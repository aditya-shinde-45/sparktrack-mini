import React, { useEffect, useMemo, useState } from "react";
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

const asText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return asText(value);
  return parsed.toLocaleString();
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
  const [rejectionFeedback, setRejectionFeedback] = useState("");
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const token = localStorage.getItem("mentor_token") || localStorage.getItem("token");

  const loadProgressList = async (keepSelection = true) => {
    if (!token) return;

    try {
      setLoadingList(true);
      const res = await apiRequest("/api/mentors/forms/noc", "GET", null, token);
      const nextGroups = res?.groups || res?.data?.groups || [];
      setGroups(Array.isArray(nextGroups) ? nextGroups : []);

      if (!keepSelection || !selectedGroupId || !nextGroups.some((g) => g.groupId === selectedGroupId)) {
        setSelectedGroupId(nextGroups?.[0]?.groupId || "");
      }
    } catch (error) {
      setGroups([]);
      setStatusMessage({
        type: "error",
        text: error?.message || "Unable to load NOC progress right now.",
      });
    } finally {
      setLoadingList(false);
    }
  };

  const loadGroupDetail = async (groupId) => {
    if (!token || !groupId) {
      setGroupDetail(null);
      return;
    }

    try {
      setLoadingDetail(true);
      const res = await apiRequest(`/api/mentors/forms/noc/${groupId}`, "GET", null, token);
      setGroupDetail({
        groupId,
        teamName: res?.teamName || res?.data?.teamName || "",
        members: res?.members || res?.data?.members || [],
        noc: res?.noc || res?.data?.noc || null,
        reviewStatus: res?.reviewStatus || res?.data?.reviewStatus || "draft",
        reviewFeedback: res?.reviewFeedback || res?.data?.reviewFeedback || "",
      });
      setRejectionFeedback("");
    } catch (error) {
      setGroupDetail(null);
      setStatusMessage({
        type: "error",
        text: error?.message || "Unable to load selected NOC form.",
      });
    } finally {
      setLoadingDetail(false);
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
  }, [navigate]);

  useEffect(() => {
    loadGroupDetail(selectedGroupId);
  }, [selectedGroupId]);

  const stats = useMemo(() => {
    const list = Array.isArray(groups) ? groups : [];
    return {
      total: list.length,
      pending: list.filter((item) => item.reviewStatus === "pending_mentor_approval").length,
      approved: list.filter((item) => item.reviewStatus === "approved").length,
      rejected: list.filter((item) => item.reviewStatus === "rejected").length,
    };
  }, [groups]);

  const documents = useMemo(() => {
    const payload = groupDetail?.noc?.payload;
    const docs = Array.isArray(payload?.documents) ? payload.documents : [];
    return docs;
  }, [groupDetail]);

  const submittedDocumentsCount = useMemo(() => {
    return documents.filter((doc) => asText(doc?.proofUrl)).length;
  }, [documents]);

  const selectedReviewStatus = groupDetail?.reviewStatus || "draft";
  const canReview = Boolean(groupDetail?.noc) && selectedReviewStatus === "pending_mentor_approval";

  const handleReview = async (decision) => {
    if (!selectedGroupId || !canReview) return;

    if (decision === "rejected" && !asText(rejectionFeedback)) {
      setStatusMessage({ type: "error", text: "Feedback is required when rejecting NOC." });
      return;
    }

    try {
      setReviewing(true);
      setStatusMessage({ type: "", text: "" });

      const reviewRes = await apiRequest(
        `/api/mentors/forms/noc/${selectedGroupId}/review`,
        "PUT",
        {
          status: decision,
          feedback: decision === "rejected" ? rejectionFeedback : "",
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
        text: decision === "approved" ? "NOC approved successfully." : "NOC rejected with feedback.",
      });
      setRejectionFeedback("");
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error?.message || "Unable to submit review decision.",
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
                  <div className="py-16 text-center">
                    <FileX className="w-12 h-12 text-gray-300 mx-auto" />
                    <p className="text-gray-500 font-medium mt-3">No NOC saved yet for this group.</p>
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
                            {(groupDetail.members || []).map((member) => (
                              <tr key={member.enrollment_no || member.enrollement_no} className="border-t border-gray-100">
                                <td className="px-3 py-2 text-gray-700">{member.enrollment_no || member.enrollement_no || "-"}</td>
                                <td className="px-3 py-2 text-gray-900 font-medium">{member.name_of_student || member.student_name || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-800 mb-2">Submitted Documents</h3>
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="text-left px-3 py-2">Document</th>
                              <th className="text-left px-3 py-2">Status</th>
                              <th className="text-left px-3 py-2">Proof</th>
                            </tr>
                          </thead>
                          <tbody>
                            {documents.map((doc) => (
                              <tr key={doc.id || doc.name} className="border-t border-gray-100">
                                <td className="px-3 py-2 text-gray-900 font-medium">{doc.name || "-"}</td>
                                <td className="px-3 py-2 text-gray-700">{doc.status || (doc.proofUrl ? "Submitted" : "-")}</td>
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
                          Awaiting your review action
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-amber-800 mb-1.5">
                            Rejection Feedback (required if rejecting)
                          </label>
                          <textarea
                            rows={3}
                            value={rejectionFeedback}
                            onChange={(e) => setRejectionFeedback(e.target.value)}
                            className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm"
                            placeholder="Explain what needs to be fixed before resubmission"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                          <button
                            type="button"
                            onClick={() => handleReview("rejected")}
                            disabled={reviewing}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                          >
                            <FileX className="w-4 h-4" />
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview("approved")}
                            disabled={reviewing}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </button>
                        </div>
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
