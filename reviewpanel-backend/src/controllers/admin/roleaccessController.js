import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import studentModel from '../../models/studentModel.js';
import mentorModel from '../../models/mentorModel.js';
import pblModel from '../../models/pblModel.js';
import evaluationFormModel from '../../models/evaluationFormModel.js';
import supabase from '../../config/database.js';
import emailService from '../../services/emailService.js';

/**
 * Controller for sub-admin role-based table access operations
 */
class RoleAccessController {
  isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

  sanitizeTemplateInput = (value, maxLen) => {
    if (value === undefined || value === null) return '';
    const normalized = String(value).replace(/\r/g, '').trim();
    return normalized.slice(0, maxLen);
  };

  renderTemplate = (template, variables = {}) => {
    const raw = String(template || '');
    return raw.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      const value = variables[key];
      return value === undefined || value === null ? '' : String(value);
    });
  };

  normalizeYearTag = (value) => String(value || '').trim().toUpperCase();

  extractYearTagFromClass = (classValue) => {
    const normalized = this.normalizeYearTag(classValue);
    if (!normalized) return '';
    if (normalized.includes('LY')) return 'LY';
    if (normalized.includes('TY')) return 'TY';
    if (normalized.includes('SY')) return 'SY';
    if (normalized.includes('FY')) return 'FY';
    return '';
  };

  buildAllowedYearSet = (allowedYears = []) => {
    const source = Array.isArray(allowedYears) ? allowedYears : [];
    return new Set(source.map((item) => this.normalizeYearTag(item)).filter(Boolean));
  };

  matchesYearScope = (classValue, selectedYear, allowedYearSet) => {
    const classYear = this.extractYearTagFromClass(classValue);

    if (allowedYearSet && allowedYearSet.size > 0 && (!classYear || !allowedYearSet.has(classYear))) {
      return false;
    }

    const normalizedSelectedYear = this.normalizeYearTag(selectedYear);
    if (!normalizedSelectedYear || normalizedSelectedYear === 'ALL') {
      return true;
    }

    return classYear === normalizedSelectedYear;
  };

  getTeacherSubmissionStatusData = async ({ formId, groupPrefix = '', classFilter = 'ALL' }) => {
    const normalizedPrefix = String(groupPrefix || '').trim().toLowerCase();
    const normalizedClassFilter = this.normalizeYearTag(classFilter || 'ALL');

    const evalForm = await evaluationFormModel.getFormById(formId);
    const allowedYearSet = this.buildAllowedYearSet(evalForm?.allowed_years || []);

    const { data: pblRows, error: pblError } = await supabase
      .from('pbl')
      .select('group_id, mentor_code, class')
      .not('group_id', 'is', null)
      .not('mentor_code', 'is', null);

    if (pblError) {
      throw ApiError.internalError(`Failed to fetch mentor-group mapping: ${pblError.message}`);
    }

    const groupToMentor = new Map();
    (pblRows || []).forEach((row) => {
      const groupId = String(row.group_id || '').trim();
      const mentorCode = String(row.mentor_code || '').trim();
      if (!groupId || !mentorCode) return;
      if (normalizedPrefix && !groupId.toLowerCase().startsWith(normalizedPrefix)) return;
      if (!this.matchesYearScope(row.class, normalizedClassFilter, allowedYearSet)) return;
      if (!groupToMentor.has(groupId)) {
        groupToMentor.set(groupId, mentorCode);
      }
    });

    const allGroups = [...groupToMentor.keys()];
    const mentorsMap = new Map();

    if (allGroups.length === 0) {
      return {
        summary: {
          totalTeachers: 0,
          teachersFullyGiven: 0,
          teachersPartiallyGiven: 0,
          teachersWithSubmissions: 0,
          teachersWithoutSubmissions: 0,
        },
        appliedYearFilter: normalizedClassFilter,
        formAllowedYears: [...allowedYearSet],
        formMeta: {
          id: evalForm?.id || formId,
          title: evalForm?.title || evalForm?.name || `Form ${formId}`,
        },
        completeMarks: [],
        partialMarks: [],
        gaveMarks: [],
        notGivenMarks: [],
      };
    }

    const submissions = await evaluationFormModel.listSubmissionsByForm(formId);
    const submittedGroups = new Set(
      (submissions || [])
        .map((row) => String(row.group_id || '').trim())
        .filter((groupId) => groupToMentor.has(groupId))
    );

    const { data: mentors, error: mentorError } = await supabase
      .from('mentors')
      .select('mentor_code, mentor_name');

    if (mentorError) {
      throw ApiError.internalError(`Failed to fetch mentors: ${mentorError.message}`);
    }

    (mentors || []).forEach((row) => {
      const code = String(row.mentor_code || '').trim();
      if (code) mentorsMap.set(code, String(row.mentor_name || '').trim());
    });

    const mentorStats = new Map();

    allGroups.forEach((groupId) => {
      const mentorCode = groupToMentor.get(groupId);
      if (!mentorCode) return;

      if (!mentorStats.has(mentorCode)) {
        mentorStats.set(mentorCode, {
          mentor_code: mentorCode,
          mentor_name: mentorsMap.get(mentorCode) || mentorCode,
          total_groups: 0,
          submitted_groups: 0,
          pending_groups: 0,
          group_ids: [],
          submitted_group_ids: [],
          pending_group_ids: [],
        });
      }

      const stats = mentorStats.get(mentorCode);
      stats.total_groups += 1;
      stats.group_ids.push(groupId);

      if (submittedGroups.has(groupId)) {
        stats.submitted_groups += 1;
        stats.submitted_group_ids.push(groupId);
      } else {
        stats.pending_groups += 1;
        stats.pending_group_ids.push(groupId);
      }
    });

    const teacherRows = [...mentorStats.values()].sort((a, b) => a.mentor_code.localeCompare(b.mentor_code));
    const completeMarks = teacherRows.filter((row) => row.total_groups > 0 && row.submitted_groups === row.total_groups);
    const partialMarks = teacherRows.filter((row) => row.submitted_groups > 0 && row.submitted_groups < row.total_groups);
    const gaveMarks = teacherRows.filter((row) => row.submitted_groups > 0); // Backward-compatible union
    const notGivenMarks = teacherRows.filter((row) => row.submitted_groups === 0);

    return {
      summary: {
        totalTeachers: teacherRows.length,
        teachersFullyGiven: completeMarks.length,
        teachersPartiallyGiven: partialMarks.length,
        teachersWithSubmissions: gaveMarks.length,
        teachersWithoutSubmissions: notGivenMarks.length,
      },
      appliedYearFilter: normalizedClassFilter,
      formAllowedYears: [...allowedYearSet],
      formMeta: {
        id: evalForm?.id || formId,
        title: evalForm?.title || evalForm?.name || `Form ${formId}`,
      },
      completeMarks,
      partialMarks,
      gaveMarks,
      notGivenMarks,
    };
  };

  /**
   * Helper: Verify if user has permission to access the table
   */
  verifyTablePermission = (tablePermissions, tableName, role) => {
    if ((role || '').toLowerCase() === 'admin') {
      return;
    }
    if (!tablePermissions || !Array.isArray(tablePermissions)) {
      throw ApiError.forbidden('No table permissions found');
    }
    
    const hasTableAccess = tablePermissions.includes(tableName)
      || (tableName === 'students1' && tablePermissions.includes('students'))
      || (tableName === 'students' && tablePermissions.includes('students1'));

    if (!hasTableAccess) {
      throw ApiError.forbidden(`You don't have permission to access ${tableName} table`);
    }
  };

  /**
   * Helper: Get the appropriate model based on table name
   */
  getModel = (tableName) => {
    const models = {
      students1: studentModel,
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
    this.currentUserRole = req.user?.role;

    // Verify permission
    this.verifyTablePermission(tablePermissions, tableName, req.user?.role);

    let records;

    switch (tableName) {
      case 'students1':
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

      case 'evaluation_form_submission': {
        if (forms === '1') {
          const evalForms = await evaluationFormModel.listForms();
          return ApiResponse.success(res, 'Evaluation forms retrieved successfully', { forms: evalForms || [] });
        }

        if (req.query.teachersStatus === '1') {
          if (!formId) {
            throw ApiError.badRequest('Form ID is required');
          }

          const { groupPrefix, classFilter } = req.query;
          const teacherStatus = await this.getTeacherSubmissionStatusData({ formId, groupPrefix, classFilter });
          return ApiResponse.success(res, 'Teacher submission status retrieved successfully', teacherStatus);
        }

        if (!formId) {
          throw ApiError.badRequest('Form ID is required');
        }

        const { groupPrefix } = req.query;
        const evalForm = await evaluationFormModel.getFormById(formId);
        let submissions = await evaluationFormModel.listSubmissionsByForm(formId);

        // Filter by group_id prefix if provided (case-insensitive, leading/trailing whitespace tolerant)
        if (groupPrefix && groupPrefix.trim() !== '') {
          const prefix = groupPrefix.trim().toLowerCase();
          submissions = submissions.filter(sub =>
            String(sub.group_id || '').toLowerCase().startsWith(prefix)
          );
        }

        const normalizedSearch = (search || '').toLowerCase().trim();
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
      }

      default:
        throw ApiError.badRequest('Invalid table name');
    }

    return ApiResponse.success(res, `${tableName} records retrieved successfully`, { 
      records,
      count: records?.length || 0 
    });
  });

  /**
   * POST: Send reminder emails to teachers with pending marks for an evaluation form
   */
  sendTeacherReminderEmails = asyncHandler(async (req, res) => {
    const role = String(req.user?.role || '').toLowerCase();
    if (role !== 'admin') {
      throw ApiError.forbidden('Only admin can send teacher reminder emails');
    }

    const body = req.body || {};
    const formId = String(body.formId || '').trim();
    const groupPrefix = String(body.groupPrefix || '').trim();
    const classFilter = this.normalizeYearTag(body.classFilter || 'ALL');
    const requestedMentorCodes = Array.isArray(body.mentor_codes)
      ? [...new Set(body.mentor_codes.map((code) => String(code || '').trim()).filter(Boolean))]
      : [];

    if (!formId) {
      throw ApiError.badRequest('formId is required');
    }

    const customSubject = this.sanitizeTemplateInput(body.subject, 200);
    const customMessage = this.sanitizeTemplateInput(body.message, 5000);

    if (customSubject.includes('\n')) {
      throw ApiError.badRequest('Email subject cannot contain line breaks');
    }

    const teacherStatus = await this.getTeacherSubmissionStatusData({ formId, groupPrefix, classFilter });
    const pendingTeachers = [...(teacherStatus.partialMarks || []), ...(teacherStatus.notGivenMarks || [])];

    const targetTeachers = requestedMentorCodes.length > 0
      ? pendingTeachers.filter((teacher) => requestedMentorCodes.includes(String(teacher.mentor_code || '').trim()))
      : pendingTeachers;

    if (targetTeachers.length === 0) {
      return ApiResponse.success(res, 'No pending teachers found for reminder email', {
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        sentTeachers: [],
        failedTeachers: [],
        skippedTeachers: [],
      });
    }

    const mentorCodes = [...new Set(targetTeachers.map((teacher) => String(teacher.mentor_code || '').trim()).filter(Boolean))];
    const { data: mentorRows, error: mentorError } = await supabase
      .from('mentors')
      .select('mentor_code, mentor_name, email')
      .in('mentor_code', mentorCodes);

    if (mentorError) {
      throw ApiError.internalError(`Failed to fetch mentor emails: ${mentorError.message}`);
    }

    const mentorEmailMap = new Map();
    (mentorRows || []).forEach((row) => {
      const code = String(row.mentor_code || '').trim();
      if (!code) return;
      mentorEmailMap.set(code, {
        mentor_name: String(row.mentor_name || '').trim() || code,
        email: String(row.email || '').trim().toLowerCase(),
      });
    });

    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const sentTeachers = [];
    const failedTeachers = [];
    const skippedTeachers = [];

    const defaultSubjectTemplate = 'Reminder: Please submit pending evaluation marks ({{form_title}})';
    const defaultBodyTemplate = `Dear {{mentor_name}} ({{mentor_code}}),

This is a reminder to submit evaluation marks for the pending groups in {{form_title}}.

Pending groups:
{{pending_groups}}

Pending count: {{pending_count}}

Please complete the marks submission at the earliest.

Regards,
SparkTrack Admin`;

    const processTeacher = async (teacher) => {
      const mentorCode = String(teacher.mentor_code || '').trim();
      const mentorEmailInfo = mentorEmailMap.get(mentorCode);
      const mentorEmail = String(mentorEmailInfo?.email || '').trim();
      const mentorName = mentorEmailInfo?.mentor_name || String(teacher.mentor_name || mentorCode);

      const pendingGroups = Array.isArray(teacher.pending_group_ids)
        ? teacher.pending_group_ids.map((groupId) => String(groupId || '').trim()).filter(Boolean)
        : [];

      if (!mentorEmail || !this.isValidEmail(mentorEmail)) {
        return {
          status: 'skipped',
          payload: { mentor_code: mentorCode, mentor_name: mentorName, reason: 'No valid mentor email found' },
        };
      }

      if (pendingGroups.length === 0) {
        return {
          status: 'skipped',
          payload: { mentor_code: mentorCode, mentor_name: mentorName, reason: 'No pending groups for this teacher' },
        };
      }

      const templateVariables = {
        mentor_name: mentorName,
        mentor_code: mentorCode,
        pending_groups: pendingGroups.map((groupId) => `- ${groupId}`).join('\n'),
        pending_count: pendingGroups.length,
        form_title: teacherStatus.formMeta?.title || `Form ${formId}`,
        form_id: formId,
      };

      const subject = this.renderTemplate(customSubject || defaultSubjectTemplate, templateVariables);
      const text = this.renderTemplate(customMessage || defaultBodyTemplate, templateVariables);
      const html = `<p>${String(text).replace(/\n/g, '<br/>')}</p>`;

      try {
        await emailService.sendMail(mentorEmail, subject, text, html);
        return {
          status: 'sent',
          payload: { mentor_code: mentorCode, mentor_name: mentorName, recipients: [mentorEmail], pending_groups: pendingGroups },
        };
      } catch (_error) {
        return {
          status: 'failed',
          payload: { mentor_code: mentorCode, mentor_name: mentorName, error: 'Failed to send email' },
        };
      }
    };

    const batchSize = 5;
    for (let i = 0; i < targetTeachers.length; i += batchSize) {
      const batch = targetTeachers.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((teacher) => processTeacher(teacher)));
      batchResults.forEach((result) => {
        if (result.status === 'sent') {
          sentCount += 1;
          sentTeachers.push(result.payload);
        } else if (result.status === 'failed') {
          failedCount += 1;
          failedTeachers.push(result.payload);
        } else {
          skippedCount += 1;
          skippedTeachers.push(result.payload);
        }
      });
    }

    return ApiResponse.success(res, 'Teacher reminder email process completed', {
      sentCount,
      failedCount,
      skippedCount,
      sentTeachers,
      failedTeachers,
      skippedTeachers,
    });
  });

  /**
   * GET: Fetch a single record by ID
   */
  getRecordById = asyncHandler(async (req, res) => {
    const { tableName, id } = req.params;
    const { tablePermissions } = req.user;
    // Verify permission
    this.verifyTablePermission(tablePermissions, tableName, req.user?.role);

    if (!id) {
      throw ApiError.badRequest('Record ID is required');
    }

    let record;

    switch (tableName) {
      case 'students1':
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
    this.verifyTablePermission(tablePermissions, tableName, req.user?.role);

    if (!recordData || Object.keys(recordData).length === 0) {
      throw ApiError.badRequest('Record data is required');
    }

    let newRecord;

    switch (tableName) {
      case 'students1':
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
          .from('students1')
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
            email: email ? String(email).trim().toLowerCase() : null,
            designation: designation ? String(designation).trim() : null,
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
    this.verifyTablePermission(tablePermissions, tableName, req.user?.role);

    if (!id) {
      throw ApiError.badRequest('Record ID is required');
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw ApiError.badRequest('Update data is required');
    }

    let updatedRecord;

    switch (tableName) {
      case 'students1':
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
    this.verifyTablePermission(tablePermissions, tableName, req.user?.role);

    if (!id) {
      throw ApiError.badRequest('Record ID is required');
    }

    switch (tableName) {
      case 'students1':
      case 'students':
        // Check if student exists
        const student = await studentModel.getByEnrollmentNo(id);
        if (!student) {
          throw ApiError.notFound('Student not found');
        }

        const { error: studentError } = await supabase
          .from('students1')
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
