import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api";
import MentorSidebar from "../../Components/Mentor/MentorSidebar";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import {
  CheckCircle2,
  Clock3,
  FileCheck,
  FileX,
  ChevronDown,
  AlertTriangle,
  Download,
  ExternalLink,
} from "lucide-react";

const STATUS_STYLE = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  pending_mentor_approval: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABEL = {
  draft: "Draft",
  pending_mentor_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
};

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
const MAX_LINKED_ITEMS = 2;

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

const asText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const asRecord = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
};

const asList = (value) => (Array.isArray(value) ? value : []);

const displayValue = (value) => {
  const text = asText(value);
  return text || "-";
};

const formatDate = (value) => {
  const raw = asText(value);
  if (!raw) return "-";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString();
};

const ensureRows = (rows, minimum, createItem) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (safeRows.length >= minimum) return safeRows;

  return [
    ...safeRows,
    ...Array.from({ length: minimum - safeRows.length }, (_, index) =>
      createItem(safeRows.length + index)
    ),
  ];
};

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

const isAuthErrorMessage = (message = "") => {
  const lowered = asText(message).toLowerCase();
  return (
    lowered.includes("unauthorized") ||
    lowered.includes("forbidden") ||
    lowered.includes("token") ||
    lowered.includes("authentication")
  );
};

const normalizeDocuments = (rawDocuments) => {
  const incomingDocs = asList(rawDocuments);
  const incomingById = new Map();

  incomingDocs.forEach((doc, index) => {
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

  return DEFAULT_DOCUMENTS.map((defaultDoc) => {
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
  });
};

const normalizeNocPayload = (rawPayload) => {
  const payload = asRecord(rawPayload);

  return {
    certificateDate: asText(payload.certificateDate),
    concludingRemark: asText(payload.concludingRemark),
    guideSignatureName: asText(payload.guideSignatureName),
    documents: normalizeDocuments(payload.documents),
    publicationDetails: ensureRows(payload.publicationDetails, 1, createPublicationDetailItem)
      .slice(0, MAX_LINKED_ITEMS)
      .map((row) => ({
        ...createPublicationDetailItem(),
        ...asRecord(row),
      })),
    patentDetails: ensureRows(payload.patentDetails, 1, createPatentDetailItem)
      .slice(0, MAX_LINKED_ITEMS)
      .map((row) => ({
        ...createPatentDetailItem(),
        ...asRecord(row),
      })),
    copyrightDetails: ensureRows(payload.copyrightDetails, 1, createCopyrightDetailItem)
      .slice(0, MAX_LINKED_ITEMS)
      .map((row) => ({
        ...createCopyrightDetailItem(),
        ...asRecord(row),
      })),
    eventParticipationDetails: ensureRows(payload.eventParticipationDetails, 1, createEventParticipationItem)
      .slice(0, MAX_LINKED_ITEMS)
      .map((row) => ({
        ...createEventParticipationItem(),
        ...asRecord(row),
      })),
    mentorReview: asRecord(payload.mentorReview),
  };
};

const hasRowContent = (row = {}, keys = []) => {
  const hasFieldValue = keys.some((key) => asText(row?.[key]));
  const hasProof = Boolean(asText(row?.proofUrl) || asText(row?.proofFileName) || asText(row?.proofKey));
  return hasFieldValue || hasProof;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return asText(value);
  return parsed.toLocaleString();
};

const hasDocumentSubmission = (doc = {}) => {
  const proofUrl = asText(doc?.proofUrl);
  const status = asText(doc?.status).toLowerCase();
  return Boolean(proofUrl || status === "submitted");
};

const getTokenData = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1] || ""));
  } catch {
    return {};
  }
};

const MentorNoc = () => {
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupDetail, setGroupDetail] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewingFieldId, setReviewingFieldId] = useState("");
  const [fieldFeedbackById, setFieldFeedbackById] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const listRequestRef = useRef(0);
  const detailRequestRef = useRef(0);

  const token = localStorage.getItem("mentor_token") || localStorage.getItem("token");

  const resolveErrorMessage = (error, fallback) => asText(error?.message) || fallback;

  const handleAuthRedirectIfNeeded = (message) => {
    if (!isAuthErrorMessage(message)) return false;
    navigate("/pblmanagementfacultydashboardlogin");
    return true;
  };

  const loadProgressList = async (keepSelection = true) => {
    if (!token) return;

    const requestId = ++listRequestRef.current;

    try {
      setLoadingList(true);
      setStatusMessage((prev) => (prev.type ? { type: "", text: "" } : prev));

      const res = await apiRequest("/api/mentors/forms/noc", "GET", null, token);

      if (!res?.success) {
        throw new Error(res?.message || "Unable to load NOC progress right now.");
      }

      const rawGroups = res?.groups || res?.data?.groups || [];
      const nextGroups = Array.isArray(rawGroups) ? rawGroups : [];

      if (requestId !== listRequestRef.current) {
        return;
      }

      setGroups(nextGroups);

      if (!keepSelection || !selectedGroupId || !nextGroups.some((g) => g.groupId === selectedGroupId)) {
        setSelectedGroupId(nextGroups?.[0]?.groupId || "");
      }
    } catch (error) {
      if (requestId !== listRequestRef.current) {
        return;
      }

      const message = resolveErrorMessage(error, "Unable to load NOC progress right now.");
      if (handleAuthRedirectIfNeeded(message)) {
        return;
      }

      setGroups([]);
      setSelectedGroupId("");
      setGroupDetail(null);
      setStatusMessage({
        type: "error",
        text: message,
      });
    } finally {
      if (requestId === listRequestRef.current) {
        setLoadingList(false);
      }
    }
  };

  const loadGroupDetail = async (groupId) => {
    if (!token || !groupId) {
      setGroupDetail(null);
      return;
    }

    const requestId = ++detailRequestRef.current;

    try {
      setLoadingDetail(true);
      setStatusMessage((prev) => (prev.type === "error" ? { type: "", text: "" } : prev));

      const res = await apiRequest(`/api/mentors/forms/noc/${groupId}`, "GET", null, token);

      if (!res?.success) {
        throw new Error(res?.message || "Unable to load selected NOC form.");
      }

      const rawNoc = res?.noc || res?.data?.noc || null;
      const normalizedNoc = rawNoc
        ? {
            ...rawNoc,
            payload: normalizeNocPayload(rawNoc?.payload),
          }
        : null;

      if (requestId !== detailRequestRef.current) {
        return;
      }

      setGroupDetail({
        groupId,
        teamName: res?.teamName || res?.data?.teamName || "",
        members: res?.members || res?.data?.members || [],
        noc: normalizedNoc,
        reviewStatus: res?.reviewStatus || res?.data?.reviewStatus || "draft",
        reviewFeedback: res?.reviewFeedback || res?.data?.reviewFeedback || "",
      });
      setFieldFeedbackById({});
    } catch (error) {
      if (requestId !== detailRequestRef.current) {
        return;
      }

      const message = resolveErrorMessage(error, "Unable to load selected NOC form.");
      if (handleAuthRedirectIfNeeded(message)) {
        return;
      }

      setGroupDetail(null);
      setStatusMessage({
        type: "error",
        text: message,
      });
    } finally {
      if (requestId === detailRequestRef.current) {
        setLoadingDetail(false);
      }
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/pblmanagementfacultydashboardlogin");
      return;
    }

    const tokenData = getTokenData(token);
    setMentor({
      name: tokenData.mentor_name || "Mentor",
      id: tokenData.mentor_id || "----",
    });

    loadProgressList(false);
  }, [navigate, token]);

  useEffect(() => {
    loadGroupDetail(selectedGroupId);
  }, [selectedGroupId, token]);

  const stats = useMemo(() => {
    const list = Array.isArray(groups) ? groups : [];
    return {
      total: list.length,
      pending: list.filter((item) => item.reviewStatus === "pending_mentor_approval").length,
      approved: list.filter((item) => item.reviewStatus === "approved").length,
      rejected: list.filter((item) => item.reviewStatus === "rejected").length,
    };
  }, [groups]);

  const nocPayload = useMemo(() => {
    return normalizeNocPayload(groupDetail?.noc?.payload);
  }, [groupDetail?.noc?.payload]);

  const documents = useMemo(() => {
    return asList(nocPayload?.documents);
  }, [nocPayload]);

  const publicationDetails = useMemo(() => {
    return asList(nocPayload?.publicationDetails).filter((row) =>
      hasRowContent(row, [
        "paperTitle",
        "journalName",
        "year",
        "authors",
        "url",
        "doi",
        "volume",
        "pageNo",
        "publisher",
      ])
    );
  }, [nocPayload]);

  const patentDetails = useMemo(() => {
    return asList(nocPayload?.patentDetails).filter((row) =>
      hasRowContent(row, [
        "title",
        "inventors",
        "applicationNo",
        "patentNumber",
        "filingCountry",
        "subjectCategory",
        "filingDate",
        "publicationDate",
        "publicationStatus",
      ])
    );
  }, [nocPayload]);

  const copyrightDetails = useMemo(() => {
    return asList(nocPayload?.copyrightDetails).filter((row) =>
      hasRowContent(row, ["titleOfWork", "nameOfApplicants", "registrationNo", "dairyNumber", "date", "status"])
    );
  }, [nocPayload]);

  const eventParticipationDetails = useMemo(() => {
    return asList(nocPayload?.eventParticipationDetails).filter((row) =>
      hasRowContent(row, ["nameOfEvent", "typeOfEvent", "date", "typeOfParticipation", "detailsOfPrizeWon"])
    );
  }, [nocPayload]);

  const submittedDocumentsCount = useMemo(() => {
    return documents.filter((doc) => hasDocumentSubmission(doc)).length;
  }, [documents]);

  const fieldReviewsById = useMemo(() => {
    const fieldReviews = nocPayload?.mentorReview?.fieldReviews;
    return fieldReviews && typeof fieldReviews === "object" ? fieldReviews : {};
  }, [nocPayload]);

  const submittedDocuments = useMemo(
    () => documents.filter((doc) => hasDocumentSubmission(doc)),
    [documents]
  );

  const selectedReviewStatus = groupDetail?.reviewStatus || "draft";
  const canReview =
    Boolean(groupDetail?.noc) &&
    ["pending_mentor_approval", "rejected"].includes(selectedReviewStatus);
  const canFinalApprove =
    canReview &&
    submittedDocuments.length > 0 &&
    submittedDocuments.every((doc) => fieldReviewsById[doc.id]?.status === "approved");

  const hasAnyDetailedSection =
    publicationDetails.length > 0 ||
    patentDetails.length > 0 ||
    copyrightDetails.length > 0 ||
    eventParticipationDetails.length > 0;

  const handleFieldReview = async (doc, decision) => {
    if (!selectedGroupId || !canReview) {
      setStatusMessage({
        type: "warning",
        text: "Field review is available only when NOC is pending or rejected.",
      });
      return;
    }

    const documentId = asText(doc?.id);
    if (!documentId) {
      setStatusMessage({ type: "error", text: "Unable to review this document." });
      return;
    }

    const feedback = asText(fieldFeedbackById[documentId]);
    if (decision === "rejected" && !feedback) {
      setStatusMessage({ type: "error", text: "Feedback is required when rejecting a field." });
      return;
    }

    try {
      setReviewingFieldId(documentId);
      setStatusMessage({ type: "", text: "" });

      const reviewRes = await apiRequest(
        `/api/mentors/forms/noc/${selectedGroupId}/review`,
        "PUT",
        {
          mode: "field",
          fieldId: documentId,
          status: decision,
          feedback: decision === "rejected" ? feedback : "",
        },
        token
      );

      if (!reviewRes?.success) {
        throw new Error(reviewRes?.message || "Failed to update review status");
      }

      await loadProgressList(true);
      await loadGroupDetail(selectedGroupId);

      setStatusMessage({
        type: "success",
        text:
          decision === "approved"
            ? `${doc?.name || "Document"} accepted successfully.`
            : `${doc?.name || "Document"} rejected with feedback.`,
      });

      if (decision === "approved") {
        setFieldFeedbackById((prev) => ({ ...prev, [documentId]: "" }));
      }
    } catch (error) {
      const message = resolveErrorMessage(error, "Unable to submit field review decision.");
      if (handleAuthRedirectIfNeeded(message)) {
        return;
      }

      setStatusMessage({
        type: "error",
        text: message,
      });
    } finally {
      setReviewingFieldId("");
    }
  };

  const handleFinalApprove = async () => {
    if (!selectedGroupId || !canFinalApprove) return;

    try {
      setReviewing(true);
      setStatusMessage({ type: "", text: "" });

      const reviewRes = await apiRequest(
        `/api/mentors/forms/noc/${selectedGroupId}/review`,
        "PUT",
        { mode: "final_approve" },
        token
      );

      if (!reviewRes?.success) {
        throw new Error(reviewRes?.message || "Failed to finalize NOC approval");
      }

      await loadProgressList(true);
      await loadGroupDetail(selectedGroupId);

      setStatusMessage({
        type: "success",
        text: "NOC form approved successfully.",
      });
    } catch (error) {
      const message = resolveErrorMessage(error, "Unable to finalize NOC approval.");
      if (handleAuthRedirectIfNeeded(message)) {
        return;
      }

      setStatusMessage({
        type: "error",
        text: message,
      });
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <MentorHeader name={mentor?.name || "Mentor"} id={mentor?.id || "----"} />

      <div className="flex flex-1 flex-col lg:flex-row mt-[72px]">
        <MentorSidebar />

        <main className="flex-1 px-3 py-5 sm:px-5 md:px-8 bg-gray-50 lg:ml-72 mb-16 lg:mb-0">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-500">Mentor Workspace</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mt-1">NOC Review</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Select a group and approve or reject submitted NOC with feedback.
                  </p>
                </div>

                <div className="w-full lg:w-80">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Select Group</label>
                  <div className="relative">
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-purple-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={loadingList || groups.length === 0}
                    >
                      {loadingList && <option>Loading groups...</option>}
                      {!loadingList && groups.length === 0 && <option>No groups assigned</option>}
                      {!loadingList && groups.map((group) => (
                        <option key={group.groupId} value={group.groupId}>
                          {group.groupId}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500 font-semibold">Total Groups</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs text-amber-600 font-semibold">Pending</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{stats.pending}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs text-emerald-600 font-semibold">Approved</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.approved}</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-xs text-red-600 font-semibold">Rejected</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{stats.rejected}</p>
                </div>
              </div>
            </div>

            {statusMessage.text && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : statusMessage.type === "warning"
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                {loadingDetail ? (
                  <div className="py-20 text-center text-gray-500">Loading group NOC...</div>
                ) : !selectedGroupId ? (
                  <div className="py-20 text-center text-gray-500">Select a group to continue.</div>
                ) : !groupDetail?.noc ? (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
                      <FileX className="w-12 h-12 text-gray-300 mx-auto" />
                      <p className="text-gray-700 font-semibold mt-3">NOC not submitted yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        The template below shows the NOC structure the student will fill.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-800 mb-2">NOC Template</h3>
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[860px] text-sm">
                            <thead className="bg-gray-50 text-gray-700">
                              <tr>
                                <th className="text-left px-3 py-2">Document</th>
                                <th className="text-left px-3 py-2">Student Status</th>
                                <th className="text-left px-3 py-2">Mentor Review</th>
                                <th className="text-left px-3 py-2">Feedback</th>
                                <th className="text-left px-3 py-2">Action</th>
                                <th className="text-left px-3 py-2">Proof</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(documents.length ? documents : [
                                { id: "project_tracker_sheet", name: "Project Tracker Sheet (fully updated)" },
                                { id: "project_synopsis", name: "Project Synopsis" },
                                { id: "final_project_report", name: "Final Project report / Success story (for internship)" },
                                { id: "copyright_details", name: "Copyright Details" },
                                { id: "patent_details", name: "Patent Details" },
                                { id: "research_publication_details", name: "Research Publication Details" },
                                { id: "project_presentation_ppt", name: "Project Presentation PPT" },
                                { id: "achievements", name: "Achievements" },
                                { id: "internship_reports", name: "Internship joining report & Completion Report (If any)" },
                              ]).map((doc) => (
                                <tr key={doc.id || doc.name} className="border-t border-gray-100 bg-white">
                                  <td className="px-3 py-2 text-gray-900 font-medium">{doc.name || "-"}</td>
                                  <td className="px-3 py-2 text-gray-700">-</td>
                                  <td className="px-3 py-2">
                                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 border-slate-200">
                                      Pending
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-gray-400">-</td>
                                  <td className="px-3 py-2 text-gray-400">-</td>
                                  <td className="px-3 py-2 text-gray-400">-</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-purple-900">{groupDetail.groupId}</h2>
                        <p className="text-sm text-gray-600 mt-0.5">{groupDetail.teamName || "No team name"}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLE[selectedReviewStatus] || STATUS_STYLE.draft}`}>
                        {STATUS_LABEL[selectedReviewStatus] || STATUS_LABEL.draft}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                        <p className="text-[11px] text-gray-500 font-semibold">Documents</p>
                        <p className="text-lg font-bold text-gray-800 mt-0.5">{documents.length}</p>
                      </div>
                      <div className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2.5">
                        <p className="text-[11px] text-purple-600 font-semibold">Uploaded</p>
                        <p className="text-lg font-bold text-purple-700 mt-0.5">{submittedDocumentsCount}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                        <p className="text-[11px] text-gray-500 font-semibold">Submitted At</p>
                        <p className="text-xs font-semibold text-gray-700 mt-1">{formatDateTime(groupDetail?.noc?.submitted_at)}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                        <p className="text-[11px] text-gray-500 font-semibold">Last Update</p>
                        <p className="text-xs font-semibold text-gray-700 mt-1">{formatDateTime(groupDetail?.noc?.updated_at)}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-800 mb-2">Group Members</h3>
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="text-left px-3 py-2">Enrollment</th>
                              <th className="text-left px-3 py-2">Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(groupDetail.members || []).map((member, index) => (
                              <tr key={`${member.enrollment_no || member.enrollement_no || "member"}-${index}`} className="border-t border-gray-100">
                                <td className="px-3 py-2 text-gray-700">{member.enrollment_no || member.enrollement_no || "-"}</td>
                                <td className="px-3 py-2 text-gray-900 font-medium">{member.name_of_student || member.student_name || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-800 mb-2">Submitted NOC Fields</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                          <p className="text-[11px] text-gray-500 font-semibold">Certificate Date</p>
                          <p className="text-sm font-semibold text-gray-800 mt-1">
                            {formatDate(nocPayload?.certificateDate)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                          <p className="text-[11px] text-gray-500 font-semibold">Guide Signature Name</p>
                          <p className="text-sm font-semibold text-gray-800 mt-1">
                            {displayValue(nocPayload?.guideSignatureName)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 md:col-span-2">
                          <p className="text-[11px] text-gray-500 font-semibold">Concluding Remark</p>
                          <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap break-words">
                            {displayValue(nocPayload?.concludingRemark)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-800 mb-2">Detailed Section Entries</h3>

                      {hasAnyDetailedSection ? (
                        <div className="space-y-4">
                          {publicationDetails.length > 0 && (
                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                                Research Publication Details
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px] text-sm">
                                  <thead className="bg-white text-gray-700">
                                    <tr>
                                      <th className="text-left px-3 py-2">Title</th>
                                      <th className="text-left px-3 py-2">Journal</th>
                                      <th className="text-left px-3 py-2">Year</th>
                                      <th className="text-left px-3 py-2">Authors</th>
                                      <th className="text-left px-3 py-2">DOI</th>
                                      <th className="text-left px-3 py-2">URL</th>
                                      <th className="text-left px-3 py-2">Proof</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {publicationDetails.map((item, index) => (
                                      <tr key={`publication-${index}`} className="border-t border-gray-100">
                                        <td className="px-3 py-2 text-gray-800">{displayValue(item.paperTitle)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.journalName)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.year)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.authors)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.doi)}</td>
                                        <td className="px-3 py-2 text-gray-700">
                                          {asText(item.url) ? (
                                            <a
                                              href={item.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1 text-purple-700 hover:underline font-semibold"
                                            >
                                              Open <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">
                                          {asText(item.proofUrl) ? (
                                            <a
                                              href={item.proofUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1 text-purple-700 hover:underline font-semibold"
                                            >
                                              View <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {patentDetails.length > 0 && (
                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                                Patent Details
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[1080px] text-sm">
                                  <thead className="bg-white text-gray-700">
                                    <tr>
                                      <th className="text-left px-3 py-2">Title</th>
                                      <th className="text-left px-3 py-2">Inventors</th>
                                      <th className="text-left px-3 py-2">Application No.</th>
                                      <th className="text-left px-3 py-2">Patent No.</th>
                                      <th className="text-left px-3 py-2">Filing Country</th>
                                      <th className="text-left px-3 py-2">Publication Status</th>
                                      <th className="text-left px-3 py-2">Proof</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {patentDetails.map((item, index) => (
                                      <tr key={`patent-${index}`} className="border-t border-gray-100">
                                        <td className="px-3 py-2 text-gray-800">{displayValue(item.title)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.inventors)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.applicationNo)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.patentNumber)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.filingCountry)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.publicationStatus)}</td>
                                        <td className="px-3 py-2 text-gray-700">
                                          {asText(item.proofUrl) ? (
                                            <a
                                              href={item.proofUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1 text-purple-700 hover:underline font-semibold"
                                            >
                                              View <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {copyrightDetails.length > 0 && (
                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                                Copyright Details
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px] text-sm">
                                  <thead className="bg-white text-gray-700">
                                    <tr>
                                      <th className="text-left px-3 py-2">Title Of Work</th>
                                      <th className="text-left px-3 py-2">Applicants</th>
                                      <th className="text-left px-3 py-2">Registration No.</th>
                                      <th className="text-left px-3 py-2">Dairy No.</th>
                                      <th className="text-left px-3 py-2">Date</th>
                                      <th className="text-left px-3 py-2">Status</th>
                                      <th className="text-left px-3 py-2">Proof</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {copyrightDetails.map((item, index) => (
                                      <tr key={`copyright-${index}`} className="border-t border-gray-100">
                                        <td className="px-3 py-2 text-gray-800">{displayValue(item.titleOfWork)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.nameOfApplicants)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.registrationNo)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.dairyNumber)}</td>
                                        <td className="px-3 py-2 text-gray-700">{formatDate(item.date)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.status)}</td>
                                        <td className="px-3 py-2 text-gray-700">
                                          {asText(item.proofUrl) ? (
                                            <a
                                              href={item.proofUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1 text-purple-700 hover:underline font-semibold"
                                            >
                                              View <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {eventParticipationDetails.length > 0 && (
                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                                Event Participation (Achievements)
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px] text-sm">
                                  <thead className="bg-white text-gray-700">
                                    <tr>
                                      <th className="text-left px-3 py-2">Event</th>
                                      <th className="text-left px-3 py-2">Level</th>
                                      <th className="text-left px-3 py-2">Date</th>
                                      <th className="text-left px-3 py-2">Participation</th>
                                      <th className="text-left px-3 py-2">Prize/Details</th>
                                      <th className="text-left px-3 py-2">Proof</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {eventParticipationDetails.map((item, index) => (
                                      <tr key={`event-${index}`} className="border-t border-gray-100">
                                        <td className="px-3 py-2 text-gray-800">{displayValue(item.nameOfEvent)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.typeOfEvent)}</td>
                                        <td className="px-3 py-2 text-gray-700">{formatDate(item.date)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.typeOfParticipation)}</td>
                                        <td className="px-3 py-2 text-gray-700">{displayValue(item.detailsOfPrizeWon)}</td>
                                        <td className="px-3 py-2 text-gray-700">
                                          {asText(item.proofUrl) ? (
                                            <a
                                              href={item.proofUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1 text-purple-700 hover:underline font-semibold"
                                            >
                                              View <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-600">
                          No detailed section entries were submitted yet for publication, patent, copyright, or achievements.
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-800 mb-2">Submitted Documents</h3>
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="text-left px-3 py-2">Document</th>
                              <th className="text-left px-3 py-2">Student Status</th>
                              <th className="text-left px-3 py-2">Mentor Review</th>
                              <th className="text-left px-3 py-2">Feedback</th>
                              <th className="text-left px-3 py-2">Action</th>
                              <th className="text-left px-3 py-2">Proof</th>
                            </tr>
                          </thead>
                          <tbody>
                            {documents.map((doc) => (
                              <tr key={doc.id || doc.name} className="border-t border-gray-100">
                                <td className="px-3 py-2 text-gray-900 font-medium">{doc.name || "-"}</td>
                                <td className="px-3 py-2 text-gray-700">{doc.status || (doc.proofUrl ? "Submitted" : "-")}</td>
                                <td className="px-3 py-2">
                                  {asText(fieldReviewsById[doc.id]?.status) ? (
                                    <span
                                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                        fieldReviewsById[doc.id]?.status === "approved"
                                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                          : fieldReviewsById[doc.id]?.status === "rejected"
                                            ? "bg-red-100 text-red-700 border-red-200"
                                            : "bg-amber-100 text-amber-700 border-amber-200"
                                      }`}
                                    >
                                      {fieldReviewsById[doc.id]?.status}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={fieldFeedbackById[doc.id] || ""}
                                    onChange={(e) =>
                                      setFieldFeedbackById((prev) => ({ ...prev, [doc.id]: e.target.value }))
                                    }
                                    disabled={!canReview || !hasDocumentSubmission(doc)}
                                    placeholder="Feedback for rejection"
                                    className="w-full min-w-[180px] rounded-md border border-gray-200 px-2 py-1 text-xs disabled:bg-gray-100"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  {hasDocumentSubmission(doc) ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleFieldReview(doc, "approved")}
                                        disabled={!canReview || reviewingFieldId === doc.id}
                                        className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleFieldReview(doc, "rejected")}
                                        disabled={!canReview || reviewingFieldId === doc.id}
                                        className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">Not submitted</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {doc.proofUrl ? (
                                    <a
                                      href={doc.proofUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-purple-700 hover:underline font-semibold"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      View
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </div>
                      </div>
                    </div>

                    {selectedReviewStatus === "rejected" && asText(groupDetail.reviewFeedback) && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-red-600">Rejection Feedback</p>
                        <p className="text-sm text-red-800 mt-1">{groupDetail.reviewFeedback}</p>
                      </div>
                    )}

                    {canReview ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 space-y-3">
                        <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                          <Clock3 className="w-4 h-4" />
                          Review each submitted field, then finalize approval
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                          <button
                            type="button"
                            onClick={handleFinalApprove}
                            disabled={reviewing || !canFinalApprove}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Final Approve Form
                          </button>
                        </div>
                        {!canFinalApprove && (
                          <p className="text-xs text-amber-800">
                            Final approval is enabled only after all submitted fields are accepted.
                          </p>
                        )}
                      </div>
                    ) : selectedReviewStatus === "approved" ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 font-medium inline-flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        This NOC has been approved.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 inline-flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Student has not submitted this NOC for review yet.
                      </div>
                    )}
                  </div>
                )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MentorNoc;
