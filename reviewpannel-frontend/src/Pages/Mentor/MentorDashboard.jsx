import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { useNavigate } from "react-router-dom";
import MentorSidebar from "../../Components/Mentor/MentorSidebar";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import { Users, BookOpen, Calendar, Award, TrendingUp, ChevronRight, UserCircle2 } from "lucide-react";

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalStudents: 0,
    pendingReviews: 0,
    upcomingDeadlines: 0
  });

  useEffect(() => {
    const token = localStorage.getItem("mentor_token");
    if (!token) {
      navigate('/pblmanagementfacultydashboardlogin');
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
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      setMentor({
        name: tokenData.mentor_name || mentorName,
        id: tokenData.mentor_id,
        contact: tokenData.contact_number
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
        const totalStudents = groupDetails.reduce((sum, g) => sum + g.studentCount, 0);
        setStats({
          totalGroups: groupDetails.length,
          totalStudents,
          pendingReviews: 0,
          upcomingDeadlines: 0
        });
      }
    } catch (error) {
      console.error("Error fetching mentor data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading dashboard…</p>
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

  const statCards = [
    {
      label: "Total Groups",
      value: stats.totalGroups,
      icon: Users,
      from: "from-purple-500",
      to: "to-purple-700",
      light: "text-purple-100",
    },
    {
      label: "Total Students",
      value: stats.totalStudents,
      icon: BookOpen,
      from: "from-blue-500",
      to: "to-blue-700",
      light: "text-blue-100",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingReviews,
      icon: Award,
      from: "from-orange-500",
      to: "to-orange-700",
      light: "text-orange-100",
    },
    {
      label: "Deadlines",
      value: stats.upcomingDeadlines,
      icon: Calendar,
      from: "from-green-500",
      to: "to-green-700",
      light: "text-green-100",
    },
  ];

  const quickActions = [
    {
      label: "Review Projects",
      desc: "Evaluate student work",
      icon: Award,
      color: "purple",
      path: "/mentor/reviews",
    },
    {
      label: "View Schedule",
      desc: "Check upcoming deadlines",
      icon: Calendar,
      color: "blue",
      path: "/mentor/schedule",
    },
    {
      label: "Track Progress",
      desc: "Monitor group performance",
      icon: TrendingUp,
      color: "green",
      path: "/mentor/groups",
    },
  ];

  const colorMap = {
    purple: {
      bg: "bg-purple-50 hover:bg-purple-100",
      border: "border-purple-200 hover:border-purple-400",
      icon: "text-purple-600",
      title: "text-purple-800",
    },
    blue: {
      bg: "bg-blue-50 hover:bg-blue-100",
      border: "border-blue-200 hover:border-blue-400",
      icon: "text-blue-600",
      title: "text-blue-800",
    },
    green: {
      bg: "bg-green-50 hover:bg-green-100",
      border: "border-green-200 hover:border-green-400",
      icon: "text-green-600",
      title: "text-green-800",
    },
  };

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <MentorHeader name={mentor.name} id={mentor.id} />

      <div className="flex flex-1 flex-col lg:flex-row mt-[80px]">
        <MentorSidebar />

        <main className="flex-1 px-3 py-5 sm:px-5 md:px-8 bg-gray-50 lg:ml-72 mb-16 lg:mb-0">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* ── Welcome Banner ── */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-600 rounded-2xl p-5 sm:p-7 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-purple-200 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1">
                  Faculty Dashboard
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                  Welcome, {mentor.name}!
                </h1>
                <p className="text-purple-200 text-sm mt-1">
                  Here's an overview of your assigned groups.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 self-start sm:self-auto">
                <UserCircle2 className="w-8 h-8 text-purple-200 flex-shrink-0" />
                <div>
                  <p className="text-xs text-purple-200 font-medium">Mentor ID</p>
                  <p className="text-white font-bold text-base">{mentor.id}</p>
                </div>
              </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {statCards.map(({ label, value, icon: Icon, from, to, light }) => (
                <div
                  key={label}
                  className={`bg-gradient-to-br ${from} ${to} rounded-2xl p-4 sm:p-5 text-white shadow-md hover:shadow-xl transition-all`}
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-3xl sm:text-4xl font-extrabold leading-none">{value}</span>
                  </div>
                  <p className={`${light} text-xs sm:text-sm font-semibold leading-tight`}>{label}</p>
                </div>
              ))}
            </div>

            {/* ── Assigned Groups ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-purple-800">Assigned Groups</h2>
                {groups.length > 0 && (
                  <button
                    onClick={() => navigate('/mentor/groups')}
                    className="text-sm text-purple-600 font-semibold flex items-center gap-1 hover:text-purple-800 transition"
                  >
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {groups.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                  <Users className="w-16 h-16 mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 font-medium">No groups assigned yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                  {groups.map((group) => (
                    <div
                      key={group.groupId}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-purple-200 flex flex-col"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <h3 className="text-base font-bold text-purple-800 truncate max-w-[120px]">
                            {group.groupId}
                          </h3>
                        </div>
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0">
                          {group.studentCount} {group.studentCount === 1 ? "student" : "students"}
                        </span>
                      </div>

                      {/* Student List */}
                      <div className="px-4 py-3 flex-1">
                        {group.students.length > 0 ? (
                          <div className="space-y-2">
                            {group.students.slice(0, 3).map((student, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2"
                              >
                                <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                                  {(student.student_name || student.name_of_students || student.name)?.charAt(0)?.toUpperCase() || "S"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate">
                                    {student.student_name || student.name_of_students || student.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {student.enrollment_no || student.enrollement_no || "—"}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {group.studentCount > 3 && (
                              <p className="text-xs text-purple-500 font-semibold text-center pt-1">
                                +{group.studentCount - 3} more
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm text-center py-4">No students</p>
                        )}
                      </div>

                      {/* View Button */}
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => navigate(`/mentor/groups/${group.groupId}`)}
                          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Quick Actions ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-purple-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {quickActions.map(({ label, desc, icon: Icon, color, path }) => {
                  const c = colorMap[color];
                  return (
                    <button
                      key={label}
                      onClick={() => navigate(path)}
                      className={`flex items-center gap-4 p-4 sm:p-5 ${c.bg} rounded-xl border ${c.border} transition-all text-left shadow-sm hover:shadow-md`}
                    >
                      <div className={`p-2.5 bg-white rounded-xl shadow-sm flex-shrink-0`}>
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

          </div>
        </main>
      </div>
    </div>
  );
};

export default MentorDashboard;


