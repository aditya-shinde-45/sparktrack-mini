import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import IndustryMentorSidebar from "../../Components/Mentor/IndustryMentorSidebar";
import { apiRequest } from "../../api";
import {
  Users, FileText, ChevronDown, AlertTriangle, BookOpen, BadgeCheck, Layers,
  User, Mail, Phone, Github, Linkedin, Globe, X, Download, Search, Eye,
  Clock, CheckCircle, XCircle, Calendar, BarChart3, Trash2
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
  const [evaluationForms, setEvaluationForms] = useState([]);
  const [selectedEvaluationFormId, setSelectedEvaluationFormId] = useState("");
  const [selectedEvaluationFormFields, setSelectedEvaluationFormFields] = useState([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [expandedEvaluations, setExpandedEvaluations] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const token = useMemo(() => localStorage.getItem("industry_mentor_token"), []);

  useEffect(() => {
    if (!token) {
      navigate("/pblmanagementfacultydashboardlogin");
      return;
    }

    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        const [groupsRes, formsRes] = await Promise.all([
          apiRequest("/api/industrial-mentors/groups", "GET", null, token),
          apiRequest("/api/industrial-mentors/evaluation-forms", "GET", null, token)
        ]);
        const mentorGroups = groupsRes?.data?.groups || groupsRes?.groups || [];
        const facultyGroups = groupsRes?.data?.groupsByFaculty || groupsRes?.groupsByFaculty || [];
        const availableForms = formsRes?.data || formsRes || [];

        const tokenData = JSON.parse(atob(token.split(".")[1]));
        setMentor({
          name: tokenData.name,
          id: tokenData.industrial_mentor_code || tokenData.mentor_code
        });

        setGroups(mentorGroups);
        setGroupsByFaculty(facultyGroups);
        setEvaluationForms(Array.isArray(availableForms) ? availableForms : []);
        if (Array.isArray(availableForms) && availableForms.length > 0) {
          setSelectedEvaluationFormId(availableForms[0].id);
        }
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
    if (!selectedEvaluationFormId || !token) {
      setSelectedEvaluationFormFields([]);
      return;
    }

    const fetchSelectedFormDetails = async () => {
      try {
        const response = await apiRequest(
          `/api/industrial-mentors/evaluation-forms/${selectedEvaluationFormId}`,
          "GET",
          null,
          token
        );

        const fields = Array.isArray(response?.data?.fields) ? response.data.fields : [];
        const sortedFields = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setSelectedEvaluationFormFields(sortedFields);
      } catch {
        setSelectedEvaluationFormFields([]);
      }
    };

    fetchSelectedFormDetails();
  }, [selectedEvaluationFormId, token]);

  useEffect(() => {
    if (!selectedGroupId || !token) {
      setEvaluations([]);
      return;
    }

    const fetchEvaluations = async () => {
      try {
        setLoadingEvaluations(true);
        const response = await apiRequest(
          `/api/mentors/evaluations/${selectedGroupId}${selectedEvaluationFormId ? `?formId=${encodeURIComponent(selectedEvaluationFormId)}` : ""}`,
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
  }, [selectedGroupId, selectedEvaluationFormId, token]);

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

  const handleMemberClick = async (member) => {
    const enrollmentNo = member.enrollment_no || member.enrollement_no;
    if (!enrollmentNo || !token) return;

    setSelectedMember(member);
    setProfileLoading(true);
    try {
      const profileRes = await apiRequest(`/api/students/profile/${enrollmentNo}`, "GET", null, token);
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
      case "approved": return <CheckCircle className="w-3 h-3" />;
      case "rejected": return <XCircle className="w-3 h-3" />;
      case "pending": return <Clock className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const handleGroupChange = (event) => {
    const nextGroupId = event.target.value;
    setSelectedGroupId(nextGroupId);
    setCurrentPage(1);
    if (nextGroupId) {
      navigate(`/industry-mentor/groups/${nextGroupId}`);
    }
  };

  const evaluationColumns = useMemo(() => {
    if (selectedEvaluationFormFields.length > 0) {
      return selectedEvaluationFormFields.map((field) => ({
        key: field.key,
        label: field.label || field.key
      }));
    }

    const firstMarks = evaluations?.[0]?.student_marks?.[0]?.marks || {};
    return Object.keys(firstMarks).map((key) => ({ key, label: key }));
  }, [selectedEvaluationFormFields, evaluations]);

  // Pagination
  const totalPages = Math.ceil(evaluations.length / itemsPerPage);
  const paginatedEvaluations = evaluations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportCSV = () => {
    if (evaluations.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Form Name,Student Name,Enrollment No,Total Marks,Status\n";
    
    evaluations.forEach(evaluation => {
      evaluation.student_marks?.forEach(mark => {
        csvContent += `"${evaluation.form_name}","${mark.student_name}","${mark.enrollment_no}",${mark.total},"${mark.absent ? 'Absent' : 'Present'}"\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `evaluations_${selectedGroupId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="font-[Poppins] bg-white flex flex-col min-h-screen">
      <MentorHeader name={mentor?.name || "Industry Mentor"} id={mentor?.id || "----"} />

      <div className="flex flex-1 flex-col lg:flex-row mt-[72px]">
        <IndustryMentorSidebar />

        <main className="flex-1 lg:ml-72 pb-8">
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] px-4 py-8">
            <div className="w-full">
              <h1 className="text-2xl font-bold text-white">Evaluation Dashboard</h1>
              <p className="text-purple-100 text-sm mt-1">Review marks and student performance</p>
            </div>
          </div>

          <div className="w-full px-4 -mt-4">
            {/* Group Selector */}
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Group</label>
                  <select
                    value={selectedGroupId}
                    onChange={handleGroupChange}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    disabled={loadingGroups || groups.length === 0}
                  >
                    {loadingGroups && <option>Loading...</option>}
                    {!loadingGroups && groups.length === 0 && <option>No groups</option>}
                    {!loadingGroups && groupsByFaculty.length > 0
                      ? groupsByFaculty.map((faculty) => (
                          <optgroup key={faculty.mentor_code} label={`Faculty: ${faculty.faculty_name}`}>
                            {faculty.groups.map((groupId) => (
                              <option key={groupId} value={groupId}>{groupId}</option>
                            ))}
                          </optgroup>
                        ))
                      : !loadingGroups && groups.map((groupId) => (
                          <option key={groupId} value={groupId}>{groupId}</option>
                        ))
                    }
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Review Form</label>
                  <select
                    value={selectedEvaluationFormId}
                    onChange={(e) => {
                      setSelectedEvaluationFormId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    disabled={evaluationForms.length === 0}
                  >
                    {evaluationForms.length === 0 && <option value="">No forms available</option>}
                    {evaluationForms.map((form) => (
                      <option key={form.id} value={form.id}>
                        {form.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={exportCSV}
                  disabled={evaluations.length === 0}
                  className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-semibold hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Evaluation Table */}
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Evaluation Marks</h2>
                <span className="text-xs text-purple-100">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, evaluations.length)} of {evaluations.length} results
                </span>
              </div>

              {!selectedGroupId ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                  <p className="text-sm text-gray-600 font-medium">Select a group to view evaluations</p>
                </div>
              ) : loadingEvaluations ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <div className="w-8 h-8 border-2 border-purple-200 border-t-[#7C3AED] rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              ) : evaluations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <FileText className="w-8 h-8 text-gray-300" />
                  <p className="text-sm text-gray-500">No evaluations found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white">
                          <th className="sticky left-0 bg-[#7C3AED] w-24 px-3 py-2 text-left text-xs uppercase tracking-wide whitespace-nowrap">Group</th>
                          <th className="sticky left-24 bg-[#7C3AED] w-36 px-3 py-2 text-left text-xs uppercase tracking-wide whitespace-nowrap">Enrollment</th>
                          <th className="sticky left-60 bg-[#7C3AED] w-44 px-3 py-2 text-left text-xs uppercase tracking-wide whitespace-nowrap">Student</th>
                          {evaluationColumns.map((column) => (
                            <th
                              key={column.key}
                              className="w-20 px-3 py-2 text-center text-xs uppercase tracking-wide whitespace-nowrap"
                              title={column.label}
                            >
                              {String(column.label).slice(0, 10)}
                            </th>
                          ))}
                          <th className="w-16 px-3 py-2 text-center text-xs uppercase tracking-wide whitespace-nowrap">Total</th>
                          <th className="w-20 px-3 py-2 text-center text-xs uppercase tracking-wide whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedEvaluations.map((evaluation, idx) => (
                          evaluation.student_marks?.map((studentMark, sIdx) => (
                            <tr key={`${idx}-${sIdx}`} className="hover:bg-[#F3E8FF] transition-colors">
                              <td className="sticky left-0 bg-white px-3 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap">{selectedGroupId}</td>
                              <td className="sticky left-24 bg-white px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{studentMark.enrollment_no || studentMark.enrollement_no}</td>
                              <td className="sticky left-60 bg-white px-3 py-2 text-xs font-medium text-gray-900 whitespace-nowrap truncate">{studentMark.student_name}</td>
                              {evaluationColumns.map((column) => {
                                const mark = studentMark?.marks?.[column.key];
                                return (
                                  <td key={`${studentMark.enrollment_no || studentMark.enrollement_no}_${column.key}`} className="px-3 py-2 text-center text-xs font-bold text-gray-800">
                                    {typeof mark === 'boolean' ? (
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${mark ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                      {mark ? 'Yes' : 'No'}
                                    </span>
                                  ) : (mark ?? "-")}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2 text-center">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#7C3AED]">
                                  {studentMark.total}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                {studentMark.absent ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                    <XCircle className="w-3 h-3" />Absent
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                    <CheckCircle className="w-3 h-3" />Present
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default IndustryMentorGroups;
