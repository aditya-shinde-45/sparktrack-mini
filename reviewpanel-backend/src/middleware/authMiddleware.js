import { ApiError } from '../utils/errorHandler.js';
import userModel from '../models/userModel.js';
import studentAuthModel from '../models/studentAuthModel.js';
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
   * Authenticate user (admin/mentor/student/external/reviewerAdmin)
   */
  authenticateUser = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        throw ApiError.unauthorized('Authentication token required');
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const isProduction = process.env.NODE_ENV === 'production';

        // Check user type from token payload
        if (decoded.role === 'student') {
          const student = await studentAuthModel.findById(decoded.student_id);
          if (!student) {
            if (isProduction) {
              throw ApiError.unauthorized('Student not found');
            }
            // Development fallback only
            req.user = { ...decoded };
          } else {
            req.user = { ...decoded, ...student };
          }
        } else if (decoded.role === 'mentor' || decoded.role === 'industry_mentor') {
          req.user = { ...decoded };
        } else if (decoded.role === 'reviewerAdmin') {
          req.user = { ...decoded };
        } else {
          // Admin
          if (decoded.isRoleBased) {
            // Role-based sub-admins exist in the DB roles table, not in userModel (env-var store)
            // Their token already carries all needed info (user_id, tablePermissions, etc.)
            req.user = { ...decoded };
          } else {
            const user = await userModel.findById(decoded.id);
            if (!user) {
              if (isProduction) {
                throw ApiError.unauthorized('User not found');
              }
              req.user = { ...decoded };
            } else {
              req.user = { ...decoded, ...user };
            }
          }
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
        
        if (decoded.role !== 'admin') {
          throw ApiError.forbidden('Admin access required');
        }
        
        const isProduction = process.env.NODE_ENV === 'production';

        // Role-based sub-admins exist in the DB roles table, not in userModel (env-var store).
        // Their token already carries all needed info (user_id, tablePermissions, etc.)
        if (decoded.isRoleBased) {
          req.user = { ...decoded };
        } else {
          const admin = await userModel.findById(decoded.id);
          
          if (!admin) {
            if (isProduction) {
              throw ApiError.unauthorized('Admin user not found');
            }
            // Development fallback only
            req.user = { ...decoded, role: 'admin' };
          } else {
            if (admin.role.toLowerCase() !== 'admin') {
              throw ApiError.forbidden('Admin access required');
            }
            const { passwordHash, ...safeAdmin } = admin;
            req.user = { ...decoded, ...safeAdmin };
          }
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
          req.user = { ...decoded };
        } else {
          // Mentor — token carries all needed info (mentor_id, mentor_name, contact_number)
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
   * Check if user has one of the allowed roles
   */
  checkRole = (allowedRoles) => {
    return (req, res, next) => {
      try {
        if (!req.user) {
          throw ApiError.unauthorized('Authentication required');
        }

        const userRole = req.user.role;
        
        if (!allowedRoles.includes(userRole)) {
          throw ApiError.forbidden(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
        }

        next();
      } catch (error) {
        next(error);
      }
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