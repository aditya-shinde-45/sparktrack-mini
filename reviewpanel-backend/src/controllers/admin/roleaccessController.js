import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import studentModel from '../../models/studentModel.js';
import mentorModel from '../../models/mentorModel.js';
import pblModel from '../../models/pblModel.js';
import evaluationFormModel from '../../models/evaluationFormModel.js';
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
    const { formId, forms, page, limit, search } = req.query;

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
        // Fetch PBL groups
        const { data: pblGroups, error: pblError } = await supabase
          .from('pbl')
          .select('*');
        
        if (pblError) {
          console.error('PBL fetch error:', pblError);
          throw ApiError.internalError(`Failed to fetch PBL groups: ${pblError.message}`);
        }

        // Fetch all mentors to map mentor_code to mentor_name
        const { data: mentors, error: mentorsError } = await supabase
          .from('mentors')
          .select('mentor_code, mentor_name');
        
        if (mentorsError) {
          console.error('Mentors fetch error:', mentorsError);
        }

        // Create mentor map for quick lookup
        const mentorMap = {};
        if (mentors) {
          mentors.forEach(mentor => {
            mentorMap[mentor.mentor_code] = mentor.mentor_name;
          });
        }
        
        // Add mentor_name to records
        records = pblGroups?.map(record => ({
          ...record,
          mentor_name: record.mentor_code ? mentorMap[record.mentor_code] : null,
        })) || [];
        break;

      case 'industrial_mentors':
        const { data: industrialMentors, error: industrialError } = await supabase
          .from('industrial_mentors')
          .select('id, industrial_mentor_code, name, company_name, designation, email, contact, mentor_code, created_at')
          .order('created_at', { ascending: false });

        if (industrialError) {
          throw ApiError.internalError('Failed to fetch industrial mentors');
        }

        const { data: industrialMentorLinks, error: mentorLookupError } = await supabase
          .from('mentors')
          .select('mentor_code, mentor_name');

        if (mentorLookupError) {
          throw ApiError.internalError('Failed to fetch mentors for industrial mentors');
        }

        const mentorNameMap = {};
        (industrialMentorLinks || []).forEach((mentor) => {
          mentorNameMap[mentor.mentor_code] = mentor.mentor_name;
        });

        records = (industrialMentors || []).map((record) => ({
          ...record,
          mentor_name: record.mentor_code ? mentorNameMap[record.mentor_code] : null
        }));
        break;

      case 'evaluation_form_submission':
        if (forms === '1') {
          const evalForms = await evaluationFormModel.listForms();
          return ApiResponse.success(res, 'Evaluation forms retrieved successfully', { forms: evalForms || [] });
        }

        if (!formId) {
          throw ApiError.badRequest('Form ID is required');
        }

        const evalForm = await evaluationFormModel.getFormById(formId);
        const submissions = await evaluationFormModel.listSubmissionsByForm(formId);
        const normalizedSearch = (search || '').toLowerCase();
        const safeLimit = Number(limit) || 50;
        const safePage = Number(page) || 1;

        const flattened = submissions.flatMap((submission) => {
          const evaluations = Array.isArray(submission.evaluations) ? submission.evaluations : [];
          return evaluations.map((evaluation) => ({
            submission_id: submission.id,
            group_id: submission.group_id,
            external_name: submission.external_name,
            feedback: submission.feedback,
            created_at: submission.created_at,
            enrollment_no: evaluation.enrollment_no || evaluation.enrollement_no,
            student_name: evaluation.student_name || evaluation.name_of_student,
            marks: evaluation.marks || {},
            total: evaluation.total ?? null,
            absent: evaluation.absent || false
          }));
        });

        const filtered = normalizedSearch
          ? flattened.filter((row) => {
              const groupId = String(row.group_id || '').toLowerCase();
              const enrollmentNo = String(row.enrollment_no || '').toLowerCase();
              const studentName = String(row.student_name || '').toLowerCase();
              return groupId.includes(normalizedSearch)
                || enrollmentNo.includes(normalizedSearch)
                || studentName.includes(normalizedSearch);
            })
          : flattened;

        const totalRecords = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalRecords / safeLimit));
        const safePageNumber = Math.min(Math.max(safePage, 1), totalPages);
        const startIndex = (safePageNumber - 1) * safeLimit;
        const paginated = filtered.slice(startIndex, startIndex + safeLimit);

        return ApiResponse.success(res, 'Evaluation form submissions retrieved successfully', {
          data: paginated,
          pagination: {
            currentPage: safePageNumber,
            totalPages,
            totalRecords,
            limit: safeLimit
          },
          form: evalForm || null
        });

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
        const { enrollment_no, name_of_students, email_id, class: studentClass } = recordData;
        if (!enrollment_no || !name_of_students || !email_id || !studentClass) {
          throw ApiError.badRequest('enrollment_no, name_of_students, email_id, and class are required');
        }

        // Handle password if provided
        let hashedPassword = null;
        if (recordData.password && recordData.password.trim() !== '') {
          const bcrypt = await import('bcrypt');
          hashedPassword = await bcrypt.hash(recordData.password, 10);
        }

        const { data: student, error: studentError } = await supabase
          .from('students')
          .insert([{
            enrollment_no,
            name_of_student: name_of_students,
            student_email_id: email_id,
            student_contact_no: recordData.contact || null,
            class_division: studentClass,
            password: hashedPassword,
            created_at: new Date().toISOString(),
          }])
          .select()
          .single();
        
        if (studentError) {
          console.error('Student creation error:', studentError);
          console.error('Data attempted:', {
            enrollment_no,
            name_of_student: name_of_students,
            student_email_id: email_id,
            student_contact_no: recordData.contact || null,
            class_division: studentClass,
          });
          if (studentError.code === '23505') {
            throw ApiError.badRequest('Student with this enrollment number already exists');
          }
          throw ApiError.internalError(`Failed to create student: ${studentError.message || JSON.stringify(studentError)}`);
        }
        newRecord = student;
        break;

      case 'mentors':
        // Validate required mentor fields
        const { mentor_name, contact_number, email, designation } = recordData;
        if (!mentor_name || !contact_number) {
          throw ApiError.badRequest('mentor_name and contact_number are required');
        }

        const normalizedContact = String(contact_number).trim();
        if (!normalizedContact) {
          throw ApiError.badRequest('contact_number is required');
        }

        const { data: existingByContact, error: contactLookupError } = await supabase
          .from('mentors')
          .select('mentor_code, contact_number')
          .eq('contact_number', normalizedContact)
          .maybeSingle();

        if (contactLookupError && contactLookupError.code !== 'PGRST116') {
          throw ApiError.internalError('Failed to check mentor contact number');
        }

        if (existingByContact) {
          throw ApiError.badRequest('Mentor with this contact number already exists');
        }

        // Auto-generate mentor_code starting from M190
        const { data: existingMentors, error: fetchError } = await supabase
          .from('mentors')
          .select('mentor_code')
          .ilike('mentor_code', 'm%');

        if (fetchError) {
          throw ApiError.internalError('Failed to generate mentor code');
        }
        
        let maxMentorNumber = 189;
        (existingMentors || []).forEach((mentor) => {
          const match = String(mentor.mentor_code || '').match(/m(\d+)/i);
          if (match) {
            const parsed = Number.parseInt(match[1], 10);
            if (!Number.isNaN(parsed)) {
              maxMentorNumber = Math.max(maxMentorNumber, parsed);
            }
          }
        });

        const newMentorCode = `M${maxMentorNumber + 1}`;

        const { data: mentor, error: mentorError } = await supabase
          .from('mentors')
          .insert([{
            mentor_name,
            contact_number: normalizedContact,
            mentor_code: newMentorCode,
            group_id: null,
          }])
          .select()
          .single();
        
        if (mentorError) {
          if (mentorError.code === '23505') {
            if (mentorError.details && mentorError.details.includes('contact_number')) {
              throw ApiError.badRequest('Mentor with this contact number already exists');
            }
            if (mentorError.details && mentorError.details.includes('mentor_code')) {
              throw ApiError.badRequest('Generated mentor code already exists. Please retry.');
            }
            throw ApiError.badRequest('Mentor already exists');
          }
          throw ApiError.internalError('Failed to create mentor');
        }
        newRecord = mentor;
        break;

      case 'pbl':
        // Validate required PBL fields
        const { group_id: pblGroupId, enrollment_no: pblEnrollmentNo, student_name } = recordData;
        if (!pblGroupId || !pblEnrollmentNo || !student_name) {
          throw ApiError.badRequest('group_id, enrollment_no, and student_name are required');
        }

        const pblInsertData = {
          group_id: pblGroupId,
          enrollment_no: pblEnrollmentNo,
          student_name: student_name,
          class: recordData.class || null,
          team_name: recordData.team_name || null,
          is_leader: recordData.is_leader || false,
          mentor_code: recordData.mentor_code || null,
        };

        console.log('Attempting to insert PBL record:', pblInsertData);

        const { data: pblGroup, error: pblError } = await supabase
          .from('pbl')
          .insert([pblInsertData])
          .select()
          .single();
        
        if (pblError) {
          console.error('PBL insert error details:', {
            message: pblError.message,
            details: pblError.details,
            hint: pblError.hint,
            code: pblError.code,
            fullError: pblError
          });
          if (pblError.code === '23505') {
            throw ApiError.badRequest('PBL record with this enrollment number already exists');
          }
          throw ApiError.internalError(`Failed to create PBL record: ${pblError.message || JSON.stringify(pblError)}`);
        }
        
        console.log('PBL record created successfully:', pblGroup);
        
        newRecord = pblGroup;
        break;

      case 'industrial_mentors':
        const {
          name,
          email: industrialEmail,
          contact: industrialContact,
          company_name: industrialCompany,
          designation: industrialDesignation,
          mentor_code: industrialMentorCode
        } = recordData;
        if (!name || !industrialEmail || !industrialContact) {
          throw ApiError.badRequest('name, email, and contact are required');
        }

        let hashedIndustrialPassword = null;
        if (recordData.password && recordData.password.trim() !== '') {
          const bcrypt = await import('bcrypt');
          hashedIndustrialPassword = await bcrypt.hash(recordData.password, 10);
        }

        let industrialMentorCodeValue = recordData.industrial_mentor_code;
        if (!industrialMentorCodeValue) {
          const { data: codes, error: codeError } = await supabase
            .from('industrial_mentors')
            .select('industrial_mentor_code')
            .ilike('industrial_mentor_code', 'im%');

          if (codeError) {
            throw ApiError.internalError('Failed to generate industrial mentor code');
          }

          let maxNumber = 0;
          (codes || []).forEach((row) => {
            const match = String(row.industrial_mentor_code || '').match(/im(\d+)/i);
            if (match) {
              const parsed = Number.parseInt(match[1], 10);
              if (!Number.isNaN(parsed)) {
                maxNumber = Math.max(maxNumber, parsed);
              }
            }
          });
          industrialMentorCodeValue = `IM${String(maxNumber + 1).padStart(3, '0')}`;
        }

        const { data: industrialMentor, error: industrialInsertError } = await supabase
          .from('industrial_mentors')
          .insert([{
            industrial_mentor_code: industrialMentorCodeValue,
            name,
            email: industrialEmail,
            contact: industrialContact,
            company_name: industrialCompany || null,
            designation: industrialDesignation || null,
            mentor_code: industrialMentorCode || null,
            password: hashedIndustrialPassword
          }])
          .select()
          .single();

        if (industrialInsertError) {
          throw ApiError.internalError('Failed to create industrial mentor');
        }

        const { password: _password, ...safeIndustrialMentor } = industrialMentor || {};
        newRecord = safeIndustrialMentor;
        break;

      case 'evaluation_form_submission':
        throw ApiError.badRequest('Evaluation form submissions cannot be created here');

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

        console.log('PBL Update - Received data:', updateData);
        console.log('Existing PBL:', existingPbl);

        // If mentor_code is being updated, update all group members
        if (updateData.mentor_code && existingPbl.group_id) {
          console.log('Updating mentor_code for all group members');
          const { data: allGroupMembers, error: groupError } = await supabase
            .from('pbl')
            .update({ mentor_code: updateData.mentor_code })
            .eq('group_id', existingPbl.group_id)
            .select();
          
          if (groupError) throw ApiError.internalError('Failed to update group mentor');
          
          // Get the updated record for the current member
          updatedRecord = allGroupMembers.find(member => member.enrollment_no === id) || allGroupMembers[0];
        } else {
          // Normal update for single record (including group_id, student_name, class, etc.)
          console.log('Updating single record with data:', updateData);
          const { data: pblGroup, error: pblError } = await supabase
            .from('pbl')
            .update(updateData)
            .eq('enrollment_no', id)
            .select()
            .single();
          
          if (pblError) {
            console.error('PBL update error:', pblError);
            throw ApiError.internalError(`Failed to update PBL record: ${pblError.message}`);
          }
          updatedRecord = pblGroup;
        }
        break;

      case 'evaluation_form_submission':
        throw ApiError.badRequest('Evaluation form submissions cannot be updated here');

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
    const { formId } = req.query;

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

      case 'industrial_mentors':
        throw ApiError.forbidden('Industrial mentors cannot be deleted by sub-admins');
        break;

      case 'evaluation_form_submission':
        if (!formId) {
          throw ApiError.badRequest('Form ID is required');
        }

        const submission = await evaluationFormModel.getSubmissionByFormAndGroup(formId, id);
        if (!submission) {
          throw ApiError.notFound('Submission not found for this group');
        }

        await evaluationFormModel.deleteSubmission(submission.id, formId);
        break;

      default:
        throw ApiError.badRequest('Invalid table name');
    }

    return ApiResponse.success(res, `${tableName} record deleted successfully`, { id });
  });
}

export default new RoleAccessController();
