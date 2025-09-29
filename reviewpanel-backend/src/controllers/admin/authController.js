import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import userModel from '../../models/userModel.js';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';

/**
 * Controller for authentication operations
 */
class AuthController {
  /**
   * Login a user and generate token
   */
  login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw ApiError.badRequest('Username and password are required');
    }

    const user = await userModel.validateCredentials(username, password);
    
    if (!user) {
      throw ApiError.unauthorized('Invalid username or password');
    }
    
    const token = userModel.generateToken(user);
    
    return ApiResponse.success(res, 'Login successful', { 
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });

  /**
   * Get current user from token
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    // User is already set by the auth middleware
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated');
    }

    return ApiResponse.success(res, 'User retrieved', { user: req.user });
  });

  /**
   * Validate a token
   */
  validateToken = asyncHandler(async (req, res) => {
    const { token } = req.body;
    
    if (!token) {
      throw ApiError.badRequest('Token is required');
    }
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      if (!decoded) {
        throw ApiError.unauthorized('Invalid or expired token');
      }
      
      // Check for required fields based on role
      let isValid = false;
      let userInfo = {};
      
      if (decoded.role === 'external') {
        // External token should have external_id, name, role
        if (decoded.external_id && decoded.name && decoded.role) {
          isValid = true;
          userInfo = {
            external_id: decoded.external_id,
            name: decoded.name,
            role: decoded.role
          };
        }
      } else if (decoded.role === 'student') {
        // Student token should have student_id, name, role
        if (decoded.student_id && decoded.name && decoded.role) {
          isValid = true;
          userInfo = {
            student_id: decoded.student_id,
            name: decoded.name,
            role: decoded.role
          };
        }
      } else {
        // Admin/Mentor token should have id, username, role
        if (decoded.id && decoded.username && decoded.role) {
          isValid = true;
          userInfo = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
          };
        }
      }
      
      if (!isValid) {
        throw ApiError.unauthorized('Token missing required fields');
      }
      
      return ApiResponse.success(res, 'Token is valid', { 
        valid: true,
        user: userInfo
      });
      
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw ApiError.unauthorized('Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Token expired');
      }
      throw error;
    }
  });
}

export default new AuthController();