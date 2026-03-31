import supabase from '../config/database.js';

class EvaluationFormModel {
  constructor() {
    this.formsTable = 'evaluation_forms';
    this.submissionsTable = 'evaluation_form_submissions';
  }

  normalizeGroupId(groupId) {
    return String(groupId || '').trim().toUpperCase();
  }

  isMissingColumnError(error, columnName) {
    const message = String(error?.message || '');
    return error?.code === '42703' || message.includes(`column "${columnName}" does not exist`);
  }

  async createForm({ name, sheet_title, total_marks, fields, created_by, allowed_years, view_roles, edit_after_submit_roles, submit_roles, mentor_edit_enabled_groups }) {
    const payload = {
      name,
      sheet_title,
      total_marks,
      fields,
      created_by,
      allowed_years,
      view_roles,
      edit_after_submit_roles,
      submit_roles,
      mentor_edit_enabled_groups: mentor_edit_enabled_groups || []
    };

    const { data, error } = await supabase
      .from(this.formsTable)
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async listForms() {
    const baseColumns = 'id, name, sheet_title, total_marks, created_at, allowed_years, view_roles, edit_after_submit_roles, submit_roles, mentor_edit_enabled_groups';
    const { data, error } = await supabase
      .from(this.formsTable)
      .select(baseColumns)
      .order('created_at', { ascending: false });

    if (!error) return data || [];

    if (this.isMissingColumnError(error, 'mentor_edit_enabled_groups')) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from(this.formsTable)
        .select('id, name, sheet_title, total_marks, created_at, allowed_years, view_roles, edit_after_submit_roles, submit_roles')
        .order('created_at', { ascending: false });

      if (fallbackError) throw fallbackError;
      return (fallbackData || []).map((row) => ({
        ...row,
        mentor_edit_enabled_groups: []
      }));
    }

    throw error;
  }

  async getFormById(formId) {
    const { data, error } = await supabase
      .from(this.formsTable)
      .select('*')
      .eq('id', formId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateForm(formId, { name, sheet_title, total_marks, fields, allowed_years, view_roles, edit_after_submit_roles, submit_roles, mentor_edit_enabled_groups }) {
    const payload = {
      name,
      sheet_title,
      total_marks,
      fields,
      allowed_years,
      view_roles,
      edit_after_submit_roles,
      submit_roles
    };

    if (mentor_edit_enabled_groups !== undefined) {
      payload.mentor_edit_enabled_groups = mentor_edit_enabled_groups;
    }

    const { data, error } = await supabase
      .from(this.formsTable)
      .update(payload)
      .eq('id', formId)
      .select()
      .single();

    if (!error) return data;

    if (mentor_edit_enabled_groups !== undefined && this.isMissingColumnError(error, 'mentor_edit_enabled_groups')) {
      const { mentor_edit_enabled_groups: _ignored, ...safePayload } = payload;
      const { data: fallbackData, error: fallbackError } = await supabase
        .from(this.formsTable)
        .update(safePayload)
        .eq('id', formId)
        .select()
        .single();

      if (fallbackError) throw fallbackError;
      return fallbackData;
    }

    throw error;
  }

  async createSubmission({ form_id, group_id, external_name, feedback, evaluations, created_by }) {
    const payload = {
      form_id,
      group_id,
      external_name,
      feedback,
      evaluations,
      created_by,
      is_approved: false,
      approved_at: null,
      approved_by: null
    };

    const { data, error } = await supabase
      .from(this.submissionsTable)
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async listSubmissionsByForm(formId) {
    const { data, error } = await supabase
      .from(this.submissionsTable)
      .select('id, form_id, group_id, external_name, feedback, evaluations, created_at, is_approved, approved_at, approved_by')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSubmissionByFormAndGroup(formId, groupId) {
    const { data, error } = await supabase
      .from(this.submissionsTable)
      .select('id, form_id, group_id, external_name, feedback, evaluations, created_at, is_approved, approved_at, approved_by')
      .eq('form_id', formId)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async getSubmissionById(submissionId, formId) {
    const { data, error } = await supabase
      .from(this.submissionsTable)
      .select('id, form_id, group_id, external_name, feedback, evaluations, created_at, is_approved, approved_at, approved_by')
      .eq('id', submissionId)
      .eq('form_id', formId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  async updateSubmission(submissionId, formId, payload) {
    const { data, error } = await supabase
      .from(this.submissionsTable)
      .update(payload)
      .eq('id', submissionId)
      .eq('form_id', formId)
      .select('id, form_id, group_id, external_name, feedback, evaluations, created_at, is_approved, approved_at, approved_by')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSubmission(submissionId, formId) {
    const { data, error } = await supabase
      .from(this.submissionsTable)
      .delete()
      .eq('id', submissionId)
      .eq('form_id', formId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async toggleMentorEditForGroup(formId, groupId, enabled) {
    // First get the current form
    const form = await this.getFormById(formId);
    if (!form) throw new Error('Form not found');

    const normalizedGroupId = this.normalizeGroupId(groupId);
    const currentGroups = Array.isArray(form.mentor_edit_enabled_groups)
      ? form.mentor_edit_enabled_groups
          .map((id) => this.normalizeGroupId(id))
          .filter(Boolean)
      : [];
    
    let updatedGroups;
    if (enabled) {
      // Add group if not already present
      updatedGroups = currentGroups.includes(normalizedGroupId)
        ? currentGroups
        : [...currentGroups, normalizedGroupId];
    } else {
      // Remove group
      updatedGroups = currentGroups.filter((g) => g !== normalizedGroupId);
    }

    const { data, error } = await supabase
      .from(this.formsTable)
      .update({ mentor_edit_enabled_groups: updatedGroups })
      .eq('id', formId)
      .select()
      .single();

    if (error) {
      if (this.isMissingColumnError(error, 'mentor_edit_enabled_groups')) {
        const err = new Error('Mentor edit feature is not available until the database migration is applied.');
        err.code = 'MISSING_MENTOR_EDIT_COLUMN';
        throw err;
      }
      throw error;
    }
    return data;
  }

  async setMentorEditGroups(formId, groupIds) {
    const { data, error } = await supabase
      .from(this.formsTable)
      .update({ mentor_edit_enabled_groups: groupIds || [] })
      .eq('id', formId)
      .select()
      .single();

    if (error) {
      if (this.isMissingColumnError(error, 'mentor_edit_enabled_groups')) {
        const err = new Error('Mentor edit feature is not available until the database migration is applied.');
        err.code = 'MISSING_MENTOR_EDIT_COLUMN';
        throw err;
      }
      throw error;
    }
    return data;
  }

  async isMentorEditEnabledForGroup(formId, groupId) {
    const form = await this.getFormById(formId);
    if (!form) return false;

    const normalizedGroupId = this.normalizeGroupId(groupId);
    const enabledGroups = Array.isArray(form.mentor_edit_enabled_groups)
      ? form.mentor_edit_enabled_groups
          .map((id) => this.normalizeGroupId(id))
          .filter(Boolean)
      : [];

    return enabledGroups.includes(normalizedGroupId);
  }
}

export default new EvaluationFormModel();
