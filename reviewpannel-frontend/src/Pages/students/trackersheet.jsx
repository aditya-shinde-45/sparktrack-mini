import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Student/Header";
import Sidebar from "../../Components/Student/sidebar";
import Loading from "../../Components/Common/loading";
import { apiRequest } from "../../api";
import {
  ClipboardList,
  Save,
  Send,
  Download,
  Eye,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  generateUnifiedTrackerPdfBlob,
  openPdfPreviewWindow,
  downloadPdfBlob,
} from "../../utils/trackerSheetPdf";

const MAX_UPLOAD_SIZE_MB = 10;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const TRACKER_ALLOWED_FILE_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];

const getFileExtension = (fileName = "") => {
  const index = String(fileName).lastIndexOf(".");
  if (index < 0) return "";
  return String(fileName).slice(index).toLowerCase();
};

const isAllowedFileType = (file, allowedExtensions = TRACKER_ALLOWED_FILE_EXTENSIONS) => {
  const extension = getFileExtension(file?.name || "");
  return allowedExtensions.includes(extension);
};

const buildUploadRuleLabel = (allowedExtensions = TRACKER_ALLOWED_FILE_EXTENSIONS) =>
  `${allowedExtensions.map((ext) => ext.replace(".", "").toUpperCase()).join(", ")} | Max ${MAX_UPLOAD_SIZE_MB}MB`;

const validateSelectedFile = (file, allowedExtensions = TRACKER_ALLOWED_FILE_EXTENSIONS) => {
  if (!file) return null;

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `File size must be ${MAX_UPLOAD_SIZE_MB}MB or less.`;
  }

  if (!isAllowedFileType(file, allowedExtensions)) {
    return `Only ${allowedExtensions
      .map((ext) => ext.replace(".", "").toUpperCase())
      .join(", ")} files are allowed.`;
  }

  return null;
};

const createSprintItem = (index = 0) => ({
  sprintName: `Sprint ${index + 1}`,
  startDate: "",
  endDate: "",
  objective: "",
  status: "Upcoming",
});

const createMeetingItem = () => ({
  meetingDate: "",
  attendees: "",
  agenda: "",
  decisions: "",
  nextSteps: "",
});

const createPublicationDetailItem = () => ({
  paperTitle: "",
  journalName: "",
  year: "",
  authors: "",
  url: "",
  doi: "",
  volume: "",
  pageNo: "",
  publisher: "",
  proofFileName: "",
  proofUrl: "",
  proofKey: "",
});

const createPatentDetailItem = () => ({
  title: "",
  inventors: "",
  applicationNo: "",
  patentNumber: "",
  filingCountry: "",
  subjectCategory: "",
  filingDate: "",
  publicationDate: "",
  publicationStatus: "",
  proofFileName: "",
  proofUrl: "",
  proofKey: "",
});

const createCopyrightDetailItem = () => ({
  titleOfWork: "",
  nameOfApplicants: "",
  registrationNo: "",
  dairyNumber: "",
  date: "",
  status: "",
  proofFileName: "",
  proofUrl: "",
  proofKey: "",
});

const createEventParticipationItem = () => ({
  nameOfEvent: "",
  typeOfEvent: "Institute",
  date: "",
  typeOfParticipation: "",
  detailsOfPrizeWon: "",
  proofFileName: "",
  proofUrl: "",
  proofKey: "",
});

const deriveGroupYear = (groupId = "") => {
  const normalized = String(groupId || "").toUpperCase();
  if (normalized.startsWith("SY")) return "SY";
  if (normalized.startsWith("TY")) return "TY";
  if (normalized.startsWith("LY")) return "LY";
  return "";
};

const SUBMISSION_STATE_LABELS = {
  draft: "Draft",
  pending_mentor_approval: "Pending mentor approval",
  approved: "Approved by mentor",
  rejected: "Rejected by mentor",
};

const getSubmissionStateLabel = (state) => SUBMISSION_STATE_LABELS[state] || SUBMISSION_STATE_LABELS.draft;

const SUBMISSION_STATE_META = {
  draft: {
    cardClass: "border-slate-200 bg-slate-50",
    badgeClass: "bg-slate-100 text-slate-700",
    titleClass: "text-slate-800",
    description: "You can edit and submit your tracker when ready.",
  },
  pending_mentor_approval: {
    cardClass: "border-amber-200 bg-amber-50",
    badgeClass: "bg-amber-100 text-amber-800",
    titleClass: "text-amber-900",
    description: "Your tracker is sent to mentor and waiting for review.",
  },
  approved: {
    cardClass: "border-emerald-200 bg-emerald-50",
    badgeClass: "bg-emerald-100 text-emerald-800",
    titleClass: "text-emerald-900",
    description: "Mentor approved your tracker sheet.",
  },
  rejected: {
    cardClass: "border-red-200 bg-red-50",
    badgeClass: "bg-red-100 text-red-800",
    titleClass: "text-red-900",
    description: "Mentor requested updates before approval.",
  },
};

const getSubmissionStateMeta = (state) => SUBMISSION_STATE_META[state] || SUBMISSION_STATE_META.draft;

const asText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const hasValue = (value) => asText(value).length > 0;

const areFieldsFilled = (item, fields = []) =>
  fields.every((field) => hasValue(item?.[field]));

const listHasValues = (list = []) =>
  Array.isArray(list) && list.length > 0 && list.every((value) => hasValue(value));

const ensureMinimumItems = (list, minimum, createItem) => {
  const safeList = Array.isArray(list) ? list : [];

  if (safeList.length >= minimum) return safeList;

  return [
    ...safeList,
    ...Array.from({ length: minimum - safeList.length }, (_, index) =>
      createItem(safeList.length + index)
    ),
  ];
};

const createInitialForm = () => ({
  projectInfo: {
    completionStatus: "100%",
    copyrightStatus: "NA",
    technologyTransfer: "NO",
    paperPublicationStatus: "NA",
    sourceOfProblemStatement: "Hackathon Problems",
    githubLink: "",
    sustainableDevelopmentGoal: "NO poverty",
    achievements: "",
  },
  techStack: {
    frontend: "",
    backend: "",
    database: "",
    devOps: "",
    tools: "",
  },
  userStories: {
    epic: "",
    stories: Array.from({ length: 5 }, () => ""),
    tasks: Array.from({ length: 5 }, () => ""),
    acceptanceCriteria: Array.from({ length: 5 }, () => ""),
  },
  sprintPlanning: Array.from({ length: 4 }, (_, index) => createSprintItem(index)),
  publicationDetails: [createPublicationDetailItem(), createPublicationDetailItem()],
  patentDetails: [createPatentDetailItem()],
  copyrightDetails: [createCopyrightDetailItem()],
  eventParticipationDetails: [createEventParticipationItem(), createEventParticipationItem()],
  meetings: Array.from({ length: 12 }, () => createMeetingItem()),
});

const NOC_DOCUMENT_IDS = {
  TRACKER: "project_tracker_sheet",
  SYNOPSIS: "project_synopsis",
  FINAL_REPORT: "final_project_report",
  COPYRIGHT: "copyright_details",
  PATENT: "patent_details",
  PUBLICATION: "research_publication_details",
  PPT: "project_presentation_ppt",
  ACHIEVEMENTS: "achievements",
  INTERNSHIP: "internship_reports",
};

const NOC_MAX_LINKED_ITEMS = 2;

const NOC_DEFAULT_DOCUMENTS = [
  {
    id: NOC_DOCUMENT_IDS.TRACKER,
    name: "Project Tracker Sheet (fully updated)",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: NOC_DOCUMENT_IDS.SYNOPSIS,
    name: "Project Synopsis",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: NOC_DOCUMENT_IDS.FINAL_REPORT,
    name: "Final Project report / Success story (for internship)",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: NOC_DOCUMENT_IDS.COPYRIGHT,
    name: "Copyright Details",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: NOC_DOCUMENT_IDS.PATENT,
    name: "Patent Details",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: NOC_DOCUMENT_IDS.PUBLICATION,
    name: "Research Publication Details",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: NOC_DOCUMENT_IDS.PPT,
    name: "Project Presentation PPT",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: NOC_DOCUMENT_IDS.ACHIEVEMENTS,
    name: "Achievements",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: NOC_DOCUMENT_IDS.INTERNSHIP,
    name: "Internship joining report & Completion Report (If any)",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
];

const NOC_LINKED_DOCUMENT_IDS = new Set([
  NOC_DOCUMENT_IDS.COPYRIGHT,
  NOC_DOCUMENT_IDS.PATENT,
  NOC_DOCUMENT_IDS.PUBLICATION,
  NOC_DOCUMENT_IDS.ACHIEVEMENTS,
]);

const hasMeaningfulPublicationEntry = (item = {}) =>
  Boolean(
    asText(item?.paperTitle) ||
      asText(item?.journalName) ||
      asText(item?.doi) ||
      asText(item?.url) ||
      asText(item?.proofUrl) ||
      asText(item?.proofKey) ||
      asText(item?.proofFileName)
  );

const hasMeaningfulPatentEntry = (item = {}) =>
  Boolean(
    asText(item?.title) ||
      asText(item?.applicationNo) ||
      asText(item?.patentNumber) ||
      asText(item?.proofUrl) ||
      asText(item?.proofKey) ||
      asText(item?.proofFileName)
  );

const hasMeaningfulCopyrightEntry = (item = {}) =>
  Boolean(
    asText(item?.titleOfWork) ||
      asText(item?.registrationNo) ||
      asText(item?.nameOfApplicants) ||
      asText(item?.proofUrl) ||
      asText(item?.proofKey) ||
      asText(item?.proofFileName)
  );

const hasMeaningfulEventEntry = (item = {}) =>
  Boolean(
    asText(item?.nameOfEvent) ||
      asText(item?.typeOfParticipation) ||
      asText(item?.detailsOfPrizeWon) ||
      asText(item?.proofUrl) ||
      asText(item?.proofKey) ||
      asText(item?.proofFileName)
  );

const hasAnySharedDetails = (payload = {}) =>
  ensureMinimumItems(payload?.publicationDetails, 0, createPublicationDetailItem).some(
    hasMeaningfulPublicationEntry
  ) ||
  ensureMinimumItems(payload?.patentDetails, 0, createPatentDetailItem).some(
    hasMeaningfulPatentEntry
  ) ||
  ensureMinimumItems(payload?.copyrightDetails, 0, createCopyrightDetailItem).some(
    hasMeaningfulCopyrightEntry
  ) ||
  ensureMinimumItems(payload?.eventParticipationDetails, 0, createEventParticipationItem).some(
    hasMeaningfulEventEntry
  );

const parseTimestamp = (value) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const mergeSharedRowsPreservingProof = (baseRows = [], incomingRows = []) => {
  const safeBaseRows = Array.isArray(baseRows) ? baseRows : [];
  const safeIncomingRows = Array.isArray(incomingRows) ? incomingRows : [];
  const rowCount = Math.max(safeBaseRows.length, safeIncomingRows.length, 1);

  return Array.from({ length: rowCount }, (_, index) => {
    const baseRow =
      safeBaseRows[index] && typeof safeBaseRows[index] === "object" ? safeBaseRows[index] : {};
    const incomingRow =
      safeIncomingRows[index] && typeof safeIncomingRows[index] === "object"
        ? safeIncomingRows[index]
        : {};

    return {
      ...baseRow,
      ...incomingRow,
      proofFileName: asText(incomingRow?.proofFileName) || asText(baseRow?.proofFileName),
      proofUrl: asText(incomingRow?.proofUrl) || asText(baseRow?.proofUrl),
      proofKey: asText(incomingRow?.proofKey) || asText(baseRow?.proofKey),
    };
  });
};

const getTrackerDraftStorageKey = (enrollmentNo = "") =>
  `student_tracker_draft_${asText(enrollmentNo).toUpperCase() || "UNKNOWN"}`;

const buildAchievementsSummaryFromEvents = (eventRows = []) => {
  const values = ensureMinimumItems(eventRows, 0, createEventParticipationItem)
    .map((item) => asText(item?.nameOfEvent || item?.detailsOfPrizeWon))
    .filter(Boolean)
    .slice(0, 6);

  return values.join("; ");
};

const findFirstProof = (rows = []) => {
  const item = ensureMinimumItems(rows, 0, () => ({})).find(
    (row) =>
      hasValue(row?.proofUrl) || hasValue(row?.proofKey) || hasValue(row?.proofFileName)
  );

  if (!item) return null;

  return {
    fileName: asText(item?.proofFileName),
    url: asText(item?.proofUrl),
    key: asText(item?.proofKey),
  };
};

const normalizeNocPayloadForSync = (payload) => {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const incomingDocuments = Array.isArray(safePayload.documents) ? safePayload.documents : [];
  const byId = new Map();

  incomingDocuments.forEach((doc, index) => {
    const fallbackId = NOC_DEFAULT_DOCUMENTS[index]?.id;
    const id = asText(doc?.id || fallbackId);
    if (!id) return;
    byId.set(id, doc || {});
  });

  return {
    certificateDate: asText(safePayload.certificateDate),
    concludingRemark: asText(safePayload.concludingRemark),
    guideSignatureName: asText(safePayload.guideSignatureName),
    documents: NOC_DEFAULT_DOCUMENTS.map((defaultDoc) => {
      const incoming = byId.get(defaultDoc.id) || {};
      return {
        ...defaultDoc,
        ...incoming,
        id: defaultDoc.id,
        name: defaultDoc.name,
      };
    }),
    publicationDetails: ensureMinimumItems(
      safePayload?.publicationDetails,
      1,
      createPublicationDetailItem
    )
      .slice(0, NOC_MAX_LINKED_ITEMS)
      .map((item) => ({
      ...createPublicationDetailItem(),
      ...(item || {}),
    })),
    patentDetails: ensureMinimumItems(safePayload?.patentDetails, 1, createPatentDetailItem)
      .slice(0, NOC_MAX_LINKED_ITEMS)
      .map((item) => ({
        ...createPatentDetailItem(),
        ...(item || {}),
      })),
    copyrightDetails: ensureMinimumItems(
      safePayload?.copyrightDetails,
      1,
      createCopyrightDetailItem
    )
      .slice(0, NOC_MAX_LINKED_ITEMS)
      .map((item) => ({
      ...createCopyrightDetailItem(),
      ...(item || {}),
    })),
    eventParticipationDetails: ensureMinimumItems(
      safePayload?.eventParticipationDetails,
      1,
      createEventParticipationItem
    )
      .slice(0, NOC_MAX_LINKED_ITEMS)
      .map((item) => ({
      ...createEventParticipationItem(),
      ...(item || {}),
    })),
    sharedDetailsUpdatedAt: safePayload?.sharedDetailsUpdatedAt || null,
    mentorReview:
      safePayload?.mentorReview && typeof safePayload.mentorReview === "object"
        ? safePayload.mentorReview
        : {
            status: "draft",
            feedback: "",
            reviewedBy: "",
            reviewedAt: null,
          },
  };
};

const applyLinkedDocumentStatusesToNocPayload = (payload) => {
  const normalized = normalizeNocPayloadForSync(payload);

  const hasPublication = normalized.publicationDetails.some(hasMeaningfulPublicationEntry);
  const hasPatent = normalized.patentDetails.some(hasMeaningfulPatentEntry);
  const hasCopyright = normalized.copyrightDetails.some(hasMeaningfulCopyrightEntry);
  const hasAchievements = normalized.eventParticipationDetails.some(hasMeaningfulEventEntry);

  const proofs = {
    [NOC_DOCUMENT_IDS.PUBLICATION]: findFirstProof(normalized.publicationDetails),
    [NOC_DOCUMENT_IDS.PATENT]: findFirstProof(normalized.patentDetails),
    [NOC_DOCUMENT_IDS.COPYRIGHT]: findFirstProof(normalized.copyrightDetails),
    [NOC_DOCUMENT_IDS.ACHIEVEMENTS]: findFirstProof(normalized.eventParticipationDetails),
  };

  const statusMap = {
    [NOC_DOCUMENT_IDS.PUBLICATION]: hasPublication,
    [NOC_DOCUMENT_IDS.PATENT]: hasPatent,
    [NOC_DOCUMENT_IDS.COPYRIGHT]: hasCopyright,
    [NOC_DOCUMENT_IDS.ACHIEVEMENTS]: hasAchievements,
  };

  return {
    ...normalized,
    documents: normalized.documents.map((doc) => {
      if (!NOC_LINKED_DOCUMENT_IDS.has(doc.id)) return doc;

      const hasLinkedValue = statusMap[doc.id];
      const proof = proofs[doc.id];

      if (!hasLinkedValue) {
        return {
          ...doc,
          status: "",
          proofFileName: "",
          proofUrl: "",
          proofKey: "",
        };
      }

      return {
        ...doc,
        status: "Submitted",
        proofFileName: proof?.fileName || "",
        proofUrl: proof?.url || "",
        proofKey: proof?.key || "",
      };
    }),
  };
};

const normalizeUserStoriesSection = (userStoriesDraft) => {
  if (Array.isArray(userStoriesDraft)) {
    const migratedStories = userStoriesDraft.map(
      (story) => story?.goal || story?.benefit || story?.role || ""
    );

    return {
      epic: "",
      stories: ensureMinimumItems(migratedStories, 5, () => ""),
      tasks: Array.from({ length: 5 }, () => ""),
      acceptanceCriteria: Array.from({ length: 5 }, () => ""),
    };
  }

  const safeDraft =
    userStoriesDraft && typeof userStoriesDraft === "object" ? userStoriesDraft : {};
  const baseUserStories = createInitialForm().userStories;

  return {
    ...baseUserStories,
    ...safeDraft,
    stories: ensureMinimumItems(safeDraft?.stories, 5, () => ""),
    tasks: ensureMinimumItems(safeDraft?.tasks, 5, () => ""),
    acceptanceCriteria: ensureMinimumItems(safeDraft?.acceptanceCriteria, 5, () => ""),
  };
};

const normalizeTrackerDraft = (draftData) => {
  const parsedDraft = draftData && typeof draftData === "object" ? draftData : {};

  return {
    ...createInitialForm(),
    ...parsedDraft,
    userStories: normalizeUserStoriesSection(parsedDraft?.userStories),
    sprintPlanning: ensureMinimumItems(parsedDraft?.sprintPlanning, 4, createSprintItem),
    meetings: ensureMinimumItems(parsedDraft?.meetings, 12, createMeetingItem),
    publicationDetails: ensureMinimumItems(
      parsedDraft?.publicationDetails,
      2,
      createPublicationDetailItem
    ).map((item) => ({
      ...createPublicationDetailItem(),
      ...(item || {}),
    })),
    patentDetails: ensureMinimumItems(parsedDraft?.patentDetails, 1, createPatentDetailItem).map(
      (item) => ({
        ...createPatentDetailItem(),
        ...(item || {}),
      })
    ),
    copyrightDetails: ensureMinimumItems(
      parsedDraft?.copyrightDetails,
      1,
      createCopyrightDetailItem
    ).map((item) => ({
      ...createCopyrightDetailItem(),
      ...(item || {}),
    })),
    eventParticipationDetails: ensureMinimumItems(
      parsedDraft?.eventParticipationDetails,
      2,
      createEventParticipationItem
    ).map((item) => ({
      ...createEventParticipationItem(),
      ...(item || {}),
    })),
  };
};

const createTrackerSnapshot = (payload) => JSON.stringify(normalizeTrackerDraft(payload));

const sectionTabs = [
  { id: "project-info", label: "Project Information" },
  { id: "tech", label: "Technology Stack" },
  { id: "stories", label: "User Stories" },
  { id: "sprints", label: "Sprint Planning" },
  { id: "publications", label: "Publication Details" },
  { id: "meetings", label: "Meetings" },
];

const TrackerSheet = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("project-info");
  const [formData, setFormData] = useState(createInitialForm());
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [groupId, setGroupId] = useState("");
  const [groupYear, setGroupYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [proofFiles, setProofFiles] = useState({});
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [submissionState, setSubmissionState] = useState("draft");
  const [lastPersistedSnapshot, setLastPersistedSnapshot] = useState(() =>
    createTrackerSnapshot(createInitialForm())
  );

  useEffect(() => {
    const token = localStorage.getItem("student_token") || localStorage.getItem("token");
    if (!token) {
      navigate("/studentlogin");
      return;
    }

    const fetchStudent = async () => {
      try {
        const profileRes = await apiRequest("/api/student-auth/profile", "GET", null, token);

        if (!profileRes?.success) {
          throw new Error(profileRes?.message || "Unable to load student profile");
        }

        const profileData = profileRes?.data?.profile || profileRes?.profile || null;

        if (!profileData) {
          navigate("/studentlogin");
          return;
        }

        setStudent(profileData);

        const localDraftKey = getTrackerDraftStorageKey(profileData?.enrollment_no);
        let localDraft = null;
        try {
          const rawLocalDraft = localStorage.getItem(localDraftKey);
          const parsedLocalDraft = rawLocalDraft ? JSON.parse(rawLocalDraft) : null;
          if (parsedLocalDraft && typeof parsedLocalDraft === "object") {
            localDraft = parsedLocalDraft;
          }
        } catch (storageError) {
          console.warn("Unable to parse local tracker draft backup:", storageError);
        }

        try {
          const groupRes = await apiRequest(
            `/api/students/student/group-details/${profileData.enrollment_no}`,
            "GET",
            null,
            token
          );

          if (!groupRes?.success) {
            throw new Error(groupRes?.message || "Unable to load group details");
          }

          const groupData = groupRes?.data?.group || groupRes?.group || null;
          const detectedGroupId = groupData?.group_id || "";
          setGroupId(detectedGroupId);
          setGroupYear(deriveGroupYear(detectedGroupId));
        } catch (groupError) {
          console.warn("Unable to fetch group details for tracker rules:", groupError);
        }

        try {
          const trackerRes = await apiRequest("/api/students/tracker-sheet/me", "GET", null, token);

          if (!trackerRes?.success) {
            throw new Error(trackerRes?.message || "Unable to load tracker sheet");
          }

          const trackerRecord = trackerRes?.data?.tracker || trackerRes?.tracker || null;
          const trackerPayload = trackerRecord?.payload || null;
          const trackerSubmissionState =
            trackerRes?.data?.submissionState || trackerRes?.submissionState || "draft";
          setSubmissionState(trackerSubmissionState);

          let mergedTrackerPayload = normalizeTrackerDraft(trackerPayload || createInitialForm());

          try {
            const nocRes = await apiRequest("/api/students/noc/me", "GET", null, token);

            if (!nocRes?.success) {
              throw new Error(nocRes?.message || "Unable to load NOC shared details");
            }

            const nocPayload = nocRes?.data?.noc?.payload || nocRes?.noc?.payload || null;

            if (nocPayload && typeof nocPayload === "object") {
              const nocHasShared = hasAnySharedDetails(nocPayload);
              const trackerHasShared = hasAnySharedDetails(mergedTrackerPayload);
              const nocSharedStamp = parseTimestamp(nocPayload?.sharedDetailsUpdatedAt);
              const trackerSharedStamp = parseTimestamp(mergedTrackerPayload?.sharedDetailsUpdatedAt);

              if (nocHasShared && (nocSharedStamp > trackerSharedStamp || !trackerHasShared)) {
                mergedTrackerPayload = normalizeTrackerDraft({
                  ...mergedTrackerPayload,
                  publicationDetails: mergeSharedRowsPreservingProof(
                    mergedTrackerPayload?.publicationDetails,
                    nocPayload?.publicationDetails
                  ),
                  patentDetails: mergeSharedRowsPreservingProof(
                    mergedTrackerPayload?.patentDetails,
                    nocPayload?.patentDetails
                  ),
                  copyrightDetails: mergeSharedRowsPreservingProof(
                    mergedTrackerPayload?.copyrightDetails,
                    nocPayload?.copyrightDetails
                  ),
                  eventParticipationDetails: mergeSharedRowsPreservingProof(
                    mergedTrackerPayload?.eventParticipationDetails,
                    nocPayload?.eventParticipationDetails
                  ),
                  sharedDetailsUpdatedAt:
                    nocPayload?.sharedDetailsUpdatedAt ||
                    mergedTrackerPayload?.sharedDetailsUpdatedAt ||
                    null,
                  projectInfo: {
                    ...(mergedTrackerPayload?.projectInfo || {}),
                    achievements:
                      asText(mergedTrackerPayload?.projectInfo?.achievements) ||
                      buildAchievementsSummaryFromEvents(nocPayload?.eventParticipationDetails),
                  },
                });
              }
            }
          } catch (nocSyncError) {
            console.warn("Unable to load NOC shared details for tracker sync:", nocSyncError);
          }

          if (localDraft?.formData && typeof localDraft.formData === "object") {
            const localDraftData = normalizeTrackerDraft(localDraft.formData);
            const serverStamp = parseTimestamp(mergedTrackerPayload?.sharedDetailsUpdatedAt);
            const localStamp = parseTimestamp(localDraftData?.sharedDetailsUpdatedAt);

            if (localStamp > serverStamp) {
              mergedTrackerPayload = localDraftData;
              setStatusMessage({
                type: "warning",
                text: "Recovered your latest unsynced tracker draft from this device. Please save once to sync with server.",
              });
            }
          }

          setFormData(mergedTrackerPayload);
          setLastPersistedSnapshot(createTrackerSnapshot(mergedTrackerPayload));

          if (trackerPayload && typeof trackerPayload === "object") {
            setStatusMessage({ type: "success", text: "Tracker sheet loaded from database." });
          }

          const serverGroupId = trackerRes?.data?.groupId || trackerRes?.groupId || "";
          if (serverGroupId) {
            setGroupId(serverGroupId);
            setGroupYear(deriveGroupYear(serverGroupId));
          }
        } catch (trackerError) {
          console.warn("Unable to load tracker sheet from backend:", trackerError);
        }
      } catch (error) {
        console.error("Failed to load tracker sheet:", error);

        const safeMessage = asText(error?.message).toLowerCase();
        const isAuthIssue =
          safeMessage.includes("unauthorized") ||
          safeMessage.includes("authentication") ||
          safeMessage.includes("token") ||
          safeMessage.includes("forbidden");

        if (isAuthIssue) {
          navigate("/studentlogin");
          return;
        }

        setStatusMessage({
          type: "error",
          text:
            error?.message ||
            "Unable to load tracker from server right now. Your local draft (if any) is preserved.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [navigate]);

  useEffect(() => {
    if (loading || !student?.enrollment_no) return;

    try {
      const draftKey = getTrackerDraftStorageKey(student.enrollment_no);
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          formData: normalizeTrackerDraft(formData),
          submissionState,
          savedAt: new Date().toISOString(),
        })
      );
    } catch (storageError) {
      console.warn("Unable to cache tracker draft locally:", storageError);
    }
  }, [formData, submissionState, student?.enrollment_no, loading]);

  const isSYGroup = groupYear === "SY";
  const isTYOrLYGroup = groupYear === "TY" || groupYear === "LY";

  const hasAtLeastOnePaperPublication = () =>
    formData.publicationDetails.some(
      (item) =>
        item.paperTitle?.trim() ||
        item.journalName?.trim() ||
        item.doi?.trim() ||
        item.url?.trim()
    );

  const hasAtLeastOneCopyrightEntry = () =>
    formData.copyrightDetails.some(
      (item) =>
        item.titleOfWork?.trim() ||
        item.registrationNo?.trim() ||
        item.nameOfApplicants?.trim()
    );

  const handleTechField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      techStack: {
        ...prev.techStack,
        [field]: value,
      },
    }));
  };

  const handleProjectInfoField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      projectInfo: {
        ...prev.projectInfo,
        [field]: value,
      },
    }));
  };

  const handleUserStoriesField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      userStories: {
        ...prev.userStories,
        [field]: value,
      },
    }));
  };

  const handleUserStoriesListField = (field, index, value) => {
    setFormData((prev) => {
      const updatedList = [...(prev.userStories?.[field] || [])];
      updatedList[index] = value;

      return {
        ...prev,
        userStories: {
          ...prev.userStories,
          [field]: updatedList,
        },
      };
    });
  };

  const handleListFieldChange = (section, index, field, value) => {
    setFormData((prev) => {
      const nextSection = [...prev[section]];
      nextSection[index] = {
        ...nextSection[index],
        [field]: value,
      };
      return {
        ...prev,
        [section]: nextSection,
      };
    });
  };

  const getProofFileKey = (section, index) => `${section}::${index}`;

  const hasProofForSectionRow = (section, index, item = {}) => {
    const localFile = proofFiles[getProofFileKey(section, index)];

    return Boolean(
      localFile || asText(item?.proofUrl) || asText(item?.proofKey) || asText(item?.proofFileName)
    );
  };

  const trackerAllFieldsFilled = useMemo(() => {
    const projectInfoComplete = areFieldsFilled(formData?.projectInfo, [
      "completionStatus",
      "copyrightStatus",
      "technologyTransfer",
      "paperPublicationStatus",
      "sourceOfProblemStatement",
      "githubLink",
      "sustainableDevelopmentGoal",
    ]);

    const techStackComplete = areFieldsFilled(formData?.techStack, [
      "frontend",
      "backend",
      "database",
      "devOps",
      "tools",
    ]);

    const userStoriesComplete =
      hasValue(formData?.userStories?.epic) &&
      listHasValues(formData?.userStories?.stories) &&
      listHasValues(formData?.userStories?.tasks) &&
      listHasValues(formData?.userStories?.acceptanceCriteria);

    const sprintComplete =
      Array.isArray(formData?.sprintPlanning) &&
      formData.sprintPlanning.length > 0 &&
      formData.sprintPlanning.every((item) =>
        areFieldsFilled(item, ["sprintName", "startDate", "endDate", "objective", "status"])
      );

    const publicationComplete =
      Array.isArray(formData?.publicationDetails) &&
      formData.publicationDetails.length > 0 &&
      formData.publicationDetails.every((item, index) =>
        areFieldsFilled(item, [
          "paperTitle",
          "journalName",
          "year",
          "authors",
          "url",
          "doi",
          "volume",
          "pageNo",
          "publisher",
        ]) && hasProofForSectionRow("publicationDetails", index, item)
      );

    const patentComplete =
      Array.isArray(formData?.patentDetails) &&
      formData.patentDetails.length > 0 &&
      formData.patentDetails.every((item, index) =>
        areFieldsFilled(item, [
          "title",
          "inventors",
          "applicationNo",
          "patentNumber",
          "filingCountry",
          "subjectCategory",
          "filingDate",
          "publicationDate",
          "publicationStatus",
        ]) && hasProofForSectionRow("patentDetails", index, item)
      );

    const copyrightComplete =
      Array.isArray(formData?.copyrightDetails) &&
      formData.copyrightDetails.length > 0 &&
      formData.copyrightDetails.every((item, index) =>
        areFieldsFilled(item, [
          "titleOfWork",
          "nameOfApplicants",
          "registrationNo",
          "dairyNumber",
          "date",
          "status",
        ]) && hasProofForSectionRow("copyrightDetails", index, item)
      );

    const eventComplete =
      Array.isArray(formData?.eventParticipationDetails) &&
      formData.eventParticipationDetails.length > 0 &&
      formData.eventParticipationDetails.every((item, index) =>
        areFieldsFilled(item, [
          "nameOfEvent",
          "typeOfEvent",
          "date",
          "typeOfParticipation",
          "detailsOfPrizeWon",
        ]) && hasProofForSectionRow("eventParticipationDetails", index, item)
      );

    const meetingsComplete =
      Array.isArray(formData?.meetings) &&
      formData.meetings.length > 0 &&
      formData.meetings.every((item) =>
        areFieldsFilled(item, ["meetingDate", "attendees", "agenda", "decisions", "nextSteps"])
      );

    return (
      projectInfoComplete &&
      techStackComplete &&
      userStoriesComplete &&
      sprintComplete &&
      publicationComplete &&
      patentComplete &&
      copyrightComplete &&
      eventComplete &&
      meetingsComplete
    );
  }, [formData, proofFiles]);

  const isTrackerSubmitLocked = submissionState === "approved" && trackerAllFieldsFilled;

  const handleProofFileChange = (section, index, file) => {
    const validationMessage = validateSelectedFile(file, TRACKER_ALLOWED_FILE_EXTENSIONS);

    if (validationMessage) {
      setStatusMessage({
        type: "error",
        text: `${validationMessage} (${buildUploadRuleLabel(TRACKER_ALLOWED_FILE_EXTENSIONS)})`,
      });
      return;
    }

    setProofFiles((prev) => {
      const key = getProofFileKey(section, index);

      if (!file) {
        const nextFiles = { ...prev };
        delete nextFiles[key];
        return nextFiles;
      }

      return {
        ...prev,
        [key]: file,
      };
    });

    setFormData((prev) => {
      const nextSection = [...(prev[section] || [])];
      nextSection[index] = {
        ...nextSection[index],
        proofFileName: file?.name || "",
        proofUrl: file ? "" : nextSection[index]?.proofUrl || "",
        proofKey: file ? "" : nextSection[index]?.proofKey || "",
      };

      return {
        ...prev,
        [section]: nextSection,
      };
    });
  };

  const addListItem = (section, itemTemplate) => {
    setFormData((prev) => ({
      ...prev,
      [section]: [...prev[section], { ...itemTemplate }],
    }));
  };

  const removeListItem = (section, index, minItems = 1) => {
    setFormData((prev) => {
      if (prev[section].length <= minItems) return prev;

      return {
        ...prev,
        [section]: prev[section].filter((_, itemIndex) => itemIndex !== index),
      };
    });

    setProofFiles((prev) => {
      const nextFiles = {};

      Object.entries(prev).forEach(([key, file]) => {
        const [fileSection, fileIndexRaw] = key.split("::");
        const fileIndex = Number(fileIndexRaw);

        if (fileSection !== section || Number.isNaN(fileIndex)) {
          nextFiles[key] = file;
          return;
        }

        if (fileIndex === index) {
          return;
        }

        const shiftedIndex = fileIndex > index ? fileIndex - 1 : fileIndex;
        nextFiles[getProofFileKey(fileSection, shiftedIndex)] = file;
      });

      return nextFiles;
    });
  };

  const uploadPendingProofFiles = async (token, draftToPersist) => {
    const pendingUploads = Object.entries(proofFiles);
    if (!pendingUploads.length) {
      return draftToPersist;
    }

    const nextPayload = JSON.parse(JSON.stringify(draftToPersist));

    for (const [key, file] of pendingUploads) {
      if (!(file instanceof File)) {
        continue;
      }

      const [section, indexRaw] = key.split("::");
      const index = Number(indexRaw);

      if (!section || Number.isNaN(index)) {
        continue;
      }

      const form = new FormData();
      form.append("file", file);
      form.append("section", section);
      form.append("rowIndex", String(index));

      const uploadRes = await apiRequest(
        "/api/students/tracker-sheet/proof",
        "POST",
        form,
        token,
        true,
        120000
      );

      if (!uploadRes?.success) {
        throw new Error(uploadRes?.message || "Failed to upload proof file");
      }

      const proof = uploadRes?.data?.proof || uploadRes?.proof || null;

      if (!proof || !Array.isArray(nextPayload[section]) || !nextPayload[section][index]) {
        continue;
      }

      nextPayload[section][index] = {
        ...nextPayload[section][index],
        proofFileName: proof.fileName || nextPayload[section][index]?.proofFileName || "",
        proofUrl: proof.url || "",
        proofKey: proof.key || "",
      };
    }

    setProofFiles({});
    return nextPayload;
  };

  const syncSharedDetailsToNoc = async (token, trackerPayload) => {
    const nocRes = await apiRequest("/api/students/noc/me", "GET", null, token).catch(() => null);

    if (nocRes && nocRes.success === false) {
      throw new Error(nocRes?.message || "Unable to load NOC for shared-details sync");
    }

    const existingNocPayload = nocRes?.data?.noc?.payload || nocRes?.noc?.payload || null;

    const normalizedNocPayload = normalizeNocPayloadForSync(existingNocPayload);

    const mergedNocPayload = applyLinkedDocumentStatusesToNocPayload({
      ...normalizedNocPayload,
      publicationDetails: trackerPayload?.publicationDetails || [],
      patentDetails: trackerPayload?.patentDetails || [],
      copyrightDetails: trackerPayload?.copyrightDetails || [],
      eventParticipationDetails: trackerPayload?.eventParticipationDetails || [],
      sharedDetailsUpdatedAt: trackerPayload?.sharedDetailsUpdatedAt || new Date().toISOString(),
    });

    const syncRes = await apiRequest(
      "/api/students/noc/me",
      "PUT",
      {
        formData: mergedNocPayload,
        submit: false,
      },
      token
    );

    if (!syncRes?.success) {
      throw new Error(syncRes?.message || "Unable to sync shared details to NOC");
    }
  };

  const persistTrackerSheet = async (submit = false) => {
    if (!student || saving) return false;

    const token = localStorage.getItem("student_token") || localStorage.getItem("token");
    if (!token) {
      navigate("/studentlogin");
      return false;
    }

    setSaving(true);
    setStatusMessage({ type: "", text: "" });

    try {
      const normalizedDraft = normalizeTrackerDraft(formData);
      const achievementSummary = buildAchievementsSummaryFromEvents(
        normalizedDraft?.eventParticipationDetails
      );
      const draftWithSharedDetails = {
        ...normalizedDraft,
        sharedDetailsUpdatedAt: new Date().toISOString(),
        projectInfo: {
          ...normalizedDraft.projectInfo,
          achievements: asText(normalizedDraft?.projectInfo?.achievements) || achievementSummary,
        },
      };

      const draftWithUploadedProofs = await uploadPendingProofFiles(token, draftWithSharedDetails);

      const saveRes = await apiRequest(
        "/api/students/tracker-sheet/me",
        "PUT",
        {
          formData: draftWithUploadedProofs,
          submit,
        },
        token,
        false,
        submit ? 120000 : 60000
      );

      if (!saveRes?.success) {
        throw new Error(saveRes?.message || "Failed to save tracker sheet");
      }

      const trackerRecord = saveRes?.data?.tracker || saveRes?.tracker || null;
      const persistedPayload = trackerRecord?.payload || draftWithUploadedProofs;
      const normalizedPersistedPayload = normalizeTrackerDraft(persistedPayload);
      setFormData(normalizedPersistedPayload);
      setLastPersistedSnapshot(createTrackerSnapshot(normalizedPersistedPayload));
      setSubmissionState(
        saveRes?.data?.submissionState ||
          saveRes?.submissionState ||
          (submit ? "pending_mentor_approval" : "draft")
      );

      try {
        if (student?.enrollment_no) {
          const draftKey = getTrackerDraftStorageKey(student.enrollment_no);
          localStorage.setItem(
            draftKey,
            JSON.stringify({
              formData: normalizedPersistedPayload,
              submissionState:
                saveRes?.data?.submissionState ||
                saveRes?.submissionState ||
                (submit ? "pending_mentor_approval" : "draft"),
              savedAt: new Date().toISOString(),
              source: "server-confirmed",
            })
          );
        }
      } catch (storageError) {
        console.warn("Unable to refresh local tracker draft backup:", storageError);
      }

      let syncWarning = "";
      try {
        await syncSharedDetailsToNoc(token, normalizedPersistedPayload);
      } catch (syncError) {
        console.warn("Unable to sync tracker shared details to NOC:", syncError);
        syncWarning = "Linked NOC details could not be synced right now.";
      }

      const successText =
        saveRes?.message ||
        (submit
          ? "Tracker sheet submitted to mentor for approval."
          : "Tracker sheet saved to database.");

      setStatusMessage({
        type: syncWarning ? "warning" : "success",
        text: syncWarning ? `${successText} ${syncWarning}` : successText,
      });

      return true;
    } catch (error) {
      console.error("Tracker persistence failed:", error);

      setStatusMessage({
        type: "error",
        text:
          error?.message ||
          "Unable to save tracker right now. Your entered data is preserved on this device. Please retry after a moment.",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    await persistTrackerSheet(false);
  };

  const normalizeMemberEnrollment = (member = {}) =>
    String(member?.enrollmentNo || member?.enrollment_no || member?.enrollement_no || "").trim();

  const mergeMemberSources = (primaryMembers = [], fallbackMembers = []) => {
    const fallbackByEnrollment = new Map(
      (Array.isArray(fallbackMembers) ? fallbackMembers : []).map((member) => [
        normalizeMemberEnrollment(member).toUpperCase(),
        member || {},
      ])
    );

    const normalizedPrimary = (Array.isArray(primaryMembers) ? primaryMembers : []).map((member) => {
      const enrollment = normalizeMemberEnrollment(member);
      const fallback = fallbackByEnrollment.get(enrollment.toUpperCase()) || {};

      return {
        enrollmentNo: enrollment,
        name: member?.name_of_student || member?.student_name || fallback?.name_of_student || "",
        className: member?.class || member?.class_division || fallback?.class || "",
        contact:
          member?.contact ||
          member?.phone ||
          member?.student_contact_no ||
          member?.contact_no ||
          fallback?.contact ||
          fallback?.phone ||
          fallback?.student_contact_no ||
          fallback?.contact_no ||
          "",
        email:
          member?.email ||
          member?.email_id ||
          member?.student_email_id ||
          fallback?.email ||
          fallback?.email_id ||
          fallback?.student_email_id ||
          "",
      };
    });

    if (normalizedPrimary.length) {
      return normalizedPrimary;
    }

    return (Array.isArray(fallbackMembers) ? fallbackMembers : []).map((member) => ({
      enrollmentNo: normalizeMemberEnrollment(member),
      name: member?.name_of_student || member?.student_name || "",
      className: member?.class || member?.class_division || "",
      contact:
        member?.contact || member?.phone || member?.student_contact_no || member?.contact_no || "",
      email: member?.email || member?.email_id || member?.student_email_id || "",
    }));
  };

  const handleDownloadUnifiedPdf = async (mode = "preview") => {
    if (!student || saving || pdfGenerating) return;

    setShowDownloadOptions(false);

    const token = localStorage.getItem("student_token") || localStorage.getItem("token");
    if (!token) {
      navigate("/studentlogin");
      return;
    }

    let previewWindow = null;
    if (mode === "preview") {
      previewWindow = window.open("", "trackerPdfPreview", "popup=yes,width=1200,height=800");
      if (!previewWindow || previewWindow.closed) {
        setStatusMessage({
          type: "error",
          text: "Popup blocked. Please allow popups to preview the PDF.",
        });
        return;
      }
    }

    if (mode === "preview" && previewWindow && !previewWindow.closed) {
      previewWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Preparing Tracker PDF</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #f5f5f5; color: #1f2937; }
    .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); text-align: center; }
    .title { font-weight: 700; margin-bottom: 6px; }
    .subtitle { font-size: 14px; color: #4b5563; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Preparing tracker sheet PDF</div>
    <div class="subtitle">Please wait...</div>
  </div>
</body>
</html>`);
      previewWindow.document.close();
    }

    setPdfGenerating(true);

    try {
      const [groupMetaResult, groupDetailsResult, marksResult, previousGroupResult, trackerResult] =
        await Promise.allSettled([
          apiRequest(
            `/api/students/student/group-details/${student.enrollment_no}`,
            "GET",
            null,
            token
          ),
          apiRequest(`/api/students/pbl/gp/${student.enrollment_no}`, "GET", null, token),
          apiRequest("/api/announcements/announcement/evaluation-marks", "GET", null, token),
          apiRequest(`/api/groups/previous/${student.enrollment_no}`, "GET", null, token),
          apiRequest("/api/students/tracker-sheet/me", "GET", null, token),
        ]);

      const groupMetaRes = groupMetaResult.status === "fulfilled" ? groupMetaResult.value : null;
      const groupDetailsRes = groupDetailsResult.status === "fulfilled" ? groupDetailsResult.value : null;
      const marksRes = marksResult.status === "fulfilled" ? marksResult.value : null;
      const previousGroupRes =
        previousGroupResult.status === "fulfilled" ? previousGroupResult.value : null;
      const trackerRes = trackerResult.status === "fulfilled" ? trackerResult.value : null;

      const groupMeta = groupMetaRes?.data?.group || groupMetaRes?.group || {};
      const groupDetails =
        groupDetailsRes?.data?.groupDetails || groupDetailsRes?.groupDetails || {};
      const evaluationMarks = marksRes?.data?.marks || marksRes?.marks || [];
      const previousMembers = previousGroupRes?.data?.members || previousGroupRes?.members || [];
      const latestTrackerPayload =
        trackerRes?.data?.tracker?.payload || trackerRes?.tracker?.payload || null;
      const latestSubmissionState =
        trackerRes?.data?.submissionState || trackerRes?.submissionState || submissionState;

      const resolvedGroupId = groupMeta?.group_id || groupDetails?.group_id || groupId;
      const resolvedGroupYear = deriveGroupYear(resolvedGroupId);

      let problemStatement = null;
      if (resolvedGroupId) {
        const psId = groupMeta?.ps_id;
        const endpoint = psId
          ? `/api/students/student/problem-statement/${resolvedGroupId}?ps_id=${psId}`
          : `/api/students/student/problem-statement/${resolvedGroupId}`;

        try {
          const problemRes = await apiRequest(endpoint, "GET", null, token);
          problemStatement =
            problemRes?.data?.problemStatement || problemRes?.problemStatement || null;
        } catch (problemError) {
          console.warn("Unable to fetch problem statement for tracker PDF:", problemError);
        }
      }

      const mergedMembers = mergeMemberSources(groupDetails?.members || [], previousMembers || []);

      const pdfBlob = generateUnifiedTrackerPdfBlob({
        trackerData: normalizeTrackerDraft(latestTrackerPayload || formData),
        student,
        groupId: resolvedGroupId,
        groupYear: resolvedGroupYear,
        teamName:
          groupMeta?.team_name ||
          groupDetails?.team_name ||
          previousGroupRes?.data?.previousGroup?.team_name ||
          "",
        mentorName: groupDetails?.mentor_name || groupMeta?.mentor_code || "",
        industryMentor: previousGroupRes?.data?.previousGroup?.industry_mentor || "",
        problemStatement,
        evaluationMarks,
        members: mergedMembers,
        submissionState: latestSubmissionState,
      });

      const fileName = `tracker-sheet-${resolvedGroupId || student.enrollment_no || "student"}.pdf`;

      if (mode === "download") {
        downloadPdfBlob({ blob: pdfBlob, fileName });
        setStatusMessage({
          type: "success",
          text: "Tracker sheet PDF downloaded successfully.",
        });
      } else {
        const openedMode = openPdfPreviewWindow({
          blob: pdfBlob,
          fileName,
          previewWindow,
        });

        if (openedMode === "preview") {
          setStatusMessage({
            type: "success",
            text: "Unified tracker sheet PDF preview opened with download option.",
          });
        }
      }

    } catch (error) {
      if (mode === "preview" && previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }

      console.error("Failed to generate unified tracker sheet PDF:", error);
      setStatusMessage({
        type: "error",
        text: error?.message || "Unable to generate tracker sheet PDF right now.",
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isTrackerSubmitLocked) {
      setStatusMessage({
        type: "warning",
        text: "Tracker sheet is already approved and all fields are filled. Submit is disabled.",
      });
      return;
    }

    if (submissionState === "rejected") {
      const currentSnapshot = createTrackerSnapshot(formData);

      if (currentSnapshot === lastPersistedSnapshot) {
        setStatusMessage({
          type: "warning",
          text: "No changes detected. Please update the tracker before submitting again.",
        });
        return;
      }
    }

    if (isSYGroup) {
      if (formData.projectInfo.copyrightStatus === "NA") {
        setStatusMessage({
          type: "error",
          text: "For SY groups, copyright status is compulsory and cannot be NA.",
        });
        return;
      }

      if (!hasAtLeastOneCopyrightEntry()) {
        setStatusMessage({
          type: "error",
          text: "For SY groups, please add at least one copyright detail entry.",
        });
        return;
      }
    }

    if (isTYOrLYGroup) {
      if (formData.projectInfo.paperPublicationStatus === "NA") {
        setStatusMessage({
          type: "error",
          text: "For TY/LY groups, paper publication status is compulsory and cannot be NA.",
        });
        return;
      }

      if (!hasAtLeastOnePaperPublication()) {
        setStatusMessage({
          type: "error",
          text: "For TY/LY groups, at least one paper publication detail is compulsory.",
        });
        return;
      }
    }

    await persistTrackerSheet(true);
  };

  const submissionStateMeta = getSubmissionStateMeta(submissionState);
  const mentorFeedback = asText(formData?.mentorReview?.feedback);
  const approvalStatusDescription =
    submissionState === "approved"
      ? isTrackerSubmitLocked
        ? "Mentor approved your tracker and all fields are complete. Submit is now locked."
        : "Mentor approved your tracker. Fill pending fields if needed and submit again."
      : submissionStateMeta.description;

  const renderProjectInfo = () => (
    <section className="bg-white rounded-2xl shadow-sm border border-purple-200 p-4 sm:p-5">
      <h2 className="text-xl font-bold text-purple-900 mb-4">Project Information</h2>

      <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs sm:text-sm text-purple-800">
        <span className="font-semibold">Group:</span> {groupId || "Not linked"}
        {groupYear ? ` (${groupYear})` : ""}
        <span className="mx-2 text-purple-300">|</span>
        <span>SY: Copyright compulsory</span>
        <span className="mx-2 text-purple-300">|</span>
        <span>TY/LY: One paper publication compulsory</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Completion Status</label>
          <select
            value={formData.projectInfo.completionStatus}
            onChange={(e) => handleProjectInfoField("completionStatus", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="0%">0%</option>
            <option value="25%">25%</option>
            <option value="50%">50%</option>
            <option value="75%">75%</option>
            <option value="100%">100%</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Copyright Status {isSYGroup ? <span className="text-red-600">*</span> : null}
          </label>
          <select
            value={formData.projectInfo.copyrightStatus}
            onChange={(e) => handleProjectInfoField("copyrightStatus", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="NA">NA</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Granted">Granted</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Technology Transfer</label>
          <select
            value={formData.projectInfo.technologyTransfer}
            onChange={(e) => handleProjectInfoField("technologyTransfer", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="Crieya">Crieya</option>
            <option value="AIC">AIC</option>
            <option value="Department">Department</option>
            <option value="Other">Other</option>
            <option value="NO">NO</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Paper Publication Status {isTYOrLYGroup ? <span className="text-red-600">*</span> : null}
          </label>
          <select
            value={formData.projectInfo.paperPublicationStatus}
            onChange={(e) => handleProjectInfoField("paperPublicationStatus", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="NA">NA</option>
            <option value="Prepared">Prepared</option>
            <option value="Submitted">Submitted</option>
            <option value="Accepted">Accepted</option>
            <option value="Published">Published</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Source of Problem Statement</label>
          <select
            value={formData.projectInfo.sourceOfProblemStatement}
            onChange={(e) => handleProjectInfoField("sourceOfProblemStatement", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="Hackathon Problems">Hackathon Problems</option>
            <option value="Faculty">Faculty</option>
            <option value="Corporate">Corporate</option>
            <option value="Student Innovation">Student Innovation</option>
            <option value="Other Institure OF ADT">Other Institure OF ADT</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">GitHub Link</label>
          <input
            type="url"
            value={formData.projectInfo.githubLink}
            onChange={(e) => handleProjectInfoField("githubLink", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            placeholder="https://github.com/..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sustainable Development Goal</label>
          <select
            value={formData.projectInfo.sustainableDevelopmentGoal}
            onChange={(e) => handleProjectInfoField("sustainableDevelopmentGoal", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="NO poverty">NO poverty</option>
            <option value="Zero Hunger">Zero Hunger</option>
            <option value="Good-Health and Well Being">Good-Health and Well Being</option>
            <option value="Quality Education">Quality Education</option>
            <option value="Gender Equality">Gender Equality</option>
            <option value="Clean Water and sanitation">Clean Water and sanitation</option>
            <option value="Affordable and Clean Energy">Affordable and Clean Energy</option>
            <option value="Decent work and Economic Growth">Decent work and Economic Growth</option>
            <option value="(industary,innovation and infrastructure)">(industary,innovation and infrastructure)</option>
            <option value="Reduced Ineuality">Reduced Ineuality</option>
            <option value="Sustainable cities and communities">Sustainable cities and communities</option>
            <option value="responsible Consumption and produciton">responsible Consumption and produciton</option>
            <option value="climate Action">climate Action</option>
            <option value="Life Below water">Life Below water</option>
            <option value="life on Land">life on Land</option>
            <option value="Peace justice and strong institutions">Peace justice and strong institutions</option>
            <option value="partnerships for the Goals">partnerships for the Goals</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Achievements</label>
          <textarea
            rows={3}
            value={formData.projectInfo.achievements}
            onChange={(e) => handleProjectInfoField("achievements", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            placeholder="List project achievements"
          />
        </div>
      </div>
    </section>
  );

  const renderTechStack = () => (
    <section className="bg-white rounded-2xl shadow-sm border border-purple-200 p-4 sm:p-5">
      <h2 className="text-xl font-bold text-purple-900 mb-4">Technology Stack</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Frontend</label>
          <input
            type="text"
            value={formData.techStack.frontend}
            onChange={(e) => handleTechField("frontend", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            placeholder="React, Vue, Angular..."
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Backend</label>
          <input
            type="text"
            value={formData.techStack.backend}
            onChange={(e) => handleTechField("backend", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            placeholder="Node.js, Spring Boot, Django..."
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Database</label>
          <input
            type="text"
            value={formData.techStack.database}
            onChange={(e) => handleTechField("database", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            placeholder="MySQL, PostgreSQL, MongoDB..."
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">DevOps / Deployment</label>
          <input
            type="text"
            value={formData.techStack.devOps}
            onChange={(e) => handleTechField("devOps", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            placeholder="Docker, Vercel, AWS..."
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Development Tools</label>
          <textarea
            rows={3}
            value={formData.techStack.tools}
            onChange={(e) => handleTechField("tools", e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            placeholder="Tailwind CSS, Redux, Jest, Postman..."
          />
        </div>
      </div>
    </section>
  );

  const renderUserStories = () => (
    <section className="bg-white rounded-2xl shadow-sm border border-purple-200 p-4 sm:p-5">
      <h2 className="text-xl font-bold text-purple-900 mb-4">Epic, Stories, Tasks and Acceptance Criteria</h2>

      <div className="rounded-xl border border-purple-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[170px_1fr] border-b border-purple-200 bg-purple-100/70">
          <div className="px-3 py-3 text-sm font-bold text-purple-900 md:border-r md:border-purple-200">Epic</div>
          <div className="bg-white p-3">
            <textarea
              rows={3}
              value={formData.userStories.epic}
              onChange={(e) => handleUserStoriesField("epic", e.target.value)}
              className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              placeholder="As a ..., I want to ..., so that ..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[170px_1fr] border-b border-purple-200 bg-violet-50/80">
          <div className="px-3 py-3 text-sm font-bold text-purple-900 md:border-r md:border-purple-200">Stories</div>
          <div className="bg-white p-3 space-y-2">
            {formData.userStories.stories.map((story, index) => (
              <div key={`story-line-${index}`} className="grid grid-cols-[78px_1fr] gap-2 items-center">
                <span className="text-xs font-semibold text-gray-700">Story {index + 1}:</span>
                <input
                  type="text"
                  value={story}
                  onChange={(e) => handleUserStoriesListField("stories", index, e.target.value)}
                  className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm"
                  placeholder={`Enter Story ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[170px_1fr] border-b border-purple-200 bg-emerald-50/80">
          <div className="px-3 py-3 text-sm font-bold text-purple-900 md:border-r md:border-purple-200">Tasks</div>
          <div className="bg-white p-3 space-y-2">
            {formData.userStories.tasks.map((task, index) => (
              <div key={`task-line-${index}`} className="grid grid-cols-[78px_1fr] gap-2 items-center">
                <span className="text-xs font-semibold text-gray-700">Task {index + 1}:</span>
                <input
                  type="text"
                  value={task}
                  onChange={(e) => handleUserStoriesListField("tasks", index, e.target.value)}
                  className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm"
                  placeholder={`Enter Task ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[170px_1fr] bg-amber-50/80">
          <div className="px-3 py-3 text-sm font-bold text-purple-900 md:border-r md:border-purple-200">
            Acceptance Criteria
          </div>
          <div className="bg-white p-3 space-y-2">
            {formData.userStories.acceptanceCriteria.map((criteria, index) => (
              <div key={`criteria-line-${index}`} className="grid grid-cols-[34px_1fr] gap-2 items-center">
                <span className="text-xs font-semibold text-gray-700">{index + 1}.</span>
                <input
                  type="text"
                  value={criteria}
                  onChange={(e) =>
                    handleUserStoriesListField("acceptanceCriteria", index, e.target.value)
                  }
                  className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm"
                  placeholder={`Acceptance criteria ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const renderSprintPlanning = () => (
    <section className="bg-white rounded-2xl shadow-sm border border-purple-200 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-purple-900">Sprint Planning</h2>
        <button
          type="button"
          onClick={() => addListItem("sprintPlanning", createSprintItem(formData.sprintPlanning.length))}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-semibold hover:bg-purple-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Sprint
        </button>
      </div>

      <div className="space-y-3">
        {formData.sprintPlanning.map((sprint, index) => (
          <div key={`sprint-${index}`} className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 sm:p-4">
            <p className="text-xs font-semibold text-purple-700 mb-3">Sr. No. {index + 1}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={sprint.sprintName}
                onChange={(e) => handleListFieldChange("sprintPlanning", index, "sprintName", e.target.value)}
                className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                placeholder="Sprint name"
              />
              <select
                value={sprint.status}
                onChange={(e) => handleListFieldChange("sprintPlanning", index, "status", e.target.value)}
                className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
              >
                <option>Upcoming</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
              <input
                type="date"
                value={sprint.startDate}
                onChange={(e) => handleListFieldChange("sprintPlanning", index, "startDate", e.target.value)}
                className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
              />
              <input
                type="date"
                value={sprint.endDate}
                onChange={(e) => handleListFieldChange("sprintPlanning", index, "endDate", e.target.value)}
                className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
              />
              <textarea
                rows={2}
                value={sprint.objective}
                onChange={(e) => handleListFieldChange("sprintPlanning", index, "objective", e.target.value)}
                className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm md:col-span-2"
                placeholder="Sprint objective and deliverables"
              />
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => removeListItem("sprintPlanning", index, 4)}
                disabled={formData.sprintPlanning.length <= 4}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  formData.sprintPlanning.length <= 4
                    ? "text-red-400 bg-red-50/70 cursor-not-allowed"
                    : "text-red-600 bg-red-50 hover:bg-red-100"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderPublications = () => (
    <section className="bg-white rounded-2xl shadow-sm border border-purple-200 p-4 sm:p-5">
      <h2 className="text-xl font-bold text-purple-900 mb-4">Publication Details</h2>

      <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs sm:text-sm text-purple-800">
        Upload proof files for each entry (PDF/Image/Doc). For TY/LY groups, at least one paper publication entry is compulsory.
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-bold text-purple-900">Publication Details</h3>
            <button
              type="button"
              onClick={() => addListItem("publicationDetails", createPublicationDetailItem())}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-semibold hover:bg-purple-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Publication
            </button>
          </div>

          <div className="space-y-3">
            {formData.publicationDetails.map((item, index) => (
              <div key={`publication-${index}`} className="rounded-xl border border-purple-100 bg-white p-3 sm:p-4">
                <p className="text-xs font-semibold text-purple-700 mb-3">Sr. No. {index + 1}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={item.paperTitle}
                    onChange={(e) =>
                      handleListFieldChange("publicationDetails", index, "paperTitle", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Paper Title"
                  />
                  <input
                    type="text"
                    value={item.journalName}
                    onChange={(e) =>
                      handleListFieldChange("publicationDetails", index, "journalName", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Name of Journal"
                  />
                  <input
                    type="number"
                    value={item.year}
                    onChange={(e) =>
                      handleListFieldChange("publicationDetails", index, "year", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Year"
                  />
                  <input
                    type="text"
                    value={item.authors}
                    onChange={(e) =>
                      handleListFieldChange("publicationDetails", index, "authors", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Authors"
                  />
                  <input
                    type="url"
                    value={item.url}
                    onChange={(e) =>
                      handleListFieldChange("publicationDetails", index, "url", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="URL"
                  />
                  <input
                    type="text"
                    value={item.doi}
                    onChange={(e) =>
                      handleListFieldChange("publicationDetails", index, "doi", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="DOI"
                  />
                  <input
                    type="text"
                    value={item.volume}
                    onChange={(e) =>
                      handleListFieldChange("publicationDetails", index, "volume", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Volume"
                  />
                  <input
                    type="text"
                    value={item.pageNo}
                    onChange={(e) =>
                      handleListFieldChange("publicationDetails", index, "pageNo", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Page no."
                  />
                  <input
                    type="text"
                    value={item.publisher}
                    onChange={(e) =>
                      handleListFieldChange("publicationDetails", index, "publisher", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Publisher"
                  />
                  <div className="md:col-span-2 xl:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Proof Upload</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) =>
                        handleProofFileChange("publicationDetails", index, e.target.files?.[0])
                      }
                      className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-purple-100 file:px-3 file:py-1.5 file:text-purple-700"
                    />
                    {item.proofFileName ? (
                      <p className="mt-1 text-xs text-purple-700">Selected: {item.proofFileName}</p>
                    ) : null}
                    {item.proofUrl ? (
                      <a
                        href={item.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-purple-700 underline"
                      >
                        View uploaded proof
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeListItem("publicationDetails", index, 1)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-bold text-purple-900">Patent Details</h3>
            <button
              type="button"
              onClick={() => addListItem("patentDetails", createPatentDetailItem())}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-semibold hover:bg-purple-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Patent
            </button>
          </div>

          <div className="space-y-3">
            {formData.patentDetails.map((item, index) => (
              <div key={`patent-${index}`} className="rounded-xl border border-purple-100 bg-white p-3 sm:p-4">
                <p className="text-xs font-semibold text-purple-700 mb-3">Sr. No. {index + 1}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleListFieldChange("patentDetails", index, "title", e.target.value)}
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Title"
                  />
                  <input
                    type="text"
                    value={item.inventors}
                    onChange={(e) =>
                      handleListFieldChange("patentDetails", index, "inventors", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Inventors"
                  />
                  <input
                    type="text"
                    value={item.applicationNo}
                    onChange={(e) =>
                      handleListFieldChange("patentDetails", index, "applicationNo", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Application No."
                  />
                  <input
                    type="text"
                    value={item.patentNumber}
                    onChange={(e) =>
                      handleListFieldChange("patentDetails", index, "patentNumber", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Patent Number"
                  />
                  <input
                    type="text"
                    value={item.filingCountry}
                    onChange={(e) =>
                      handleListFieldChange("patentDetails", index, "filingCountry", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Filing Country"
                  />
                  <input
                    type="text"
                    value={item.subjectCategory}
                    onChange={(e) =>
                      handleListFieldChange("patentDetails", index, "subjectCategory", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Subject Category"
                  />
                  <input
                    type="date"
                    value={item.filingDate}
                    onChange={(e) =>
                      handleListFieldChange("patentDetails", index, "filingDate", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                  />
                  <input
                    type="date"
                    value={item.publicationDate}
                    onChange={(e) =>
                      handleListFieldChange("patentDetails", index, "publicationDate", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                  />
                  <input
                    type="text"
                    value={item.publicationStatus}
                    onChange={(e) =>
                      handleListFieldChange("patentDetails", index, "publicationStatus", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Publication Status"
                  />
                  <div className="md:col-span-2 xl:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Proof Upload</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) => handleProofFileChange("patentDetails", index, e.target.files?.[0])}
                      className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-purple-100 file:px-3 file:py-1.5 file:text-purple-700"
                    />
                    {item.proofFileName ? (
                      <p className="mt-1 text-xs text-purple-700">Selected: {item.proofFileName}</p>
                    ) : null}
                    {item.proofUrl ? (
                      <a
                        href={item.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-purple-700 underline"
                      >
                        View uploaded proof
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeListItem("patentDetails", index, 1)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-bold text-purple-900">Copyright Details</h3>
            <button
              type="button"
              onClick={() => addListItem("copyrightDetails", createCopyrightDetailItem())}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-semibold hover:bg-purple-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Copyright
            </button>
          </div>

          <div className="space-y-3">
            {formData.copyrightDetails.map((item, index) => (
              <div key={`copyright-${index}`} className="rounded-xl border border-purple-100 bg-white p-3 sm:p-4">
                <p className="text-xs font-semibold text-purple-700 mb-3">Sr. No. {index + 1}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={item.titleOfWork}
                    onChange={(e) =>
                      handleListFieldChange("copyrightDetails", index, "titleOfWork", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Title of work"
                  />
                  <input
                    type="text"
                    value={item.nameOfApplicants}
                    onChange={(e) =>
                      handleListFieldChange("copyrightDetails", index, "nameOfApplicants", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Name of Applicants"
                  />
                  <input
                    type="text"
                    value={item.registrationNo}
                    onChange={(e) =>
                      handleListFieldChange("copyrightDetails", index, "registrationNo", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Registration No."
                  />
                  <input
                    type="text"
                    value={item.dairyNumber}
                    onChange={(e) =>
                      handleListFieldChange("copyrightDetails", index, "dairyNumber", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Dairy Number"
                  />
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => handleListFieldChange("copyrightDetails", index, "date", e.target.value)}
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                  />
                  <input
                    type="text"
                    value={item.status}
                    onChange={(e) => handleListFieldChange("copyrightDetails", index, "status", e.target.value)}
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Status"
                  />
                  <div className="md:col-span-2 xl:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Proof Upload</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) =>
                        handleProofFileChange("copyrightDetails", index, e.target.files?.[0])
                      }
                      className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-purple-100 file:px-3 file:py-1.5 file:text-purple-700"
                    />
                    {item.proofFileName ? (
                      <p className="mt-1 text-xs text-purple-700">Selected: {item.proofFileName}</p>
                    ) : null}
                    {item.proofUrl ? (
                      <a
                        href={item.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-purple-700 underline"
                      >
                        View uploaded proof
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeListItem("copyrightDetails", index, 1)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-bold text-purple-900">Event and Participations Details</h3>
            <button
              type="button"
              onClick={() => addListItem("eventParticipationDetails", createEventParticipationItem())}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-semibold hover:bg-purple-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>

          <div className="space-y-3">
            {formData.eventParticipationDetails.map((item, index) => (
              <div key={`event-${index}`} className="rounded-xl border border-purple-100 bg-white p-3 sm:p-4">
                <p className="text-xs font-semibold text-purple-700 mb-3">Sr. No. {index + 1}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={item.nameOfEvent}
                    onChange={(e) =>
                      handleListFieldChange("eventParticipationDetails", index, "nameOfEvent", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Name of Event"
                  />
                  <select
                    value={item.typeOfEvent}
                    onChange={(e) =>
                      handleListFieldChange("eventParticipationDetails", index, "typeOfEvent", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                  >
                    <option value="Institute">Institute</option>
                    <option value="University">University</option>
                    <option value="State">State</option>
                    <option value="National">National</option>
                    <option value="International">International</option>
                  </select>
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) =>
                      handleListFieldChange("eventParticipationDetails", index, "date", e.target.value)
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                  />
                  <input
                    type="text"
                    value={item.typeOfParticipation}
                    onChange={(e) =>
                      handleListFieldChange(
                        "eventParticipationDetails",
                        index,
                        "typeOfParticipation",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                    placeholder="Type of Participation"
                  />
                  <textarea
                    rows={2}
                    value={item.detailsOfPrizeWon}
                    onChange={(e) =>
                      handleListFieldChange(
                        "eventParticipationDetails",
                        index,
                        "detailsOfPrizeWon",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm md:col-span-2 xl:col-span-2"
                    placeholder="Details of Prize won"
                  />
                  <div className="md:col-span-2 xl:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Proof Upload</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e) =>
                        handleProofFileChange(
                          "eventParticipationDetails",
                          index,
                          e.target.files?.[0]
                        )
                      }
                      className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-purple-100 file:px-3 file:py-1.5 file:text-purple-700"
                    />
                    {item.proofFileName ? (
                      <p className="mt-1 text-xs text-purple-700">Selected: {item.proofFileName}</p>
                    ) : null}
                    {item.proofUrl ? (
                      <a
                        href={item.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-medium text-purple-700 underline"
                      >
                        View uploaded proof
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeListItem("eventParticipationDetails", index, 1)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const renderMeetings = () => (
    <section className="bg-white rounded-2xl shadow-sm border border-purple-200 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-purple-900">Meetings</h2>
        <button
          type="button"
          onClick={() => addListItem("meetings", createMeetingItem())}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-semibold hover:bg-purple-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Meeting
        </button>
      </div>

      <div className="space-y-3">
        {formData.meetings.map((meeting, index) => (
          <div key={`meeting-${index}`} className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 sm:p-4">
            <p className="text-xs font-semibold text-purple-700 mb-3">Sr. No. {index + 1}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="date"
                value={meeting.meetingDate}
                onChange={(e) => handleListFieldChange("meetings", index, "meetingDate", e.target.value)}
                className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
              />
              <input
                type="text"
                value={meeting.attendees}
                onChange={(e) => handleListFieldChange("meetings", index, "attendees", e.target.value)}
                className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm"
                placeholder="Attendees"
              />
              <textarea
                rows={2}
                value={meeting.agenda}
                onChange={(e) => handleListFieldChange("meetings", index, "agenda", e.target.value)}
                className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm md:col-span-2"
                placeholder="Meeting agenda"
              />
              <textarea
                rows={2}
                value={meeting.decisions}
                onChange={(e) => handleListFieldChange("meetings", index, "decisions", e.target.value)}
                className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm md:col-span-2"
                placeholder="Key decisions"
              />
              <textarea
                rows={2}
                value={meeting.nextSteps}
                onChange={(e) => handleListFieldChange("meetings", index, "nextSteps", e.target.value)}
                className="w-full rounded-lg border border-purple-200 px-3 py-2.5 text-sm md:col-span-2"
                placeholder="Next action items"
              />
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => removeListItem("meetings", index, 12)}
                disabled={formData.meetings.length <= 12}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  formData.meetings.length <= 12
                    ? "text-red-400 bg-red-50/70 cursor-not-allowed"
                    : "text-red-600 bg-red-50 hover:bg-red-100"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderActiveSection = () => {
    if (activeTab === "project-info") return renderProjectInfo();
    if (activeTab === "tech") return renderTechStack();
    if (activeTab === "stories") return renderUserStories();
    if (activeTab === "sprints") return renderSprintPlanning();
    if (activeTab === "publications") return renderPublications();
    return renderMeetings();
  };

  if (loading) {
    return <Loading message="Loading tracker sheet" />;
  }

  return (
    <div className="font-[Poppins] bg-purple-50/40 flex flex-col min-h-screen overflow-x-hidden">
      <Header
        name={student?.name_of_student || student?.name_of_students || student?.name || "Student"}
        id={student?.enrollment_no || "----"}
      />

      <div className="flex flex-1 flex-col lg:flex-row mt-[72px]">
        <Sidebar />

        <main className="flex-1 lg:flex-none lg:w-[calc(100%-272px)] px-3 sm:px-4 md:px-6 py-5 bg-purple-50/40 lg:ml-[272px] mb-24 lg:mb-0 overflow-x-hidden">
          <div className="w-full space-y-6 sm:space-y-7">
            <div className="bg-white rounded-2xl shadow-sm border border-purple-200 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-purple-100 rounded-xl">
                    <ClipboardList className="w-6 h-6 text-purple-700" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-purple-900">Tracker Sheet</h1>
                  </div>
                </div>
              </div>

              <div
                className={`mt-4 rounded-xl border px-4 py-3 ${submissionStateMeta.cardClass}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className={`text-sm font-semibold ${submissionStateMeta.titleClass}`}>
                    Approval Status
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${submissionStateMeta.badgeClass}`}
                  >
                    {getSubmissionStateLabel(submissionState)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{approvalStatusDescription}</p>

                {submissionState === "rejected" && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-800">
                    <p className="font-semibold">Mentor Feedback</p>
                    <p className="mt-1">{mentorFeedback || "No feedback provided by mentor."}</p>
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50/70 p-2 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  {sectionTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                        activeTab === tab.id
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-white text-purple-700 border border-purple-200 hover:bg-purple-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {statusMessage.text && (
                <div
                  className={`mt-4 rounded-xl px-4 py-3 border text-sm font-medium flex items-center gap-2 ${
                    statusMessage.type === "success"
                      ? "bg-purple-50 border-purple-200 text-purple-800"
                      : statusMessage.type === "warning"
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {statusMessage.text}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {renderActiveSection()}

              <div className="bg-white rounded-2xl shadow-sm border border-purple-200 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <div className="relative w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        if (!saving && !pdfGenerating) {
                          setShowDownloadOptions((prev) => !prev);
                        }
                      }}
                      disabled={saving || pdfGenerating}
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border font-semibold transition-colors ${
                        saving || pdfGenerating
                          ? "bg-purple-100 text-purple-400 border-purple-200 cursor-not-allowed"
                          : "bg-white text-purple-700 border-purple-300 hover:bg-purple-50"
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      {pdfGenerating ? "Generating PDF..." : "Download PDF"}
                      {!pdfGenerating && <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showDownloadOptions && !saving && !pdfGenerating && (
                      <div className="absolute right-0 bottom-full mb-2 z-20 w-48 rounded-xl border border-purple-200 bg-white shadow-lg p-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadUnifiedPdf("preview")}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-purple-800 hover:bg-purple-50 inline-flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadUnifiedPdf("download")}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-purple-800 hover:bg-purple-50 inline-flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Direct Download
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={saving || pdfGenerating}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border font-semibold transition-colors ${
                      saving || pdfGenerating
                        ? "bg-purple-100 text-purple-400 border-purple-200 cursor-not-allowed"
                        : "bg-white text-purple-700 border-purple-300 hover:bg-purple-50"
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Draft"}
                  </button>
                  <button
                    type="submit"
                    disabled={saving || pdfGenerating || isTrackerSubmitLocked}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors shadow-sm font-semibold ${
                      saving || pdfGenerating || isTrackerSubmitLocked
                        ? "bg-purple-300 text-white cursor-not-allowed"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {saving ? "Submitting..." : isTrackerSubmitLocked ? "Approved" : "Submit Tracker"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TrackerSheet;
