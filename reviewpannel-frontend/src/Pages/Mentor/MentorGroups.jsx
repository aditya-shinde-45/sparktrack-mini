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
  Download
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
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const token = useMemo(() => localStorage.getItem("mentor_token"), []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
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

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <MentorHeader name={mentor?.name || "Mentor"} id={mentor?.id || "----"} />
      <div className="flex flex-1 flex-col lg:flex-row mt-[80px]">
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

                <div className="flex items-center justify-end mb-4">
                  <ProblemStatementModal
                    selectedGroupId={selectedGroupId}
                    problemStatement={problemStatement}
                    onSuccess={handleProblemStatementSuccess}
                    isReadOnly={false}
                  />
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
    </div>
  );
};

export default MentorGroups;
