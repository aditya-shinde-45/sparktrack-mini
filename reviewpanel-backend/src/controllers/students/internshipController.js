import multer from 'multer';
import ApiResponse from '../../utils/apiResponse.js';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import supabase from '../../config/database.js';

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF files only
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for internship documents.'));
    }
  }
});

// Export multer middleware for route usage
export const uploadInternshipDocument = upload.single('internship_document');

/**
 * Controller handling internship details CRUD for students
 */
class InternshipController {
  /**
   * Submit new internship details
   */
  submitInternship = asyncHandler(async (req, res) => {
    const { organization_name, internship_type, internship_duration } = req.body;
    
    // Get enrollment number from authenticated student
    const enrollment_no = req.user?.enrollment_no || req.user?.enrollement_no;

    if (!enrollment_no) {
      throw ApiError.unauthorized('Student enrollment number not found.');
    }

    if (!organization_name || !internship_type || !internship_duration) {
      throw ApiError.badRequest('Organization name, internship type, and duration are required.');
    }

    // Fetch group_id from pbl table
    const { data: pblData, error: pblError } = await supabase
      .from('pbl')
      .select('*')
      .eq('enrollment_no', enrollment_no)
      .maybeSingle();

    console.log('PBL data from DB:', pblData);
    console.log('Enrollment number used:', enrollment_no);

    if (pblError) {
      console.error('Error fetching PBL data:', pblError);
    }

    // Try different possible column names for group_id in pbl table
    const group_id = pblData?.group_id || 
                     pblData?.groupId || 
                     pblData?.id ||
                     null;
    
    console.log('Extracted group_id from PBL:', group_id);
    
    if (!group_id) {
      console.warn('No group_id found in PBL table for this student. Group assignment may be pending.');
    }

    if (!req.file) {
      throw ApiError.badRequest('Internship document (PDF) is required.');
    }

    // Check if internship details already exist for this student
    const { data: existing } = await supabase
      .from('internship_details')
      .select('*')
      .eq('enrollment_no', enrollment_no)
      .maybeSingle();
    
    if (existing) {
      throw ApiError.badRequest('Internship details already submitted. Please use update endpoint.');
    }

    // Upload file to Supabase Storage (or skip if bucket doesn't exist)
    let file_url = null;
    let file_name = null;
    let file_type = null;

    if (req.file) {
      try {
        const fileName = `${enrollment_no}_${Date.now()}_${req.file.originalname}`;
        const filePath = `internships/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('internship-documents')
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error('File upload error:', uploadError);
          console.warn('Storage bucket may not exist. Continuing without file upload...');
          // Continue without file upload
          file_name = req.file.originalname;
          file_type = req.file.mimetype;
          file_url = 'pending_upload'; // Placeholder
        } else {
          // Get public URL only if upload succeeded
          const { data: urlData } = supabase.storage
            .from('internship-documents')
            .getPublicUrl(filePath);

          file_url = urlData.publicUrl;
          file_name = req.file.originalname;
          file_type = req.file.mimetype;
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
        // Continue without file upload
        file_name = req.file.originalname;
        file_type = req.file.mimetype;
        file_url = 'pending_upload'; // Placeholder
      }
    }

    // Insert into database
    const { data: internship, error } = await supabase
      .from('internship_details')
      .insert([{
        enrollment_no,
        group_id: group_id || null,
        organization_name,
        internship_type,
        internship_duration,
        file_url,
        file_name,
        file_type
      }])
      .select()
      .single();

    if (error) throw error;

    return ApiResponse.success(
      res,
      'Internship details submitted successfully!',
      { 
        internship,
        file_uploaded: !!file_url
      },
      201
    );
  });

  /**
   * Get internship details by enrollment number
   */
  getInternshipByEnrollment = asyncHandler(async (req, res) => {
    const { enrollment_no } = req.params;

    if (!enrollment_no) {
      throw ApiError.badRequest('Enrollment number is required.');
    }

    const { data: internship, error } = await supabase
      .from('internship_details')
      .select('*')
      .eq('enrollment_no', enrollment_no)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!internship) {
      throw ApiError.notFound('Internship details not found.');
    }

    return ApiResponse.success(res, 'Internship details retrieved successfully.', { internship });
  });

  /**
   * Get internship details for authenticated student
   */
  getMyInternship = asyncHandler(async (req, res) => {
    const enrollment_no = req.user?.enrollment_no || req.user?.enrollement_no;

    if (!enrollment_no) {
      throw ApiError.unauthorized('Student enrollment number not found.');
    }

    const { data: internship, error } = await supabase
      .from('internship_details')
      .select('*')
      .eq('enrollment_no', enrollment_no)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!internship) {
      return ApiResponse.success(res, 'No internship details found.', { internship: null });
    }

    return ApiResponse.success(res, 'Internship details retrieved successfully.', { internship });
  });

  /**
   * Get internship details by group ID
   */
  getInternshipsByGroup = asyncHandler(async (req, res) => {
    const { group_id } = req.params;

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required.');
    }

    const { data: internships, error } = await supabase
      .from('internship_details')
      .select('*')
      .eq('group_id', group_id);

    if (error) throw error;

    return ApiResponse.success(res, 'Internship details retrieved successfully.', { internships: internships || [] });
  });

  /**
   * Get all internship details (admin only)
   */
  getAllInternships = asyncHandler(async (req, res) => {
    const { data: internships, error } = await supabase
      .from('internship_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return ApiResponse.success(res, 'All internship details retrieved successfully.', { internships: internships || [] });
  });

  /**
   * Update internship details
   */
  updateInternship = asyncHandler(async (req, res) => {
    const enrollment_no = req.user?.enrollment_no || req.user?.enrollement_no;
    const { organization_name, internship_type, internship_duration, group_id } = req.body;

    if (!enrollment_no) {
      throw ApiError.unauthorized('Student enrollment number not found.');
    }

    const { data: existing, error: existingError } = await supabase
      .from('internship_details')
      .select('*')
      .eq('enrollment_no', enrollment_no)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (!existing) {
      throw ApiError.notFound('Internship details not found. Please submit first.');
    }

    console.log('Updating internship for enrollment_no:', enrollment_no);
    console.log('Request body:', { organization_name, internship_type, internship_duration });
    console.log('Existing data:', existing);

    const updateData = {
      organization_name: organization_name || existing.organization_name,
      internship_type: internship_type || existing.internship_type,
      internship_duration: internship_duration || existing.internship_duration,
      group_id: group_id !== undefined ? group_id : existing.group_id,
      updated_at: new Date().toISOString()
    };

    console.log('Update data prepared:', updateData);

    // Upload new file if provided
    if (req.file) {
      try {
        const fileName = `${enrollment_no}_${Date.now()}_${req.file.originalname}`;
        const filePath = `internships/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('internship-documents')
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error('File upload error:', uploadError);
          console.warn('Storage bucket may not exist. Updating without new file...');
          // Continue without file upload
          updateData.file_name = req.file.originalname;
          updateData.file_type = req.file.mimetype;
          updateData.file_url = 'pending_upload';
        } else {
          // Get public URL only if upload succeeded
          const { data: urlData } = supabase.storage
            .from('internship-documents')
            .getPublicUrl(filePath);

          updateData.file_url = urlData.publicUrl;
          updateData.file_name = req.file.originalname;
          updateData.file_type = req.file.mimetype;
        }
      } catch (storageError) {
        console.error('Storage error:', storageError);
        // Continue without file upload
        updateData.file_name = req.file.originalname;
        updateData.file_type = req.file.mimetype;
        updateData.file_url = 'pending_upload';
      }
    }

    const { data: internship, error } = await supabase
      .from('internship_details')
      .update(updateData)
      .eq('enrollment_no', enrollment_no)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Update successful:', internship);

    return ApiResponse.success(res, 'Internship details updated successfully.', { internship });
  });

  /**
   * Delete internship details
   */
  deleteInternship = asyncHandler(async (req, res) => {
    const enrollment_no = req.user?.enrollment_no || req.user?.enrollement_no;

    if (!enrollment_no) {
      throw ApiError.unauthorized('Student enrollment number not found.');
    }

    const { data: existing, error: existingError } = await supabase
      .from('internship_details')
      .select('*')
      .eq('enrollment_no', enrollment_no)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (!existing) {
      throw ApiError.notFound('Internship details not found.');
    }

    const { error } = await supabase
      .from('internship_details')
      .delete()
      .eq('enrollment_no', enrollment_no);

    if (error) throw error;

    return ApiResponse.success(res, 'Internship details deleted successfully.');
  });

  /**
   * Download internship document
   */
  downloadInternshipDocument = asyncHandler(async (req, res) => {
    const { enrollment_no } = req.params;

    if (!enrollment_no) {
      throw ApiError.badRequest('Enrollment number is required.');
    }

    try {
      // Get the internship details
      const { data: internship, error: fetchError } = await supabase
        .from('internship_details')
        .select('*')
        .eq('enrollment_no', enrollment_no)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      if (!internship || !internship.file_url) {
        throw ApiError.notFound('No file found for this internship');
      }

      // Extract file path from URL
      const urlParts = internship.file_url.split('/');
      const filePath = `internships/${urlParts[urlParts.length - 1]}`;

      // Download from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('internship-documents')
        .download(filePath);

      if (downloadError) {
        console.error('File download error:', downloadError);
        throw ApiError.notFound('Failed to download file');
      }

      // Convert blob to buffer
      const buffer = await fileData.arrayBuffer();

      // Set appropriate headers
      res.setHeader('Content-Type', internship.file_type);
      res.setHeader('Content-Disposition', `attachment; filename="${internship.file_name}"`);
      
      // Send file
      res.send(Buffer.from(buffer));
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      throw ApiError.notFound('Document not found or could not be downloaded');
    }
  });
}

export default new InternshipController();
