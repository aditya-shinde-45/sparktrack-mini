import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import IndustryMentorSidebar from "../../Components/Mentor/IndustryMentorSidebar";
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
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3
} from "lucide-react";

const IndustryMentorGroups = () => {
  const navigate = useNavigate();
  const { groupId: groupIdParam } = useParams();
  const [mentor, setMentor] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupsByFaculty, setGroupsByFaculty] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [students, setStudents] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [problemStatement, setProblemStatement] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [evaluations, setEvaluations] = useState([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [expandedEvaluations, setExpandedEvaluations] = useState(new Set());

  const token = useMemo(() => localStorage.getItem("industry_mentor_token"), []);

  useEffect(() => {
    if (!token) {
      navigate("/pblmanagementfacultydashboardlogin");
      return;
    }

    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        const groupsRes = await apiRequest("/api/industrial-mentors/groups", "GET", null, token);
        const mentorGroups = groupsRes?.data?.groups || groupsRes?.groups || [];
        const facultyGroups = groupsRes?.data?.groupsByFaculty || groupsRes?.groupsByFaculty || [];

        const tokenData = JSON.parse(atob(token.split(".")[1]));
        setMentor({
          name: tokenData.name,
          id: tokenData.industrial_mentor_code || tokenData.mentor_code
        });

        setGroups(mentorGroups);
        setGroupsByFaculty(facultyGroups);
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

  const handleGroupChange = (event) => {
    const nextGroupId = event.target.value;
    setSelectedGroupId(nextGroupId);
    if (nextGroupId) {
      navigate(`/industry-mentor/groups/${nextGroupId}`);
    }
  };

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <MentorHeader name={mentor?.name || "Industry Mentor"} id={mentor?.id || "----"} />
      <div className="flex flex-1 flex-col lg:flex-row mt-[80px]">
        <IndustryMentorSidebar />
        <main className="flex-1 p-4 md:p-8 bg-gray-50 lg:ml-72 mb-16 lg:mb-0">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-3">
                Industry Mentor Workspace
              </h1>
              <p className="text-gray-600 text-base md:text-lg">
                Review group details and problem statements.
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
                      {!loadingGroups && groupsByFaculty.length > 0
                        ? groupsByFaculty.map((faculty) => (
                            <optgroup key={faculty.mentor_code} label={`Faculty: ${faculty.faculty_name}`}>
                              {faculty.groups.map((groupId) => (
                                <option key={groupId} value={groupId}>
                                  {groupId}
                                </option>
                              ))}
                            </optgroup>
                          ))
                        : !loadingGroups && groups.map((groupId) => (
                            <option key={groupId} value={groupId}>
                              {groupId}
                            </option>
                          ))
                      }
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
                <span>{error}</span>
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
                ) : (
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    No problem statement submitted yet.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-black mb-1">Document Review System</h2>
                    <p className="text-sm text-gray-800">View student submissions</p>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-100 bg-slate-50/50">
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-700 uppercase">Total</p>
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <p className="text-2xl font-bold text-black">{documentStats.total}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-amber-700 uppercase">Pending</p>
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-2xl font-bold text-amber-700">{documentStats.pending}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-emerald-700 uppercase">Approved</p>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-2xl font-bold text-emerald-700">{documentStats.approved}</p>
                    </div>
                    <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-rose-700 uppercase">Rejected</p>
                        <XCircle className="w-4 h-4 text-rose-500" />
                      </div>
                      <p className="text-2xl font-bold text-rose-700">{documentStats.rejected}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-white border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-900 uppercase mb-2">Search</label>
                        <div className="relative">
                          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                          />
                        </div>
                      </div>
                      <div className="lg:w-64">
                        <label className="block text-xs font-semibold text-gray-900 uppercase mb-2">Category</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                        >
                          <option value="all">All Categories</option>
                          <option value="reports">Reports</option>
                          <option value="presentations">Presentations</option>
                          <option value="code">Code</option>
                          <option value="videos">Videos</option>
                        </select>
                      </div>
                      <div className="lg:w-48">
                        <label className="block text-xs font-semibold text-gray-900 uppercase mb-2">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

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
                      <p className="text-gray-900 font-medium mb-1">No documents found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase">Document</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase">Submitted By</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-black uppercase">Actions</th>
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
                                    <p className="text-sm font-semibold text-black truncate">{doc.document_name}</p>
                                    {doc.description && <p className="text-xs text-gray-700 mt-1 line-clamp-1">{doc.description}</p>}
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
                                  <span className="text-sm text-black font-medium">{doc.uploaded_by || "Unknown"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm text-black">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(doc.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                  doc.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                                  doc.status === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                                }`}>
                                  {getStatusIcon(doc.status)}
                                  <span className="capitalize">{doc.status}</span>
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <a
                                  href={doc.document_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-black bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-purple-800 mb-1">Evaluation Marks</h2>
                    <p className="text-sm text-gray-600">View marks from all review cycles</p>
                  </div>
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
                                    {studentMark.marks && Object.values(studentMark.marks).map((mark, mIdx) => (
                                      <td key={mIdx} className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                                        {typeof mark === 'boolean' ? (mark ? '✓' : '✗') : mark}
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
              <button onClick={closeMemberProfile} className="text-gray-400 hover:text-gray-600 transition">
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
                        <img src={memberProfile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-9 h-9 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedMember.enrollment_no || selectedMember.enrollement_no || "-"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Class</label>
                        <p className="text-sm text-gray-900">{memberProfile?.class || "N/A"}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                        <p className="text-sm text-gray-900 break-all">
                          {memberProfile?.email_id ? (
                            <a href={`mailto:${memberProfile.email_id}`} className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2">
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
                            <a href={`tel:${memberProfile.phone}`} className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2">
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
                        <p className="text-sm text-gray-900">{memberProfile?.bio || "No bio available"}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Skills</label>
                        <div className="flex flex-wrap gap-2">
                          {memberProfile?.skills ? (
                            memberProfile.skills.split(",").map((skill, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
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
                        <a href={memberProfile.github_url.startsWith("http") ? memberProfile.github_url : `https://${memberProfile.github_url}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                          <Github className="h-4 w-4 mr-1" />
                          GitHub
                        </a>
                      )}
                      {memberProfile?.linkedin_url && (
                        <a href={memberProfile.linkedin_url.startsWith("http") ? memberProfile.linkedin_url : `https://${memberProfile.linkedin_url}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
                          <Linkedin className="h-4 w-4 mr-1" />
                          LinkedIn
                        </a>
                      )}
                      {memberProfile?.portfolio_url && (
                        <a href={memberProfile.portfolio_url.startsWith("http") ? memberProfile.portfolio_url : `https://${memberProfile.portfolio_url}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">
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
                      <a href={memberProfile.resume_url} download
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
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
    </div>
  );
};

export default IndustryMentorGroups;
