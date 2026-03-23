import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import MentorSidebar from "../../Components/Mentor/MentorSidebar";
import ProblemStatementModal from "../../Components/Mentor/ProblemStatementModal";
import { apiRequest } from "../../api";
import {
  Users,
  FileText,
  ChevronDown,
  AlertTriangle,
  BookOpen,
  BadgeCheck,
  Layers,
  User,
  Mail,
  Phone,
  Github,
  Linkedin,
  Globe,
  X,
  Download,
  FileCheck,
  FileX,
  Upload,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  BarChart3,
  Trash2
} from "lucide-react";

const MentorGroups = () => {
  const navigate = useNavigate();
  const { groupId: groupIdParam } = useParams();
  const [mentor, setMentor] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [students, setStudents] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [problemStatement, setProblemStatement] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [error, setError] = useState("");

  const errorText = React.useMemo(() => {
    if (!error) return "";
    if (typeof error === "string") return error;
    if (typeof error === "object") {
      if (typeof error.message === "string") return error.message;
      try {
        return JSON.stringify(error);
      } catch {
        return "Something went wrong.";
      }
    }
    return String(error);
  }, [error]);

  const renderMarkCellValue = (mark) => {
    if (typeof mark === "boolean") {
      return mark ? "✓" : "✗";
    }

    if (mark && typeof mark === "object") {
      const fileUrl = typeof mark.url === "string" ? mark.url : "";
      const fileName = typeof mark.name === "string" && mark.name ? mark.name : "View file";

      if (fileUrl) {
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-purple-600 hover:underline"
          >
            {fileName}
          </a>
        );
      }

      try {
        return JSON.stringify(mark);
      } catch {
        return "[Object]";
      }
    }

    if (mark === null || mark === undefined || mark === "") return "-";
    return String(mark);
  };
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [expandedEvaluations, setExpandedEvaluations] = useState(new Set());

  const token = useMemo(() => localStorage.getItem("mentor_token"), []);

  useEffect(() => {
    if (!token) {
      navigate("/pblmanagementfacultydashboardlogin");
      return;
    }

    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        const groupsRes = await apiRequest("/api/mentors/groups", "GET", null, token);
        const mentorGroups = groupsRes?.data?.groups || groupsRes?.groups || [];
        const mentorName = groupsRes?.data?.mentor_name || groupsRes?.mentor_name;

        const tokenData = JSON.parse(atob(token.split(".")[1]));
        setMentor({
          name: tokenData.mentor_name || mentorName,
          id: tokenData.mentor_id,
          contact: tokenData.contact_number
        });

        setGroups(mentorGroups);

        const initialGroup = groupIdParam || mentorGroups[0] || "";
        setSelectedGroupId(initialGroup);
      } catch (err) {
        console.error("Error fetching mentor groups:", err);
        setError("Unable to load groups.");
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, [groupIdParam, navigate, token]);

  useEffect(() => {
    if (!selectedGroupId || !token) {
      setStudents([]);
      setTeamName("");
      setProblemStatement(null);
      setLoadingDetails(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoadingDetails(true);
        setError("");
        setStudents([]);
        setTeamName("");
        setProblemStatement(null);

        const [studentsRes, problemRes] = await Promise.all([
          apiRequest(`/api/students/group/${selectedGroupId}`, "GET", null, token),
          apiRequest(`/api/students/student/problem-statement/${selectedGroupId}`, "GET", null, token)
        ]);

        const groupStudents = studentsRes?.data?.students || studentsRes?.students || [];
        const ps = problemRes?.data?.problemStatement || problemRes?.problemStatement || null;

        setStudents(groupStudents);
        setTeamName(groupStudents[0]?.team_name || "");
        setProblemStatement(ps);
      } catch (err) {
        console.error("Error fetching group details:", err);
        setError("Unable to load group details.");
        setStudents([]);
        setProblemStatement(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedGroupId, token]);

  const handleGroupChange = (event) => {
    const nextGroupId = event.target.value;
    setSelectedGroupId(nextGroupId);
    if (nextGroupId) {
      navigate(`/mentor/groups/${nextGroupId}`);
    }
  };

  const handleMemberClick = async (member) => {
    const enrollmentNo = member.enrollment_no || member.enrollement_no;
    if (!enrollmentNo || !token) {
      return;
    }

    setSelectedMember(member);
    setProfileLoading(true);
    try {
      const profileRes = await apiRequest(
        `/api/students/profile/${enrollmentNo}`,
        "GET",
        null,
        token
      );
      setMemberProfile(profileRes?.data?.profile || profileRes?.profile || null);
    } catch (err) {
      console.error("Error fetching member profile:", err);
      setMemberProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const closeMemberProfile = () => {
    setSelectedMember(null);
    setMemberProfile(null);
  };

  const handleProblemStatementSuccess = (savedData) => {
    setProblemStatement(savedData);
  };

  useEffect(() => {
    if (!selectedGroupId || !token) {
      setDocuments([]);
      return;
    }

    const fetchDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const response = await apiRequest(
          `/api/mentors/documents/${selectedGroupId}`,
          "GET",
          null,
          token
        );
        setDocuments(response?.data?.documents || response?.documents || []);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setDocuments([]);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, [selectedGroupId, token]);

  useEffect(() => {
    if (!selectedGroupId || !token) {
      setEvaluations([]);
      return;
    }

    const fetchEvaluations = async () => {
      try {
        setLoadingEvaluations(true);
        const response = await apiRequest(
          `/api/mentors/evaluations/${selectedGroupId}`,
          "GET",
          null,
          token
        );
        setEvaluations(response?.data?.evaluations || response?.evaluations || []);
      } catch (err) {
        console.error("Error fetching evaluations:", err);
        setEvaluations([]);
      } finally {
        setLoadingEvaluations(false);
      }
    };

    fetchEvaluations();
  }, [selectedGroupId, token]);

  const toggleEvaluation = (index) => {
    setExpandedEvaluations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleApproveDocument = async (documentId) => {
    setConfirmAction(null);
    try {
      await apiRequest(
        `/api/mentors/documents/${documentId}/status`,
        "PUT",
        { status: "approved" },
        token
      );
      
      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === documentId ? { ...doc, status: "approved" } : doc
        )
      );
    } catch (err) {
      console.error("Error approving document:", err);
      alert("Failed to approve document. Please try again.");
    }
  };

  const handleRejectDocument = async (documentId, feedback) => {
    if (!feedback || !feedback.trim()) {
      alert('Please provide feedback for rejection.');
      return;
    }
    
    setConfirmAction(null);
    try {
      await apiRequest(
        `/api/mentors/documents/${documentId}/status`,
        "PUT",
        { status: "rejected", feedback },
        token
      );
      
      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === documentId ? { ...doc, status: "rejected", rejection_feedback: feedback } : doc
        )
      );
      setRejectionFeedback('');
    } catch (err) {
      console.error("Error rejecting document:", err);
      alert("Failed to reject document. Please try again.");
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this rejected document?')) {
      return;
    }
    
    try {
      await apiRequest(
        `/api/mentors/documents/${documentId}`,
        "DELETE",
        null,
        token
      );
      
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== documentId));
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Failed to delete document. Please try again.");
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      const matchesSearch = doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [documents, selectedCategory, statusFilter, searchQuery]);

  const documentStats = useMemo(() => {
    return {
      total: documents.length,
      pending: documents.filter(d => d.status === "pending").length,
      approved: documents.filter(d => d.status === "approved").length,
      rejected: documents.filter(d => d.status === "rejected").length
    };
  }, [documents]);

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <MentorHeader name={mentor?.name || "Mentor"} id={mentor?.id || "----"} />
      <div className="flex flex-1 flex-col lg:flex-row mt-[72px]">
        <MentorSidebar />
        <main className="flex-1 p-4 md:p-8 bg-gray-50 lg:ml-72 mb-16 lg:mb-0">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-3">
                My Groups Workspace
              </h1>
              <p className="text-gray-600 text-base md:text-lg">
                Review group details, members, and problem statements at a glance.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-5 md:p-6 border border-white/50 mb-8">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Select Group</p>
                  <div className="relative mt-2">
                    <select
                      value={selectedGroupId}
                      onChange={handleGroupChange}
                      className="w-full appearance-none rounded-xl border border-purple-200 bg-white py-3 pl-4 pr-10 text-base font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={loadingGroups || groups.length === 0}
                    >
                      {loadingGroups && <option>Loading groups...</option>}
                      {!loadingGroups && groups.length === 0 && <option>No groups assigned</option>}
                      {!loadingGroups && groups.map((groupId) => (
                        <option key={groupId} value={groupId}>
                          {groupId}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-purple-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-4 text-white shadow-lg">
                    <p className="text-sm uppercase tracking-wider text-purple-100">Active Group</p>
                    <p className="text-2xl font-bold mt-1">
                      {selectedGroupId || "Not Selected"}
                    </p>
                    <p className="text-sm text-purple-100 mt-1">
                      {students.length} members assigned
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <span>{errorText}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Group Details</p>
                    <h2 className="text-xl font-bold text-gray-900">Overview</h2>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Group ID</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedGroupId || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total Members</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {students.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      <BadgeCheck className="w-4 h-4" />
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Problem Statement</p>
                    <h2 className="text-xl font-bold text-gray-900">Project Scope</h2>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                {loadingDetails ? (
                  <p className="text-sm text-gray-500">Loading problem statement...</p>
                ) : problemStatement ? (
                  <div className="space-y-4">
                    {/* Status and Timestamp Section */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          problemStatement.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-700'
                            : problemStatement.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {problemStatement.status === 'APPROVED' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : problemStatement.status === 'REJECTED' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {problemStatement.status || 'PENDING'}
                        </span>
                        {problemStatement.updated_at && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            Last updated: {new Date(problemStatement.updated_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* PS Content */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {problemStatement.title}
                      </h3>
                      <p className="text-sm text-gray-600">{problemStatement.description || "No description provided."}</p>
                      <div className="flex flex-wrap gap-2">
                        {problemStatement.type && (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                            {problemStatement.type}
                          </span>
                        )}
                        {problemStatement.domain && (
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                            {problemStatement.domain}
                          </span>
                        )}
                        {problemStatement.technologybucket && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {problemStatement.technologybucket}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                      <ProblemStatementModal
                        selectedGroupId={selectedGroupId}
                        problemStatement={problemStatement}
                        onSuccess={handleProblemStatementSuccess}
                        isReadOnly={false}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      No problem statement submitted yet.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-purple-800 mb-1">Evaluation Marks</h2>
                    <p className="text-sm text-gray-600">View marks from all review cycles</p>
                  </div>
                  <button
                    onClick={() => navigate('/mentor/evaluation')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-semibold"
                  >
                    Add Evaluation
                  </button>
                </div>
              </div>

              {!selectedGroupId ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="text-gray-900 font-medium">Select a group to view evaluations</p>
                </div>
              ) : loadingEvaluations ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-900 font-medium">Loading evaluations...</p>
                </div>
              ) : evaluations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-gray-900 font-medium mb-1">No evaluations found</p>
                  <p className="text-sm text-gray-600">This group hasn't been evaluated yet</p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {evaluations.map((evaluation, idx) => (
                    <div 
                      key={idx} 
                      className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-purple-300 transform-gpu"
                    >
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 cursor-pointer hover:from-purple-700 hover:to-indigo-700 transition-colors duration-200"
                        onClick={() => toggleEvaluation(idx)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white">{evaluation.form_name}</h3>
                            {evaluation.external_name && (
                              <p className="text-purple-100 text-sm mt-1">External: {evaluation.external_name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-semibold backdrop-blur-sm">
                              Total: {evaluation.total_marks} marks
                            </span>
                            <button
                              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 hover:scale-110 transform-gpu"
                            >
                              <ChevronDown className={`w-5 h-5 text-white transition-transform duration-300 ease-out ${expandedEvaluations.has(idx) ? 'rotate-180' : 'rotate-0'}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div 
                        className={`transition-all duration-300 ease-out overflow-hidden ${
                          expandedEvaluations.has(idx) 
                            ? 'max-h-[2000px] opacity-100' 
                            : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Student</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Enrollment No</th>
                                  {evaluation.student_marks?.[0]?.marks && Object.keys(evaluation.student_marks[0].marks).map((key) => (
                                    <th key={key} className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">{key}</th>
                                  ))}
                                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Total</th>
                                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {evaluation.student_marks?.map((studentMark, sIdx) => (
                                  <tr key={sIdx} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                      {studentMark.student_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                      {studentMark.enrollment_no}
                                    </td>
                                    {studentMark.marks && Object.entries(studentMark.marks).map(([markKey, mark], mIdx) => (
                                      <td key={`${markKey}-${mIdx}`} className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                                        {renderMarkCellValue(mark)}
                                      </td>
                                    ))}
                                    <td className="px-6 py-4 text-center">
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-700">
                                        {studentMark.total}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      {studentMark.absent ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                          Absent
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                          Present
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {evaluation.feedback && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Feedback</p>
                              <p className="text-sm text-gray-700">{evaluation.feedback}</p>
                            </div>
                          )}

                          {evaluation.submitted_at && (
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                              <p className="text-xs text-gray-500">
                                Submitted on {new Date(evaluation.submitted_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-black mb-1">Document Review System</h2>
                    <p className="text-sm text-gray-800">Evaluate and approve student submissions</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-gray-700" />
                    <span className="text-sm font-medium text-black">Academic Review</span>
                  </div>
                </div>
              </div>

              {!selectedGroupId ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="text-gray-900 font-medium">Select a group to view documents</p>
                  <p className="text-sm text-gray-700 mt-1">Choose a group from the dropdown above</p>
                </div>
              ) : (
                <>
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-100 bg-slate-50/50">
                    <div className="bg-white rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Total</p>
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <p className="text-2xl font-bold text-black">{documentStats.total}</p>
                      <p className="text-xs text-gray-700 mt-1">Documents</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 hover:border-amber-300 transition">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pending</p>
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-2xl font-bold text-amber-700">{documentStats.pending}</p>
                      <p className="text-xs text-amber-600 mt-1">Awaiting Review</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 hover:border-emerald-300 transition">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Approved</p>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-2xl font-bold text-emerald-700">{documentStats.approved}</p>
                      <p className="text-xs text-emerald-600 mt-1">Accepted</p>
                    </div>
                    <div className="bg-rose-50 rounded-lg p-4 border border-rose-200 hover:border-rose-300 transition">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Rejected</p>
                        <XCircle className="w-4 h-4 text-rose-500" />
                      </div>
                      <p className="text-2xl font-bold text-rose-700">{documentStats.rejected}</p>
                      <p className="text-xs text-rose-600 mt-1">Not Approved</p>
                    </div>
                  </div>

                  {/* Filters and Search */}
                  <div className="p-6 bg-white border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
                          Search Documents
                        </label>
                        <div className="relative">
                          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search by filename or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm bg-white text-black"
                          />
                        </div>
                      </div>
                      <div className="lg:w-64">
                        <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
                          Category
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm bg-white appearance-none cursor-pointer text-black"
                        >
                          <option value="all">All Categories</option>
                          <option value="reports">Reports</option>
                          <option value="presentations">Presentations</option>
                          <option value="code">Code</option>
                          <option value="videos">Videos</option>
                        </select>
                      </div>
                      <div className="lg:w-48">
                        <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
                          Status
                        </label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm bg-white appearance-none cursor-pointer text-black"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Document List */}
                  {loadingDocuments ? (
                    <div className="text-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
                      <p className="mt-4 text-sm text-gray-900 font-medium">Loading documents...</p>
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-gray-900 font-medium mb-1">
                        {searchQuery || selectedCategory !== "all" || statusFilter !== "all"
                          ? "No documents match your filters"
                          : "No documents uploaded yet"}
                      </p>
                      <p className="text-sm text-gray-700">
                        {searchQuery || selectedCategory !== "all" || statusFilter !== "all"
                          ? "Try adjusting your search criteria"
                          : "Students haven't uploaded any documents for this group"}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                              Document
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                              Submitted By
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-black uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {filteredDocuments.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-50 transition">
                              <td className="px-6 py-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-slate-100 rounded-lg">
                                    <FileText className="w-5 h-5 text-gray-700" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-black truncate">
                                      {doc.document_name}
                                    </p>
                                    {doc.description && (
                                      <p className="text-xs text-gray-700 mt-1 line-clamp-1">
                                        {doc.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-black capitalize">
                                  {doc.category}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-gray-700" />
                                  </div>
                                  <span className="text-sm text-black font-medium">
                                    {doc.uploaded_by || "Unknown"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm text-black">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(doc.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                    doc.status === "approved"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : doc.status === "rejected"
                                      ? "bg-rose-100 text-rose-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {getStatusIcon(doc.status)}
                                  <span className="capitalize">{doc.status}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <a
                                    href={doc.document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-black bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                  </a>
                                  {doc.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() => setConfirmAction({ type: 'approve', doc })}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => setConfirmAction({ type: 'reject', doc })}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {doc.status === "rejected" && (
                                    <button
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {filteredDocuments.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                      <p className="text-xs text-gray-800">
                        Showing <span className="font-semibold text-black">{filteredDocuments.length}</span> of{" "}
                        <span className="font-semibold text-black">{documents.length}</span> documents
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Group Members</p>
                  <h2 className="text-xl font-bold text-gray-900">{teamName || ""}</h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Layers className="w-4 h-4" />
                  {students.length} Members
                </div>
              </div>

              {!selectedGroupId ? (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Select a group to view the roster.
                </div>
              ) : loadingDetails ? (
                <p className="text-sm text-gray-500">Loading members...</p>
              ) : students.length === 0 ? (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  No students found for this group.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map((student) => (
                    <div
                      key={student.enrollment_no || student.enrollement_no}
                      className="rounded-xl border border-gray-200 p-4 bg-gray-50 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {student.student_name || student.name_of_student || student.name_of_students || "Student"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.enrollment_no || student.enrollement_no || "-"}
                          </p>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Class: {student.class || student.class_division || "N/A"}
                      </p>
                      <button
                        onClick={() => handleMemberClick(student)}
                        className="mt-4 w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition"
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {selectedMember && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">Member Profile</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedMember.student_name || selectedMember.name_of_student || selectedMember.name_of_students || "Student"}
                </h3>
              </div>
              <button
                onClick={closeMemberProfile}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {profileLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-3 text-sm text-gray-600">Loading profile...</p>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mb-3 border border-gray-200">
                      {memberProfile?.profile_picture_url ? (
                        <img
                          src={memberProfile.profile_picture_url}
                          alt={selectedMember.name_of_student || "Profile"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextElementSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full items-center justify-center ${memberProfile?.profile_picture_url ? "hidden" : "flex"}`}>
                        <User className="w-9 h-9 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedMember.enrollment_no || selectedMember.enrollement_no || "-"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Class</label>
                        <p className="text-sm text-gray-900">
                          {memberProfile?.class || memberProfile?.class_division || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                        <p className="text-sm text-gray-900 break-all">
                          {memberProfile?.email_id ? (
                            <a
                              href={`mailto:${memberProfile.email_id}`}
                              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
                            >
                              <Mail className="w-4 h-4" />
                              {memberProfile.email_id}
                            </a>
                          ) : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone</label>
                        <p className="text-sm text-gray-900">
                          {memberProfile?.phone ? (
                            <a
                              href={`tel:${memberProfile.phone}`}
                              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
                            >
                              <Phone className="w-4 h-4" />
                              {memberProfile.phone}
                            </a>
                          ) : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Bio</label>
                        <p className="text-sm text-gray-900">
                          {memberProfile?.bio || "No bio available"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Skills</label>
                        <div className="flex flex-wrap gap-2">
                          {memberProfile?.skills ? (
                            memberProfile.skills.split(",").map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                              >
                                {skill.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No skills listed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Links</h4>
                    <div className="flex flex-wrap gap-2">
                      {memberProfile?.github_url && (
                        <a
                          href={memberProfile.github_url.startsWith("http") ? memberProfile.github_url : `https://${memberProfile.github_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                          <Github className="h-4 w-4 mr-1" />
                          GitHub
                        </a>
                      )}
                      {memberProfile?.linkedin_url && (
                        <a
                          href={memberProfile.linkedin_url.startsWith("http") ? memberProfile.linkedin_url : `https://${memberProfile.linkedin_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                        >
                          <Linkedin className="h-4 w-4 mr-1" />
                          LinkedIn
                        </a>
                      )}
                      {memberProfile?.portfolio_url && (
                        <a
                          href={memberProfile.portfolio_url.startsWith("http") ? memberProfile.portfolio_url : `https://${memberProfile.portfolio_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          Portfolio
                        </a>
                      )}
                      {!memberProfile?.github_url && !memberProfile?.linkedin_url && !memberProfile?.portfolio_url && (
                        <p className="text-sm text-gray-500">No links available</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    {memberProfile?.resume_url ? (
                      <a
                        href={memberProfile.resume_url}
                        download
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Resume
                      </a>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-medium">
                        Resume not available
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-slate-200">
            <div className={`flex items-center justify-between p-6 border-b ${
              confirmAction.type === 'approve' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex items-center gap-3">
                {confirmAction.type === 'approve' ? (
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-rose-600" />
                  </div>
                )}
                <div>
                  <h3 className={`text-lg font-bold ${
                    confirmAction.type === 'approve' ? 'text-emerald-900' : 'text-rose-900'
                  }`}>
                    {confirmAction.type === 'approve' ? 'Approve Document' : 'Reject Document'}
                  </h3>
                  <p className={`text-sm ${
                    confirmAction.type === 'approve' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    Confirm your decision
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmAction(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-700 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black break-words">
                      {confirmAction.doc.document_name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-black capitalize">
                        {confirmAction.doc.category}
                      </span>
                      <span className="text-xs text-gray-800">
                        by {confirmAction.doc.uploaded_by || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {confirmAction.type === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Rejection Feedback <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    value={rejectionFeedback}
                    onChange={(e) => setRejectionFeedback(e.target.value)}
                    placeholder="Explain why this document is being rejected..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    This feedback will be shown to the student.
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-900 mb-6">
                {confirmAction.type === 'approve' ? (
                  <>
                    Are you sure you want to <span className="font-semibold text-emerald-700">approve</span> this document? 
                    Students will be able to see this approval status immediately.
                  </>
                ) : (
                  <>
                    Please provide feedback explaining why you are rejecting this document.
                  </>
                )}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-black bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmAction.type === 'approve' 
                      ? handleApproveDocument(confirmAction.doc.id)
                      : handleRejectDocument(confirmAction.doc.id, rejectionFeedback);
                  }}
                  disabled={confirmAction.type === 'reject' && !rejectionFeedback.trim()}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    confirmAction.type === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {confirmAction.type === 'approve' ? 'Approve Document' : 'Reject Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorGroups;
