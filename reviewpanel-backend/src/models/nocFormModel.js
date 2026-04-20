import supabase from '../config/database.js';

class NocFormModel {
  constructor() {
    this.table = 'noc_forms';
  }

  async listByGroupIds(groupIds = []) {
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .in('group_id', groupIds);

    if (error) throw error;
    return data || [];
  }

  async getByGroupId(groupId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async saveByGroupId({ groupId, groupYear, payload, actorEnrollment, submit = false }) {
    const now = new Date().toISOString();
    const existing = await this.getByGroupId(groupId);

    if (existing) {
      const updateData = {
        group_year: groupYear || existing.group_year || null,
        payload,
        updated_by: actorEnrollment || existing.updated_by || null,
        updated_at: now,
      };

      if (submit) {
        updateData.submitted = true;
        updateData.submitted_at = now;
      }

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('group_id', groupId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    }

    const insertData = {
      group_id: groupId,
      group_year: groupYear || null,
      payload,
      submitted: Boolean(submit),
      submitted_at: submit ? now : null,
      created_by: actorEnrollment || null,
      updated_by: actorEnrollment || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert([insertData])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async updateByGroupId(groupId, updates = {}) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.table)
      .update({
        ...updates,
        updated_at: now,
      })
      .eq('group_id', groupId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }
}

export default NocFormModel;