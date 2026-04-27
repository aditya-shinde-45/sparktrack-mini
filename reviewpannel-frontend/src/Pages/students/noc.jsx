import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Student/Header";
import Sidebar from "../../Components/Student/sidebar";
import Loading from "../../Components/Common/loading";
import { apiRequest } from "../../api";
import {
  FileCheck,
  Save,
  Send,
  Download,
  Eye,
  ChevronDown,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { generateNocPdfBlob } from "../../utils/nocPdf";
import { openPdfPreviewWindow, downloadPdfBlob } from "../../utils/trackerSheetPdf";

const DOCUMENT_IDS = {
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

const LEGACY_COMBINED_DOCUMENT_ID = "ip_patent_publication";

const LINKED_DOCUMENT_IDS = new Set([
  DOCUMENT_IDS.COPYRIGHT,
  DOCUMENT_IDS.PATENT,
  DOCUMENT_IDS.PUBLICATION,
  DOCUMENT_IDS.ACHIEVEMENTS,
]);

const MAX_LINKED_ITEMS = 2;
const MAX_UPLOAD_SIZE_MB = 10;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

const DEFAULT_ALLOWED_FILE_EXTENSIONS = [".pdf", ".doc", ".docx"];
const PPT_ALLOWED_FILE_EXTENSIONS = [".ppt", ".pptx"];

const FIELD_LIMITS = {
  SHORT: 100,
  MEDIUM: 150,
  LONG: 250,
  URL: 300,
  NOTE: 500,
  YEAR: 4,
};

const getFileExtension = (fileName = "") => {
  const index = String(fileName).lastIndexOf(".");
  if (index < 0) return "";
  return String(fileName).slice(index).toLowerCase();
};

const getAllowedExtensionsForDocument = (documentId) =>
  documentId === DOCUMENT_IDS.PPT
    ? PPT_ALLOWED_FILE_EXTENSIONS
    : DEFAULT_ALLOWED_FILE_EXTENSIONS;

const getAcceptTypesForDocument = (documentId) =>
  getAllowedExtensionsForDocument(documentId).join(",");

const isAllowedFileType = (file, allowedExtensions) => {
  const extension = getFileExtension(file?.name || "");
  return allowedExtensions.includes(extension);
};

const buildUploadRuleLabel = (allowedExtensions) =>
  `${allowedExtensions.map((ext) => ext.replace(".", "").toUpperCase()).join(", ")} | Max ${MAX_UPLOAD_SIZE_MB}MB`;

const validateSelectedFile = (file, allowedExtensions) => {
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

const DEFAULT_DOCUMENTS = [
  {
    id: DOCUMENT_IDS.TRACKER,
    name: "Project Tracker Sheet (fully updated)",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: DOCUMENT_IDS.SYNOPSIS,
    name: "Project Synopsis",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: DOCUMENT_IDS.FINAL_REPORT,
    name: "Final Project report / Success story (for internship)",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: DOCUMENT_IDS.COPYRIGHT,
    name: "Copyright Details",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: DOCUMENT_IDS.PATENT,
    name: "Patent Details",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: DOCUMENT_IDS.PUBLICATION,
    name: "Research Publication Details",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: DOCUMENT_IDS.PPT,
    name: "Project Presentation PPT",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: DOCUMENT_IDS.ACHIEVEMENTS,
    name: "Achievements",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: DOCUMENT_IDS.INTERNSHIP,
    name: "Internship joining report & Completion Report (If any)",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
];

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

const createInitialNocForm = () => ({
  certificateDate: "",
  concludingRemark: "",
  guideSignatureName: "",
  documents: DEFAULT_DOCUMENTS.map((doc) => ({ ...doc })),
  publicationDetails: [createPublicationDetailItem()],
  patentDetails: [createPatentDetailItem()],
  copyrightDetails: [createCopyrightDetailItem()],
  eventParticipationDetails: [createEventParticipationItem()],
  sharedDetailsUpdatedAt: null,
});

const asText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const hasValue = (value) => asText(value).length > 0;

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const ensureMinimumItems = (list, minimum, createItem) => {
  const safeList = ensureArray(list);

  if (safeList.length >= minimum) return safeList;

  return [
    ...safeList,
    ...Array.from({ length: minimum - safeList.length }, (_, index) =>
      createItem(safeList.length + index)
    ),
  ];
};

const deriveGroupYear = (groupId = "") => {
  const normalized = String(groupId || "").toUpperCase();
  if (normalized.startsWith("SY")) return "SY";
  if (normalized.startsWith("TY")) return "TY";
  if (normalized.startsWith("LY")) return "LY";
  return "";
};

const hasMeaningfulPublicationEntry = (item = {}) =>
  Boolean(
    asText(item?.paperTitle) ||
      asText(item?.journalName) ||
      asText(item?.status) ||
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
      asText(item?.status) ||
      asText(item?.proofUrl) ||
      asText(item?.proofKey) ||
      asText(item?.proofFileName)
  );

const hasMeaningfulCopyrightEntry = (item = {}) =>
  Boolean(
    asText(item?.titleOfWork) ||
      asText(item?.registrationNo) ||
      asText(item?.nameOfApplicants) ||
      asText(item?.status) ||
      asText(item?.proofUrl) ||
      asText(item?.proofKey) ||
      asText(item?.proofFileName)
  );

const hasMeaningfulEventEntry = (item = {}) =>
  Boolean(
    asText(item?.nameOfEvent) ||
      asText(item?.typeOfParticipation) ||
      asText(item?.detailsOfPrizeWon) ||
      asText(item?.status) ||
      asText(item?.proofUrl) ||
      asText(item?.proofKey) ||
      asText(item?.proofFileName)
  );

const hasAnySharedDetails = (payload = {}) =>
  ensureArray(payload?.publicationDetails).some(hasMeaningfulPublicationEntry) ||
  ensureArray(payload?.patentDetails).some(hasMeaningfulPatentEntry) ||
  ensureArray(payload?.copyrightDetails).some(hasMeaningfulCopyrightEntry) ||
  ensureArray(payload?.eventParticipationDetails).some(hasMeaningfulEventEntry);

const parseTimestamp = (value) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const mergeSharedRowsPreservingProof = (baseRows = [], incomingRows = []) => {
  const safeBaseRows = ensureArray(baseRows);
  const safeIncomingRows = ensureArray(incomingRows);
  const rowCount = Math.max(safeBaseRows.length, safeIncomingRows.length, 1);

  return Array.from({ length: rowCount }, (_, index) => {
    const baseRow = safeBaseRows[index] && typeof safeBaseRows[index] === "object" ? safeBaseRows[index] : {};
    const incomingRow =
      safeIncomingRows[index] && typeof safeIncomingRows[index] === "object" ? safeIncomingRows[index] : {};

    return {
      ...baseRow,
      ...incomingRow,
      proofFileName: asText(incomingRow?.proofFileName) || asText(baseRow?.proofFileName),
      proofUrl: asText(incomingRow?.proofUrl) || asText(baseRow?.proofUrl),
      proofKey: asText(incomingRow?.proofKey) || asText(baseRow?.proofKey),
    };
  }).slice(0, MAX_LINKED_ITEMS);
};

const normalizeNocDraft = (draftData) => {
  const parsedDraft = draftData && typeof draftData === "object" ? draftData : {};
  const incomingDocuments = Array.isArray(parsedDraft.documents) ? parsedDraft.documents : [];

  const incomingById = new Map();

  incomingDocuments.forEach((doc, index) => {
    if (!doc || typeof doc !== "object") return;
    const fallbackId = DEFAULT_DOCUMENTS[index]?.id;
    const id = asText(doc.id || fallbackId);
    if (!id) return;
    incomingById.set(id, doc);
  });

  const legacyCombinedDoc = incomingById.get(LEGACY_COMBINED_DOCUMENT_ID);
  if (legacyCombinedDoc) {
    [DOCUMENT_IDS.COPYRIGHT, DOCUMENT_IDS.PATENT, DOCUMENT_IDS.PUBLICATION].forEach((id) => {
      if (!incomingById.has(id)) {
        incomingById.set(id, legacyCombinedDoc);
      }
    });
  }

  return {
    ...createInitialNocForm(),
    ...parsedDraft,
    certificateDate: asText(parsedDraft.certificateDate),
    concludingRemark: asText(parsedDraft.concludingRemark),
    guideSignatureName: asText(parsedDraft.guideSignatureName),
    documents: DEFAULT_DOCUMENTS.map((defaultDoc) => {
      const incoming = incomingById.get(defaultDoc.id) || {};
      const proofUrl = asText(incoming.proofUrl);

      return {
        ...defaultDoc,
        ...incoming,
        id: defaultDoc.id,
        name: defaultDoc.name,
        status: asText(incoming.status) || (proofUrl ? "Submitted" : ""),
        proofFileName: asText(incoming.proofFileName),
        proofUrl,
        proofKey: asText(incoming.proofKey),
      };
    }),
    publicationDetails: ensureMinimumItems(
      parsedDraft?.publicationDetails,
      1,
      createPublicationDetailItem
    )
      .slice(0, MAX_LINKED_ITEMS)
      .map((item) => ({
      ...createPublicationDetailItem(),
      ...(item || {}),
    })),
    patentDetails: ensureMinimumItems(parsedDraft?.patentDetails, 1, createPatentDetailItem)
      .slice(0, MAX_LINKED_ITEMS)
      .map((item) => ({
        ...createPatentDetailItem(),
        ...(item || {}),
      })),
    copyrightDetails: ensureMinimumItems(
      parsedDraft?.copyrightDetails,
      1,
      createCopyrightDetailItem
    )
      .slice(0, MAX_LINKED_ITEMS)
      .map((item) => ({
      ...createCopyrightDetailItem(),
      ...(item || {}),
    })),
    eventParticipationDetails: ensureMinimumItems(
      parsedDraft?.eventParticipationDetails,
      1,
      createEventParticipationItem
    )
      .slice(0, MAX_LINKED_ITEMS)
      .map((item) => ({
      ...createEventParticipationItem(),
      ...(item || {}),
    })),
    sharedDetailsUpdatedAt: parsedDraft?.sharedDetailsUpdatedAt || null,
  };
};

const createNocSnapshot = (payload) => JSON.stringify(normalizeNocDraft(payload));

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

const buildAchievementsSummaryFromEvents = (eventRows = []) => {
  const parts = ensureArray(eventRows)
    .map((item) => asText(item?.nameOfEvent || item?.detailsOfPrizeWon))
    .filter(Boolean)
    .slice(0, 6);

  return parts.join("; ");
};

const getFirstProofFromRows = (rows = []) => {
  const match = ensureArray(rows).find(
    (item) =>
      hasValue(item?.proofUrl) || hasValue(item?.proofKey) || hasValue(item?.proofFileName)
  );

  if (!match) return null;

  return {
    fileName: asText(match?.proofFileName),
    url: asText(match?.proofUrl),
    key: asText(match?.proofKey),
  };
};

const applyLinkedDocumentStatuses = (payload) => {
  const normalized = normalizeNocDraft(payload);

  const hasPublication = normalized.publicationDetails.some(hasMeaningfulPublicationEntry);
  const hasPatent = normalized.patentDetails.some(hasMeaningfulPatentEntry);
  const hasCopyright = normalized.copyrightDetails.some(hasMeaningfulCopyrightEntry);
  const hasAchievements = normalized.eventParticipationDetails.some(hasMeaningfulEventEntry);

  const publicationProof = getFirstProofFromRows(normalized.publicationDetails);
  const patentProof = getFirstProofFromRows(normalized.patentDetails);
  const copyrightProof = getFirstProofFromRows(normalized.copyrightDetails);
  const achievementsProof = getFirstProofFromRows(normalized.eventParticipationDetails);

  const statusById = {
    [DOCUMENT_IDS.PUBLICATION]: hasPublication,
    [DOCUMENT_IDS.PATENT]: hasPatent,
    [DOCUMENT_IDS.COPYRIGHT]: hasCopyright,
    [DOCUMENT_IDS.ACHIEVEMENTS]: hasAchievements,
  };

  const proofById = {
    [DOCUMENT_IDS.PUBLICATION]: publicationProof,
    [DOCUMENT_IDS.PATENT]: patentProof,
    [DOCUMENT_IDS.COPYRIGHT]: copyrightProof,
    [DOCUMENT_IDS.ACHIEVEMENTS]: achievementsProof,
  };

  const nextDocuments = normalized.documents.map((doc) => {
    if (!LINKED_DOCUMENT_IDS.has(doc.id)) {
      return doc;
    }

    const hasLinkedValue = statusById[doc.id];
    const linkedProof = proofById[doc.id];

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
      proofFileName: linkedProof?.fileName || "",
      proofUrl: linkedProof?.url || "",
      proofKey: linkedProof?.key || "",
    };
  });

  return {
    ...normalized,
    documents: nextDocuments,
  };
};

const SUBMISSION_STATE_LABELS = {
  draft: "Draft",
  pending_mentor_approval: "Pending mentor approval",
  approved: "Approved by mentor",
  rejected: "Rejected by mentor",
};

const getSubmissionStateLabel = (state) =>
  SUBMISSION_STATE_LABELS[state] || SUBMISSION_STATE_LABELS.draft;

const SUBMISSION_STATE_META = {
  draft: {
    cardClass: "border-slate-200 bg-slate-50",
    badgeClass: "bg-slate-100 text-slate-700",
    titleClass: "text-slate-800",
    description: "You can edit and submit your form when ready.",
  },
  pending_mentor_approval: {
    cardClass: "border-amber-200 bg-amber-50",
    badgeClass: "bg-amber-100 text-amber-800",
    titleClass: "text-amber-900",
    description: "Your submission is sent to mentor and waiting for review.",
  },
  approved: {
    cardClass: "border-emerald-200 bg-emerald-50",
    badgeClass: "bg-emerald-100 text-emerald-800",
    titleClass: "text-emerald-900",
    description: "Mentor approved your submission.",
  },
  rejected: {
    cardClass: "border-red-200 bg-red-50",
    badgeClass: "bg-red-100 text-red-800",
    titleClass: "text-red-900",
    description: "Mentor requested updates before approval.",
  },
};

const getSubmissionStateMeta = (state) => SUBMISSION_STATE_META[state] || SUBMISSION_STATE_META.draft;

const getNocDraftStorageKey = (enrollmentNo = "") =>
  `student_noc_draft_${asText(enrollmentNo).toUpperCase() || "UNKNOWN"}`;

const NocPage = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(createInitialNocForm());
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [groupId, setGroupId] = useState("");
  const [groupYear, setGroupYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [proofFiles, setProofFiles] = useState({});
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [submissionState, setSubmissionState] = useState("draft");
  const [lastPersistedSnapshot, setLastPersistedSnapshot] = useState(() =>
    createNocSnapshot(createInitialNocForm())
  );

  useEffect(() => {
    const token = localStorage.getItem("student_token") || localStorage.getItem("token");
    if (!token) {
      navigate("/studentlogin");
      return;
    }

    const fetchStudentAndNoc = async () => {
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

        const localDraftKey = getNocDraftStorageKey(profileData?.enrollment_no);
        let localDraft = null;
        try {
          const rawLocalDraft = localStorage.getItem(localDraftKey);
          const parsedLocalDraft = rawLocalDraft ? JSON.parse(rawLocalDraft) : null;
          if (parsedLocalDraft && typeof parsedLocalDraft === "object") {
            localDraft = parsedLocalDraft;
          }
        } catch (storageError) {
          console.warn("Unable to parse local NOC draft backup:", storageError);
        }

        let resolvedGroupId = "";

        try {
          const groupRes = await apiRequest(
            `/api/students/student/group-details/${profileData.enrollment_no}`,
            "GET",
            null,
            token
          );
          const groupData = groupRes?.data?.group || groupRes?.group || null;
          resolvedGroupId = groupData?.group_id || "";
          setGroupId(resolvedGroupId);
          setGroupYear(deriveGroupYear(resolvedGroupId));
        } catch (groupError) {
          console.warn("Unable to fetch group details for NOC form:", groupError);
        }

        let nextFormData = createInitialNocForm();
        let nextSubmissionState = "draft";
        let loadedNoc = false;
        let nocLoadErrorMessage = "";

        try {
          const nocRes = await apiRequest("/api/students/noc/me", "GET", null, token);

          if (!nocRes?.success) {
            throw new Error(nocRes?.message || "Unable to load NOC form");
          }

          const nocRecord = nocRes?.data?.noc || nocRes?.noc || null;
          const nocPayload = nocRecord?.payload || null;
          nextSubmissionState =
            nocRes?.data?.submissionState || nocRes?.submissionState || "draft";

          if (nocPayload && typeof nocPayload === "object") {
            nextFormData = normalizeNocDraft(nocPayload);
            loadedNoc = true;
          }

          const serverGroupId = nocRes?.data?.groupId || nocRes?.groupId || "";
          if (serverGroupId) {
            resolvedGroupId = serverGroupId;
            setGroupId(serverGroupId);
            setGroupYear(deriveGroupYear(serverGroupId));
          }
        } catch (nocError) {
          console.warn("Unable to load NOC form from backend:", nocError);
          nocLoadErrorMessage = asText(nocError?.message || "Unable to load NOC form from server.");
        }

        try {
          const trackerRes = await apiRequest("/api/students/tracker-sheet/me", "GET", null, token);

          if (!trackerRes?.success) {
            throw new Error(trackerRes?.message || "Unable to load tracker shared details");
          }

          const trackerPayload =
            trackerRes?.data?.tracker?.payload || trackerRes?.tracker?.payload || null;

          if (trackerPayload && typeof trackerPayload === "object") {
            const trackerHasShared = hasAnySharedDetails(trackerPayload);
            const nocHasShared = hasAnySharedDetails(nextFormData);
            const trackerStamp = parseTimestamp(trackerPayload?.sharedDetailsUpdatedAt);
            const nocStamp = parseTimestamp(nextFormData?.sharedDetailsUpdatedAt);

            if (trackerHasShared && (trackerStamp > nocStamp || !nocHasShared)) {
              nextFormData = normalizeNocDraft({
                ...nextFormData,
                publicationDetails: mergeSharedRowsPreservingProof(
                  nextFormData?.publicationDetails,
                  trackerPayload?.publicationDetails
                ),
                patentDetails: mergeSharedRowsPreservingProof(
                  nextFormData?.patentDetails,
                  trackerPayload?.patentDetails
                ),
                copyrightDetails: mergeSharedRowsPreservingProof(
                  nextFormData?.copyrightDetails,
                  trackerPayload?.copyrightDetails
                ),
                eventParticipationDetails: mergeSharedRowsPreservingProof(
                  nextFormData?.eventParticipationDetails,
                  trackerPayload?.eventParticipationDetails
                ),
                sharedDetailsUpdatedAt:
                  trackerPayload?.sharedDetailsUpdatedAt || nextFormData?.sharedDetailsUpdatedAt || null,
              });
            }
          }
        } catch (trackerError) {
          console.warn("Unable to load tracker shared details for NOC sync:", trackerError);
        }

        if (resolvedGroupId) {
          setGroupYear(deriveGroupYear(resolvedGroupId));
        }

        let infoMessage = loadedNoc ? "NOC form loaded from database." : "";
        if (localDraft?.formData && typeof localDraft.formData === "object") {
          const localDraftData = normalizeNocDraft(localDraft.formData);
          const serverStamp = parseTimestamp(nextFormData?.sharedDetailsUpdatedAt);
          const localStamp = parseTimestamp(localDraftData?.sharedDetailsUpdatedAt);

          if (!loadedNoc || localStamp > serverStamp) {
            nextFormData = localDraftData;
            infoMessage =
              "Recovered your latest unsynced NOC draft from this device. Please save once to sync with server.";
          }
        }

        setFormData(nextFormData);
        setLastPersistedSnapshot(createNocSnapshot(nextFormData));
        setSubmissionState(nextSubmissionState);

        if (infoMessage) {
          setStatusMessage({
            type: infoMessage.includes("Recovered") ? "warning" : "success",
            text: infoMessage,
          });
        } else if (nocLoadErrorMessage) {
          setStatusMessage({
            type: "warning",
            text: `${nocLoadErrorMessage} Showing latest available data.`,
          });
        }
      } catch (error) {
        console.error("Failed to load NOC form:", error);

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
            "Unable to load NOC from server right now. Your local draft (if any) is preserved.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAndNoc();
  }, [navigate]);

  useEffect(() => {
    if (loading || !student?.enrollment_no) return;

    try {
      const draftKey = getNocDraftStorageKey(student.enrollment_no);
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          formData: normalizeNocDraft(formData),
          submissionState,
          savedAt: new Date().toISOString(),
        })
      );
    } catch (storageError) {
      console.warn("Unable to cache NOC draft locally:", storageError);
    }
  }, [formData, submissionState, student?.enrollment_no, loading]);

  const getDocumentProofFileKey = (documentId) => `document::${documentId}`;
  const getSectionProofFileKey = (section, index) => `section::${section}::${index}`;

  const hasProofForSectionRow = (section, index, item = {}) => {
    const localFile = proofFiles[getSectionProofFileKey(section, index)];

    return Boolean(
      localFile || asText(item?.proofUrl) || asText(item?.proofKey) || asText(item?.proofFileName)
    );
  };

  const hasPublicationDetails = useMemo(
    () =>
      ensureArray(formData?.publicationDetails).some(
        (item, index) =>
          hasMeaningfulPublicationEntry(item) || hasProofForSectionRow("publicationDetails", index, item)
      ),
    [formData?.publicationDetails, proofFiles]
  );

  const hasPatentDetails = useMemo(
    () =>
      ensureArray(formData?.patentDetails).some(
        (item, index) => hasMeaningfulPatentEntry(item) || hasProofForSectionRow("patentDetails", index, item)
      ),
    [formData?.patentDetails, proofFiles]
  );

  const hasCopyrightDetails = useMemo(
    () =>
      ensureArray(formData?.copyrightDetails).some(
        (item, index) =>
          hasMeaningfulCopyrightEntry(item) || hasProofForSectionRow("copyrightDetails", index, item)
      ),
    [formData?.copyrightDetails, proofFiles]
  );

  const hasAchievementDetails = useMemo(
    () =>
      ensureArray(formData?.eventParticipationDetails).some(
        (item, index) =>
          hasMeaningfulEventEntry(item) || hasProofForSectionRow("eventParticipationDetails", index, item)
      ),
    [formData?.eventParticipationDetails, proofFiles]
  );

  const linkedStatusById = useMemo(
    () => ({
      [DOCUMENT_IDS.PUBLICATION]: hasPublicationDetails,
      [DOCUMENT_IDS.PATENT]: hasPatentDetails,
      [DOCUMENT_IDS.COPYRIGHT]: hasCopyrightDetails,
      [DOCUMENT_IDS.ACHIEVEMENTS]: hasAchievementDetails,
    }),
    [hasPublicationDetails, hasPatentDetails, hasCopyrightDetails, hasAchievementDetails]
  );

  const mentorFieldReviewsById = useMemo(() => {
    const fieldReviews = formData?.mentorReview?.fieldReviews;
    return fieldReviews && typeof fieldReviews === "object" ? fieldReviews : {};
  }, [formData?.mentorReview]);

  const getMentorFieldStatus = (documentId) => {
    const rawStatus = asText(mentorFieldReviewsById?.[documentId]?.status).toLowerCase();
    if (rawStatus === "approved") return "Approved";
    if (rawStatus === "rejected") return "Rejected";
    if (rawStatus === "pending") return "Pending";
    return "";
  };

  const getLinkedDocumentStatusLabel = (documentId) => {
    const isSubmitted = Boolean(linkedStatusById[documentId]);
    return isSubmitted ? "Submitted" : "Pending";
  };

  const hasDocumentProof = (documentId, documentData = {}) => {
    if (documentId === DOCUMENT_IDS.PUBLICATION) return hasPublicationDetails;
    if (documentId === DOCUMENT_IDS.PATENT) return hasPatentDetails;
    if (documentId === DOCUMENT_IDS.COPYRIGHT) return hasCopyrightDetails;
    if (documentId === DOCUMENT_IDS.ACHIEVEMENTS) return hasAchievementDetails;

    const localFile = proofFiles[getDocumentProofFileKey(documentId)];

    return Boolean(
      localFile ||
        asText(documentData?.proofUrl) ||
        asText(documentData?.proofKey) ||
        asText(documentData?.proofFileName)
    );
  };

  const nocAllFieldsFilled = useMemo(() => {
    const requiredDocuments = ensureArray(formData?.documents).filter(
      (doc) => doc.id !== DOCUMENT_IDS.PATENT
    );

    return (
      requiredDocuments.length > 0 &&
      requiredDocuments.every((doc) => hasDocumentProof(doc.id, doc))
    );
  }, [
    formData?.documents,
    proofFiles,
    hasPublicationDetails,
    hasPatentDetails,
    hasCopyrightDetails,
    hasAchievementDetails,
  ]);

  const isNocSubmitLocked = submissionState === "approved" && nocAllFieldsFilled;

  const handleProofFileChange = (documentId, event) => {
    if (LINKED_DOCUMENT_IDS.has(documentId)) {
      return;
    }

    const file = event?.target?.files?.[0];
    const allowedExtensions = getAllowedExtensionsForDocument(documentId);
    const validationMessage = validateSelectedFile(file, allowedExtensions);

    if (validationMessage) {
      if (event?.target) {
        event.target.value = "";
      }

      setStatusMessage({
        type: "error",
        text: `${validationMessage} (${buildUploadRuleLabel(allowedExtensions)})`,
      });
      return;
    }

    setProofFiles((prev) => {
      const key = getDocumentProofFileKey(documentId);

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

    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) => {
        if (doc.id !== documentId) return doc;

        return {
          ...doc,
          proofFileName: file?.name || "",
          proofUrl: file ? "" : doc.proofUrl || "",
          proofKey: file ? "" : doc.proofKey || "",
          status: file ? "" : doc.status || "",
        };
      }),
    }));
  };

  const handleSectionProofFileChange = (section, index, event) => {
    const file = event?.target?.files?.[0];
    const allowedExtensions = DEFAULT_ALLOWED_FILE_EXTENSIONS;
    const validationMessage = validateSelectedFile(file, allowedExtensions);

    if (validationMessage) {
      if (event?.target) {
        event.target.value = "";
      }

      setStatusMessage({
        type: "error",
        text: `${validationMessage} (${buildUploadRuleLabel(allowedExtensions)})`,
      });
      return;
    }

    setProofFiles((prev) => {
      const key = getSectionProofFileKey(section, index);

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

  const handleListFieldChange = (section, index, field, value) => {
    setFormData((prev) => {
      const nextSection = [...(prev[section] || [])];
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

  const addListItem = (section, itemTemplate) => {
    setFormData((prev) => ({
      ...prev,
      [section]: [...(prev[section] || []), { ...itemTemplate }],
    }));
  };

  const removeListItem = (section, index, minItems = 1) => {
    setFormData((prev) => {
      if ((prev[section] || []).length <= minItems) return prev;

      return {
        ...prev,
        [section]: prev[section].filter((_, itemIndex) => itemIndex !== index),
      };
    });

    setProofFiles((prev) => {
      const nextFiles = {};

      Object.entries(prev).forEach(([key, file]) => {
        const [entryType, sectionName, indexRaw] = key.split("::");

        if (entryType !== "section" || sectionName !== section) {
          nextFiles[key] = file;
          return;
        }

        const fileIndex = Number(indexRaw);
        if (Number.isNaN(fileIndex)) {
          nextFiles[key] = file;
          return;
        }

        if (fileIndex === index) {
          return;
        }

        const shiftedIndex = fileIndex > index ? fileIndex - 1 : fileIndex;
        nextFiles[getSectionProofFileKey(sectionName, shiftedIndex)] = file;
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

      const [entryType, firstPart, secondPart] = String(key).split("::");

      if (entryType === "document") {
        const documentId = firstPart;
        if (!documentId) {
          continue;
        }

        const form = new FormData();
        form.append("file", file);
        form.append("documentId", documentId);

        const uploadRes = await apiRequest(
          "/api/students/noc/proof",
          "POST",
          form,
          token,
          true,
          120000
        );

        if (!uploadRes?.success) {
          throw new Error(uploadRes?.message || "Failed to upload document");
        }

        const proof = uploadRes?.data?.proof || uploadRes?.proof || null;
        if (!proof) {
          continue;
        }

        const docIndex = nextPayload.documents.findIndex((doc) => doc.id === documentId);
        if (docIndex < 0) {
          continue;
        }

        nextPayload.documents[docIndex] = {
          ...nextPayload.documents[docIndex],
          proofFileName: proof.fileName || nextPayload.documents[docIndex]?.proofFileName || "",
          proofUrl: proof.url || "",
          proofKey: proof.key || "",
          status: "Submitted",
        };

        continue;
      }

      if (entryType === "section") {
        const section = firstPart;
        const index = Number(secondPart);

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
          throw new Error(uploadRes?.message || "Failed to upload linked proof file");
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
    }

    setProofFiles({});
    return nextPayload;
  };

  const syncSharedDetailsToTracker = async (token, sourceNocPayload) => {
    const trackerRes = await apiRequest("/api/students/tracker-sheet/me", "GET", null, token).catch(
      () => null
    );

    if (trackerRes && trackerRes.success === false) {
      throw new Error(trackerRes?.message || "Unable to load tracker sheet for shared-details sync");
    }

    const trackerPayload =
      trackerRes?.data?.tracker?.payload || trackerRes?.tracker?.payload || {};

    const safeTrackerPayload =
      trackerPayload && typeof trackerPayload === "object" ? trackerPayload : {};

    const existingProjectInfo =
      safeTrackerPayload?.projectInfo && typeof safeTrackerPayload.projectInfo === "object"
        ? safeTrackerPayload.projectInfo
        : {};

    const achievementsSummary = buildAchievementsSummaryFromEvents(
      sourceNocPayload?.eventParticipationDetails
    );

    const payloadToSync = {
      ...safeTrackerPayload,
      publicationDetails: sourceNocPayload?.publicationDetails || [],
      patentDetails: sourceNocPayload?.patentDetails || [],
      copyrightDetails: sourceNocPayload?.copyrightDetails || [],
      eventParticipationDetails: sourceNocPayload?.eventParticipationDetails || [],
      sharedDetailsUpdatedAt: sourceNocPayload?.sharedDetailsUpdatedAt || new Date().toISOString(),
      projectInfo: {
        ...existingProjectInfo,
        achievements: asText(existingProjectInfo?.achievements) || achievementsSummary,
      },
    };

    const syncRes = await apiRequest(
      "/api/students/tracker-sheet/me",
      "PUT",
      {
        formData: payloadToSync,
        submit: false,
      },
      token
    );

    if (!syncRes?.success) {
      throw new Error(syncRes?.message || "Unable to sync shared details to tracker");
    }
  };

  const persistNocForm = async (submit = false) => {
    if (!student || saving) return false;

    const token = localStorage.getItem("student_token") || localStorage.getItem("token");
    if (!token) {
      navigate("/studentlogin");
      return false;
    }

    setSaving(true);
    setStatusMessage({ type: "", text: "" });

    try {
      const normalizedDraft = normalizeNocDraft(formData);
      const draftWithTimestamp = {
        ...normalizedDraft,
        sharedDetailsUpdatedAt: new Date().toISOString(),
      };
      const draftWithUploadedProofs = await uploadPendingProofFiles(token, draftWithTimestamp);
      const payloadToPersist = applyLinkedDocumentStatuses(draftWithUploadedProofs);

      const saveRes = await apiRequest(
        "/api/students/noc/me",
        "PUT",
        {
          formData: payloadToPersist,
          submit,
        },
        token,
        false,
        submit ? 120000 : 60000
      );

      if (!saveRes?.success) {
        throw new Error(saveRes?.message || "Failed to save NOC form");
      }

      const nocRecord = saveRes?.data?.noc || saveRes?.noc || null;
      const persistedPayload = nocRecord?.payload || payloadToPersist;
      const normalizedPersistedPayload = normalizeNocDraft(persistedPayload);
      setFormData(normalizedPersistedPayload);
      setLastPersistedSnapshot(createNocSnapshot(normalizedPersistedPayload));
      setSubmissionState(
        saveRes?.data?.submissionState ||
          saveRes?.submissionState ||
          (submit ? "pending_mentor_approval" : "draft")
      );

      try {
        if (student?.enrollment_no) {
          const draftKey = getNocDraftStorageKey(student.enrollment_no);
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
        console.warn("Unable to refresh local NOC draft backup:", storageError);
      }

      let syncWarning = "";
      try {
        await syncSharedDetailsToTracker(token, normalizedPersistedPayload);
      } catch (syncError) {
        console.warn("Unable to sync NOC shared details to tracker:", syncError);
        syncWarning = "Shared publication details could not be synced to tracker right now.";
      }

      const successText =
        saveRes?.message ||
        (submit ? "NOC submitted to mentor for approval." : "NOC saved to database.");

      setStatusMessage({
        type: syncWarning ? "warning" : "success",
        text: syncWarning ? `${successText} ${syncWarning}` : successText,
      });

      return true;
    } catch (error) {
      console.error("NOC persistence failed:", error);
      const fallbackMessage =
        "Unable to submit NOC right now. Your entered data is preserved on this device. Please retry after a moment.";

      setStatusMessage({
        type: "error",
        text: error?.message || fallbackMessage,
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    await persistNocForm(false);
  };

  const handleDownloadNocPdf = async (mode = "preview") => {
    if (!student || saving || pdfGenerating) return;

    setShowDownloadOptions(false);

    const token = localStorage.getItem("student_token") || localStorage.getItem("token");
    if (!token) {
      navigate("/studentlogin");
      return;
    }

    let previewWindow = null;
    if (mode === "preview") {
      previewWindow = window.open("", "nocPdfPreview", "popup=yes,width=1100,height=800");
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
  <title>Preparing NOC PDF</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #f5f5f5; color: #1f2937; }
    .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); text-align: center; }
    .title { font-weight: 700; margin-bottom: 6px; }
    .subtitle { font-size: 14px; color: #4b5563; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Preparing NOC PDF</div>
    <div class="subtitle">Please wait...</div>
  </div>
</body>
</html>`);
      previewWindow.document.close();
    }

    setPdfGenerating(true);

    try {
      const [groupMetaResult, groupDetailsResult, previousGroupResult, nocResult] =
        await Promise.allSettled([
          apiRequest(
            `/api/students/student/group-details/${student.enrollment_no}`,
            "GET",
            null,
            token
          ),
          apiRequest(`/api/students/pbl/gp/${student.enrollment_no}`, "GET", null, token),
          apiRequest(`/api/groups/previous/${student.enrollment_no}`, "GET", null, token),
          apiRequest("/api/students/noc/me", "GET", null, token),
        ]);

      const groupMetaRes = groupMetaResult.status === "fulfilled" ? groupMetaResult.value : null;
      const groupDetailsRes =
        groupDetailsResult.status === "fulfilled" ? groupDetailsResult.value : null;
      const previousGroupRes =
        previousGroupResult.status === "fulfilled" ? previousGroupResult.value : null;
      const nocRes = nocResult.status === "fulfilled" ? nocResult.value : null;

      const groupMeta = groupMetaRes?.data?.group || groupMetaRes?.group || {};
      const groupDetails =
        groupDetailsRes?.data?.groupDetails || groupDetailsRes?.groupDetails || {};
      const previousMembers = previousGroupRes?.data?.members || previousGroupRes?.members || [];
      const latestNocPayload = nocRes?.data?.noc?.payload || nocRes?.noc?.payload || null;

      const resolvedGroupId = groupMeta?.group_id || groupDetails?.group_id || groupId;

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
          console.warn("Unable to fetch problem statement for NOC PDF:", problemError);
        }
      }

      const mergedMembers = mergeMemberSources(groupDetails?.members || [], previousMembers || []);
      const normalizedNoc = normalizeNocDraft(latestNocPayload || formData);

      const pdfBlob = await generateNocPdfBlob({
        nocData: normalizedNoc,
        groupId: resolvedGroupId,
        projectTitle: problemStatement?.title || problemStatement?.description || "",
        members: mergedMembers,
      });

      const fileName = `noc-${resolvedGroupId || student.enrollment_no || "student"}.pdf`;

      if (mode === "download") {
        downloadPdfBlob({ blob: pdfBlob, fileName });
        setStatusMessage({
          type: "success",
          text: "NOC PDF downloaded successfully.",
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
            text: "NOC PDF preview opened with download option.",
          });
        }
      }
    } catch (error) {
      if (mode === "preview" && previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }

      console.error("Failed to generate NOC PDF:", error);
      setStatusMessage({
        type: "error",
        text: error?.message || "Unable to generate NOC PDF right now.",
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isNocSubmitLocked) {
      setStatusMessage({
        type: "warning",
        text: "NOC is already approved and all fields are filled. Submit is disabled.",
      });
      return;
    }

    if (submissionState === "rejected") {
      const currentSnapshot = createNocSnapshot(formData);

      if (currentSnapshot === lastPersistedSnapshot) {
        setStatusMessage({
          type: "warning",
          text: "No changes detected. Please update the form before submitting again.",
        });
        return;
      }
    }

    if (groupYear === "SY" && !hasCopyrightDetails) {
      setStatusMessage({
        type: "error",
        text: "For SY groups, at least one copyright detail is compulsory in NOC.",
      });
      return;
    }

    if ((groupYear === "TY" || groupYear === "LY") && !hasPublicationDetails) {
      setStatusMessage({
        type: "error",
        text: "For TY/LY groups, at least one research publication detail is compulsory in NOC.",
      });
      return;
    }

    await persistNocForm(true);
  };

  const getSectionRows = (section) => ensureArray(formData?.[section]).slice(0, MAX_LINKED_ITEMS);

  const canAddSectionRow = (section) => ensureArray(formData?.[section]).length < MAX_LINKED_ITEMS;

  const addSectionRowWithLimit = (section, createItem) => {
    if (!canAddSectionRow(section)) {
      return;
    }

    addListItem(section, createItem());
  };

  const renderProofHint = (
    section,
    index,
    item,
    allowedExtensions = DEFAULT_ALLOWED_FILE_EXTENSIONS
  ) => {
    const localFile = proofFiles[getSectionProofFileKey(section, index)];
    const selectedName = localFile?.name || item?.proofFileName;

    return (
      <>
        <p className="mt-1 text-[11px] text-slate-500">{buildUploadRuleLabel(allowedExtensions)}</p>
        {selectedName ? (
          <p className="mt-1 text-[11px] text-slate-700">Selected: {selectedName}</p>
        ) : null}
        {item?.proofUrl ? (
          <a
            href={item.proofUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-[11px] font-medium text-indigo-700 underline"
          >
            View uploaded proof
          </a>
        ) : null}
      </>
    );
  };

  const renderInlineRowsContainer = (title, section, createItem, rowsMarkup) => (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <button
          type="button"
          onClick={() => addSectionRowWithLimit(section, createItem)}
          disabled={!canAddSectionRow(section)}
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            canAddSectionRow(section)
              ? "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          Add (+)
        </button>
      </div>

      <div className="space-y-3">{rowsMarkup}</div>
      <p className="text-[11px] text-slate-500">Maximum 2 entries.</p>
    </div>
  );

  const renderLinkedDetailsCell = (documentId) => {
    if (documentId === DOCUMENT_IDS.COPYRIGHT) {
      const rows = getSectionRows("copyrightDetails");

      return renderInlineRowsContainer(
        "Copyright Details",
        "copyrightDetails",
        createCopyrightDetailItem,
        rows.map((item, index) => (
          <div
            key={`copyright-inline-${index}`}
            className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm"
          >
            <p className="mb-2 text-[11px] font-semibold text-slate-700">Entry {index + 1}</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <input
                type="text"
                value={item.titleOfWork}
                onChange={(e) =>
                  handleListFieldChange("copyrightDetails", index, "titleOfWork", e.target.value)
                }
                maxLength={FIELD_LIMITS.LONG}
                className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs"
                placeholder="Title of work"
              />
              <input
                type="text"
                value={item.nameOfApplicants}
                onChange={(e) =>
                  handleListFieldChange("copyrightDetails", index, "nameOfApplicants", e.target.value)
                }
                maxLength={FIELD_LIMITS.MEDIUM}
                className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs"
                placeholder="Name of applicants"
              />
              <input
                type="text"
                value={item.registrationNo}
                onChange={(e) =>
                  handleListFieldChange("copyrightDetails", index, "registrationNo", e.target.value)
                }
                maxLength={FIELD_LIMITS.SHORT}
                className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs"
                placeholder="Registration no."
              />
              <input
                type="text"
                value={item.dairyNumber}
                onChange={(e) =>
                  handleListFieldChange("copyrightDetails", index, "dairyNumber", e.target.value)
                }
                maxLength={FIELD_LIMITS.SHORT}
                className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs"
                placeholder="Dairy number"
              />
              <input
                type="date"
                value={item.date}
                onChange={(e) => handleListFieldChange("copyrightDetails", index, "date", e.target.value)}
                className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={item.status}
                onChange={(e) => handleListFieldChange("copyrightDetails", index, "status", e.target.value)}
                maxLength={FIELD_LIMITS.SHORT}
                className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs"
                placeholder="Status"
              />
              <div className="md:col-span-3">
                <input
                  type="file"
                  accept={DEFAULT_ALLOWED_FILE_EXTENSIONS.join(",")}
                  onChange={(e) => handleSectionProofFileChange("copyrightDetails", index, e)}
                  className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-slate-700"
                />
                {renderProofHint("copyrightDetails", index, item)}
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => removeListItem("copyrightDetails", index, 1)}
                disabled={rows.length <= 1}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                  rows.length > 1
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        ))
      );
    }

    if (documentId === DOCUMENT_IDS.PATENT) {
      const rows = getSectionRows("patentDetails");

      return renderInlineRowsContainer(
        "Patent Details",
        "patentDetails",
        createPatentDetailItem,
        rows.map((item, index) => (
          <div
            key={`patent-inline-${index}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
          >
            <p className="mb-3 text-xs font-semibold text-slate-700">Entry {index + 1}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <input
                type="text"
                value={item.title}
                onChange={(e) => handleListFieldChange("patentDetails", index, "title", e.target.value)}
                maxLength={FIELD_LIMITS.LONG}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Title"
              />
              <input
                type="text"
                value={item.inventors}
                onChange={(e) => handleListFieldChange("patentDetails", index, "inventors", e.target.value)}
                maxLength={FIELD_LIMITS.MEDIUM}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Inventors"
              />
              <input
                type="text"
                value={item.applicationNo}
                onChange={(e) =>
                  handleListFieldChange("patentDetails", index, "applicationNo", e.target.value)
                }
                maxLength={FIELD_LIMITS.SHORT}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Application no."
              />
              <input
                type="text"
                value={item.patentNumber}
                onChange={(e) =>
                  handleListFieldChange("patentDetails", index, "patentNumber", e.target.value)
                }
                maxLength={FIELD_LIMITS.SHORT}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Patent number"
              />
              <input
                type="text"
                value={item.filingCountry}
                onChange={(e) =>
                  handleListFieldChange("patentDetails", index, "filingCountry", e.target.value)
                }
                maxLength={FIELD_LIMITS.SHORT}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Filing country"
              />
              <input
                type="text"
                value={item.publicationStatus}
                onChange={(e) =>
                  handleListFieldChange("patentDetails", index, "publicationStatus", e.target.value)
                }
                maxLength={FIELD_LIMITS.SHORT}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Publication status"
              />
              <div className="md:col-span-2 xl:col-span-3">
                <input
                  type="file"
                  accept={DEFAULT_ALLOWED_FILE_EXTENSIONS.join(",")}
                  onChange={(e) => handleSectionProofFileChange("patentDetails", index, e)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-slate-700"
                />
                {renderProofHint("patentDetails", index, item)}
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => removeListItem("patentDetails", index, 1)}
                disabled={rows.length <= 1}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                  rows.length > 1
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        ))
      );
    }

    if (documentId === DOCUMENT_IDS.PUBLICATION) {
      const rows = getSectionRows("publicationDetails");

      return renderInlineRowsContainer(
        "Research Publication Details",
        "publicationDetails",
        createPublicationDetailItem,
        rows.map((item, index) => (
          <div
            key={`publication-inline-${index}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
          >
            <p className="mb-3 text-xs font-semibold text-slate-700">Entry {index + 1}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <input
                type="text"
                value={item.paperTitle}
                onChange={(e) =>
                  handleListFieldChange("publicationDetails", index, "paperTitle", e.target.value)
                }
                maxLength={FIELD_LIMITS.LONG}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Paper title"
              />
              <input
                type="text"
                value={item.journalName}
                onChange={(e) =>
                  handleListFieldChange("publicationDetails", index, "journalName", e.target.value)
                }
                maxLength={FIELD_LIMITS.MEDIUM}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Journal name"
              />
              <input
                type="text"
                value={item.year}
                onChange={(e) =>
                  handleListFieldChange(
                    "publicationDetails",
                    index,
                    "year",
                    e.target.value.replace(/\D/g, "").slice(0, FIELD_LIMITS.YEAR)
                  )
                }
                inputMode="numeric"
                maxLength={FIELD_LIMITS.YEAR}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Year"
              />
              <input
                type="text"
                value={item.authors}
                onChange={(e) =>
                  handleListFieldChange("publicationDetails", index, "authors", e.target.value)
                }
                maxLength={FIELD_LIMITS.MEDIUM}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Authors"
              />
              <input
                type="url"
                value={item.url}
                onChange={(e) => handleListFieldChange("publicationDetails", index, "url", e.target.value)}
                maxLength={FIELD_LIMITS.URL}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="URL"
              />
              <input
                type="text"
                value={item.doi}
                onChange={(e) => handleListFieldChange("publicationDetails", index, "doi", e.target.value)}
                maxLength={FIELD_LIMITS.SHORT}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="DOI"
              />
              <div className="md:col-span-2 xl:col-span-3">
                <input
                  type="file"
                  accept={DEFAULT_ALLOWED_FILE_EXTENSIONS.join(",")}
                  onChange={(e) => handleSectionProofFileChange("publicationDetails", index, e)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-slate-700"
                />
                {renderProofHint("publicationDetails", index, item)}
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => removeListItem("publicationDetails", index, 1)}
                disabled={rows.length <= 1}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                  rows.length > 1
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        ))
      );
    }

    if (documentId === DOCUMENT_IDS.ACHIEVEMENTS) {
      const rows = getSectionRows("eventParticipationDetails");

      return renderInlineRowsContainer(
        "Event Participation (Achievements)",
        "eventParticipationDetails",
        createEventParticipationItem,
        rows.map((item, index) => (
          <div key={`event-inline-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-slate-700">Entry {index + 1}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <input
                type="text"
                value={item.nameOfEvent}
                onChange={(e) =>
                  handleListFieldChange("eventParticipationDetails", index, "nameOfEvent", e.target.value)
                }
                maxLength={FIELD_LIMITS.MEDIUM}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Name of event"
              />
              <select
                value={item.typeOfEvent}
                onChange={(e) =>
                  handleListFieldChange("eventParticipationDetails", index, "typeOfEvent", e.target.value)
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
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
                onChange={(e) => handleListFieldChange("eventParticipationDetails", index, "date", e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
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
                maxLength={FIELD_LIMITS.SHORT}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Type of participation"
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
                maxLength={FIELD_LIMITS.NOTE}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm md:col-span-2 xl:col-span-2"
                placeholder="Details of prize won"
              />
              <div className="md:col-span-2 xl:col-span-3">
                <input
                  type="file"
                  accept={DEFAULT_ALLOWED_FILE_EXTENSIONS.join(",")}
                  onChange={(e) => handleSectionProofFileChange("eventParticipationDetails", index, e)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-slate-700"
                />
                {renderProofHint("eventParticipationDetails", index, item)}
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => removeListItem("eventParticipationDetails", index, 1)}
                disabled={rows.length <= 1}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                  rows.length > 1
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        ))
      );
    }

    return null;
  };

  const submissionStateMeta = getSubmissionStateMeta(submissionState);
  const mentorFeedback = asText(formData?.mentorReview?.feedback);
  const approvalStatusDescription =
    submissionState === "approved"
      ? isNocSubmitLocked
        ? "Mentor approved your submission and all fields are complete. Submit is now locked."
        : "Mentor approved your submission. Fill pending fields if needed and submit again."
      : submissionStateMeta.description;

  if (loading) {
    return <Loading message="Loading NOC form" />;
  }

  return (
    <div className="font-[Poppins] bg-slate-50 flex flex-col min-h-screen overflow-x-hidden">
      <Header
        name={student?.name_of_student || student?.name_of_students || student?.name || "Student"}
        id={student?.enrollment_no || "----"}
      />

      <div className="flex flex-1 flex-col lg:flex-row mt-[72px]">
        <Sidebar />

        <main className="flex-1 lg:flex-none lg:w-[calc(100%-272px)] px-3 sm:px-4 md:px-6 py-5 bg-slate-50 lg:ml-[272px] mb-24 lg:mb-0 overflow-x-hidden">
          <div className="mx-auto w-full max-w-none space-y-6 sm:space-y-7">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-xl">
                    <FileCheck className="w-6 h-6 text-slate-700" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      No Objection Certificate (NOC)
                    </h1>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-700">
                <span className="font-semibold">Group:</span> {groupId || "Not linked"}
                {groupYear ? ` (${groupYear})` : ""}
                <span className="mx-2 text-slate-300">|</span>
                <span>SY: Copyright compulsory</span>
                <span className="mx-2 text-slate-300">|</span>
                <span>TY/LY: Research publication compulsory</span>
              </div>

              <div className={`mt-4 rounded-xl border px-4 py-3 ${submissionStateMeta.cardClass}`}>
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

              {statusMessage.text && (
                <div
                  className={`mt-4 rounded-xl px-4 py-3 border text-sm font-medium flex items-center gap-2 ${
                    statusMessage.type === "success"
                      ? "bg-slate-50 border-slate-200 text-slate-800"
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
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-5">
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-100 text-slate-900">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold border-b border-slate-200">Sr. No.</th>
                          <th className="px-3 py-2 text-left font-bold border-b border-slate-200">
                            Name of Document
                          </th>
                          <th className="px-3 py-2 text-left font-bold border-b border-slate-200 border-l border-slate-200">
                            Upload
                          </th>
                          <th className="w-[140px] min-w-[140px] px-3 py-2 text-left font-bold border-b border-slate-200 border-l border-slate-200">
                            Status of Submission
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.documents.map((doc, index) => {
                          const isLinkedDocument = LINKED_DOCUMENT_IDS.has(doc.id);
                          const status = isLinkedDocument
                            ? getLinkedDocumentStatusLabel(doc.id)
                            : doc.status || (doc.proofUrl ? "Submitted" : "");
                          const mentorFieldStatus = getMentorFieldStatus(doc.id);

                          return (
                            <React.Fragment key={doc.id}>
                              <tr
                                className={`align-top ${
                                  isLinkedDocument ? "border-b-0" : "border-b border-slate-100"
                                }`}
                              >
                                <td className="px-3 py-4 text-slate-700">{index + 1}</td>
                                <td className="px-3 py-4 text-slate-900 font-medium">{doc.name}</td>
                                <td className="px-3 py-3 min-w-[260px] border-l border-slate-200">
                                  {isLinkedDocument ? (
                                    <p className="text-xs text-slate-500">
                                      Fill details in the expanded section below this point.
                                    </p>
                                  ) : (
                                    <>
                                      <input
                                        type="file"
                                        accept={getAcceptTypesForDocument(doc.id)}
                                        onChange={(e) => handleProofFileChange(doc.id, e)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-slate-700"
                                      />
                                      <p className="mt-1 text-[11px] text-slate-500">
                                        {buildUploadRuleLabel(getAllowedExtensionsForDocument(doc.id))}
                                      </p>
                                    </>
                                  )}

                                  {!isLinkedDocument && doc.proofFileName ? (
                                    <p className="mt-1 text-xs text-slate-700">Selected: {doc.proofFileName}</p>
                                  ) : null}
                                  {!isLinkedDocument && doc.proofUrl ? (
                                    <a
                                      href={doc.proofUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-1 inline-block text-xs font-medium text-indigo-700 underline"
                                    >
                                      View uploaded document
                                    </a>
                                  ) : null}
                                </td>
                                {isLinkedDocument ? (
                                  <td
                                    rowSpan={2}
                                    className="w-[140px] min-w-[140px] px-2 py-2 align-top border-l border-slate-200"
                                  >
                                    <div className="flex flex-col gap-1">
                                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] leading-none font-semibold ${
                                        status === "Submitted"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}>
                                        {status}
                                      </span>
                                      {mentorFieldStatus ? (
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] leading-none font-semibold ${
                                          mentorFieldStatus === "Approved"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : mentorFieldStatus === "Rejected"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-slate-100 text-slate-700"
                                        }`}>
                                          Mentor: {mentorFieldStatus}
                                        </span>
                                      ) : null}
                                    </div>
                                  </td>
                                ) : (
                                  <td className="w-[140px] min-w-[140px] px-2 py-2 border-l border-slate-200 align-top">
                                    {status || mentorFieldStatus ? (
                                      <div className="flex flex-col gap-1">
                                        {status ? (
                                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] leading-none font-semibold ${
                                            status === "Submitted"
                                              ? "bg-emerald-100 text-emerald-800"
                                              : "bg-amber-100 text-amber-800"
                                          }`}>
                                            {status}
                                          </span>
                                        ) : null}
                                        {mentorFieldStatus ? (
                                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] leading-none font-semibold ${
                                            mentorFieldStatus === "Approved"
                                              ? "bg-emerald-100 text-emerald-800"
                                              : mentorFieldStatus === "Rejected"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-slate-100 text-slate-700"
                                          }`}>
                                            Mentor: {mentorFieldStatus}
                                          </span>
                                        ) : null}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">&nbsp;</span>
                                    )}
                                  </td>
                                )}
                              </tr>

                              {isLinkedDocument ? (
                                <tr className="border-b border-slate-100">
                                  <td className="px-3 pb-3" colSpan={3}>
                                    {renderLinkedDetailsCell(doc.id)}
                                  </td>
                                </tr>
                              ) : null}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
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
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        {pdfGenerating ? "Generating PDF..." : "Download NOC"}
                        {!pdfGenerating && <ChevronDown className="w-4 h-4" />}
                      </button>

                      {showDownloadOptions && !saving && !pdfGenerating && (
                        <div className="absolute right-0 bottom-full mb-2 z-20 w-48 rounded-xl border border-slate-200 bg-white shadow-lg p-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadNocPdf("preview")}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 inline-flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadNocPdf("download")}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 inline-flex items-center gap-2"
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
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Saving..." : "Save Draft"}
                    </button>

                    <button
                      type="submit"
                      disabled={saving || pdfGenerating || isNocSubmitLocked}
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors shadow-sm font-semibold ${
                        saving || pdfGenerating || isNocSubmitLocked
                          ? "bg-slate-300 text-white cursor-not-allowed"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      {saving ? "Submitting..." : isNocSubmitLocked ? "Approved" : "Submit NOC"}
                    </button>
                  </div>
                </div>
              </section>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NocPage;
