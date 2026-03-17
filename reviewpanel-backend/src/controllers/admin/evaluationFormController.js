import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import evaluationFormModel from '../../models/evaluationFormModel.js';
import problemStatementModel from '../../models/problemStatementModel.js';
import supabase from '../../config/database.js';

const YEAR_OPTIONS = ['SY', 'TY', 'LY'];
const ROLE_OPTIONS = ['mentor', 'industry_mentor'];
const EVALUATION_UPLOAD_BUCKET = 'evaluation-forms';

const evaluationUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

export const uploadEvaluationFileMiddleware = evaluationUpload.single('file');

const normalizeAllowedYears = (years) => {
  if (!Array.isArray(years)) return [];
  const normalized = years
    .map((value) => String(value || '').trim().toUpperCase())
    .filter((value) => YEAR_OPTIONS.includes(value));
  return Array.from(new Set(normalized));
};

const normalizeFieldType = (field = {}) => {
  if (field.type) return field.type;
  return Number(field.max_marks) > 0 ? 'number' : 'boolean';
};

const coerceBooleanValue = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', ''].includes(normalized)) return false;
  }
  return Boolean(value);
};

const normalizeRoleList = (roles, fallback = []) => {
  if (!Array.isArray(roles)) return [...fallback];
  const normalized = roles
    .map((role) => String(role || '').trim().toLowerCase())
    .filter((role) => ROLE_OPTIONS.includes(role));
  return Array.from(new Set(normalized));
};

class EvaluationFormController {
  isAdmin = (user = {}) => String(user?.role || '').toLowerCase() === 'admin';

  isIndustryMentor = (user = {}) => String(user?.role || '').toLowerCase() === 'industry_mentor';

  getFormRolePermissions = (form = {}) => {
    const viewRoles = normalizeRoleList(form?.view_roles, ROLE_OPTIONS);
    const editAfterSubmitRoles = normalizeRoleList(form?.edit_after_submit_roles, []);
    return { viewRoles, editAfterSubmitRoles };
  };

  assertFormAccess = (user = {}, form = {}, action = 'view') => {
    const role = String(user?.role || '').toLowerCase();
    if (!['mentor', 'industry_mentor'].includes(role)) return;

    const { viewRoles, editAfterSubmitRoles } = this.getFormRolePermissions(form);

    if (action === 'view' && !viewRoles.includes(role)) {
      throw ApiError.forbidden('This role is not allowed to view this evaluation form');
    }

    if (action === 'edit_after_submit' && !editAfterSubmitRoles.includes(role)) {
      throw ApiError.forbidden('This role is not allowed to edit marks after submission');
    }
  };

  getScopedGroupIds = async (user = {}) => {
    const role = String(user?.role || '').toLowerCase();

    if (role === 'mentor') {
      const mentorCode = user?.mentor_code || user?.mentor_id || null;
      if (!mentorCode) return [];

      const { data, error } = await supabase
        .from('pbl')
        .select('group_id')
        .eq('mentor_code', mentorCode);

      if (error) throw error;
      return [...new Set((data || []).map((row) => row.group_id).filter(Boolean))];
    }

    if (role === 'industry_mentor') {
      const mentorCodes = Array.isArray(user?.mentor_codes) && user.mentor_codes.length > 0
        ? user.mentor_codes
        : (user?.mentor_code ? [user.mentor_code] : []);

      if (mentorCodes.length === 0) return [];

      const { data, error } = await supabase
        .from('pbl')
        .select('group_id')
        .in('mentor_code', mentorCodes);

      if (error) throw error;
      return [...new Set((data || []).map((row) => row.group_id).filter(Boolean))];
    }

    return null;
  };

  assertGroupAccess = async (user = {}, groupId) => {
    const role = String(user?.role || '').toLowerCase();
    if (!['mentor', 'industry_mentor'].includes(role)) return;

    const scopedGroupIds = await this.getScopedGroupIds(user);
    const allowedSet = new Set(scopedGroupIds || []);
    if (!allowedSet.has(groupId)) {
      throw ApiError.forbidden('You can access marks only for your assigned groups');
    }
  };

  listForms = asyncHandler(async (req, res) => {
    const forms = await evaluationFormModel.listForms();
    const role = String(req.user?.role || '').toLowerCase();

    if (!['mentor', 'industry_mentor'].includes(role)) {
      return ApiResponse.success(res, 'Evaluation forms retrieved successfully', forms);
    }

    const filteredForms = (forms || []).filter((form) => {
      const { viewRoles } = this.getFormRolePermissions(form);
      return viewRoles.includes(role);
    });

    return ApiResponse.success(res, 'Evaluation forms retrieved successfully', filteredForms);
  });

  getForm = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    if (!formId) throw ApiError.badRequest('Form ID is required');

    const form = await evaluationFormModel.getFormById(formId);
    this.assertFormAccess(req.user, form, 'view');
    return ApiResponse.success(res, 'Evaluation form retrieved successfully', form);
  });

  createForm = asyncHandler(async (req, res) => {
    const { name, total_marks, fields, allowed_years, sheet_title, view_roles, edit_after_submit_roles } = req.body;
    if (!name || !total_marks || !Array.isArray(fields) || fields.length === 0) {
      throw ApiError.badRequest('Name, total marks, and at least one field are required');
    }

    const created_by = req.user?.id || req.user?.admin_id || req.user?.email || null;
    const normalizedYears = normalizeAllowedYears(allowed_years);
    const normalizedViewRoles = normalizeRoleList(view_roles, ROLE_OPTIONS);
    const normalizedEditRoles = normalizeRoleList(edit_after_submit_roles, []);

    const sanitizedFields = fields.map((field, index) => {
      const normalizedType = ['number', 'boolean', 'text', 'select', 'file'].includes(field.type)
        ? field.type
        : (Number(field.max_marks) > 0 ? 'number' : 'boolean');
      const options = normalizedType === 'select'
        ? Array.from(new Set((field.options || []).map((value) => String(value || '').trim()).filter(Boolean)))
        : [];
      const scope = ['select', 'file'].includes(normalizedType)
        ? (field.scope === 'individual' ? 'individual' : 'common')
        : undefined;
      const allowedTypes = normalizedType === 'file'
        ? String(field.allowed_types || 'all').trim().toLowerCase()
        : undefined;
      const maxSizeMb = normalizedType === 'file'
        ? Number(field.max_size_mb) || null
        : undefined;

      return {
        key: field.key || `field_${index + 1}`,
        label: field.label?.trim() || `Field ${index + 1}`,
        type: normalizedType,
        max_marks: normalizedType === 'number' ? Number(field.max_marks) || 0 : 0,
        order: typeof field.order === 'number' ? field.order : index,
        options,
        scope,
        allowed_types: allowedTypes,
        max_size_mb: maxSizeMb
      };
    });

    const form = await evaluationFormModel.createForm({
      name: name.trim(),
      sheet_title: sheet_title ? String(sheet_title).trim() : null,
      total_marks: Number(total_marks),
      fields: sanitizedFields,
      created_by,
      allowed_years: normalizedYears,
      view_roles: normalizedViewRoles,
      edit_after_submit_roles: normalizedEditRoles
    });

    const deadlineKey = `evaluation_form_${form.id}`;
    try {
      await supabase
        .from('deadlines_control')
        .upsert(
          {
            key: deadlineKey,
            label: `Evaluation: ${form.name}`,
            enabled: true
          },
          { onConflict: 'key', ignoreDuplicates: true }
        );
    } catch (deadlineError) {
      console.error('Failed to create deadline toggle for evaluation form:', deadlineError);
    }

    return ApiResponse.success(res, 'Evaluation form created successfully', form, 201);
  });

  updateForm = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const { name, total_marks, fields, allowed_years, sheet_title, view_roles, edit_after_submit_roles } = req.body;

    if (!formId || !name || !total_marks || !Array.isArray(fields) || fields.length === 0) {
      throw ApiError.badRequest('Form ID, name, total marks, and fields are required');
    }

    const sanitizedFields = fields.map((field, index) => {
      const normalizedType = ['number', 'boolean', 'text', 'select', 'file'].includes(field.type)
        ? field.type
        : (Number(field.max_marks) > 0 ? 'number' : 'boolean');
      const options = normalizedType === 'select'
        ? Array.from(new Set((field.options || []).map((value) => String(value || '').trim()).filter(Boolean)))
        : [];
      const scope = ['select', 'file'].includes(normalizedType)
        ? (field.scope === 'individual' ? 'individual' : 'common')
        : undefined;
      const allowedTypes = normalizedType === 'file'
        ? String(field.allowed_types || 'all').trim().toLowerCase()
        : undefined;
      const maxSizeMb = normalizedType === 'file'
        ? Number(field.max_size_mb) || null
        : undefined;

      return {
        key: field.key || `field_${index + 1}`,
        label: field.label?.trim() || `Field ${index + 1}`,
        type: normalizedType,
        max_marks: normalizedType === 'number' ? Number(field.max_marks) || 0 : 0,
        order: typeof field.order === 'number' ? field.order : index,
        options,
        scope,
        allowed_types: allowedTypes,
        max_size_mb: maxSizeMb
      };
    });

    const normalizedYears = normalizeAllowedYears(allowed_years);
    const normalizedViewRoles = normalizeRoleList(view_roles, ROLE_OPTIONS);
    const normalizedEditRoles = normalizeRoleList(edit_after_submit_roles, []);

    const updated = await evaluationFormModel.updateForm(formId, {
      name: name.trim(),
      sheet_title: sheet_title ? String(sheet_title).trim() : null,
      total_marks: Number(total_marks),
      fields: sanitizedFields,
      allowed_years: normalizedYears,
      view_roles: normalizedViewRoles,
      edit_after_submit_roles: normalizedEditRoles
    });

    const deadlineKey = `evaluation_form_${formId}`;
    const updatedLabel = `Evaluation: ${name.trim()}`;
    try {
      const { data: deadlineUpdate } = await supabase
        .from('deadlines_control')
        .update({ label: updatedLabel })
        .eq('key', deadlineKey)
        .select('key');

      if (!deadlineUpdate || deadlineUpdate.length === 0) {
        await supabase
          .from('deadlines_control')
          .insert({ key: deadlineKey, label: updatedLabel, enabled: true });
      }
    } catch (deadlineError) {
      console.error('Failed to update deadline label for evaluation form:', deadlineError);
    }

    return ApiResponse.success(res, 'Evaluation form updated successfully', updated);
  });

  getGroupDetails = asyncHandler(async (req, res) => {
    const { formId, groupId } = req.params;
    if (!groupId) throw ApiError.badRequest('Group ID is required');

    if (!formId) throw ApiError.badRequest('Form ID is required');

    const form = await evaluationFormModel.getFormById(formId);
    this.assertFormAccess(req.user, form, 'view');

    await this.assertGroupAccess(req.user, groupId);

    const { data, error } = await supabase
      .from('pbl')
      .select('group_id, enrollment_no, student_name, class, mentor_code, ps_id')
      .eq('group_id', groupId);

    if (error) throw error;

    const problemStatement = await problemStatementModel.findByGroup(groupId);

    const normalizedStudents = (data || []).map((student) => ({
      ...student,
      enrollment_no: student.enrollment_no
    }));

    return ApiResponse.success(res, 'Group details retrieved successfully', {
      group_id: groupId,
      students: normalizedStudents,
      problem_statement: problemStatement
    });
  });

  submitEvaluation = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const { group_id, external_name, feedback, evaluations } = req.body;

    if (!formId || !group_id || !Array.isArray(evaluations)) {
      throw ApiError.badRequest('Form ID, group ID and evaluations are required');
    }

    await this.assertGroupAccess(req.user, group_id);

  const form = await evaluationFormModel.getFormById(formId);
  this.assertFormAccess(req.user, form, 'view');

    const created_by = req.user?.id || req.user?.admin_id || req.user?.email || null;

    const normalizedEvaluations = evaluations.map((student) => ({
      ...student,
      enrollement_no: student.enrollement_no || student.enrollment_no
    }));

    const existingSubmission = await evaluationFormModel.getSubmissionByFormAndGroup(formId, group_id);

    if (existingSubmission) {
      if (existingSubmission.is_approved && !this.isAdmin(req.user)) {
        throw ApiError.forbidden('Evaluation has been approved and can no longer be edited');
      }

      this.assertFormAccess(req.user, form, 'edit_after_submit');

      const updatedSubmission = await evaluationFormModel.updateSubmission(existingSubmission.id, formId, {
        external_name: external_name || null,
        feedback: feedback || null,
        evaluations: normalizedEvaluations
      });

      return ApiResponse.success(res, 'Evaluation updated successfully', updatedSubmission);
    }

    const submission = await evaluationFormModel.createSubmission({
      form_id: formId,
      group_id,
      external_name: external_name || null,
      feedback: feedback || null,
      evaluations: normalizedEvaluations,
      created_by
    });

    return ApiResponse.success(res, 'Evaluation submitted successfully', submission, 201);
  });

  uploadEvaluationFile = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const { group_id, field_key, scope, enrollment_no } = req.body;

    if (!formId) {
      throw ApiError.badRequest('Form ID is required');
    }

    if (!req.file) {
      throw ApiError.badRequest('File is required');
    }

    if (!group_id) {
      throw ApiError.badRequest('Group ID is required');
    }

    if (!field_key) {
      throw ApiError.badRequest('Field key is required');
    }

    const form = await evaluationFormModel.getFormById(formId);
    this.assertFormAccess(req.user, form, 'view');

    await this.assertGroupAccess(req.user, group_id);

    if (!form) {
      throw ApiError.notFound('Evaluation form not found');
    }

    const fields = Array.isArray(form?.fields) ? form.fields : [];
    const targetField = fields.find((field) => field.key === field_key);

    if (!targetField || targetField.type !== 'file') {
      throw ApiError.badRequest('Invalid file field key for this form');
    }

    const allowedType = String(targetField.allowed_types || 'all').toLowerCase();
    const allowedMap = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      pdf: ['application/pdf'],
      docx: [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      ppt: [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ]
    };

    if (allowedType !== 'all') {
      const allowed = allowedMap[allowedType] || [];
      if (!allowed.includes(req.file.mimetype)) {
        throw ApiError.badRequest(`Unsupported file type for this field. Allowed types: ${allowedType}`);
      }
    }

    const maxSizeMb = Number(targetField.max_size_mb) || null;
    if (maxSizeMb && req.file.size > maxSizeMb * 1024 * 1024) {
      throw ApiError.badRequest(`File exceeds the configured size limit of ${maxSizeMb}MB`);
    }

    try {
      const safeGroupId = String(group_id || 'group').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeFieldKey = String(field_key || 'field').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeEnrollment = enrollment_no ? String(enrollment_no).replace(/[^a-zA-Z0-9_-]/g, '_') : 'common';
      const extension = req.file.originalname.split('.').pop();
      const uniqueName = `${safeFieldKey}_${safeEnrollment}_${uuidv4()}.${extension}`;
      const filePath = `files/${formId}/${safeGroupId}/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from(EVALUATION_UPLOAD_BUCKET)
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw ApiError.internalError(`Failed to upload evaluation file: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(EVALUATION_UPLOAD_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw ApiError.internalError('Failed to generate public URL for uploaded file');
      }

      return ApiResponse.success(res, 'Evaluation file uploaded successfully', {
        file_url: urlData.publicUrl,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        scope: scope === 'individual' ? 'individual' : 'common'
      });
    } catch (error) {
      console.error('Upload evaluation file error:', error);
      if (error instanceof ApiError) throw error;
      throw ApiError.internalError(`Failed to process file upload: ${error.message}`);
    }
  });

  getFormSubmissions = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const search = (req.query.search || '').toLowerCase();
    const groupIdFilter = String(req.query.groupId || '').trim();

    if (!formId) {
      throw ApiError.badRequest('Form ID is required');
    }

    const form = await evaluationFormModel.getFormById(formId);
    this.assertFormAccess(req.user, form, 'view');

    const scopedGroupIds = await this.getScopedGroupIds(req.user || {});
    const scopedGroupSet = Array.isArray(scopedGroupIds) ? new Set(scopedGroupIds) : null;

    const submissions = await evaluationFormModel.listSubmissionsByForm(formId);

    const scopedSubmissions = submissions.filter((submission) => {
      const currentGroupId = String(submission?.group_id || '');
      if (groupIdFilter && currentGroupId !== groupIdFilter) return false;
      if (scopedGroupSet && !scopedGroupSet.has(currentGroupId)) return false;
      return true;
    });

    const flattened = scopedSubmissions.flatMap((submission) => {
      const evaluations = Array.isArray(submission.evaluations) ? submission.evaluations : [];
      return evaluations.map((evaluation) => ({
        submission_id: submission.id, // Include submission ID for delete/reset operations
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

    const filtered = search
      ? flattened.filter((row) => {
          const groupId = (row.group_id || '').toLowerCase();
          const enrollmentNo = (row.enrollment_no || '').toLowerCase();
          const studentName = (row.student_name || '').toLowerCase();
          return groupId.includes(search) || enrollmentNo.includes(search) || studentName.includes(search);
        })
      : flattened;

    const totalRecords = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (safePage - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return ApiResponse.success(res, 'Evaluation form submissions retrieved successfully', {
      data: paginated,
      pagination: {
        currentPage: safePage,
        totalPages,
        totalRecords,
        limit
      }
    });
  });

  getSubmissionByGroup = asyncHandler(async (req, res) => {
    const { formId, groupId } = req.params;

    if (!formId || !groupId) {
      throw ApiError.badRequest('Form ID and Group ID are required');
    }

    const form = await evaluationFormModel.getFormById(formId);
    this.assertFormAccess(req.user, form, 'view');

    await this.assertGroupAccess(req.user, groupId);

    const submission = await evaluationFormModel.getSubmissionByFormAndGroup(formId, groupId);

    if (!submission) {
      return ApiResponse.success(res, 'No submission found for this group', null);
    }

    return ApiResponse.success(res, 'Evaluation submission retrieved successfully', submission);
  });

  approveSubmissionByGroup = asyncHandler(async (req, res) => {
    const { formId, groupId } = req.params;

    if (!formId || !groupId) {
      throw ApiError.badRequest('Form ID and Group ID are required');
    }

    if (!this.isIndustryMentor(req.user)) {
      throw ApiError.forbidden('Only industry mentors can approve evaluation submissions');
    }

    const form = await evaluationFormModel.getFormById(formId);
    this.assertFormAccess(req.user, form, 'view');

    await this.assertGroupAccess(req.user, groupId);

    const submission = await evaluationFormModel.getSubmissionByFormAndGroup(formId, groupId);

    if (!submission) {
      throw ApiError.notFound('No submission found for this group');
    }

    if (submission.is_approved) {
      return ApiResponse.success(res, 'Evaluation already approved', submission);
    }

    const approverIdentity = req.user?.id || req.user?.industrial_mentor_code || req.user?.email || null;
    const approvedSubmission = await evaluationFormModel.updateSubmission(submission.id, formId, {
      is_approved: true,
      approved_at: new Date().toISOString(),
      approved_by: approverIdentity
    });

    return ApiResponse.success(res, 'Evaluation approved successfully', approvedSubmission);
  });

  deleteSubmission = asyncHandler(async (req, res) => {
    const { formId, submissionId } = req.params;

    if (!formId || !submissionId) {
      throw ApiError.badRequest('Form ID and Submission ID are required');
    }

    const result = await evaluationFormModel.deleteSubmission(submissionId, formId);

    if (!result) {
      throw ApiError.notFound('Submission not found');
    }

    return ApiResponse.success(res, 'Evaluation submission deleted successfully', null);
  });

  updateSubmissionStudentMarks = asyncHandler(async (req, res) => {
    const { formId, submissionId, enrollmentNo } = req.params;
    const { marks } = req.body || {};

    if (!formId || !submissionId || !enrollmentNo) {
      throw ApiError.badRequest('Form ID, submission ID and enrollment number are required');
    }

    if (!marks || typeof marks !== 'object' || Array.isArray(marks)) {
      throw ApiError.badRequest('Marks object is required');
    }

    const form = await evaluationFormModel.getFormById(formId);
    if (!form) {
      throw ApiError.notFound('Evaluation form not found');
    }

    const fields = Array.isArray(form.fields) ? form.fields : [];
    const fieldMap = new Map(fields.map((field) => [field.key, field]));

    const submission = await evaluationFormModel.getSubmissionById(submissionId, formId);
    if (!submission) {
      throw ApiError.notFound('Submission not found');
    }

    const normalizedEnrollment = String(enrollmentNo).trim();
    const evaluations = Array.isArray(submission.evaluations) ? [...submission.evaluations] : [];

    const studentIndex = evaluations.findIndex((item) => {
      const itemEnrollment = String(item?.enrollment_no || item?.enrollement_no || '').trim();
      return itemEnrollment === normalizedEnrollment;
    });

    if (studentIndex === -1) {
      throw ApiError.notFound('Student evaluation not found in this submission');
    }

    const currentEvaluation = evaluations[studentIndex] || {};
    const mergedMarks = { ...(currentEvaluation.marks || {}) };

    for (const [key, rawValue] of Object.entries(marks)) {
      const field = fieldMap.get(key);
      if (!field) {
        throw ApiError.badRequest(`Invalid mark field: ${key}`);
      }

      const fieldType = normalizeFieldType(field);

      if (fieldType === 'number') {
        if (rawValue === null || rawValue === undefined || rawValue === '') {
          mergedMarks[key] = 0;
          continue;
        }

        const numericValue = Number(rawValue);
        if (Number.isNaN(numericValue)) {
          throw ApiError.badRequest(`Invalid numeric value for field: ${key}`);
        }

        const minMarks = 0;
        const maxMarks = Number(field.max_marks) || 0;
        if (numericValue < minMarks || numericValue > maxMarks) {
          throw ApiError.badRequest(`Field ${key} must be between ${minMarks} and ${maxMarks}`);
        }

        mergedMarks[key] = numericValue;
        continue;
      }

      if (fieldType === 'boolean') {
        mergedMarks[key] = coerceBooleanValue(rawValue);
        continue;
      }

      mergedMarks[key] = rawValue ?? '';
    }

    const total = fields.reduce((sum, field) => {
      if (normalizeFieldType(field) !== 'number') return sum;
      return sum + (Number(mergedMarks[field.key]) || 0);
    }, 0);

    const updatedEvaluation = {
      ...currentEvaluation,
      marks: mergedMarks,
      total
    };

    evaluations[studentIndex] = updatedEvaluation;

    const updatedSubmission = await evaluationFormModel.updateSubmission(submissionId, formId, {
      evaluations
    });

    return ApiResponse.success(res, 'Student marks updated successfully', {
      submission_id: updatedSubmission.id,
      group_id: updatedSubmission.group_id,
      external_name: updatedSubmission.external_name,
      feedback: updatedSubmission.feedback,
      created_at: updatedSubmission.created_at,
      enrollment_no: updatedEvaluation.enrollment_no || updatedEvaluation.enrollement_no,
      student_name: updatedEvaluation.student_name || updatedEvaluation.name_of_student,
      marks: updatedEvaluation.marks || {},
      total: updatedEvaluation.total ?? 0,
      absent: updatedEvaluation.absent || false
    });
  });
}

export default new EvaluationFormController();
