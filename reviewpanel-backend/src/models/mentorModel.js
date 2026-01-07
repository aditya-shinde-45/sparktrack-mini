import supabase from '../config/database.js';
import bcrypt from 'bcryptjs';

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
   * Get mentor by contact number (mobile number)
   * @param {string} contactNumber - Mentor contact number
   */
  async getByContactNumber(contactNumber) {
    const { data, error } = await supabase
      .from(this.table)
      .select('mentor_id, mentor_name, contact_number, password, group_id')
      .eq('contact_number', contactNumber);

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if mentor has set a password
   * @param {string} contactNumber - Mobile number
   */
  async hasPassword(contactNumber) {
    const mentors = await this.getByContactNumber(contactNumber);
    
    if (!mentors || mentors.length === 0) {
      return null; // Mentor not found
    }

    return {
      exists: mentors.length > 0,
      hasPassword: !!(mentors[0].password),
      mentor: mentors[0]
    };
  }

  /**
   * Set password for mentor (first-time setup)
   * @param {string} contactNumber - Mobile number
   * @param {string} password - New password
   */
  async setPassword(contactNumber, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase
      .from(this.table)
      .update({ password: hashedPassword })
      .eq('contact_number', contactNumber)
      .select('mentor_id, mentor_name, contact_number');

    if (error) throw error;
    return data;
  }

  /**
   * Validate mentor credentials
   * @param {string} contactNumber - Mobile number
   * @param {string} password - Password
   */
  async validateCredentials(contactNumber, password) {
    const mentors = await this.getByContactNumber(contactNumber);
    
    if (!mentors || mentors.length === 0) {
      return null;
    }

    const mentor = mentors[0];

    // Check if password is set
    if (!mentor.password) {
      return null; // Password not set yet
    }

    // Verify password
    const isValid = await bcrypt.compare(password, mentor.password);
    
    if (!isValid) {
      return null;
    }

    return mentor; // Return first mentor record
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