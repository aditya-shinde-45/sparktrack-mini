import supabase from '../config/database.js';

/**
 * Document Model for managing project documents
 */
class DocumentModel {
  constructor() {
    this.table = 'documents';
  }

  /**
   * Create a new document record
   * @param {Object} documentData - { group_id, document_name, document_url, category, description, uploaded_by }
   * @returns {Promise<Object>} Created document
   */
  async create(documentData) {
    // Build insert object with only required fields first
    const insertData = {
      group_id: documentData.group_id,
      document_name: documentData.document_name,
      document_url: documentData.document_url
    };

    // Add optional fields only if they are provided
    if (documentData.category) insertData.category = documentData.category;
    if (documentData.description) insertData.description = documentData.description;
    if (documentData.uploaded_by) insertData.uploaded_by = documentData.uploaded_by;
    if (documentData.status) insertData.status = documentData.status;

    const { data, error } = await supabase
      .from(this.table)
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all documents for a specific group
   * @param {Number} groupId - Group ID
   * @returns {Promise<Array>} List of documents
   */
  async getByGroupId(groupId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get document by ID
   * @param {Number} id - Document ID
   * @returns {Promise<Object>} Document data
   */
  async getById(id) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update document status
   * @param {Number} id - Document ID
   * @param {String} status - New status (pending, approved, rejected)
   * @returns {Promise<Object>} Updated document
   */
  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from(this.table)
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a document record
   * @param {Number} id - Document ID
   * @returns {Promise<Boolean>} Success status
   */
  async delete(id) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Get documents by category for a group
   * @param {Number} groupId - Group ID
   * @param {String} category - Document category
   * @returns {Promise<Array>} List of documents
   */
  async getByCategory(groupId, category) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('group_id', groupId)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export default DocumentModel;
