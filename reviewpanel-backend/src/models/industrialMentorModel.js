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
      .eq('mentor_code', mentorCode);

    if (error) {
      throw error;
    }

    return data || [];
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

  async getByIndustrialMentorCode(industrialMentorCode) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('industrial_mentor_code', industrialMentorCode)
      .limit(1);

    if (error) throw error;
    return (data && data[0]) || null;
  }

  async getOneByContact(contact) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('contact', contact);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    // Prefer the row that has an email (the original row, not a linked null-email copy)
    const withEmail = data.find((r) => r.email);
    return withEmail || data[0];
  }

  async getByContact(contact) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('contact', contact);

    if (error) {
      throw error;
    }

    return data || [];
  }

  async getByEmail(email) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('email', email.trim().toLowerCase());

    if (error) throw error;
    return data || [];
  }

  async searchByName(name) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .ilike('name', `%${name.trim()}%`)
      .order('name', { ascending: true })
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  async create(payload) {
    const { data, error } = await supabase
      .from(this.table)
      .insert([payload])
      .select()
      .single();

    if (error) {
      // Convert Supabase plain-object errors into proper Error instances
      // so Express error handler can process them.
      const err = new Error(error.message || 'Database error');
      err.statusCode = 500;
      err.isOperational = false;
      err.dbCode = error.code;
      // Mark unique-constraint violations as operational 400s
      if (
        error.code === '23505' ||
        (error.message || '').toLowerCase().includes('duplicate') ||
        (error.message || '').toLowerCase().includes('unique')
      ) {
        err.statusCode = 400;
        err.isOperational = true;
        err.isUniqueViolation = true;
      }
      throw err;
    }
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
    const records = await this.getByContact(contact);
    if (!records || records.length === 0) {
      return null;
    }

    // Verify password against the first record (each faculty sets an independent password;
    // try all records in case passwords differ)
    for (const record of records) {
      if (!record.password) continue;
      const isValid = await bcrypt.compare(password, record.password);
      if (isValid) {
        // Return all records so the login can include every linked faculty
        return records;
      }
    }

    return null;
  }
}

export default new IndustrialMentorModel();
