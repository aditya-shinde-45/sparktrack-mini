import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/errorHandler.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

/**
 * Security middleware functions
 */
const securityMiddleware = {
  /**
   * Apply Helmet security headers with custom configuration
   */
  applyHelmet: () => {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          connectSrc: ["'self'", config.supabase?.url || ''],
          imgSrc: ["'self'", "data:", "blob:"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", "data:"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    });
  },

  /**
   * Rate limiting to prevent brute force and DoS attacks
   */
  rateLimiter: (options = {}) => {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        throw ApiError.forbidden(options.message);
      }
    };

    return rateLimit({
      ...defaultOptions,
      ...options
    });
  },

  /**
   * Additional security for authentication routes
   */
  authLimiter: () => {
    return securityMiddleware.rateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 login attempts per hour per IP
      message: 'Too many login attempts, please try again later'
    });
  },

  /**
   * CORS error handler
   */
  handleCorsError: (err, req, res, next) => {
    if (err.name === 'CorsError') {
      logger.warn(`CORS Error: ${err.message}`);
      throw ApiError.forbidden('CORS Error: Not allowed by CORS policy');
    }
    next(err);
  },
  
  /**
   * Add security headers for file uploads
   */
  secureUploads: (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
  }
};

export default securityMiddleware;