import { asyncHandler, ApiError } from '../../utils/errorHandler.js';
import ApiResponse from '../../utils/apiResponse.js';
import evaluationFormModel from '../../models/evaluationFormModel.js';
import problemStatementModel from '../../models/problemStatementModel.js';
import supabase from '../../config/database.js';

class EvaluationFormController {
  listForms = asyncHandler(async (req, res) => {
    const forms = await evaluationFormModel.listForms();
    return ApiResponse.success(res, 'Evaluation forms retrieved successfully', forms);
  });

  getForm = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    if (!formId) throw ApiError.badRequest('Form ID is required');

    const form = await evaluationFormModel.getFormById(formId);
    return ApiResponse.success(res, 'Evaluation form retrieved successfully', form);
  });

  createForm = asyncHandler(async (req, res) => {
    const { name, total_marks, fields } = req.body;
    if (!name || !total_marks || !Array.isArray(fields) || fields.length === 0) {
      throw ApiError.badRequest('Name, total marks, and at least one field are required');
    }

    const created_by = req.user?.id || req.user?.admin_id || req.user?.email || null;

    const sanitizedFields = fields.map((field, index) => ({
      key: field.key || `field_${index + 1}`,
      label: field.label?.trim() || `Field ${index + 1}`,
      max_marks: Number(field.max_marks) || 0,
      order: typeof field.order === 'number' ? field.order : index
    }));

    const form = await evaluationFormModel.createForm({
      name: name.trim(),
      total_marks: Number(total_marks),
      fields: sanitizedFields,
      created_by
    });

    return ApiResponse.success(res, 'Evaluation form created successfully', form, 201);
  });

  updateForm = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const { name, total_marks, fields } = req.body;

    if (!formId || !name || !total_marks || !Array.isArray(fields) || fields.length === 0) {
      throw ApiError.badRequest('Form ID, name, total marks, and fields are required');
    }

    const sanitizedFields = fields.map((field, index) => ({
      key: field.key || `field_${index + 1}`,
      label: field.label?.trim() || `Field ${index + 1}`,
      max_marks: Number(field.max_marks) || 0,
      order: typeof field.order === 'number' ? field.order : index
    }));

    const updated = await evaluationFormModel.updateForm(formId, {
      name: name.trim(),
      total_marks: Number(total_marks),
      fields: sanitizedFields
    });

    return ApiResponse.success(res, 'Evaluation form updated successfully', updated);
  });

  getGroupDetails = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    if (!groupId) throw ApiError.badRequest('Group ID is required');

    const { data, error } = await supabase
      .from('pbl')
      .select('group_id, enrollment_no, student_name, class, email_id, contact, mentor_code, ps_id')
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

    const created_by = req.user?.id || req.user?.admin_id || req.user?.email || null;

    const normalizedEvaluations = evaluations.map((student) => ({
      ...student,
      enrollement_no: student.enrollement_no || student.enrollment_no
    }));

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

  getFormSubmissions = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const search = (req.query.search || '').toLowerCase();

    if (!formId) {
      throw ApiError.badRequest('Form ID is required');
    }

    const submissions = await evaluationFormModel.listSubmissionsByForm(formId);

    const flattened = submissions.flatMap((submission) => {
      const evaluations = Array.isArray(submission.evaluations) ? submission.evaluations : [];
      return evaluations.map((evaluation) => ({
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

    const submission = await evaluationFormModel.getSubmissionByFormAndGroup(formId, groupId);

    if (!submission) {
      return ApiResponse.success(res, 'No submission found for this group', null);
    }

    return ApiResponse.success(res, 'Evaluation submission retrieved successfully', submission);
  });
}

export default new EvaluationFormController();
