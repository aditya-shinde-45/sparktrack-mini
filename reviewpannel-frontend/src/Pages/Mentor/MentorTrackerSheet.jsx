import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api";
import MentorSidebar from "../../Components/Mentor/MentorSidebar";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import {
  CheckCircle2,
  Clock3,
  FileX,
  ChevronDown,
  AlertTriangle,
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

const asText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const asRecord = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
};

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

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return asText(value);
  return parsed.toLocaleString();
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

const countFilledRows = (rows = [], keys = []) => {
  if (!Array.isArray(rows)) return 0;

  return rows.filter((row) => keys.some((key) => asText(row?.[key]))).length;
};

const getTokenData = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1] || ""));
  } catch {
    return {};
  }
};

const createSprintItem = (index = 0) => ({
  sprintName: `Sprint ${index + 1}`,
  startDate: "",
  endDate: "",
  objective: "",
  status: "Upcoming",
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

const createMeetingItem = () => ({
  meetingDate: "",
  attendees: "",
  agenda: "",
  decisions: "",
  nextSteps: "",
});

const MentorTrackerSheet = () => {
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
      const res = await apiRequest("/api/mentors/forms/tracker-sheet", "GET", null, token);
      const nextGroups = res?.groups || res?.data?.groups || [];
      setGroups(Array.isArray(nextGroups) ? nextGroups : []);

      if (!keepSelection || !selectedGroupId || !nextGroups.some((g) => g.groupId === selectedGroupId)) {
        setSelectedGroupId(nextGroups?.[0]?.groupId || "");
      }
    } catch (error) {
      setGroups([]);
      setStatusMessage({
        type: "error",
        text: error?.message || "Unable to load tracker progress right now.",
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
      const res = await apiRequest(`/api/mentors/forms/tracker-sheet/${groupId}`, "GET", null, token);

      setGroupDetail({
        groupId,
        teamName: res?.teamName || res?.data?.teamName || "",
        members: res?.members || res?.data?.members || [],
        tracker: res?.tracker || res?.data?.tracker || null,
        reviewStatus: res?.reviewStatus || res?.data?.reviewStatus || "draft",
        reviewFeedback: res?.reviewFeedback || res?.data?.reviewFeedback || "",
      });
      setRejectionFeedback("");
    } catch (error) {
      setGroupDetail(null);
      setStatusMessage({
        type: "error",
        text: error?.message || "Unable to load selected tracker sheet.",
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

  const trackerPayload = asRecord(groupDetail?.tracker?.payload);
  const projectInfo = asRecord(trackerPayload?.projectInfo);
  const techStack = asRecord(trackerPayload?.techStack);

  const userStories = useMemo(() => {
    const raw = asRecord(trackerPayload?.userStories);

    return {
      epic: asText(raw.epic),
      stories: ensureRows(raw.stories, 5, () => ""),
      tasks: ensureRows(raw.tasks, 5, () => ""),
      acceptanceCriteria: ensureRows(raw.acceptanceCriteria, 5, () => ""),
    };
  }, [trackerPayload]);

  const sprintPlanning = useMemo(() => {
    return ensureRows(trackerPayload?.sprintPlanning, 4, createSprintItem).map((row, index) => ({
      ...createSprintItem(index),
      ...asRecord(row),
    }));
  }, [trackerPayload]);

  const publicationDetails = useMemo(() => {
    return ensureRows(
      trackerPayload?.publicationDetails,
      2,
      createPublicationDetailItem
    ).map((row) => ({
      ...createPublicationDetailItem(),
      ...asRecord(row),
    }));
  }, [trackerPayload]);

  const patentDetails = useMemo(() => {
    return ensureRows(trackerPayload?.patentDetails, 1, createPatentDetailItem).map((row) => ({
      ...createPatentDetailItem(),
      ...asRecord(row),
    }));
  }, [trackerPayload]);

  const copyrightDetails = useMemo(() => {
    return ensureRows(
      trackerPayload?.copyrightDetails,
      1,
      createCopyrightDetailItem
    ).map((row) => ({
      ...createCopyrightDetailItem(),
      ...asRecord(row),
    }));
  }, [trackerPayload]);

  const eventParticipationDetails = useMemo(() => {
    return ensureRows(
      trackerPayload?.eventParticipationDetails,
      2,
      createEventParticipationItem
    ).map((row) => ({
      ...createEventParticipationItem(),
      ...asRecord(row),
    }));
  }, [trackerPayload]);

  const meetings = useMemo(() => {
    return ensureRows(trackerPayload?.meetings, 12, createMeetingItem).map((row) => ({
      ...createMeetingItem(),
      ...asRecord(row),
    }));
  }, [trackerPayload]);

  const trackerProgress = useMemo(() => {
    return {
      sprintCount: countFilledRows(trackerPayload?.sprintPlanning, ["objective", "startDate", "endDate"]),
      meetingCount: countFilledRows(trackerPayload?.meetings, ["meetingDate", "agenda", "decisions", "nextSteps"]),
      publicationCount: countFilledRows(trackerPayload?.publicationDetails, ["paperTitle", "journalName", "doi", "url"]),
      patentCount: countFilledRows(trackerPayload?.patentDetails, ["title", "applicationNo", "patentNumber"]),
      eventCount: countFilledRows(trackerPayload?.eventParticipationDetails, ["nameOfEvent", "typeOfParticipation"]),
    };
  }, [trackerPayload]);

  const selectedReviewStatus = groupDetail?.reviewStatus || "draft";
  const canReview = Boolean(groupDetail?.tracker) && selectedReviewStatus === "pending_mentor_approval";

  const handleReview = async (decision) => {
    if (!selectedGroupId || !canReview) return;

    if (decision === "rejected" && !asText(rejectionFeedback)) {
      setStatusMessage({ type: "error", text: "Feedback is required when rejecting tracker sheet." });
      return;
    }

    try {
      setReviewing(true);
      setStatusMessage({ type: "", text: "" });

      const reviewRes = await apiRequest(
        `/api/mentors/forms/tracker-sheet/${selectedGroupId}/review`,
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
        text: decision === "approved"
          ? "Tracker sheet approved successfully."
          : "Tracker sheet rejected with feedback.",
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
                  <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mt-1">Tracker Sheet Review</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Select group, verify full tracker details, and approve or reject submitted tracker sheets.
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
                <div className="py-20 text-center text-gray-500">Loading tracker sheet...</div>
              ) : !selectedGroupId ? (
                <div className="py-20 text-center text-gray-500">Select a group to continue.</div>
              ) : !groupDetail?.tracker ? (
                <div className="py-16 text-center">
                  <FileX className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="text-gray-500 font-medium mt-3">No tracker sheet saved yet for this group.</p>
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
                      <p className="text-[11px] text-gray-500 font-semibold">Completion</p>
                      <p className="text-lg font-bold text-gray-800 mt-0.5">{displayValue(projectInfo.completionStatus)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                      <p className="text-[11px] text-gray-500 font-semibold">Meetings Filled</p>
                      <p className="text-lg font-bold text-gray-800 mt-0.5">{trackerProgress.meetingCount}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                      <p className="text-[11px] text-gray-500 font-semibold">Sprints Filled</p>
                      <p className="text-lg font-bold text-gray-800 mt-0.5">{trackerProgress.sprintCount}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                      <p className="text-[11px] text-gray-500 font-semibold">Publications Filled</p>
                      <p className="text-lg font-bold text-gray-800 mt-0.5">{trackerProgress.publicationCount}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Group Members</h3>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="text-left px-3 py-2">Enrollment</th>
                              <th className="text-left px-3 py-2">Name</th>
                              <th className="text-left px-3 py-2">Contact</th>
                              <th className="text-left px-3 py-2">Email</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(groupDetail.members || []).map((member, index) => (
                              <tr
                                key={`${member.enrollment_no || member.enrollement_no || index}-member`}
                                className="border-t border-gray-100"
                              >
                                <td className="px-3 py-2 text-gray-700">{displayValue(member.enrollment_no || member.enrollement_no)}</td>
                                <td className="px-3 py-2 text-gray-900 font-medium">{displayValue(member.name_of_student || member.student_name)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(member.student_contact_no || member.contact || member.phone)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(member.student_email_id || member.email || member.email_id)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Project Information</h3>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="text-left px-3 py-2">Completion</th>
                              <th className="text-left px-3 py-2">Copyright</th>
                              <th className="text-left px-3 py-2">Paper Publication</th>
                              <th className="text-left px-3 py-2">Tech Transfer</th>
                              <th className="text-left px-3 py-2">Source</th>
                              <th className="text-left px-3 py-2">SDG</th>
                              <th className="text-left px-3 py-2">Submitted At</th>
                              <th className="text-left px-3 py-2">Last Update</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-gray-100">
                              <td className="px-3 py-2 text-gray-700">{displayValue(projectInfo.completionStatus)}</td>
                              <td className="px-3 py-2 text-gray-700">{displayValue(projectInfo.copyrightStatus)}</td>
                              <td className="px-3 py-2 text-gray-700">{displayValue(projectInfo.paperPublicationStatus)}</td>
                              <td className="px-3 py-2 text-gray-700">{displayValue(projectInfo.technologyTransfer)}</td>
                              <td className="px-3 py-2 text-gray-700">{displayValue(projectInfo.sourceOfProblemStatement)}</td>
                              <td className="px-3 py-2 text-gray-700">{displayValue(projectInfo.sustainableDevelopmentGoal)}</td>
                              <td className="px-3 py-2 text-gray-700">{formatDateTime(groupDetail?.tracker?.submitted_at)}</td>
                              <td className="px-3 py-2 text-gray-700">{formatDateTime(groupDetail?.tracker?.updated_at)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-200 p-4">
                      <h3 className="text-sm font-bold text-gray-800 mb-3">Tech Stack</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Frontend:</span> <span className="font-semibold text-gray-800">{displayValue(techStack.frontend)}</span></p>
                        <p><span className="text-gray-500">Backend:</span> <span className="font-semibold text-gray-800">{displayValue(techStack.backend)}</span></p>
                        <p><span className="text-gray-500">Database:</span> <span className="font-semibold text-gray-800">{displayValue(techStack.database)}</span></p>
                        <p><span className="text-gray-500">DevOps:</span> <span className="font-semibold text-gray-800">{displayValue(techStack.devOps)}</span></p>
                        <p><span className="text-gray-500">Tools:</span> <span className="font-semibold text-gray-800">{displayValue(techStack.tools)}</span></p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4">
                      <h3 className="text-sm font-bold text-gray-800 mb-3">Project Links and Achievements</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-gray-500">GitHub:</span>{" "}
                          {asText(projectInfo.githubLink) ? (
                            <a
                              href={projectInfo.githubLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-purple-700 hover:underline font-semibold"
                            >
                              Open Link <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="font-semibold text-gray-800">-</span>
                          )}
                        </p>
                        <p><span className="text-gray-500">Achievements:</span> <span className="font-semibold text-gray-800">{displayValue(projectInfo.achievements)}</span></p>
                        <p><span className="text-gray-500">Patents Filled:</span> <span className="font-semibold text-gray-800">{trackerProgress.patentCount}</span></p>
                        <p><span className="text-gray-500">Events Filled:</span> <span className="font-semibold text-gray-800">{trackerProgress.eventCount}</span></p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Epic, Stories, Tasks and Acceptance Criteria</h3>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="text-left px-3 py-2">Row</th>
                              <th className="text-left px-3 py-2">Story</th>
                              <th className="text-left px-3 py-2">Task</th>
                              <th className="text-left px-3 py-2">Acceptance Criteria</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-gray-100">
                              <td className="px-3 py-2 text-gray-700 font-semibold">Epic</td>
                              <td className="px-3 py-2 text-gray-700" colSpan={3}>{displayValue(userStories.epic)}</td>
                            </tr>
                            {Array.from({ length: 5 }).map((_, index) => (
                              <tr key={`story-row-${index}`} className="border-t border-gray-100">
                                <td className="px-3 py-2 text-gray-700 font-semibold">{`#${index + 1}`}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(userStories.stories[index])}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(userStories.tasks[index])}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(userStories.acceptanceCriteria[index])}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Sprint Planning</h3>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="text-left px-3 py-2">Sprint</th>
                              <th className="text-left px-3 py-2">Start Date</th>
                              <th className="text-left px-3 py-2">End Date</th>
                              <th className="text-left px-3 py-2">Objective</th>
                              <th className="text-left px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sprintPlanning.map((item, index) => (
                              <tr key={`sprint-${index}`} className="border-t border-gray-100">
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.sprintName || `Sprint ${index + 1}`)}</td>
                                <td className="px-3 py-2 text-gray-700">{formatDate(item.startDate)}</td>
                                <td className="px-3 py-2 text-gray-700">{formatDate(item.endDate)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.objective)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Publication Details</h3>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="text-left px-3 py-2">Title</th>
                              <th className="text-left px-3 py-2">Journal</th>
                              <th className="text-left px-3 py-2">Year</th>
                              <th className="text-left px-3 py-2">Authors</th>
                              <th className="text-left px-3 py-2">URL</th>
                              <th className="text-left px-3 py-2">DOI</th>
                              <th className="text-left px-3 py-2">Volume</th>
                              <th className="text-left px-3 py-2">Page</th>
                              <th className="text-left px-3 py-2">Publisher</th>
                              <th className="text-left px-3 py-2">Proof</th>
                            </tr>
                          </thead>
                          <tbody>
                            {publicationDetails.map((item, index) => (
                              <tr key={`publication-${index}`} className="border-t border-gray-100">
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.paperTitle)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.journalName)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.year)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.authors)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.url)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.doi)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.volume)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.pageNo)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.publisher)}</td>
                                <td className="px-3 py-2 text-gray-700">
                                  {asText(item.proofUrl) ? (
                                    <a href={item.proofUrl} target="_blank" rel="noreferrer" className="text-purple-700 hover:underline font-semibold">
                                      View
                                    </a>
                                  ) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Patent Details</h3>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="text-left px-3 py-2">Title</th>
                              <th className="text-left px-3 py-2">Inventors</th>
                              <th className="text-left px-3 py-2">Application No.</th>
                              <th className="text-left px-3 py-2">Patent No.</th>
                              <th className="text-left px-3 py-2">Country</th>
                              <th className="text-left px-3 py-2">Category</th>
                              <th className="text-left px-3 py-2">Filing Date</th>
                              <th className="text-left px-3 py-2">Publication Date</th>
                              <th className="text-left px-3 py-2">Status</th>
                              <th className="text-left px-3 py-2">Proof</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patentDetails.map((item, index) => (
                              <tr key={`patent-${index}`} className="border-t border-gray-100">
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.title)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.inventors)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.applicationNo)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.patentNumber)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.filingCountry)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.subjectCategory)}</td>
                                <td className="px-3 py-2 text-gray-700">{formatDate(item.filingDate)}</td>
                                <td className="px-3 py-2 text-gray-700">{formatDate(item.publicationDate)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.publicationStatus)}</td>
                                <td className="px-3 py-2 text-gray-700">
                                  {asText(item.proofUrl) ? (
                                    <a href={item.proofUrl} target="_blank" rel="noreferrer" className="text-purple-700 hover:underline font-semibold">
                                      View
                                    </a>
                                  ) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Copyright Details</h3>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="text-left px-3 py-2">Title of Work</th>
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
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.titleOfWork)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.nameOfApplicants)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.registrationNo)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.dairyNumber)}</td>
                                <td className="px-3 py-2 text-gray-700">{formatDate(item.date)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.status)}</td>
                                <td className="px-3 py-2 text-gray-700">
                                  {asText(item.proofUrl) ? (
                                    <a href={item.proofUrl} target="_blank" rel="noreferrer" className="text-purple-700 hover:underline font-semibold">
                                      View
                                    </a>
                                  ) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Event and Participation Details</h3>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="text-left px-3 py-2">Event Name</th>
                              <th className="text-left px-3 py-2">Type</th>
                              <th className="text-left px-3 py-2">Date</th>
                              <th className="text-left px-3 py-2">Participation</th>
                              <th className="text-left px-3 py-2">Prize Details</th>
                              <th className="text-left px-3 py-2">Proof</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eventParticipationDetails.map((item, index) => (
                              <tr key={`event-${index}`} className="border-t border-gray-100">
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.nameOfEvent)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.typeOfEvent)}</td>
                                <td className="px-3 py-2 text-gray-700">{formatDate(item.date)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.typeOfParticipation)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.detailsOfPrizeWon)}</td>
                                <td className="px-3 py-2 text-gray-700">
                                  {asText(item.proofUrl) ? (
                                    <a href={item.proofUrl} target="_blank" rel="noreferrer" className="text-purple-700 hover:underline font-semibold">
                                      View
                                    </a>
                                  ) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Meetings</h3>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="text-left px-3 py-2">Date</th>
                              <th className="text-left px-3 py-2">Attendees</th>
                              <th className="text-left px-3 py-2">Agenda</th>
                              <th className="text-left px-3 py-2">Decisions</th>
                              <th className="text-left px-3 py-2">Next Steps</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meetings.map((item, index) => (
                              <tr key={`meeting-${index}`} className="border-t border-gray-100">
                                <td className="px-3 py-2 text-gray-700">{formatDate(item.meetingDate)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.attendees)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.agenda)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.decisions)}</td>
                                <td className="px-3 py-2 text-gray-700">{displayValue(item.nextSteps)}</td>
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
                      This tracker sheet has been approved.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 inline-flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Student has not submitted this tracker sheet for review yet.
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

export default MentorTrackerSheet;
