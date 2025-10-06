import supabase from '../config/database.js';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * External auth model for external evaluator authentication
 */
class ExternalAuthModel {
  constructor() {
    this.table = 'externals';
  }

  /**
   * Validate external evaluator credentials
   * @param {string} externalId - External ID
   * @param {string} password - Password
   */
  async validateCredentials(externalId, password) {
    const { data, error } = await supabase
      .from(this.table)
      .select('external_id, password, name')
      .eq('external_id', externalId)
      .single();

    if (error || !data) return null;
    
    // Direct password comparison
    if (data.password !== password) return null;
    
    return {
      external_id: data.external_id,
      name: data.name || data.external_id, // Use external_id as fallback if name is null
      role: 'external' // Ensure lowercase for consistency
    };
  }

  /**
   * Generate JWT token for external evaluator
   * @param {object} external - External evaluator data
   */
  generateToken(external) {
    const payload = {
      external_id: external.external_id,
      name: external.name || external.external_id, // Use external_id as fallback if name is null
      role: 'external' // Ensure lowercase for consistency
    };
    
    return jwt.sign(payload, config.jwt.secret, { expiresIn: '1d' });
  }

  /**
   * Get assigned groups for an external evaluator
   * @param {string} externalId - External ID
   */
  async getAssignedGroups(externalId) {
    // First get the external's year and class information
    const { data: externalData, error: externalError } = await supabase
      .from(this.table)
      .select('year, class')
      .eq('external_id', externalId)
      .single();

    if (externalError || !externalData) {
      // Fallback to old behavior if no year/class info
      const { data, error } = await supabase
        .from('pbl')
        .select('group_id')
        .like('group_id', `${externalId}%`);

      if (error) throw error;
      return data?.map(g => g.group_id) || [];
    }

    // Get groups that match the external's year and class
    let query = supabase
      .from('pbl')
      .select('group_id');

    // Filter by year prefix (e.g., SY, TY) if available
    if (externalData.year) {
      query = query.like('group_id', `${externalData.year}%`);
    }

    // Filter by class if specified
    if (externalData.class) {
      query = query.eq('class', externalData.class);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Get unique group_ids
    const uniqueGroups = [...new Set(data?.map(g => g.group_id) || [])];
    return uniqueGroups;
  }
  
  /**
   * Find external evaluator by ID
   * @param {string} id - External evaluator ID
   */
  async findById(id) {
    const { data, error } = await supabase
      .from(this.table)
      .select('external_id, name')
      .eq('external_id', id)
      .single();

    if (error) return null;
    
    return {
      id: data.external_id,
      external_id: data.external_id,
      name: data.name || data.external_id, // Use external_id as fallback if name is null
      role: 'external'
    };
  }

  /**
   * Get groups assigned to a mentor by mentor name
   * @param {string} mentorName - Mentor name
   */
  async getGroupsByMentorName(mentorName) {
    const { data, error } = await supabase
      .from('mentors')
      .select('group_id')
      .eq('mentor_name', mentorName);

    if (error) throw error;
    
    // Get unique group_ids
    const uniqueGroups = [...new Set(data?.map(m => m.group_id) || [])];
    return uniqueGroups;
  }

  /**
   * Get all mentors list with their contact numbers
   */
  async getAllMentors() {
    const { data, error } = await supabase
      .from('mentors')
      .select('mentor_name, contact_number');

    if (error) throw error;
    
    // Get unique mentors (remove duplicates based on mentor_name)
    const mentorMap = new Map();
    (data || []).forEach(mentor => {
      if (!mentorMap.has(mentor.mentor_name)) {
        mentorMap.set(mentor.mentor_name, {
          mentor_name: mentor.mentor_name,
          contact_number: mentor.contact_number
        });
      }
    });
    
    return Array.from(mentorMap.values());
  }
}

export default new ExternalAuthModel();