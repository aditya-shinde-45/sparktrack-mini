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
      name: data.name,
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
      name: external.name,
      role: 'external' // Ensure lowercase for consistency
    };
    
    return jwt.sign(payload, config.jwt.secret, { expiresIn: '1d' });
  }

  /**
   * Get assigned groups for an external evaluator
   * @param {string} externalId - External ID
   */
  async getAssignedGroups(externalId) {
    const { data, error } = await supabase
      .from('pbl')
      .select('group_id')
      .like('group_id', `${externalId}%`);

    if (error) throw error;
    
    return data?.map(g => g.group_id) || [];
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
      name: data.name,
      role: 'external'
    };
  }
}

export default new ExternalAuthModel();