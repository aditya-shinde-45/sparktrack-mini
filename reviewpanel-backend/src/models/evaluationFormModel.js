import supabase from '../config/database.js';

class EvaluationFormModel {
  constructor() {
    this.formsTable = 'evaluation_forms';
    this.submissionsTable = 'evaluation_form_submissions';
  }

  async createForm({ name, total_marks, fields, created_by }) {
    const payload = {
      name,
      total_marks,
      fields,
      created_by
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
      .select('id, name, total_marks, created_at')
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

  async updateForm(formId, { name, total_marks, fields }) {
    const payload = {
      name,
      total_marks,
      fields
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
}

export default new EvaluationFormModel();
