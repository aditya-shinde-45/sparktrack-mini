import supabase from '../config/database.js';

/**
 * Mentor model for handling mentor data
 */
class MentorModel {
  constructor() {
    this.table = 'mentors';
  }

  /**
   * Get all mentors with their assigned groups
   */
  async getAll() {
    const { data, error } = await supabase
      .from(this.table)
      .select('mentor_id, mentor_name, contact_number, group_id');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a mentor by name (includes password for authentication)
   * @param {string} mentorName - Mentor name
   */
  async getByName(mentorName) {
    const { data, error } = await supabase
      .from(this.table)
      .select('mentor_id, mentor_name, contact_number, password, group_id')
      .eq('mentor_name', mentorName);

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new mentor assignment
   * @param {object} mentorData - Mentor data including group assignment
   */
  async create(mentorData) {
    const { data, error } = await supabase
      .from(this.table)
      .insert([mentorData])
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Update mentor information
   * @param {string} mentorName - Mentor name
   * @param {object} updates - Fields to update
   */
  async update(mentorName, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('mentor_name', mentorName)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a mentor assignment
   * @param {string} mentorName - Mentor name
   * @param {string} groupId - Group ID (optional)
   */
  async delete(mentorName, groupId = null) {
    let query = supabase
      .from(this.table)
      .delete()
      .eq('mentor_name', mentorName);
    
    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  }
}

export default new MentorModel();