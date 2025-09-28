import supabase from '../config/database.js';
import { asyncHandler, ApiError } from '../utils/errorHandler.js';

/**
 * Deadline model for deadline control functionality
 */
class DeadlineModel {
  constructor() {
    this.table = 'deadlines_control';
  }

  /**
   * Get all deadline controls
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('key, label, enabled')
        .order('key');

      if (error) {
        throw new ApiError(500, `Database error: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting all deadlines:', error);
      throw error;
    }
  }

  /**
   * Get a deadline control by key
   * @param {string} key - Deadline control key
   */
  async getByKey(key) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('key, label, enabled')
        .eq('key', key)
        .single();

      if (error) {
        // If record not found, log warning and return null
        if (error.code === 'PGRST116') {
          console.warn(`Deadline key '${key}' not found in database.`);
          return null;
        }
        
        throw new ApiError(500, `Database error: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error getting deadline by key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Update a deadline control
   * @param {string} key - Deadline control key
   * @param {boolean} enabled - Whether the function is enabled
   */
  async update(key, enabled) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .update({ enabled })
        .eq('key', key)
        .select('key, label, enabled');

      if (error) {
        throw new ApiError(500, `Database error: ${error.message}`);
      }

      // If no rows were updated, the key doesn't exist
      if (!data || data.length === 0) {
        throw new ApiError(404, `Deadline control with key '${key}' not found`);
      }
      
      return data[0];
    } catch (error) {
      console.error(`Error updating deadline ${key}:`, error);
      throw error;
    }
  }
}

export default new DeadlineModel();