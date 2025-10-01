import { ApiError } from '../utils/errorHandler.js';
import deadlineModel from '../models/deadlineModel.js';

/**
 * Middleware to block access to a route based on deadline controls
 * @param {string} taskKey - The key of the deadline to check
 */
export const deadlineBlocker = (taskKey) => {
  return async (req, res, next) => {
    try {
      const deadline = await deadlineModel.getByKey(taskKey);
      
      if (!deadline) {
        throw ApiError.notFound('Deadline control not found.');
      }

      if (!deadline.enabled) {
        throw ApiError.forbidden('This function is currently disabled by admin.');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};