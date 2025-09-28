import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import userModel from '../../models/userModel.js';

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
    
    const decodedToken = userModel.verifyToken(token);
    
    if (!decodedToken) {
      throw ApiError.unauthorized('Invalid or expired token');
    }
    
    return ApiResponse.success(res, 'Token is valid', { 
      valid: true,
      user: {
        id: decodedToken.id,
        username: decodedToken.username,
        role: decodedToken.role
      }
    });
  });
}

export default new AuthController();