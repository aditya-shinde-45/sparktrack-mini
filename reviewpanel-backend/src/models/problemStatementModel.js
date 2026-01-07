import supabase from '../config/database.js';

/**
 * Model for the problem_statement table
 */
class ProblemStatementModel {
  constructor() {
    this.table = 'problem_statement';
  }

  /**
   * Create a new problem statement entry
   */
  async create(payload) {
    const { data, error } = await supabase
      .from(this.table)
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update ps_id in pbl table for all members of a group
   */
  async updatePsIdInPbl(groupId, psId) {
    const { error } = await supabase
      .from('pbl')
      .update({ ps_id: psId })
      .eq('group_id', groupId);

    if (error) throw error;
    return true;
  }

  /**
   * Update a problem statement for a given group
   */
  async update(groupId, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('group_id', groupId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a problem statement for a group
   */
  async delete(groupId) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('group_id', groupId);

    if (error) throw error;
    return true;
  }

  /**
   * Fetch a problem statement by group ID
   */
  async findByGroup(groupId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  }
}

export default new ProblemStatementModel();
