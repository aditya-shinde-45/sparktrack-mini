import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { useNavigate } from "react-router-dom";
import MentorSidebar from "../../Components/Mentor/MentorSidebar";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import {
  Users,
  ChevronRight,
  FileCheck,
  FileSpreadsheet,
  UserCog,
} from "lucide-react";

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mentor_token") || localStorage.getItem("token");
    if (!token) {
      navigate("/pblmanagementfacultydashboardlogin");
      return;
    }

    fetchMentorData(token);
  }, [navigate]);

  const fetchMentorData = async (token) => {
    try {
      setLoading(true);
      const groupsRes = await apiRequest("/api/mentors/groups", "GET", null, token);
      const mentorGroups = groupsRes?.data?.groups || groupsRes?.groups || [];
      const mentorName = groupsRes?.data?.mentor_name || groupsRes?.mentor_name;
      const tokenData = JSON.parse(atob(token.split(".")[1]));

      setMentor({
        name: tokenData.mentor_name || mentorName || "Mentor",
        id: tokenData.mentor_id || "----",
        contact: tokenData.contact_number || "",
      });

      if (mentorGroups.length > 0) {
        const groupDetails = await Promise.all(
          mentorGroups.map(async (groupId) => {
            try {
              const studentsRes = await apiRequest(`/api/students/group/${groupId}`, "GET", null, token);
              const students = studentsRes?.data?.students || studentsRes?.students || [];
              return { groupId, students, studentCount: students.length };
            } catch {
              return { groupId, students: [], studentCount: 0 };
            }
          })
        );
        setGroups(groupDetails);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error("Error fetching mentor data:", error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      label: "NOC",
      desc: "Review and approve NOC",
      icon: FileCheck,
      color: "purple",
      path: "/mentor/noc",
    },
    {
      label: "Tracker Sheet",
      desc: "Review tracker submissions",
      icon: FileSpreadsheet,
      color: "indigo",
      path: "/mentor/tracker-sheet",
    },
    {
      label: "My Groups",
      desc: "Open group workspace",
      icon: Users,
      color: "violet",
      path: "/mentor/groups",
    },
    {
      label: "Industry Mentor",
      desc: "Manage linked mentors",
      icon: UserCog,
      color: "fuchsia",
      path: "/mentor/settings",
    },
  ];

  const colorMap = {
    purple: {
      bg: "bg-purple-50 hover:bg-purple-100",
      border: "border-purple-200 hover:border-purple-400",
      icon: "text-purple-600",
      title: "text-purple-800",
    },
    indigo: {
      bg: "bg-indigo-50 hover:bg-indigo-100",
      border: "border-indigo-200 hover:border-indigo-400",
      icon: "text-indigo-600",
      title: "text-indigo-800",
    },
    violet: {
      bg: "bg-violet-50 hover:bg-violet-100",
      border: "border-violet-200 hover:border-violet-400",
      icon: "text-violet-600",
      title: "text-violet-800",
    },
    fuchsia: {
      bg: "bg-fuchsia-50 hover:bg-fuchsia-100",
      border: "border-fuchsia-200 hover:border-fuchsia-400",
      icon: "text-fuchsia-600",
      title: "text-fuchsia-800",
    },
  };

  const sortedGroups = [...groups].sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0));

  const getStudentName = (student) =>
    student.student_name || student.name_of_students || student.name || "Student";

  const getStudentEnrollment = (student) => student.enrollment_no || student.enrollement_no || "-";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading dashboard...</p>
        </div>
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
    <div className="font-[Poppins] bg-purple-50/40 flex flex-col min-h-screen overflow-x-hidden">
      <MentorHeader name={mentor.name} id={mentor.id} />

      <div className="flex flex-1 flex-col lg:flex-row mt-[72px]">
        <MentorSidebar />

        <main className="flex-1 lg:flex-none lg:w-[calc(100%-272px)] px-3 sm:px-4 md:px-6 py-5 bg-purple-50/40 lg:ml-[272px] mb-24 lg:mb-0 overflow-x-hidden">
          <div className="w-full space-y-6 sm:space-y-7">

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-purple-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {quickActions.map(({ label, desc, icon: Icon, color, path }) => {
                  const c = colorMap[color];
                  return (
                    <button
                      key={label}
                      onClick={() => navigate(path)}
                      className={`flex items-center gap-4 p-4 sm:p-5 ${c.bg} rounded-xl border ${c.border} transition-all text-left shadow-sm hover:shadow-md`}
                    >
                      <div className="p-2.5 bg-white rounded-xl shadow-sm flex-shrink-0">
                        <Icon className={`w-6 h-6 ${c.icon}`} />
                      </div>
                      <div>
                        <p className={`font-bold ${c.title} text-sm sm:text-base leading-tight`}>{label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${c.icon} ml-auto flex-shrink-0`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <section className="rounded-3xl border border-purple-100 bg-gradient-to-br from-white via-purple-50/40 to-indigo-50/40 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/30">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-purple-900">Assigned Groups</h2>
                  </div>
                </div>

                {groups.length > 0 && (
                  <button
                    onClick={() => navigate("/mentor/groups")}
                    className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 hover:border-purple-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                  >
                    Open Workspace
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {groups.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-purple-200 bg-white/90 p-10 text-center">
                  <Users className="w-14 h-14 mx-auto text-purple-200 mb-3" />
                  <p className="text-slate-500 font-semibold">No groups assigned yet</p>
                  <p className="text-sm text-slate-400 mt-1">Assigned groups will appear here with student insights.</p>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                  {sortedGroups.map((group) => {
                    return (
                      <div
                        key={group.groupId}
                        className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm hover:shadow-lg hover:border-purple-200 transition-all duration-300 flex flex-col"
                      >
                        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-purple-100/70 blur-2xl pointer-events-none" />

                        <div className="relative px-5 pt-5 pb-4 border-b border-purple-100">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/30 flex-shrink-0">
                                <Users className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] uppercase tracking-[0.1em] text-purple-500 font-semibold">Group</p>
                                <h3 className="text-lg font-bold text-slate-800 truncate">{group.groupId}</h3>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400 font-semibold">Members</p>
                              <p className="text-lg font-bold text-purple-700">{group.studentCount}</p>
                            </div>
                          </div>
                        </div>

                        <div className="relative px-4 py-4 flex-1">
                          {group.students.length > 0 ? (
                            <>
                              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 px-1">Students</p>
                              <div className="mt-3 space-y-2.5">
                                {group.students.slice(0, 4).map((student, idx) => {
                                  const studentName = getStudentName(student);
                                  const enrollmentNo = getStudentEnrollment(student);

                                  return (
                                    <div
                                      key={`${group.groupId}-${idx}`}
                                      className="flex items-center gap-3 bg-white border border-purple-100 rounded-xl px-3 py-2.5 shadow-sm"
                                    >
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                                        {studentName.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{studentName}</p>
                                        <p className="text-xs text-slate-500">{enrollmentNo}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="h-full min-h-[120px] rounded-xl border border-dashed border-purple-200 bg-white/70 flex flex-col items-center justify-center text-center px-4">
                              <Users className="w-8 h-8 text-purple-200" />
                              <p className="mt-2 text-sm font-medium text-slate-500">No students mapped yet</p>
                              <p className="text-xs text-slate-400">Students will appear here once assigned.</p>
                            </div>
                          )}
                        </div>

                        <div className="relative px-4 pb-4">
                          <button
                            onClick={() => navigate(`/mentor/groups/${group.groupId}`)}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-md shadow-purple-500/25"
                          >
                            View Group Details
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MentorDashboard;
