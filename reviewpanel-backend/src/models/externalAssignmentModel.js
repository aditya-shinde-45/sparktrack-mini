import supabase from '../config/database.js';

/**
 * Model responsible for assigning externals to classes
 */
class ExternalAssignmentModel {
  constructor() {
    this.table = 'externals';
  }

  /**
   * Assign an external evaluator with computed class string
   */
  async assignExternal({
    name,
    contact,
    external_id,
    email,
    year,
    assignedClass,
  }) {
    const payload = {
      name,
      contact,
      external_id,
      email,
      year,
      class: assignedClass,
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert([payload])
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Check if an external already exists by ID
   */
  async exists(externalId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('external_id')
      .eq('external_id', externalId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return Boolean(data);
  }
}

export default new ExternalAssignmentModel();
