import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Components/Student/sidebar";
import Header from "../../Components/Student/Header";
import GroupDetails from "../../Components/Student/GroupDetails";
import InfoDrawer from "../../Components/Student/InfoDrawer";
import { DashboardCards } from "../../Components/Student/DashboardCards";
import StudentPosts from "../../Components/Student/posts";
import Loading from "../../Components/Common/loading";
import { Download, FileText, Image, File, ExternalLink, Megaphone, Calendar, Paperclip, Lightbulb, Target, Code, Globe, BookOpen, Plus, CheckCircle, XCircle, Clock, AlertCircle, Users, ClipboardCheck, BellRing, Sparkles, ChevronRight } from "lucide-react";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [problem, setProblem] = useState(null);
  const [evaluationMarks, setEvaluationMarks] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState({ title: "", message: "" });
  const [announcements, setAnnouncements] = useState([]);
  const [groupSnapshot, setGroupSnapshot] = useState(null);
  
  // Posts modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [triggerPostsFetch, setTriggerPostsFetch] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (!token) {
      navigate('/studentlogin');
      return;
    }

    const fetchProblemStatement = async (groupId, psId, token) => {
      try {
        const endpoint = psId 
          ? `/api/students/student/problem-statement/${groupId}?ps_id=${psId}`
          : `/api/students/student/problem-statement/${groupId}`;
        const psRes = await apiRequest(endpoint, "GET", null, token);
        const problemStatement = psRes?.data?.problemStatement || psRes?.problemStatement || null;
        setProblem(problemStatement);
      } catch (error) {
        console.error('Error fetching problem statement:', error);
        setProblem(null);
      }
    };

    const fetchStudent = async () => {
      try {
        const profileRes = await apiRequest("/api/student-auth/profile", "GET", null, token);
        const profileData = profileRes?.data?.profile || profileRes?.profile;

        if (!profileData) {
          setStudent(null);
          return;
        }
        setStudent(profileData);

        // Fetch group details and problem statement
        const groupDetailsRes = await apiRequest(`/api/students/student/group-details/${profileData.enrollment_no}`, "GET", null, token);
        const groupDetails = groupDetailsRes?.data?.group || groupDetailsRes?.group;
        setGroupSnapshot(groupDetails || null);
        
        // If group_id exists, fetch problem statement
        if (groupDetails?.group_id) {
          await fetchProblemStatement(groupDetails.group_id, groupDetails.ps_id, token);
        }

        // Fetch evaluation marks (enabled forms only)
        fetchEvaluationMarks(token);
        fetchAnnouncements();
      } catch (error) {
        console.error('Error in fetchStudent:', error);
        navigate('/studentlogin');
      }
    };

    const fetchEvaluationMarks = async (token) => {
      const res = await apiRequest(
        "/api/announcements/announcement/evaluation-marks",
        "GET",
        null,
        token
      );
      setEvaluationMarks(res?.data?.marks || res?.marks || []);
    };

    fetchStudent();
  }, []);

  const handleDownloadFile = async (id, fileName) => {
    try {
      const token = localStorage.getItem("student_token");
      const API_BASE_URL = import.meta.env.MODE === "development"
        ? import.meta.env.VITE_API_BASE_URL
        : import.meta.env.VITE_API_BASE_URL_PROD;
      
      const response = await fetch(`${API_BASE_URL}/api/announcements/announcement/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Download failed');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <File className="w-5 h-5 text-gray-500" />;
    
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const canPreviewFile = (fileType) => {
    return fileType && (fileType.startsWith('image/') || fileType === 'application/pdf');
  };

  const openFilePreview = (fileUrl, fileType) => {
    // For images and PDFs, open in new tab for preview
    if (canPreviewFile(fileType)) {
      window.open(fileUrl, '_blank');
    }
  };

  // Updated to fetch and store announcements as objects
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("student_token");
      const res = await apiRequest("/api/announcements/", "GET", null, token);
      const announcementData = res?.data?.announcements || res?.announcements;

      if (announcementData) {
        setAnnouncements(announcementData);
      }
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }
  };

  // Updated card click handler to include file preview and download
  const handleCardClick = async (type) => {
    try {
      let title = "";
      let message = "";
      const token = localStorage.getItem("student_token");

      switch (type) {
        case "Announcements":
          await fetchAnnouncements();
          title = "Announcements";
          setDrawerContent({ 
            title, 
            message: "Loading announcements...",
            isAnnouncementView: true 
          });
          setDrawerOpen(true);
          return;

        case "Events & Posts":
          // Open posts modal instead of drawer
          setTriggerPostsFetch(true);
          setShowPostModal(true);
          return; // Don't open drawer

        case "Upload Document":
          navigate('/student/documentation');
          return;

        case "Team Chat":
          title = "Team Chat";
          message =
            "💬 After group creation and Mentor Allocation, Team Chat will be available!";
          break;

        default:
          return;
      }

      setDrawerContent({ title, message });
      setDrawerOpen(true);
    } catch (err) {
      setDrawerContent({
        title: "Error",
        message: "Something went wrong. Please try again later.",
      });
      setDrawerOpen(true);
    }
  };

  // Handle closing posts modal
  const handleClosePostModal = () => {
    setShowPostModal(false);
    setTriggerPostsFetch(false);
  };

  // Custom announcement drawer content
  const AnnouncementsContent = () => {
    if (announcements.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Megaphone className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No announcements available</p>
          <p className="text-gray-400 text-sm mt-1">Check back later for updates</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div 
            key={announcement.id} 
            className="group bg-gradient-to-br from-white to-purple-50 rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white text-base flex-1">
                {announcement.title}
              </h3>
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {announcement.message}
              </p>
              
              {/* File attachment section */}
              {announcement.file_url && (
                <div className="mt-4 pt-4 border-t border-purple-100">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getFileIcon(announcement.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700 font-medium truncate">
                            {announcement.file_name || 'Attachment'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {announcement.file_type?.split('/')[1]?.toUpperCase() || 'File'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-3">
                      {/* Preview button for supported files */}
                      {canPreviewFile(announcement.file_type) && (
                        <button
                          onClick={() => openFilePreview(announcement.file_url, announcement.file_type)}
                          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          title="Preview file"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Download button for all files */}
                      <button
                        onClick={() => handleDownloadFile(announcement.id, announcement.file_name)}
                        className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Timestamp */}
              <div className="mt-3 flex items-center justify-end">
                <span className="text-xs text-gray-400">
                  {new Date(announcement.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!student)
    return <Loading message="Loading your dashboard" />;

  const evaluatedForms = evaluationMarks.filter((entry) => !!entry.evaluation).length;
  const totalEvaluations = evaluationMarks.length;
  const pendingEvaluations = Math.max(totalEvaluations - evaluatedForms, 0);
  const totalAnnouncements = announcements.length;
  const hasGroup = !!groupSnapshot?.group_id;
  const teamSize = Array.isArray(groupSnapshot?.members)
    ? groupSnapshot.members.length
    : Array.isArray(groupSnapshot?.students)
    ? groupSnapshot.students.length
    : Array.isArray(groupSnapshot?.group_members)
    ? groupSnapshot.group_members.length
    : hasGroup
    ? 1
    : 0;

  const approvedProblem = problem?.status === "APPROVED";
  const pendingProblem = problem?.status && problem?.status !== "APPROVED" && problem?.status !== "REJECTED";

  const problemStatusClasses = problem?.status === "APPROVED"
    ? "bg-green-100 text-green-700"
    : problem?.status === "REJECTED"
    ? "bg-red-100 text-red-700"
    : "bg-yellow-100 text-yellow-700";

  const topStats = [
    {
      label: "Team Members",
      value: teamSize,
      icon: Users,
      from: "from-purple-500",
      to: "to-purple-700",
      light: "text-purple-100",
      hint: hasGroup ? "Active team" : "No finalized group",
    },
    {
      label: "Evaluated Forms",
      value: evaluatedForms,
      icon: ClipboardCheck,
      from: "from-violet-500",
      to: "to-violet-700",
      light: "text-violet-100",
      hint: `${pendingEvaluations} pending`,
    },
    {
      label: "Announcements",
      value: totalAnnouncements,
      icon: BellRing,
      from: "from-indigo-500",
      to: "to-indigo-700",
      light: "text-indigo-100",
      hint: "Latest updates",
    },
    {
      label: "Problem Status",
      value: problem?.status ? 1 : 0,
      icon: Sparkles,
      from: "from-fuchsia-500",
      to: "to-indigo-600",
      light: "text-fuchsia-100",
      hint: problem?.status || "Not submitted",
    },
  ];

  return (
    <div className="font-[Poppins] bg-white flex flex-col min-h-screen">
      <Header
        name={student?.name_of_student || student?.name_of_students || student?.name || "Student"}
        id={student?.enrollment_no || "----"}
      />
      <div className="flex flex-1 flex-col lg:flex-row mt-[72px]">
        <Sidebar />
        <main className="flex-1 px-3 py-5 sm:px-5 md:px-8 bg-white lg:ml-72 mb-24 lg:mb-0">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-7">
            <div
              className="rounded-2xl p-5 sm:p-7 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{ background: "linear-gradient(120deg,#6d58f0 0%,#4e38c7 55%,#3b2aad 100%)" }}
            >
              <div>
                <p className="text-purple-200 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1">
                  Student Dashboard
                </p>
                <h1 className="text-[clamp(1.75rem,7.5vw,2.25rem)] font-bold leading-tight break-words">
                  Welcome, {student?.name_of_student || student?.name_of_students || student?.name || "Student"}
                </h1>
                <p className="text-purple-200 text-sm mt-1">
                  Track your team, evaluations, and project statement from one place.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
                <div className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-3 w-full sm:min-w-[130px]">
                  <p className="text-xs text-purple-200 font-medium">Enrollment</p>
                  <p className="text-white font-bold text-base truncate">{student?.enrollment_no || "----"}</p>
                </div>
                <div className="bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-3 w-full sm:min-w-[130px]">
                  <p className="text-xs text-purple-200 font-medium">Evaluated Forms</p>
                  <p className="text-white font-bold text-base">{evaluatedForms}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {topStats.map(({ label, value, icon: Icon, from, to, light, hint }) => (
                <div
                  key={label}
                  className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-4 sm:p-5 text-white shadow-md hover:shadow-xl transition-all`}
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-2xl sm:text-4xl font-extrabold leading-none">{value}</span>
                  </div>
                  <p className={`${light} text-xs sm:text-sm font-semibold leading-tight`}>{label}</p>
                  <p className="text-[11px] sm:text-xs text-white/80 mt-1 truncate">{hint}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-purple-800">Quick Actions</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Fast access to announcements, posts, documents, and collaboration tools.</p>
                </div>
                <button
                  onClick={() => handleCardClick("Announcements")}
                  className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 font-semibold"
                >
                  Open announcements
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4">
                <DashboardCards onCardClick={handleCardClick} />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
              <div className="xl:col-span-8">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-purple-800">Team Workspace</h2>
                  {hasGroup && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                      Group: {groupSnapshot?.group_id}
                    </span>
                  )}
                </div>
              <GroupDetails enrollmentNo={student.enrollment_no} />

              {/* Evaluation Marks */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-purple-100 mt-6 sm:mt-8 flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <h2 className="text-xl font-bold text-purple-800">Evaluation Marks</h2>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                      {evaluationMarks.length} total
                    </span>
                  </div>
                {evaluationMarks.length === 0 ? (
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 text-center">
                      <p className="text-purple-700 font-medium">Marks are not available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    {evaluationMarks.map((entry) => {
                      const evaluation = entry.evaluation;
                      const marksLabel = evaluation
                        ? evaluation.absent
                          ? "AB"
                          : `${evaluation.total ?? "NA"}/${entry.total_marks ?? "-"}`
                        : null;

                      return (
                          <div
                            key={entry.form_id}
                            className="border border-purple-100 rounded-xl p-4 bg-gradient-to-br from-white to-purple-50 shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-3 gap-3">
                              <h3 className="font-semibold text-purple-700 leading-tight">
                              {entry.form_name || "Evaluation"}
                            </h3>
                              <span className="text-xs text-gray-500 whitespace-nowrap">{entry.total_marks ?? "-"} marks</span>
                            </div>
                          {evaluation ? (
                            <>
                                <p className="text-gray-700 text-sm">
                                  <span className="font-bold">Marks:</span> {marksLabel}
                              </p>
                              {entry.created_at && (
                                  <p className="text-gray-700 text-sm mt-1">
                                  <span className="font-bold">Date:</span>{" "}
                                  {new Date(entry.created_at).toLocaleDateString()}
                                </p>
                              )}
                                <p className="text-gray-700 text-sm mt-2 leading-relaxed">
                                <span className="font-bold">Feedback:</span>{" "}
                                {evaluation.feedback || "No feedback yet."}
                              </p>
                            </>
                          ) : (
                              <p className="text-gray-500 text-sm">Marks not available.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

              <div className="xl:col-span-4 bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden h-fit xl:sticky xl:top-24">
              {/* Header */}
                <div className="px-5 sm:px-6 py-5 border-b border-purple-100 bg-gradient-to-r from-purple-600 to-purple-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                    <h2 className="text-xl font-bold text-white">
                    Problem Statement
                  </h2>
                </div>
              </div>

              {/* Content */}
                <div className="p-5 sm:p-6">
                {problem ? (
                  <div className="space-y-4">
                    {/* Status Badge */}
                    {problem.status && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-purple-100">
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${problemStatusClasses}`}>
                            {problem.status === 'APPROVED' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : problem.status === 'REJECTED' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                            Status: {problem.status}
                          </span>
                        </div>
                        {problem.updated_at && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(problem.updated_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Rejection Feedback Alert */}
                    {problem.status === 'REJECTED' && problem.review_feedback && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-800 font-semibold text-sm mb-1">Mentor Feedback:</p>
                            <p className="text-red-700 text-sm leading-relaxed">{problem.review_feedback}</p>
                            <p className="text-red-600 text-xs mt-2 italic">
                              Please update your problem statement based on the feedback.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Approval Success Message */}
                    {problem.status === 'APPROVED' && (
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-1 bg-purple-100 rounded-full">
                            <CheckCircle className="w-5 h-5 text-purple-600" />
                          </div>
                          <p className="text-purple-900 font-semibold text-sm">
                            Your problem statement has been approved by your mentor!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 leading-tight">
                        {problem.title}
                      </h3>
                    </div>

                    {/* Metadata Grid */}
                    {(problem.type || problem.technologybucket || problem.domain) && (
                      <div className="grid grid-cols-1 gap-3">
                        {problem.type && (
                          <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <Target className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-blue-600 font-medium">Type</p>
                              <p className="text-sm text-gray-900 font-semibold">{problem.type}</p>
                            </div>
                          </div>
                        )}
                        
                        {problem.technologybucket && (
                          <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3 border border-green-100">
                            <Code className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-green-600 font-medium">Technology</p>
                              <p className="text-sm text-gray-900 font-semibold">{problem.technologybucket}</p>
                            </div>
                          </div>
                        )}
                        
                        {problem.domain && (
                          <div className="flex items-center gap-3 bg-orange-50 rounded-lg p-3 border border-orange-100">
                            <Globe className="w-5 h-5 text-orange-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-orange-600 font-medium">Domain</p>
                              <p className="text-sm text-gray-900 font-semibold">{problem.domain}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {problem.description && (
                        <div className="mt-4 pt-4 border-t border-purple-100">
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">Description</h4>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                          {problem.description}
                        </p>
                      </div>
                    )}

                    {/* Edit Button */}
                    <div className="pt-4 border-t border-purple-100">
                      <a
                        href="/student/problem-statement"
                          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Edit Problem Statement
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                      <div className="p-4 bg-purple-100 rounded-full mb-4">
                        <Lightbulb className="w-12 h-12 text-purple-500" />
                    </div>
                    <p className="text-gray-600 font-medium mb-4 text-center">
                      No problem statement submitted yet
                    </p>
                    <a
                      href="/student/problem-statement"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Add Problem Statement
                    </a>
                  </div>
                )}
              </div>
            </div>
            </div>

            {problem?.status && (
              <div className="rounded-2xl border border-purple-100 bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-purple-700">Project Statement Status</p>
                    <p className="text-xs text-gray-500">Keep your problem statement updated for faster mentor review.</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold w-fit ${problemStatusClasses}`}>
                    {approvedProblem ? <CheckCircle className="w-4 h-4" /> : pendingProblem ? <Clock className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {problem.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Enhanced Info Drawer with custom content for announcements */}
      <InfoDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerContent.title}
        message={drawerContent.isAnnouncementView ? null : drawerContent.message}
        customContent={
          drawerContent.isAnnouncementView ? <AnnouncementsContent /> : null
        }
      />

      {/* Posts Modal */}
      <StudentPosts
        isModalOpen={showPostModal}
        onCloseModal={handleClosePostModal}
        triggerFetch={triggerPostsFetch}
      />
    </div>
  );
};

export default StudentDashboard;