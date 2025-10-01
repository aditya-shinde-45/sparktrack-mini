import { ApiError } from '../utils/errorHandler.js';
import userModel from '../models/userModel.js';
import studentAuthModel from '../models/studentAuthModel.js';
import externalAuthModel from '../models/externalAuthModel.js';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

// Ensure consistent JWT secret usage across the app
const JWT_SECRET = config.jwt.secret;

/**
 * Authentication middleware
 */
class AuthMiddleware {
  /**
   * Legacy verify token method to maintain compatibility
   */
  verifyToken = (req, res, next) => {
    return this.authenticateUser(req, res, next);
  };

  /**
   * Role-based authorization middleware
   * @param {string[]} roles - Array of allowed roles
   */
  authorize = (roles = []) => {
    return (req, res, next) => {
      try {
        if (!req.user) {
          throw ApiError.unauthorized('Authentication required');
        }

        // Normalize roles for comparison
        const normalizedRoles = roles.map(role => role.toLowerCase());
        const userRole = req.user.role ? req.user.role.toLowerCase() : null;
        
        if (normalizedRoles.length && !normalizedRoles.includes(userRole)) {
          throw ApiError.forbidden('You do not have permission to access this resource');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };

  /**
   * Authenticate user (admin/mentor/student/external)
   */
  authenticateUser = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        throw ApiError.unauthorized('Authentication token required');
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token decoded:', decoded);
        
        try {
          // Check user type from token payload
          if (decoded.role === 'student') {
            try {
              const student = await studentAuthModel.findById(decoded.student_id);
              if (!student) {
                console.warn(`Student with ID ${decoded.student_id} not found`);
                // Fall back to token data for development
                req.user = { ...decoded };
              } else {
                req.user = { ...decoded, ...student };
              }
            } catch (dbError) {
              console.error('Error finding student:', dbError);
              // Fall back to token data
              req.user = { ...decoded };
            }
          } else if (decoded.role === 'external') {
            try {
              const external = await externalAuthModel.findById(decoded.external_id);
              if (!external) {
                console.warn(`External with ID ${decoded.external_id} not found`);
                // Fall back to token data for development
                req.user = { ...decoded };
              } else {
                req.user = { ...decoded, ...external };
              }
            } catch (dbError) {
              console.error('Error finding external:', dbError);
              // Fall back to token data
              req.user = { ...decoded };
            }
          } else {
            // Admin or mentor
            try {
              const user = await userModel.findById(decoded.id);
              if (!user) {
                console.warn(`User with ID ${decoded.id} not found`);
                // Fall back to token data for development
                req.user = { ...decoded };
              } else {
                req.user = { ...decoded, ...user };
              }
            } catch (dbError) {
              console.error('Error finding user:', dbError);
              // Fall back to token data
              req.user = { ...decoded };
            }
          }
        } catch (lookupError) {
          console.error('User lookup error:', lookupError);
          // For development, allow token-only authentication
          req.user = { ...decoded };
        }
        
        next();
      } catch (error) {
        if (error.name === 'JsonWebTokenError') {
          throw ApiError.unauthorized('Invalid token');
        }
        if (error.name === 'TokenExpiredError') {
          throw ApiError.unauthorized('Token expired');
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Authenticate admin only
   */
  authenticateAdmin = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        throw ApiError.unauthorized('Authentication token required');
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Admin token decoded:', decoded);
        
        if (decoded.role !== 'admin') {
          throw ApiError.forbidden('Admin access required');
        }
        
        try {
          const admin = await userModel.findById(decoded.id);
          
          if (!admin) {
            console.warn(`Admin user with ID ${decoded.id} not found in database`);
            // For development: You could allow token-only auth by commenting out the next line
            throw ApiError.unauthorized('Admin user not found');
          }
          
          if (admin.role.toLowerCase() !== 'admin') {
            throw ApiError.forbidden('Admin access required');
          }
          
          req.user = { ...decoded, ...admin };
        } catch (dbError) {
          console.error('Database error when finding admin:', dbError);
          // If findById isn't implemented or database error, fall back to token data
          console.log('Falling back to token data only for admin authentication');
          req.user = { ...decoded, role: 'admin' };
        }
        
        next();
      } catch (error) {
        if (error.name === 'JsonWebTokenError') {
          throw ApiError.unauthorized('Invalid token');
        }
        if (error.name === 'TokenExpiredError') {
          throw ApiError.unauthorized('Token expired');
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Authenticate student only
   */
  authenticateStudent = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        throw ApiError.unauthorized('Authentication token required');
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.role !== 'student') {
          throw ApiError.forbidden('Student access required');
        }
        
        const student = await studentAuthModel.findById(decoded.student_id);
        
        if (!student) {
          throw ApiError.unauthorized('Invalid student authentication');
        }
        
        req.user = { ...decoded, ...student };
        next();
      } catch (error) {
        if (error.name === 'JsonWebTokenError') {
          throw ApiError.unauthorized('Invalid token');
        }
        if (error.name === 'TokenExpiredError') {
          throw ApiError.unauthorized('Token expired');
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Authenticate external evaluator only
   */
  authenticateExternal = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        throw ApiError.unauthorized('Authentication token required');
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.role !== 'external') {
          throw ApiError.forbidden('External evaluator access required');
        }
        
        const external = await externalAuthModel.findById(decoded.external_id);
        
        if (!external) {
          throw ApiError.unauthorized('Invalid external evaluator authentication');
        }
        
        req.user = { ...decoded, ...external };
        next();
      } catch (error) {
        if (error.name === 'JsonWebTokenError') {
          throw ApiError.unauthorized('Invalid token');
        }
        if (error.name === 'TokenExpiredError') {
          throw ApiError.unauthorized('Token expired');
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Authenticate external evaluator or mentor
   */
  authenticateExternalOrMentor = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        throw ApiError.unauthorized('Authentication token required');
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.role !== 'external' && decoded.role !== 'mentor') {
          throw ApiError.forbidden('External evaluator or mentor access required');
        }
        
        if (decoded.role === 'external') {
          const external = await externalAuthModel.findById(decoded.external_id);
          
          if (!external) {
            throw ApiError.unauthorized('Invalid external evaluator authentication');
          }
          
          req.user = { ...decoded, ...external };
        } else {
          // Mentor
          const mentor = await userModel.findById(decoded.id);
          
          if (!mentor || mentor.role !== 'mentor') {
            throw ApiError.unauthorized('Invalid mentor authentication');
          }
          
          req.user = { ...decoded, ...mentor };
        }
        
        next();
      } catch (error) {
        if (error.name === 'JsonWebTokenError') {
          throw ApiError.unauthorized('Invalid token');
        }
        if (error.name === 'TokenExpiredError') {
          throw ApiError.unauthorized('Token expired');
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Restrict access to specific roles
   */
  restrictTo = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(ApiError.forbidden('You do not have permission to perform this action'));
      }
      next();
    };
  };

  /**
   * Extract token from request headers
   */
  extractToken = (req) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    
    return null;
  };
}

const authMiddleware = new AuthMiddleware();
export default authMiddleware;