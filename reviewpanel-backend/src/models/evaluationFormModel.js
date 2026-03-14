import supabase from '../config/database.js';

class EvaluationFormModel {
  constructor() {
    this.formsTable = 'evaluation_forms';
    this.submissionsTable = 'evaluation_form_submissions';
  }

  async createForm({ name, sheet_title, total_marks, fields, created_by, allowed_years }) {
    const payload = {
      name,
      sheet_title,
      total_marks,
      fields,
      created_by,
      allowed_years
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
    const { data, error } = await supabase
      .from(this.formsTable)
      .select('id, name, sheet_title, total_marks, created_at, allowed_years')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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

  async updateForm(formId, { name, sheet_title, total_marks, fields, allowed_years }) {
    const payload = {
      name,
      sheet_title,
      total_marks,
      fields,
      allowed_years
    };

    const { data, error } = await supabase
      .from(this.formsTable)
      .update(payload)
      .eq('id', formId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createSubmission({ form_id, group_id, external_name, feedback, evaluations, created_by }) {
    const payload = {
      form_id,
      group_id,
      external_name,
      feedback,
      evaluations,
      created_by
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
      .select('id, form_id, group_id, external_name, feedback, evaluations, created_at')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSubmissionByFormAndGroup(formId, groupId) {
    const { data, error } = await supabase
      .from(this.submissionsTable)
      .select('id, form_id, group_id, external_name, feedback, evaluations, created_at')
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
      .select('id, form_id, group_id, external_name, feedback, evaluations, created_at')
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
      .select('id, form_id, group_id, external_name, feedback, evaluations, created_at')
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
}

export default new EvaluationFormModel();
