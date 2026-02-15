import DocumentModel from '../../models/documentModel.js';
import ApiResponse from '../../utils/apiResponse.js';

const documentModel = new DocumentModel();

/**
 * Get all documents for a specific group (for mentor review)
 */
export const getGroupDocuments = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { category } = req.query;

    if (!groupId) {
      return ApiResponse.badRequest(res, 'Group ID is required');
    }

    let documents;
    if (category && category !== 'all') {
      documents = await documentModel.getByCategory(groupId, category);
    } else {
      documents = await documentModel.getByGroupId(groupId);
    }

    return ApiResponse.success(res, 'Documents retrieved successfully', { documents });
  } catch (error) {
    console.error('Get Group Documents Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to retrieve documents', 500);
  }
};

/**
 * Update document status (approve/reject)
 */
export const updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return ApiResponse.badRequest(res, 'Invalid status value. Must be: pending, approved, or rejected');
    }

    // If rejecting, feedback is required
    if (status === 'rejected' && !feedback) {
      return ApiResponse.badRequest(res, 'Feedback is required when rejecting a document');
    }

    const document = await documentModel.updateStatus(id, status, feedback);

    if (!document) {
      return ApiResponse.notFound(res, 'Document not found');
    }

    return ApiResponse.success(res, 'Document status updated successfully', { document });
  } catch (error) {
    console.error('Update Document Status Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to update document status', 500);
  }
};

/**
 * Delete a rejected document
 */
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // First check if document exists and is rejected
    const document = await documentModel.getById(id);
    
    if (!document) {
      return ApiResponse.notFound(res, 'Document not found');
    }

    // Only allow deletion of rejected documents
    if (document.status !== 'rejected') {
      return ApiResponse.badRequest(res, 'Only rejected documents can be deleted');
    }

    await documentModel.delete(id);

    return ApiResponse.success(res, 'Document deleted successfully');
  } catch (error) {
    console.error('Delete Document Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to delete document', 500);
  }
};

export default {
  getGroupDocuments,
  updateDocumentStatus,
  deleteDocument
};
