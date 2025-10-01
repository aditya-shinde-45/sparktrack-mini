/**
 * Standard API response formatter
 */
export default class ApiResponse {
  /**
   * Success response with data
   * @param {object} res - Express response object
   * @param {string} message - Success message
   * @param {any} data - Response data
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  static success(res, message = 'Success', data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Error response
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {any} errors - Error details (optional)
   */
  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Bad request response (400)
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {any} errors - Validation errors (optional)
   */
  static badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, message, 400, errors);
  }

  /**
   * Not found response (404)
   * @param {object} res - Express response object
   * @param {string} message - Not found message
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  /**
   * Unauthorized response (401)
   * @param {object} res - Express response object
   * @param {string} message - Unauthorized message
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  /**
   * Forbidden response (403)
   * @param {object} res - Express response object
   * @param {string} message - Forbidden message
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }
}