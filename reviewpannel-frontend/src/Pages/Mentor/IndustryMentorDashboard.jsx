import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { useNavigate } from "react-router-dom";
import IndustryMentorSidebar from "../../Components/Mentor/IndustryMentorSidebar";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import { Users, BookOpen, Calendar, Award, TrendingUp, ChevronDown } from "lucide-react";

const IndustryMentorDashboard = () => {
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [groupsByFaculty, setGroupsByFaculty] = useState([]);
  const [groupDetails, setGroupDetails] = useState({}); // groupId -> { students, studentCount }
  const [selectedFacultyCode, setSelectedFacultyCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalStudents: 0,
    totalFaculties: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("industry_mentor_token");
    if (!token) {
      navigate('/pblmanagementfacultydashboardlogin');
      return;
    }
    fetchMentorData(token);
  }, [navigate]);

  const fetchMentorData = async (token) => {
    try {
      setLoading(true);

      const groupsRes = await apiRequest("/api/industrial-mentors/groups", "GET", null, token);
      const allGroups = groupsRes?.data?.groups || groupsRes?.groups || [];
      const facultyGroups = groupsRes?.data?.groupsByFaculty || groupsRes?.groupsByFaculty || [];
      const tokenData = JSON.parse(atob(token.split('.')[1]));

      setMentor({
        name: tokenData.name,
        id: tokenData.industrial_mentor_code || tokenData.mentor_code
      });

      // If API doesn't return groupsByFaculty, fall back to a single bucket
      const faculties = facultyGroups.length > 0
        ? facultyGroups
        : allGroups.length > 0
          ? [{ mentor_code: "all", faculty_name: "Assigned Faculty", groups: allGroups }]
          : [];

      setGroupsByFaculty(faculties);
      if (faculties.length > 0) {
        setSelectedFacultyCode(faculties[0].mentor_code);
      }

      // Fetch student details for all groups in parallel
      if (allGroups.length > 0) {
        const details = {};
        await Promise.all(
          allGroups.map(async (groupId) => {
            try {
              const res = await apiRequest(`/api/students/group/${groupId}`, "GET", null, token);
              const students = res?.data?.students || res?.students || [];
              details[groupId] = { students, studentCount: students.length };
            } catch {
              details[groupId] = { students: [], studentCount: 0 };
            }
          })
        );
        setGroupDetails(details);

        const totalStudents = Object.values(details).reduce((s, g) => s + g.studentCount, 0);
        setStats({
          totalGroups: allGroups.length,
          totalStudents,
          totalFaculties: faculties.length,
        });
      }
    } catch (error) {
      console.error("Error fetching industry mentor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedFaculty = groupsByFaculty.find((f) => f.mentor_code === selectedFacultyCode) || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Please login to continue</div>
      </div>
    );
  }

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <MentorHeader name={mentor.name} id={mentor.id} />
      <div className="flex flex-1 flex-col lg:flex-row mt-[72px]">
        <IndustryMentorSidebar />
        <main className="flex-1 p-4 md:p-8 bg-gray-50 lg:ml-72 mb-16 lg:mb-0">
          <div className="max-w-7xl mx-auto">

            {/* Welcome Banner */}
            <div className="rounded-2xl p-5 sm:p-7 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8" style={{ background: 'linear-gradient(120deg,#6d58f0 0%,#4e38c7 55%,#3b2aad 100%)' }}>
              <div>
                <p className="text-purple-200 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1">Industry Mentor Dashboard</p>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Welcome, {mentor.name}!</h1>
                <p className="text-purple-200 text-sm mt-1">Overview of assigned groups and performance.</p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 self-start sm:self-auto">
                <span className="text-purple-200 text-xs font-medium">Mentor ID</span>
                <span className="text-white font-bold text-base">{mentor.id}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-500/80 to-purple-600/80 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-10 h-10 opacity-90" />
                  <span className="text-4xl font-bold">{stats.totalGroups}</span>
                </div>
                <p className="text-purple-100 font-semibold text-lg">Total Groups</p>
              </div>

              <div className="bg-gradient-to-br from-violet-500/80 to-violet-600/80 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <BookOpen className="w-10 h-10 opacity-90" />
                  <span className="text-4xl font-bold">{stats.totalStudents}</span>
                </div>
                <p className="text-violet-100 font-semibold text-lg">Total Students</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-500/80 to-indigo-600/80 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <Award className="w-10 h-10 opacity-90" />
                  <span className="text-4xl font-bold">{stats.totalFaculties}</span>
                </div>
                <p className="text-indigo-100 font-semibold text-lg">Linked Faculties</p>
              </div>
            </div>

            {/* Faculty dropdown + groups section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-purple-800">Assigned Groups</h2>

                {groupsByFaculty.length > 0 && (
                  <div className="relative w-full sm:w-72">
                    <select
                      value={selectedFacultyCode}
                      onChange={(e) => setSelectedFacultyCode(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-purple-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {groupsByFaculty.map((faculty) => (
                        <option key={faculty.mentor_code} value={faculty.mentor_code}>
                          {faculty.faculty_name} ({faculty.groups.length} group{faculty.groups.length !== 1 ? "s" : ""})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Selected faculty info banner */}
              {selectedFaculty && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl px-6 py-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 shadow-lg">
                  <div className="flex-1">
                    <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider">Faculty Mentor</p>
                    <p className="text-white text-xl font-bold">{selectedFaculty.faculty_name}</p>
                    <p className="text-purple-200 text-sm mt-0.5">
                      {selectedFaculty.groups.length} group{selectedFaculty.groups.length !== 1 ? "s" : ""} &nbsp;·&nbsp;{" "}
                      {selectedFaculty.groups.reduce((sum, gId) => sum + (groupDetails[gId]?.studentCount || 0), 0)} students
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFaculty.groups.map((gId) => (
                      <span key={gId} className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                        {gId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Group cards for selected faculty */}
              {!selectedFaculty || selectedFaculty.groups.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-12 text-center border border-white/40">
                  <Users className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-xl font-medium">No groups assigned yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {selectedFaculty.groups.map((groupId) => {
                    const group = groupDetails[groupId] || { students: [], studentCount: 0 };
                    return (
                      <div
                        key={groupId}
                        className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-2 border-purple-200/50 hover:border-purple-400/70 transform hover:-translate-y-1"
                      >
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-xl font-bold text-purple-700">{groupId}</h3>
                          <div className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold">
                            {group.studentCount} {group.studentCount === 1 ? 'Student' : 'Students'}
                          </div>
                        </div>

                        {group.students.length > 0 ? (
                          <div className="space-y-3">
                            {group.students.slice(0, 4).map((student, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 p-3 rounded-xl transition-colors"
                              >
                                <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-base flex-shrink-0">
                                  {(student.student_name || student.name_of_students || student.name)?.charAt(0) || 'S'}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <p className="font-semibold truncate text-gray-800">
                                    {student.student_name || student.name_of_students || student.name}
                                  </p>
                                  <p className="text-xs text-gray-500 font-medium">
                                    {student.enrollment_no || student.enrollement_no || "-"}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {group.studentCount > 4 && (
                              <p className="text-sm text-purple-600 font-semibold text-center pt-3 border-t border-gray-100">
                                +{group.studentCount - 4} more {group.studentCount - 4 === 1 ? 'student' : 'students'}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm text-center py-4">No students in this group</p>
                        )}

                        <button
                          onClick={() => navigate(`/industry-mentor/groups/${groupId}`)}
                          className="mt-5 w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                        >
                          View Details
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-8 border border-white/40">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <button
                  onClick={() => navigate('/industry-mentor/groups')}
                  className="flex items-center gap-4 p-5 bg-purple-50/60 backdrop-blur-sm rounded-xl hover:bg-purple-100/60 transition-colors text-left border-2 border-purple-200/50 hover:border-purple-300/70 shadow-sm hover:shadow-md"
                >
                  <Award className="w-10 h-10 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-purple-800 text-lg">Review Groups</p>
                    <p className="text-sm text-gray-600 mt-1">See team details</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/mentor/settings')}
                  className="flex items-center gap-4 p-5 bg-indigo-50/60 backdrop-blur-sm rounded-xl hover:bg-indigo-100/60 transition-colors text-left border-2 border-indigo-200/50 hover:border-indigo-300/70 shadow-sm hover:shadow-md"
                >
                  <TrendingUp className="w-10 h-10 text-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-indigo-800 text-lg">Update Profile</p>
                    <p className="text-sm text-gray-600 mt-1">Manage your account</p>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default IndustryMentorDashboard;
