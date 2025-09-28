import supabase from '../config/database.js';

/**
 * External evaluator model
 */
class ExternalModel {
  constructor() {
    this.table = 'externals';
  }

  /**
   * Get all externals
   */
  async getAll() {
    const { data, error } = await supabase
      .from(this.table)
      .select('external_id, password, name');

    if (error) throw error;
    return data;
  }

  /**
   * Get external by ID
   * @param {string} externalId - External ID
   */
  async getById(externalId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('external_id, password, name')
      .eq('external_id', externalId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check if external exists
   * @param {string} externalId - External ID to check
   */
  async exists(externalId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('external_id')
      .eq('external_id', externalId);

    if (error) throw error;
    return data && data.length > 0;
  }

  /**
   * Create a new external
   * @param {object} external - External data
   */
  async create(external) {
    const { data, error } = await supabase
      .from(this.table)
      .insert([external])
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing external
   * @param {string} externalId - External ID
   * @param {object} updates - Fields to update
   */
  async update(externalId, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('external_id', externalId)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Delete an external
   * @param {string} externalId - External ID
   */
  async delete(externalId) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('external_id', externalId);

    if (error) throw error;
    return true;
  }
}

export default new ExternalModel();