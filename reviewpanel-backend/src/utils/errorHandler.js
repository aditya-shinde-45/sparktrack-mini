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

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log different types of errors differently
  if (err.isOperational) {
    logger.warn(`${err.statusCode} - ${err.message}`);
  } else {
    // Log the full error so CloudWatch / server logs show the real cause
    logger.error('Unhandled exception on', req.method, req.originalUrl);
    logger.error('Error message:', err.message);
    logger.error('Stack trace:', err.stack);
  }
  
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'An unexpected error occurred';
  
  const responseBody = {
    success: false,
    message
  };

  // Only attach validation details for 4xx operational errors
  if (err.errors && err.isOperational) {
    responseBody.errors = err.errors;
  }
  // Pass existingMentor hint so frontend can auto-switch to Link Existing mode
  if (err.existingMentor) {
    responseBody.existingMentor = err.existingMentor;
  }

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