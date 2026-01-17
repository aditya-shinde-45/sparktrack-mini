import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import studentModel from '../../models/studentModel.js';
import mentorModel from '../../models/mentorModel.js';
import pblModel from '../../models/pblModel.js';
import supabase from '../../config/database.js';

/**
 * Controller for sub-admin role-based table access operations
 */
class RoleAccessController {
  /**
   * Helper: Verify if user has permission to access the table
   */
  verifyTablePermission = (tablePermissions, tableName) => {
    if (!tablePermissions || !Array.isArray(tablePermissions)) {
      throw ApiError.forbidden('No table permissions found');
    }
    
    if (!tablePermissions.includes(tableName)) {
      throw ApiError.forbidden(`You don't have permission to access ${tableName} table`);
    }
  };

  /**
   * Helper: Get the appropriate model based on table name
   */
  getModel = (tableName) => {
    const models = {
      students: studentModel,
      mentors: mentorModel,
      pbl: pblModel,
    };
    
    return models[tableName];
  };

  /**
   * GET: Fetch all records from a specific table
   */
  getAllRecords = asyncHandler(async (req, res) => {
    const { tableName } = req.params;
    const { tablePermissions } = req.user;

    // Verify permission
    this.verifyTablePermission(tablePermissions, tableName);

    let records;

    switch (tableName) {
      case 'students':
        records = await studentModel.getAllWithProfiles();
        break;

      case 'mentors':
        records = await mentorModel.getAll();
        break;

      case 'pbl':
        const { data: pblGroups, error: pblError } = await supabase
          .from('pbl')
          .select('*');
        
        if (pblError) {
          console.error('PBL fetch error:', pblError);
          throw ApiError.internalError(`Failed to fetch PBL groups: ${pblError.message}`);
        }
        records = pblGroups;
        break;

      default:
        throw ApiError.badRequest('Invalid table name');
    }

    return ApiResponse.success(res, `${tableName} records retrieved successfully`, { 
      records,
      count: records?.length || 0 
    });
  });

  /**
   * GET: Fetch a single record by ID
   */
  getRecordById = asyncHandler(async (req, res) => {
    const { tableName, id } = req.params;
    const { tablePermissions } = req.user;

    // Verify permission
    this.verifyTablePermission(tablePermissions, tableName);

    if (!id) {
      throw ApiError.badRequest('Record ID is required');
    }

    let record;

    switch (tableName) {
      case 'students':
        record = await studentModel.getByEnrollmentNo(id);
        break;

      case 'mentors':
        const { data: mentor, error: mentorError } = await supabase
          .from('mentors')
          .select('*')
          .eq('mentor_code', id)
          .single();
        
        if (mentorError || !mentor) {
          throw ApiError.notFound('Mentor not found');
        }
        record = mentor;
        break;

      case 'pbl':
        const { data: pblRecord, error: pblError } = await supabase
          .from('pbl')
          .select('*')
          .eq('enrollment_no', id)
          .single();
        
        if (pblError || !pblRecord) {
          throw ApiError.notFound('PBL record not found');
        }
        record = pblRecord;
        break;

      default:
        throw ApiError.badRequest('Invalid table name');
    }

    return ApiResponse.success(res, `${tableName} record retrieved successfully`, { record });
  });

  /**
   * POST: Create a new record in a specific table
   */
  createRecord = asyncHandler(async (req, res) => {
    const { tableName } = req.params;
    const { tablePermissions } = req.user;
    const recordData = req.body;

    // Verify permission
    this.verifyTablePermission(tablePermissions, tableName);

    if (!recordData || Object.keys(recordData).length === 0) {
      throw ApiError.badRequest('Record data is required');
    }

    let newRecord;

    switch (tableName) {
      case 'students':
        // Validate required student fields
        const { enrollment_no, name, email, classname } = recordData;
        if (!enrollment_no || !name || !email || !classname) {
          throw ApiError.badRequest('enrollment_no, name, email, and classname are required');
        }

        const { data: student, error: studentError } = await supabase
          .from('students')
          .insert([{
            enrollment_no,
            name,
            email,
            phone: recordData.phone || null,
            classname,
            specialization: recordData.specialization || null,
            created_at: new Date().toISOString(),
          }])
          .select()
          .single();
        
        if (studentError) {
          if (studentError.code === '23505') {
            throw ApiError.badRequest('Student with this enrollment number already exists');
          }
          throw ApiError.internalError('Failed to create student');
        }
        newRecord = student;
        break;

      case 'mentors':
        // Validate required mentor fields
        const { mentor_name, contact_number } = recordData;
        if (!mentor_name || !contact_number) {
          throw ApiError.badRequest('mentor_name and contact_number are required');
        }

        const { data: mentor, error: mentorError } = await supabase
          .from('mentors')
          .insert([{
            mentor_name,
            contact_number,
            group_id: recordData.group_id || null,
            // mentor_code will be auto-generated by trigger
          }])
          .select()
          .single();
        
        if (mentorError) {
          if (mentorError.code === '23505') {
            throw ApiError.badRequest('Mentor with this contact number already exists');
          }
          throw ApiError.internalError('Failed to create mentor');
        }
        newRecord = mentor;
        break;

      case 'pbl':
        // Validate required PBL fields
        const { group_id: pblGroupId, enrollment_no: pblEnrollmentNo, student_name, team_name } = recordData;
        if (!pblGroupId || !pblEnrollmentNo || !student_name || !team_name) {
          throw ApiError.badRequest('group_id, enrollment_no, student_name, and team_name are required');
        }

        const { data: pblGroup, error: pblError } = await supabase
          .from('pbl')
          .insert([{
            group_id: pblGroupId,
            enrollment_no: pblEnrollmentNo,
            student_name,
            team_name,
            class: recordData.class || null,
            email_id: recordData.email_id || null,
            contact: recordData.contact || null,
            is_leader: recordData.is_leader || false,
            mentor_code: recordData.mentor_code || null,
            ps_id: recordData.ps_id || null,
          }])
          .select()
          .single();
        
        if (pblError) {
          if (pblError.code === '23505') {
            throw ApiError.badRequest('PBL record with this enrollment number already exists');
          }
          throw ApiError.internalError('Failed to create PBL record');
        }
        newRecord = pblGroup;
        break;

      default:
        throw ApiError.badRequest('Invalid table name');
    }

    return ApiResponse.success(res, `${tableName} record created successfully`, { record: newRecord }, 201);
  });

  /**
   * PUT: Update an existing record
   */
  updateRecord = asyncHandler(async (req, res) => {
    const { tableName, id } = req.params;
    const { tablePermissions } = req.user;
    const updateData = req.body;

    // Verify permission
    this.verifyTablePermission(tablePermissions, tableName);

    if (!id) {
      throw ApiError.badRequest('Record ID is required');
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw ApiError.badRequest('Update data is required');
    }

    let updatedRecord;

    switch (tableName) {
      case 'students':
        // Use the existing model method if available
        updatedRecord = await studentModel.updateStudent(id, updateData);
        break;

      case 'mentors':
        // Check if mentor exists
        const { data: existingMentor, error: fetchError } = await supabase
          .from('mentors')
          .select('*')
          .eq('mentor_code', id)
          .single();
        
        if (fetchError || !existingMentor) {
          throw ApiError.notFound('Mentor not found');
        }

        // Handle password update if provided
        const mentorUpdateData = { ...updateData };
        if (updateData.password && updateData.password.trim() !== '') {
          const bcrypt = await import('bcrypt');
          mentorUpdateData.password = await bcrypt.hash(updateData.password, 10);
        } else {
          // Remove password from update if empty/not provided
          delete mentorUpdateData.password;
        }

        const { data: mentor, error: mentorError } = await supabase
          .from('mentors')
          .update(mentorUpdateData)
          .eq('mentor_code', id)
          .select()
          .single();
        
        if (mentorError) throw ApiError.internalError('Failed to update mentor');
        updatedRecord = mentor;
        break;

      case 'pbl':
        // Check if record exists
        const { data: existingPbl, error: pblFetchError } = await supabase
          .from('pbl')
          .select('*')
          .eq('enrollment_no', id)
          .single();
        
        if (pblFetchError || !existingPbl) {
          throw ApiError.notFound('PBL record not found');
        }

        const { data: pblGroup, error: pblError } = await supabase
          .from('pbl')
          .update(updateData)
          .eq('enrollment_no', id)
          .select()
          .single();
        
        if (pblError) throw ApiError.internalError('Failed to update PBL record');
        updatedRecord = pblGroup;
        break;

      default:
        throw ApiError.badRequest('Invalid table name');
    }

    return ApiResponse.success(res, `${tableName} record updated successfully`, { record: updatedRecord });
  });

  /**
   * DELETE: Delete a record
   */
  deleteRecord = asyncHandler(async (req, res) => {
    const { tableName, id } = req.params;
    const { tablePermissions } = req.user;

    // Verify permission
    this.verifyTablePermission(tablePermissions, tableName);

    if (!id) {
      throw ApiError.badRequest('Record ID is required');
    }

    switch (tableName) {
      case 'students':
        // Check if student exists
        const student = await studentModel.getByEnrollmentNo(id);
        if (!student) {
          throw ApiError.notFound('Student not found');
        }

        const { error: studentError } = await supabase
          .from('students')
          .delete()
          .eq('enrollment_no', id);
        
        if (studentError) throw ApiError.internalError('Failed to delete student');
        break;

      case 'mentors':
        // Check if mentor exists
        const { data: mentor, error: fetchError } = await supabase
          .from('mentors')
          .select('*')
          .eq('mentor_code', id)
          .single();
        
        if (fetchError || !mentor) {
          throw ApiError.notFound('Mentor not found');
        }

        const { error: mentorError } = await supabase
          .from('mentors')
          .delete()
          .eq('mentor_code', id);
        
        if (mentorError) throw ApiError.internalError('Failed to delete mentor');
        break;

      case 'pbl':
        // Check if record exists
        const { data: pblRecord, error: pblFetchError } = await supabase
          .from('pbl')
          .select('*')
          .eq('enrollment_no', id)
          .single();
        
        if (pblFetchError || !pblRecord) {
          throw ApiError.notFound('PBL record not found');
        }

        const { error: pblError } = await supabase
          .from('pbl')
          .delete()
          .eq('enrollment_no', id);
        
        if (pblError) throw ApiError.internalError('Failed to delete PBL record');
        break;

      default:
        throw ApiError.badRequest('Invalid table name');
    }

    return ApiResponse.success(res, `${tableName} record deleted successfully`, { id });
  });
}

export default new RoleAccessController();
