/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = null) {
    return new ApiError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, 404);
  }

  static internalError(message = 'Internal server error') {
    return new ApiError(message, 500);
  }
}

import logger from './logger.js';
import config from '../config/index.js';

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log different types of errors differently
  if (err.isOperational) {
    logger.warn(`${err.statusCode} - ${err.message}`);
  } else {
    logger.error('Unhandled exception:', err);
  }
  
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'An unexpected error occurred';
  
  const responseBody = {
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
    ...(config.server.env === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(responseBody);
};

/**
 * Async handler to avoid try/catch boilerplate
 * @param {function} fn - Async controller function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};