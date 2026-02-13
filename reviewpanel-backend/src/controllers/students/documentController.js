import DocumentModel from '../../models/documentModel.js';
import s3Service from '../../services/s3Service.js';
import ApiResponse from '../../utils/apiResponse.js';
import supabase from '../../config/database.js';

const documentModel = new DocumentModel();

/**
 * Upload a new document
 */
export const uploadDocument = async (req, res) => {
  try {
    const { category, description } = req.body;
    const file = req.file;

    if (!file) {
      return ApiResponse.badRequest(res, 'No file uploaded');
    }

    if (!category) {
      return ApiResponse.badRequest(res, 'Document category is required');
    }

    // Get student info from authenticated request
    const enrollmentNo = req.user?.enrollment_no;

    if (!enrollmentNo) {
      return ApiResponse.badRequest(res, 'Enrollment number not found in token');
    }

    // Fetch group_id from pbl table using enrollment_no
    const { data: pblData, error: pblError } = await supabase
      .from('pbl')
      .select('group_id')
      .eq('enrollment_no', enrollmentNo)
      .single();

    if (pblError || !pblData) {
      console.error('PBL lookup error:', pblError);
      return ApiResponse.badRequest(res, 'Student must be assigned to a group to upload documents');
    }

    const groupId = pblData.group_id;

    if (!groupId) {
      return ApiResponse.badRequest(res, 'Student must be assigned to a group to upload documents');
    }

    // Upload file to S3
    const uploadResult = await s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      `documents/${groupId}`
    );

    if (!uploadResult.success) {
      return ApiResponse.error(res, 'Failed to upload file to storage', 500);
    }

    // Save document info to database
    const documentData = {
      group_id: groupId,
      document_name: file.originalname,
      document_url: uploadResult.url,
      category,
      description: description || null,
      uploaded_by: enrollmentNo,
      status: 'pending'
    };

    const document = await documentModel.create(documentData);

    return ApiResponse.success(res, 'Document uploaded successfully', {
      document,
      s3Key: uploadResult.key
    }, 201);
  } catch (error) {
    console.error('Upload Document Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to upload document', 500);
  }
};

/**
 * Get all documents for the student's group
 */
export const getDocuments = async (req, res) => {
  try {
    const enrollmentNo = req.user?.enrollment_no;

    if (!enrollmentNo) {
      return ApiResponse.badRequest(res, 'Enrollment number not found in token');
    }

    // Fetch group_id from pbl table using enrollment_no
    const { data: pblData, error: pblError } = await supabase
      .from('pbl')
      .select('group_id')
      .eq('enrollment_no', enrollmentNo)
      .single();

    if (pblError || !pblData) {
      console.error('PBL lookup error:', pblError);
      return ApiResponse.badRequest(res, 'Student must be assigned to a group');
    }

    const groupId = pblData.group_id;

    if (!groupId) {
      return ApiResponse.badRequest(res, 'Student must be assigned to a group');
    }

    const { category } = req.query;

    let documents;
    if (category && category !== 'all') {
      documents = await documentModel.getByCategory(groupId, category);
    } else {
      documents = await documentModel.getByGroupId(groupId);
    }

    return ApiResponse.success(res, 'Documents retrieved successfully', { documents });
  } catch (error) {
    console.error('Get Documents Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to retrieve documents', 500);
  }
};

/**
 * Get a single document by ID
 */
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const enrollmentNo = req.user?.enrollment_no;

    if (!enrollmentNo) {
      return ApiResponse.badRequest(res, 'Enrollment number not found in token');
    }

    // Fetch group_id from pbl table using enrollment_no
    const { data: pblData, error: pblError } = await supabase
      .from('pbl')
      .select('group_id')
      .eq('enrollment_no', enrollmentNo)
      .single();

    if (pblError || !pblData) {
      console.error('PBL lookup error:', pblError);
      return ApiResponse.badRequest(res, 'Student must be assigned to a group');
    }

    const groupId = pblData.group_id;

    const document = await documentModel.getById(id);

    if (!document) {
      return ApiResponse.notFound(res, 'Document not found');
    }

    // Verify document belongs to student's group
    if (document.group_id !== groupId) {
      return ApiResponse.forbidden(res, 'Unauthorized access to document');
    }

    return ApiResponse.success(res, 'Document retrieved successfully', { document });
  } catch (error) {
    console.error('Get Document Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to retrieve document', 500);
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const enrollmentNo = req.user?.enrollment_no;

    if (!enrollmentNo) {
      return ApiResponse.badRequest(res, 'Enrollment number not found in token');
    }

    // Fetch group_id from pbl table using enrollment_no
    const { data: pblData, error: pblError } = await supabase
      .from('pbl')
      .select('group_id')
      .eq('enrollment_no', enrollmentNo)
      .single();

    if (pblError || !pblData) {
      console.error('PBL lookup error:', pblError);
      return ApiResponse.badRequest(res, 'Student must be assigned to a group');
    }

    const groupId = pblData.group_id;

    const document = await documentModel.getById(id);

    if (!document) {
      return ApiResponse.notFound(res, 'Document not found');
    }

    // Verify document belongs to student's group
    if (document.group_id !== groupId) {
      return ApiResponse.forbidden(res, 'Unauthorized access to document');
    }

    // Extract S3 key from URL and delete from S3
    const s3Key = s3Service.extractKeyFromUrl(document.document_url);
    if (s3Key) {
      try {
        await s3Service.deleteFile(s3Key);
      } catch (s3Error) {
        console.error('S3 Delete Error:', s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Delete from database
    await documentModel.delete(id);

    return ApiResponse.success(res, 'Document deleted successfully');
  } catch (error) {
    console.error('Delete Document Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to delete document', 500);
  }
};

/**
 * Update document status (for admin/mentor use)
 */
export const updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return ApiResponse.badRequest(res, 'Invalid status value');
    }

    const document = await documentModel.updateStatus(id, status);

    if (!document) {
      return ApiResponse.notFound(res, 'Document not found');
    }

    return ApiResponse.success(res, 'Document status updated successfully', { document });
  } catch (error) {
    console.error('Update Status Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to update document status', 500);
  }
};
