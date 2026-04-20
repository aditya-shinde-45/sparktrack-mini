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
} from "lucide-react";
import { generateNocPdfBlob } from "../../utils/nocPdf";
import { openPdfPreviewWindow, downloadPdfBlob } from "../../utils/trackerSheetPdf";

const DEFAULT_DOCUMENTS = [
  {
    id: "project_tracker_sheet",
    name: "Project Tracker Sheet (fully updated)",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: "project_synopsis",
    name: "Project Synopsis",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: "final_project_report",
    name: "Final Project report / Success story (for internship)",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: "ip_patent_publication",
    name: "Copyright (SY) / Patent (All) / Publication (TY & LY)",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: "project_presentation_ppt",
    name: "Project Presentation PPT",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: "achievements",
    name: "Achievements",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
  {
    id: "internship_reports",
    name: "Internship joining report & Completion Report (If any)",
    status: "",
    proofFileName: "",
    proofUrl: "",
    proofKey: "",
  },
];

const createInitialNocForm = () => ({
  certificateDate: "",
  concludingRemark: "",
  guideSignatureName: "",
  documents: DEFAULT_DOCUMENTS.map((doc) => ({ ...doc })),
});

const asText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
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

const NocPage = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(createInitialNocForm());
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [groupId, setGroupId] = useState("");
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
        const profileData = profileRes?.data?.profile || profileRes?.profile || null;

        if (!profileData) {
          navigate("/studentlogin");
          return;
        }

        setStudent(profileData);

        try {
          const groupRes = await apiRequest(
            `/api/students/student/group-details/${profileData.enrollment_no}`,
            "GET",
            null,
            token
          );
          const groupData = groupRes?.data?.group || groupRes?.group || null;
          setGroupId(groupData?.group_id || "");
        } catch (groupError) {
          console.warn("Unable to fetch group details for NOC form:", groupError);
        }

        try {
          const nocRes = await apiRequest("/api/students/noc/me", "GET", null, token);
          const nocRecord = nocRes?.data?.noc || nocRes?.noc || null;
          const nocPayload = nocRecord?.payload || null;
          const nocSubmissionState =
            nocRes?.data?.submissionState || nocRes?.submissionState || "draft";
          setSubmissionState(nocSubmissionState);

          if (nocPayload && typeof nocPayload === "object") {
            const normalizedPayload = normalizeNocDraft(nocPayload);
            setFormData(normalizedPayload);
            setLastPersistedSnapshot(createNocSnapshot(normalizedPayload));
            setStatusMessage({ type: "success", text: "NOC form loaded from database." });
          }

          const serverGroupId = nocRes?.data?.groupId || nocRes?.groupId || "";
          if (serverGroupId) {
            setGroupId(serverGroupId);
          }
        } catch (nocError) {
          console.warn("Unable to load NOC form from backend:", nocError);
        }
      } catch (error) {
        console.error("Failed to load NOC form:", error);
        navigate("/studentlogin");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAndNoc();
  }, [navigate]);

  const getProofFileKey = (documentId) => `document::${documentId}`;

  const hasDocumentProof = (documentId, documentData = {}) => {
    const localFile = proofFiles[getProofFileKey(documentId)];

    return Boolean(
      localFile ||
        asText(documentData?.proofUrl) ||
        asText(documentData?.proofKey) ||
        asText(documentData?.proofFileName)
    );
  };

  const nocAllFieldsFilled = useMemo(
    () =>
      Array.isArray(formData?.documents) &&
      formData.documents.length > 0 &&
      formData.documents.every((doc) => hasDocumentProof(doc.id, doc)),
    [formData?.documents, proofFiles]
  );

  const isNocSubmitLocked = submissionState === "approved" && nocAllFieldsFilled;

  const handleProofFileChange = (documentId, file) => {
    setProofFiles((prev) => {
      const key = getProofFileKey(documentId);

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

      const documentId = String(key).split("::")[1];
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
        60000
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
    }

    setProofFiles({});
    return nextPayload;
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
      const draftWithUploadedProofs = await uploadPendingProofFiles(token, normalizedDraft);

      const saveRes = await apiRequest(
        "/api/students/noc/me",
        "PUT",
        {
          formData: draftWithUploadedProofs,
          submit,
        },
        token
      );

      if (!saveRes?.success) {
        throw new Error(saveRes?.message || "Failed to save NOC form");
      }

      const nocRecord = saveRes?.data?.noc || saveRes?.noc || null;
      const persistedPayload = nocRecord?.payload || draftWithUploadedProofs;
      const normalizedPersistedPayload = normalizeNocDraft(persistedPayload);
      setFormData(normalizedPersistedPayload);
      setLastPersistedSnapshot(createNocSnapshot(normalizedPersistedPayload));
      setSubmissionState(
        saveRes?.data?.submissionState ||
          saveRes?.submissionState ||
          (submit ? "pending_mentor_approval" : "draft")
      );

      setStatusMessage({
        type: "success",
        text:
          saveRes?.message ||
          (submit ? "NOC submitted to mentor for approval." : "NOC saved to database."),
      });

      return true;
    } catch (error) {
      console.error("NOC persistence failed:", error);
      setStatusMessage({
        type: "error",
        text: error?.message || "Unable to save to database right now. Please try again.",
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

    await persistNocForm(true);
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
                    <FileCheck className="w-6 h-6 text-purple-700" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-purple-900">
                      No Objection Certificate (NOC)
                    </h1>
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
              <section className="bg-white rounded-2xl shadow-sm border border-purple-200 p-4 sm:p-5 space-y-5">
                <div className="rounded-xl border border-purple-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-purple-100 text-purple-900">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold border-b border-purple-200">Sr. No.</th>
                          <th className="px-3 py-2 text-left font-bold border-b border-purple-200">Name of Document</th>
                          <th className="px-3 py-2 text-left font-bold border-b border-purple-200">Status of Submission</th>
                          <th className="px-3 py-2 text-left font-bold border-b border-purple-200">Upload</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.documents.map((doc, index) => {
                          const status = doc.status || (doc.proofUrl ? "Submitted" : "");

                          return (
                            <tr key={doc.id} className="border-b border-purple-100 align-top">
                              <td className="px-3 py-3 text-gray-800">{index + 1}</td>
                              <td className="px-3 py-3 text-gray-900 font-medium">{doc.name}</td>
                              <td className="px-3 py-3">
                                {status ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                    {status}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">&nbsp;</span>
                                )}
                              </td>
                              <td className="px-3 py-3 min-w-[260px]">
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                  onChange={(e) => handleProofFileChange(doc.id, e.target.files?.[0])}
                                  className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-purple-100 file:px-3 file:py-1.5 file:text-purple-700"
                                />
                                {doc.proofFileName ? (
                                  <p className="mt-1 text-xs text-purple-700">Selected: {doc.proofFileName}</p>
                                ) : null}
                                {doc.proofUrl ? (
                                  <a
                                    href={doc.proofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-block text-xs font-medium text-purple-700 underline"
                                  >
                                    View uploaded document
                                  </a>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

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
                      {pdfGenerating ? "Generating PDF..." : "Download NOC"}
                      {!pdfGenerating && <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showDownloadOptions && !saving && !pdfGenerating && (
                      <div className="absolute right-0 bottom-full mb-2 z-20 w-48 rounded-xl border border-purple-200 bg-white shadow-lg p-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadNocPdf("preview")}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-purple-800 hover:bg-purple-50 inline-flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadNocPdf("download")}
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
                    disabled={saving || pdfGenerating || isNocSubmitLocked}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors shadow-sm font-semibold ${
                      saving || pdfGenerating || isNocSubmitLocked
                        ? "bg-purple-300 text-white cursor-not-allowed"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {saving ? "Submitting..." : isNocSubmitLocked ? "Approved" : "Submit NOC"}
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

export default NocPage;
