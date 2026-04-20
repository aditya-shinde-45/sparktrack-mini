import ApiResponse from '../../utils/apiResponse.js';
import supabase from '../../config/database.js';
import s3Service from '../../services/s3Service.js';
import NocFormModel from '../../models/nocFormModel.js';

const nocFormModel = new NocFormModel();

const DEFAULT_DOCUMENTS = [
  {
    id: 'project_tracker_sheet',
    name: 'Project Tracker Sheet (fully updated)',
    status: '',
    proofFileName: '',
    proofUrl: '',
    proofKey: '',
  },
  {
    id: 'project_synopsis',
    name: 'Project Synopsis',
    status: '',
    proofFileName: '',
    proofUrl: '',
    proofKey: '',
  },
  {
    id: 'final_project_report',
    name: 'Final Project report / Success story (for internship)',
    status: '',
    proofFileName: '',
    proofUrl: '',
    proofKey: '',
  },
  {
    id: 'ip_patent_publication',
    name: 'Copyright (SY) / Patent (All) / Publication (TY & LY)',
    status: '',
    proofFileName: '',
    proofUrl: '',
    proofKey: '',
  },
  {
    id: 'project_presentation_ppt',
    name: 'Project Presentation PPT',
    status: '',
    proofFileName: '',
    proofUrl: '',
    proofKey: '',
  },
  {
    id: 'achievements',
    name: 'Achievements',
    status: '',
    proofFileName: '',
    proofUrl: '',
    proofKey: '',
  },
  {
    id: 'internship_reports',
    name: 'Internship joining report & Completion Report (If any)',
    status: '',
    proofFileName: '',
    proofUrl: '',
    proofKey: '',
  },
];

const DEFAULT_NOC_PAYLOAD = {
  certificateDate: '',
  concludingRemark: '',
  guideSignatureName: '',
  documents: DEFAULT_DOCUMENTS,
  mentorReview: {
    status: 'draft',
    feedback: '',
    reviewedBy: '',
    reviewedAt: null,
  },
};

const REVIEW_STATES = ['draft', 'pending_mentor_approval', 'approved', 'rejected'];

const deriveGroupYear = (groupId = '') => {
  const normalized = String(groupId || '').toUpperCase();
  if (normalized.startsWith('SY')) return 'SY';
  if (normalized.startsWith('TY')) return 'TY';
  if (normalized.startsWith('LY')) return 'LY';
  return '';
};

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const asSafeString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const normalizeMentorReview = (rawReview = {}, fallbackSubmitted = false) => {
  const safeReview = isObject(rawReview) ? rawReview : {};
  const fallbackStatus = fallbackSubmitted ? 'pending_mentor_approval' : 'draft';
  const safeStatus = REVIEW_STATES.includes(safeReview.status)
    ? safeReview.status
    : fallbackStatus;

  return {
    status: safeStatus,
    feedback: asSafeString(safeReview.feedback),
    reviewedBy: asSafeString(safeReview.reviewedBy),
    reviewedAt: safeReview.reviewedAt || null,
  };
};

const resolveSubmissionState = (record = null) => {
  const review = normalizeMentorReview(record?.payload?.mentorReview, Boolean(record?.submitted));
  return review.status;
};

const normalizeDocuments = (rawDocuments) => {
  const safeDocuments = Array.isArray(rawDocuments) ? rawDocuments : [];
  const byId = new Map();

  safeDocuments.forEach((doc, index) => {
    if (!isObject(doc)) return;

    const fallbackId = DEFAULT_DOCUMENTS[index]?.id;
    const rawId = asSafeString(doc.id || fallbackId || '');
    if (!rawId) return;

    byId.set(rawId, doc);
  });

  return DEFAULT_DOCUMENTS.map((defaultDoc) => {
    const existing = byId.get(defaultDoc.id) || {};
    const proofUrl = asSafeString(existing.proofUrl);

    return {
      ...defaultDoc,
      status: asSafeString(existing.status) || (proofUrl ? 'Submitted' : ''),
      proofFileName: asSafeString(existing.proofFileName),
      proofUrl,
      proofKey: asSafeString(existing.proofKey),
    };
  });
};

const normalizeNocPayload = (rawPayload = {}) => {
  const safePayload = isObject(rawPayload) ? rawPayload : {};

  return {
    ...DEFAULT_NOC_PAYLOAD,
    certificateDate: asSafeString(safePayload.certificateDate),
    concludingRemark: asSafeString(safePayload.concludingRemark),
    guideSignatureName: asSafeString(safePayload.guideSignatureName),
    documents: normalizeDocuments(safePayload.documents),
    mentorReview: normalizeMentorReview(safePayload.mentorReview),
  };
};

const resolveStudentGroupContext = async (req) => {
  const enrollmentNo = req.user?.enrollment_no || req.user?.student_id;

  if (!enrollmentNo) {
    const authError = new Error('Enrollment number not found in token');
    authError.statusCode = 401;
    throw authError;
  }

  const { data: groupData, error: groupError } = await supabase
    .from('pbl')
    .select('group_id')
    .eq('enrollment_no', enrollmentNo)
    .maybeSingle();

  if (groupError) {
    const dbError = new Error(groupError.message || 'Failed to resolve student group');
    dbError.statusCode = 500;
    throw dbError;
  }

  if (!groupData?.group_id) {
    const missingGroupError = new Error('Student must be assigned to a group');
    missingGroupError.statusCode = 400;
    throw missingGroupError;
  }

  return {
    enrollmentNo,
    groupId: groupData.group_id,
    groupYear: deriveGroupYear(groupData.group_id),
  };
};

export const getNocForStudent = async (req, res) => {
  try {
    const groupContext = await resolveStudentGroupContext(req);
    const noc = await nocFormModel.getByGroupId(groupContext.groupId);
    const submissionState = resolveSubmissionState(noc);

    return ApiResponse.success(res, 'NOC form retrieved successfully', {
      groupId: groupContext.groupId,
      groupYear: groupContext.groupYear,
      noc,
      submissionState,
    });
  } catch (error) {
    const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    return ApiResponse.error(res, error.message || 'Failed to fetch NOC form', statusCode);
  }
};

export const saveNocForStudent = async (req, res) => {
  try {
    const payloadInput = req.body?.formData || req.body?.payload;
    const submit = Boolean(req.body?.submit);

    if (!isObject(payloadInput)) {
      return ApiResponse.badRequest(res, 'NOC payload is required');
    }

    const groupContext = await resolveStudentGroupContext(req);
    const existingNoc = await nocFormModel.getByGroupId(groupContext.groupId);
    const normalizedPayload = normalizeNocPayload(payloadInput);
    const existingReview = normalizeMentorReview(
      existingNoc?.payload?.mentorReview,
      Boolean(existingNoc?.submitted)
    );

    const nextReview = submit
      ? {
          status: 'pending_mentor_approval',
          feedback: '',
          reviewedBy: '',
          reviewedAt: null,
        }
      : existingReview;

    const payloadToPersist = {
      ...normalizedPayload,
      mentorReview: nextReview,
    };

    const noc = await nocFormModel.saveByGroupId({
      groupId: groupContext.groupId,
      groupYear: groupContext.groupYear,
      payload: payloadToPersist,
      actorEnrollment: groupContext.enrollmentNo,
      submit,
    });
    const submissionState = resolveSubmissionState(noc);

    return ApiResponse.success(
      res,
      submit ? 'NOC submitted to mentor for approval' : 'NOC saved to database',
      {
        groupId: groupContext.groupId,
        groupYear: groupContext.groupYear,
        noc,
        submissionState,
      }
    );
  } catch (error) {
    const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    return ApiResponse.error(res, error.message || 'Failed to save NOC form', statusCode);
  }
};

export const uploadNocProof = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return ApiResponse.badRequest(res, 'No file uploaded');
    }

    const groupContext = await resolveStudentGroupContext(req);
    const rawDocumentId = asSafeString(req.body?.documentId || req.body?.section || 'general')
      .toLowerCase();
    const safeDocumentId = rawDocumentId.replace(/[^a-z0-9_-]/g, '') || 'general';
    const parsedRowIndex = Number.parseInt(req.body?.rowIndex, 10);

    const uploadResult = await s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      `noc/${groupContext.groupId}/${safeDocumentId}`
    );

    if (!uploadResult?.success) {
      return ApiResponse.error(res, 'Failed to upload NOC proof file to storage', 500);
    }

    return ApiResponse.success(
      res,
      'NOC proof uploaded successfully',
      {
        proof: {
          documentId: safeDocumentId,
          rowIndex: Number.isNaN(parsedRowIndex) ? null : parsedRowIndex,
          fileName: file.originalname,
          url: uploadResult.url,
          key: uploadResult.key,
          mimeType: file.mimetype,
          size: file.size,
        },
      },
      201
    );
  } catch (error) {
    const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    return ApiResponse.error(res, error.message || 'Failed to upload NOC proof file', statusCode);
  }
};