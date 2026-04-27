import ApiResponse from '../../utils/apiResponse.js';
import supabase from '../../config/database.js';
import NocFormModel from '../../models/nocFormModel.js';
import TrackerSheetModel from '../../models/trackerSheetModel.js';
import studentModel from '../../models/studentModel.js';

const nocFormModel = new NocFormModel();
const trackerSheetModel = new TrackerSheetModel();

const REVIEW_STATES = ['draft', 'pending_mentor_approval', 'approved', 'rejected'];
const FIELD_REVIEW_STATES = ['pending', 'approved', 'rejected'];

const asText = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const normalizeGroupId = (groupId = '') => asText(groupId).toUpperCase();

const getReviewFromPayload = (record = null) => {
  const payload = record?.payload && typeof record.payload === 'object' ? record.payload : {};
  const rawReview = payload?.mentorReview && typeof payload.mentorReview === 'object'
    ? payload.mentorReview
    : {};

  const rawFieldReviews = rawReview?.fieldReviews && typeof rawReview.fieldReviews === 'object'
    ? rawReview.fieldReviews
    : {};

  const fieldReviews = {};
  Object.entries(rawFieldReviews).forEach(([fieldId, value]) => {
    const normalizedFieldId = asText(fieldId);
    if (!normalizedFieldId) return;

    const safeValue = value && typeof value === 'object' ? value : {};
    const normalizedStatus = FIELD_REVIEW_STATES.includes(safeValue.status)
      ? safeValue.status
      : 'pending';

    fieldReviews[normalizedFieldId] = {
      status: normalizedStatus,
      feedback: asText(safeValue.feedback),
      reviewedBy: asText(safeValue.reviewedBy),
      reviewedAt: safeValue.reviewedAt || null,
    };
  });

  const resolvedStatus = REVIEW_STATES.includes(rawReview.status)
    ? rawReview.status
    : (record?.submitted ? 'pending_mentor_approval' : 'draft');

  return {
    status: resolvedStatus,
    feedback: asText(rawReview.feedback),
    reviewedBy: asText(rawReview.reviewedBy),
    reviewedAt: rawReview.reviewedAt || null,
    fieldReviews,
  };
};

const buildPayloadWithReview = (payload, review) => {
  const safePayload = payload && typeof payload === 'object' ? payload : {};

  return {
    ...safePayload,
    mentorReview: {
      status: review.status,
      feedback: asText(review.feedback),
      reviewedBy: asText(review.reviewedBy),
      reviewedAt: review.reviewedAt || null,
      fieldReviews: review.fieldReviews && typeof review.fieldReviews === 'object'
        ? review.fieldReviews
        : {},
    },
  };
};

const hasDocumentSubmission = (doc = {}) => {
  const proofUrl = asText(doc?.proofUrl);
  const docStatus = asText(doc?.status).toLowerCase();
  return Boolean(proofUrl || docStatus === 'submitted');
};

const summarizeRejectedFields = (documents = [], fieldReviews = {}) => {
  const rejected = (Array.isArray(documents) ? documents : [])
    .map((doc) => {
      const id = asText(doc?.id);
      if (!id) return null;
      const review = fieldReviews[id];
      if (!review || review.status !== 'rejected') return null;
      const name = asText(doc?.name) || id;
      const feedback = asText(review.feedback);
      return feedback ? `${name}: ${feedback}` : name;
    })
    .filter(Boolean);

  if (!rejected.length) return '';
  return `Rejected fields - ${rejected.join('; ')}`;
};

const resolveMentorCode = async (req) => {
  const { mentor_code, mentor_id, contact_number } = req.user || {};

  if (mentor_code) {
    return mentor_code;
  }

  if (mentor_id) {
    return mentor_id;
  }

  if (!contact_number) {
    return null;
  }

  const { data: mentorRow, error } = await supabase
    .from('mentors')
    .select('mentor_code')
    .eq('contact_number', contact_number)
    .maybeSingle();

  if (error) throw error;
  return mentorRow?.mentor_code || null;
};

const getMentorGroupRows = async (mentorCode) => {
  if (!mentorCode) return [];

  const { data, error } = await supabase
    .from('pbl')
    .select('group_id, team_name, enrollment_no')
    .eq('mentor_code', mentorCode);

  if (error) throw error;
  return data || [];
};

const buildGroupMeta = (groupRows = []) => {
  const map = new Map();

  (Array.isArray(groupRows) ? groupRows : []).forEach((row) => {
    const groupId = normalizeGroupId(row?.group_id);
    if (!groupId) return;

    const existing = map.get(groupId) || {
      groupId,
      teamName: asText(row?.team_name),
      memberCount: 0,
    };

    existing.memberCount += 1;
    if (!existing.teamName && row?.team_name) {
      existing.teamName = asText(row.team_name);
    }

    map.set(groupId, existing);
  });

  return map;
};

const ensureMentorCanAccessGroup = (groupId, groupMetaMap) => {
  const normalizedGroupId = normalizeGroupId(groupId);
  return Boolean(groupMetaMap.has(normalizedGroupId));
};

const getActorMentorId = (req) => asText(req.user?.mentor_id || req.user?.mentor_code || req.user?.contact_number);

const resolveErrorStatusCode = (error, fallback = 500) => {
  return Number.isInteger(error?.statusCode) ? error.statusCode : fallback;
};

const buildProgressList = (groupMetaMap, rowsByGroupId) => {
  const groups = [];

  groupMetaMap.forEach((meta, groupId) => {
    const row = rowsByGroupId.get(groupId) || null;
    const review = getReviewFromPayload(row);

    groups.push({
      groupId,
      teamName: meta.teamName || null,
      memberCount: meta.memberCount,
      hasForm: Boolean(row),
      submitted: Boolean(row?.submitted),
      submittedAt: row?.submitted_at || null,
      updatedAt: row?.updated_at || null,
      reviewStatus: review.status,
      reviewFeedback: review.feedback,
    });
  });

  return groups.sort((a, b) => a.groupId.localeCompare(b.groupId));
};

export const getMentorNocProgressList = async (req, res) => {
  try {
    const mentorCode = await resolveMentorCode(req);

    if (!mentorCode) {
      return ApiResponse.success(res, 'No mentor code found for this mentor', {
        mentorCode: null,
        groups: [],
      });
    }

    const groupRows = await getMentorGroupRows(mentorCode);
    const groupMetaMap = buildGroupMeta(groupRows);
    const groupIds = Array.from(groupMetaMap.keys());

    const forms = await nocFormModel.listByGroupIds(groupIds);
    const formMap = new Map((forms || []).map((item) => [normalizeGroupId(item.group_id), item]));

    return ApiResponse.success(res, 'Mentor NOC progress retrieved successfully', {
      mentorCode,
      groups: buildProgressList(groupMetaMap, formMap),
    });
  } catch (error) {
    return ApiResponse.error(
      res,
      error.message || 'Failed to fetch mentor NOC progress',
      resolveErrorStatusCode(error)
    );
  }
};

export const getMentorTrackerProgressList = async (req, res) => {
  try {
    const mentorCode = await resolveMentorCode(req);

    if (!mentorCode) {
      return ApiResponse.success(res, 'No mentor code found for this mentor', {
        mentorCode: null,
        groups: [],
      });
    }

    const groupRows = await getMentorGroupRows(mentorCode);
    const groupMetaMap = buildGroupMeta(groupRows);
    const groupIds = Array.from(groupMetaMap.keys());

    const forms = await trackerSheetModel.listByGroupIds(groupIds);
    const formMap = new Map((forms || []).map((item) => [normalizeGroupId(item.group_id), item]));

    return ApiResponse.success(res, 'Mentor tracker progress retrieved successfully', {
      mentorCode,
      groups: buildProgressList(groupMetaMap, formMap),
    });
  } catch (error) {
    return ApiResponse.error(
      res,
      error.message || 'Failed to fetch mentor tracker progress',
      resolveErrorStatusCode(error)
    );
  }
};

export const getMentorNocByGroup = async (req, res) => {
  try {
    const groupId = normalizeGroupId(req.params?.groupId);
    if (!groupId) {
      return ApiResponse.badRequest(res, 'Group ID is required');
    }

    const mentorCode = await resolveMentorCode(req);
    const groupRows = await getMentorGroupRows(mentorCode);
    const groupMetaMap = buildGroupMeta(groupRows);

    if (!ensureMentorCanAccessGroup(groupId, groupMetaMap)) {
      return ApiResponse.forbidden(res, 'You are not assigned to this group');
    }

    const form = await nocFormModel.getByGroupId(groupId);
    const review = getReviewFromPayload(form);
    const members = await studentModel.getStudentsByGroup(groupId);

    return ApiResponse.success(res, 'Mentor NOC form retrieved successfully', {
      groupId,
      teamName: groupMetaMap.get(groupId)?.teamName || null,
      members,
      noc: form,
      reviewStatus: review.status,
      reviewFeedback: review.feedback,
    });
  } catch (error) {
    return ApiResponse.error(
      res,
      error.message || 'Failed to fetch NOC form',
      resolveErrorStatusCode(error)
    );
  }
};

export const getMentorTrackerByGroup = async (req, res) => {
  try {
    const groupId = normalizeGroupId(req.params?.groupId);
    if (!groupId) {
      return ApiResponse.badRequest(res, 'Group ID is required');
    }

    const mentorCode = await resolveMentorCode(req);
    const groupRows = await getMentorGroupRows(mentorCode);
    const groupMetaMap = buildGroupMeta(groupRows);

    if (!ensureMentorCanAccessGroup(groupId, groupMetaMap)) {
      return ApiResponse.forbidden(res, 'You are not assigned to this group');
    }

    const form = await trackerSheetModel.getByGroupId(groupId);
    const review = getReviewFromPayload(form);
    const members = await studentModel.getStudentsByGroup(groupId);

    return ApiResponse.success(res, 'Mentor tracker sheet retrieved successfully', {
      groupId,
      teamName: groupMetaMap.get(groupId)?.teamName || null,
      members,
      tracker: form,
      reviewStatus: review.status,
      reviewFeedback: review.feedback,
    });
  } catch (error) {
    return ApiResponse.error(
      res,
      error.message || 'Failed to fetch tracker sheet',
      resolveErrorStatusCode(error)
    );
  }
};

const performFormReview = async ({ req, res, model, formLabel, rowKey }) => {
  try {
    const groupId = normalizeGroupId(req.params?.groupId);
    const status = asText(req.body?.status).toLowerCase();
    const feedback = asText(req.body?.feedback);

    if (!groupId) {
      return ApiResponse.badRequest(res, 'Group ID is required');
    }

    if (!['approved', 'rejected'].includes(status)) {
      return ApiResponse.badRequest(res, 'Status must be either approved or rejected');
    }

    if (status === 'rejected' && !feedback) {
      return ApiResponse.badRequest(res, 'Feedback is required when rejecting');
    }

    const mentorCode = await resolveMentorCode(req);
    const groupRows = await getMentorGroupRows(mentorCode);
    const groupMetaMap = buildGroupMeta(groupRows);

    if (!ensureMentorCanAccessGroup(groupId, groupMetaMap)) {
      return ApiResponse.forbidden(res, 'You are not assigned to this group');
    }

    const existing = await model.getByGroupId(groupId);
    if (!existing) {
      return ApiResponse.notFound(res, `${formLabel} form not found for this group`);
    }

    const currentReview = getReviewFromPayload(existing);
    if (currentReview.status !== 'pending_mentor_approval') {
      return ApiResponse.badRequest(
        res,
        `Cannot review this ${formLabel} form until student submits it for approval`
      );
    }

    const now = new Date().toISOString();
    const reviewedBy = getActorMentorId(req);
    const reviewState = {
      status,
      feedback: status === 'rejected' ? feedback : '',
      reviewedBy,
      reviewedAt: now,
    };

    const nextPayload = buildPayloadWithReview(existing.payload, reviewState);
    const updated = await model.updateByGroupId(groupId, {
      payload: nextPayload,
      submitted: status === 'approved',
      updated_by: reviewedBy || existing.updated_by || null,
    });

    return ApiResponse.success(
      res,
      `${formLabel} form ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      {
        groupId,
        [rowKey]: updated,
        reviewStatus: reviewState.status,
        reviewFeedback: reviewState.feedback,
      }
    );
  } catch (error) {
    return ApiResponse.error(
      res,
      error.message || `Failed to review ${formLabel} form`,
      resolveErrorStatusCode(error)
    );
  }
};

export const reviewMentorNocByGroup = async (req, res) => {
  try {
    const groupId = normalizeGroupId(req.params?.groupId);
    const mode = asText(req.body?.mode).toLowerCase();
    const requestedStatus = asText(req.body?.status).toLowerCase();
    const feedback = asText(req.body?.feedback);
    const fieldId = asText(req.body?.fieldId);

    if (!groupId) {
      return ApiResponse.badRequest(res, 'Group ID is required');
    }

    const mentorCode = await resolveMentorCode(req);
    const groupRows = await getMentorGroupRows(mentorCode);
    const groupMetaMap = buildGroupMeta(groupRows);

    if (!ensureMentorCanAccessGroup(groupId, groupMetaMap)) {
      return ApiResponse.forbidden(res, 'You are not assigned to this group');
    }

    const existing = await nocFormModel.getByGroupId(groupId);
    if (!existing) {
      return ApiResponse.notFound(res, 'NOC form not found for this group');
    }

    const currentReview = getReviewFromPayload(existing);
    const now = new Date().toISOString();
    const reviewedBy = getActorMentorId(req);
    const documents = Array.isArray(existing?.payload?.documents) ? existing.payload.documents : [];

    if (mode === 'field') {
      if (!['approved', 'rejected'].includes(requestedStatus)) {
        return ApiResponse.badRequest(res, 'Field status must be either approved or rejected');
      }

      if (!fieldId) {
        return ApiResponse.badRequest(res, 'fieldId is required for field review');
      }

      if (requestedStatus === 'rejected' && !feedback) {
        return ApiResponse.badRequest(res, 'Feedback is required when rejecting a field');
      }

      if (!['pending_mentor_approval', 'rejected'].includes(currentReview.status)) {
        return ApiResponse.badRequest(res, 'Field review is allowed only for pending or rejected submissions');
      }

      const targetDoc = documents.find((doc) => asText(doc?.id) === fieldId);
      if (!targetDoc) {
        return ApiResponse.badRequest(res, 'Invalid fieldId for NOC document');
      }

      if (!hasDocumentSubmission(targetDoc)) {
        return ApiResponse.badRequest(res, 'Cannot review a field that has no submitted proof');
      }

      const nextFieldReviews = {
        ...(currentReview.fieldReviews || {}),
        [fieldId]: {
          status: requestedStatus,
          feedback: requestedStatus === 'rejected' ? feedback : '',
          reviewedBy,
          reviewedAt: now,
        },
      };

      const isRejected = requestedStatus === 'rejected';
      const nextReviewState = {
        status: isRejected ? 'rejected' : 'pending_mentor_approval',
        feedback: isRejected
          ? summarizeRejectedFields(documents, nextFieldReviews) || feedback
          : '',
        reviewedBy,
        reviewedAt: now,
        fieldReviews: nextFieldReviews,
      };

      const nextPayload = buildPayloadWithReview(existing.payload, nextReviewState);
      const updated = await nocFormModel.updateByGroupId(groupId, {
        payload: nextPayload,
        submitted: false,
        updated_by: reviewedBy || existing.updated_by || null,
      });

      return ApiResponse.success(res, 'NOC field review saved successfully', {
        groupId,
        noc: updated,
        reviewStatus: nextReviewState.status,
        reviewFeedback: nextReviewState.feedback,
      });
    }

    if (mode === 'final_approve') {
      if (!['pending_mentor_approval', 'rejected'].includes(currentReview.status)) {
        return ApiResponse.badRequest(res, 'Final approval is allowed only for pending or rejected submissions');
      }

      const submittedDocuments = documents.filter((doc) => hasDocumentSubmission(doc));
      if (!submittedDocuments.length) {
        return ApiResponse.badRequest(res, 'At least one submitted document is required for final approval');
      }

      const notApproved = submittedDocuments
        .filter((doc) => {
          const id = asText(doc?.id);
          const review = currentReview.fieldReviews?.[id];
          return review?.status !== 'approved';
        })
        .map((doc) => asText(doc?.name) || asText(doc?.id))
        .filter(Boolean);

      if (notApproved.length) {
        return ApiResponse.badRequest(
          res,
          `Approve all submitted fields first: ${notApproved.join(', ')}`
        );
      }

      const nextReviewState = {
        status: 'approved',
        feedback: '',
        reviewedBy,
        reviewedAt: now,
        fieldReviews: currentReview.fieldReviews || {},
      };

      const nextPayload = buildPayloadWithReview(existing.payload, nextReviewState);
      const updated = await nocFormModel.updateByGroupId(groupId, {
        payload: nextPayload,
        submitted: true,
        updated_by: reviewedBy || existing.updated_by || null,
      });

      return ApiResponse.success(res, 'NOC form approved successfully', {
        groupId,
        noc: updated,
        reviewStatus: nextReviewState.status,
        reviewFeedback: nextReviewState.feedback,
      });
    }

    return performFormReview({
      req,
      res,
      model: nocFormModel,
      formLabel: 'NOC',
      rowKey: 'noc',
    });
  } catch (error) {
    return ApiResponse.error(
      res,
      error.message || 'Failed to review NOC form',
      resolveErrorStatusCode(error)
    );
  }
};

export const reviewMentorTrackerByGroup = async (req, res) => {
  return performFormReview({
    req,
    res,
    model: trackerSheetModel,
    formLabel: 'tracker',
    rowKey: 'tracker',
  });
};
