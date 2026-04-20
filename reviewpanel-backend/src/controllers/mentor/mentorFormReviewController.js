import ApiResponse from '../../utils/apiResponse.js';
import supabase from '../../config/database.js';
import NocFormModel from '../../models/nocFormModel.js';
import TrackerSheetModel from '../../models/trackerSheetModel.js';
import studentModel from '../../models/studentModel.js';

const nocFormModel = new NocFormModel();
const trackerSheetModel = new TrackerSheetModel();

const REVIEW_STATES = ['draft', 'pending_mentor_approval', 'approved', 'rejected'];

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

  const resolvedStatus = REVIEW_STATES.includes(rawReview.status)
    ? rawReview.status
    : (record?.submitted ? 'pending_mentor_approval' : 'draft');

  return {
    status: resolvedStatus,
    feedback: asText(rawReview.feedback),
    reviewedBy: asText(rawReview.reviewedBy),
    reviewedAt: rawReview.reviewedAt || null,
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
    },
  };
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
    return ApiResponse.error(res, error.message || 'Failed to fetch mentor NOC progress', 500);
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
    return ApiResponse.error(res, error.message || 'Failed to fetch mentor tracker progress', 500);
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
    return ApiResponse.error(res, error.message || 'Failed to fetch NOC form', 500);
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
    return ApiResponse.error(res, error.message || 'Failed to fetch tracker sheet', 500);
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
    return ApiResponse.error(res, error.message || `Failed to review ${formLabel} form`, 500);
  }
};

export const reviewMentorNocByGroup = async (req, res) => {
  return performFormReview({
    req,
    res,
    model: nocFormModel,
    formLabel: 'NOC',
    rowKey: 'noc',
  });
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
