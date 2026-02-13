import supabase from '../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * Industrial mentor model for mentor-managed industry mentor records.
 */
class IndustrialMentorModel {
  constructor() {
    this.table = 'industrial_mentors';
  }

  async getByMentorCode(mentorCode) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('mentor_code', mentorCode)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  }

  async getById(id) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getByContact(contact) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('contact', contact)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  }

  async create(payload) {
    const { data, error } = await supabase
      .from(this.table)
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id, updates) {
    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteById(id) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async getNextIndustrialMentorCode() {
    const { data, error } = await supabase
      .from(this.table)
      .select('industrial_mentor_code')
      .ilike('industrial_mentor_code', 'im%');

    if (error) throw error;

    let maxNumber = 0;
    (data || []).forEach((row) => {
      const match = String(row.industrial_mentor_code || '').match(/im(\d+)/i);
      if (match) {
        const parsed = Number.parseInt(match[1], 10);
        if (!Number.isNaN(parsed)) {
          maxNumber = Math.max(maxNumber, parsed);
        }
      }
    });

    const next = maxNumber + 1;
    return `IM${String(next).padStart(3, '0')}`;
  }

  async validateCredentials(contact, password) {
    const record = await this.getByContact(contact);
    if (!record || !record.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, record.password);
    if (!isValid) {
      return null;
    }

    return record;
  }
}

export default new IndustrialMentorModel();
