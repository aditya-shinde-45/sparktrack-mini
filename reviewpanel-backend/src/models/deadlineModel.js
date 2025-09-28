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
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .order('id');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a deadline control by key
   * @param {string} key - Deadline control key
   */
  async getByKey(key) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('key', key)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a deadline control
   * @param {string} key - Deadline control key
   * @param {boolean} enabled - Whether the function is enabled
   */
  async update(key, enabled) {
    const { data, error } = await supabase
      .from(this.table)
      .update({ enabled })
      .eq('key', key)
      .select();

    if (error) throw error;
    return data;
  }
}

export default new DeadlineModel();