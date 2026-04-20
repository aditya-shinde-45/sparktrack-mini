import ApiResponse from '../../utils/apiResponse.js';
import supabase from '../../config/database.js';
import s3Service from '../../services/s3Service.js';
import TrackerSheetModel from '../../models/trackerSheetModel.js';

const trackerSheetModel = new TrackerSheetModel();

const DEFAULT_TRACKER_PAYLOAD = {
  projectInfo: {
    completionStatus: '100%',
    copyrightStatus: 'NA',
    technologyTransfer: 'NO',
    paperPublicationStatus: 'NA',
    sourceOfProblemStatement: 'Hackathon Problems',
    githubLink: '',
    sustainableDevelopmentGoal: 'NO poverty',
    achievements: '',
  },
  techStack: {
    frontend: '',
    backend: '',
    database: '',
    devOps: '',
    tools: '',
  },
  userStories: {
    epic: '',
    stories: Array.from({ length: 5 }, () => ''),
    tasks: Array.from({ length: 5 }, () => ''),
    acceptanceCriteria: Array.from({ length: 5 }, () => ''),
  },
  sprintPlanning: [],
  publicationDetails: [],
  patentDetails: [],
  copyrightDetails: [],
  eventParticipationDetails: [],
  meetings: [],
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

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const ensureMinimumItems = (list, minimum, createItem) => {
  const safeList = ensureArray(list);
  if (safeList.length >= minimum) return safeList;

  return [
    ...safeList,
    ...Array.from({ length: minimum - safeList.length }, (_, index) => createItem(safeList.length + index)),
  ];
};

const createSprintItem = (index = 0) => ({
  sprintName: `Sprint ${index + 1}`,
  startDate: '',
  endDate: '',
  objective: '',
  status: 'Upcoming',
});

const createMeetingItem = () => ({
  meetingDate: '',
  attendees: '',
  agenda: '',
  decisions: '',
  nextSteps: '',
});

const createPublicationDetailItem = () => ({
  paperTitle: '',
  journalName: '',
  year: '',
  authors: '',
  url: '',
  doi: '',
  volume: '',
  pageNo: '',
  publisher: '',
  proofFileName: '',
  proofUrl: '',
  proofKey: '',
});

const createPatentDetailItem = () => ({
  title: '',
  inventors: '',
  applicationNo: '',
  patentNumber: '',
  filingCountry: '',
  subjectCategory: '',
  filingDate: '',
  publicationDate: '',
  publicationStatus: '',
  proofFileName: '',
  proofUrl: '',
  proofKey: '',
});

const createCopyrightDetailItem = () => ({
  titleOfWork: '',
  nameOfApplicants: '',
  registrationNo: '',
  dairyNumber: '',
  date: '',
  status: '',
  proofFileName: '',
  proofUrl: '',
  proofKey: '',
});

const createEventParticipationItem = () => ({
  nameOfEvent: '',
  typeOfEvent: 'Institute',
  date: '',
  typeOfParticipation: '',
  detailsOfPrizeWon: '',
  proofFileName: '',
  proofUrl: '',
  proofKey: '',
});

const hydrateListOfObjects = (list, createTemplate, minimum = 0) => {
  const merged = ensureArray(list).map((item, index) => ({
    ...createTemplate(index),
    ...(isObject(item) ? item : {}),
  }));

  if (merged.length >= minimum) return merged;

  return [
    ...merged,
    ...Array.from({ length: minimum - merged.length }, (_, index) => createTemplate(merged.length + index)),
  ];
};

const normalizeTrackerPayload = (rawPayload = {}) => {
  const safePayload = isObject(rawPayload) ? rawPayload : {};

  return {
    ...DEFAULT_TRACKER_PAYLOAD,
    ...safePayload,
    projectInfo: {
      ...DEFAULT_TRACKER_PAYLOAD.projectInfo,
      ...(isObject(safePayload.projectInfo) ? safePayload.projectInfo : {}),
    },
    techStack: {
      ...DEFAULT_TRACKER_PAYLOAD.techStack,
      ...(isObject(safePayload.techStack) ? safePayload.techStack : {}),
    },
    userStories: {
      ...DEFAULT_TRACKER_PAYLOAD.userStories,
      ...(isObject(safePayload.userStories) ? safePayload.userStories : {}),
      stories: ensureMinimumItems(safePayload?.userStories?.stories, 5, () => ''),
      tasks: ensureMinimumItems(safePayload?.userStories?.tasks, 5, () => ''),
      acceptanceCriteria: ensureMinimumItems(
        safePayload?.userStories?.acceptanceCriteria,
        5,
        () => ''
      ),
    },
    sprintPlanning: ensureMinimumItems(safePayload.sprintPlanning, 4, createSprintItem),
    meetings: ensureMinimumItems(safePayload.meetings, 12, createMeetingItem),
    publicationDetails: hydrateListOfObjects(
      safePayload.publicationDetails,
      createPublicationDetailItem,
      2
    ),
    patentDetails: hydrateListOfObjects(safePayload.patentDetails, createPatentDetailItem, 1),
    copyrightDetails: hydrateListOfObjects(
      safePayload.copyrightDetails,
      createCopyrightDetailItem,
      1
    ),
    eventParticipationDetails: hydrateListOfObjects(
      safePayload.eventParticipationDetails,
      createEventParticipationItem,
      2
    ),
    mentorReview: normalizeMentorReview(safePayload.mentorReview),
  };
};

const hasAtLeastOnePaperPublication = (payload) =>
  ensureArray(payload?.publicationDetails).some(
    (item) =>
      item?.paperTitle?.trim() ||
      item?.journalName?.trim() ||
      item?.doi?.trim() ||
      item?.url?.trim()
  );

const hasAtLeastOneCopyrightEntry = (payload) =>
  ensureArray(payload?.copyrightDetails).some(
    (item) =>
      item?.titleOfWork?.trim() ||
      item?.registrationNo?.trim() ||
      item?.nameOfApplicants?.trim()
  );

const validateTrackerRulesForSubmit = (payload, groupYear) => {
  if (groupYear === 'SY') {
    if (payload?.projectInfo?.copyrightStatus === 'NA') {
      return 'For SY groups, copyright status is compulsory and cannot be NA.';
    }

    if (!hasAtLeastOneCopyrightEntry(payload)) {
      return 'For SY groups, please add at least one copyright detail entry.';
    }
  }

  if (groupYear === 'TY' || groupYear === 'LY') {
    if (payload?.projectInfo?.paperPublicationStatus === 'NA') {
      return 'For TY/LY groups, paper publication status is compulsory and cannot be NA.';
    }

    if (!hasAtLeastOnePaperPublication(payload)) {
      return 'For TY/LY groups, at least one paper publication detail is compulsory.';
    }
  }

  return null;
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

export const getTrackerSheetForStudent = async (req, res) => {
  try {
    const groupContext = await resolveStudentGroupContext(req);
    const tracker = await trackerSheetModel.getByGroupId(groupContext.groupId);
    const submissionState = resolveSubmissionState(tracker);

    return ApiResponse.success(res, 'Tracker sheet retrieved successfully', {
      groupId: groupContext.groupId,
      groupYear: groupContext.groupYear,
      tracker,
      submissionState,
    });
  } catch (error) {
    const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    return ApiResponse.error(res, error.message || 'Failed to fetch tracker sheet', statusCode);
  }
};

export const saveTrackerSheetForStudent = async (req, res) => {
  try {
    const payloadInput = req.body?.formData || req.body?.payload;
    const submit = Boolean(req.body?.submit);

    if (!isObject(payloadInput)) {
      return ApiResponse.badRequest(res, 'Tracker payload is required');
    }

    const groupContext = await resolveStudentGroupContext(req);
    const existingTracker = await trackerSheetModel.getByGroupId(groupContext.groupId);
    const normalizedPayload = normalizeTrackerPayload(payloadInput);
    const existingReview = normalizeMentorReview(
      existingTracker?.payload?.mentorReview,
      Boolean(existingTracker?.submitted)
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

    if (submit) {
      const validationError = validateTrackerRulesForSubmit(payloadToPersist, groupContext.groupYear);
      if (validationError) {
        return ApiResponse.badRequest(res, validationError);
      }
    }

    const tracker = await trackerSheetModel.saveByGroupId({
      groupId: groupContext.groupId,
      groupYear: groupContext.groupYear,
      payload: payloadToPersist,
      actorEnrollment: groupContext.enrollmentNo,
      submit,
    });
    const submissionState = resolveSubmissionState(tracker);

    return ApiResponse.success(
      res,
      submit
        ? 'Tracker sheet submitted to mentor for approval'
        : 'Tracker sheet saved to database',
      {
        groupId: groupContext.groupId,
        groupYear: groupContext.groupYear,
        tracker,
        submissionState,
      }
    );
  } catch (error) {
    const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    return ApiResponse.error(res, error.message || 'Failed to save tracker sheet', statusCode);
  }
};

export const uploadTrackerProof = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return ApiResponse.badRequest(res, 'No file uploaded');
    }

    const groupContext = await resolveStudentGroupContext(req);
    const rawSection = String(req.body?.section || 'general').toLowerCase();
    const safeSection = rawSection.replace(/[^a-z0-9_-]/g, '') || 'general';
    const parsedRowIndex = Number.parseInt(req.body?.rowIndex, 10);

    const uploadResult = await s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      `tracker-sheet/${groupContext.groupId}/${safeSection}`
    );

    if (!uploadResult?.success) {
      return ApiResponse.error(res, 'Failed to upload proof file to storage', 500);
    }

    return ApiResponse.success(
      res,
      'Proof uploaded successfully',
      {
        proof: {
          section: safeSection,
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
    return ApiResponse.error(res, error.message || 'Failed to upload proof file', statusCode);
  }
};
