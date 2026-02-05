import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { useNavigate } from "react-router-dom";
import MentorSidebar from "../../Components/Mentor/MentorSidebar";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import { Users, BookOpen, Calendar, Award, TrendingUp } from "lucide-react";

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
      navigate('/login');
      return;
    }

    fetchMentorData(token);
  }, [navigate]);

  const fetchMentorData = async (token) => {
    try {
      setLoading(true);
      
      // Fetch mentor groups
      const groupsRes = await apiRequest("/api/mentors/groups", "GET", null, token);
      const mentorGroups = groupsRes?.data?.groups || groupsRes?.groups || [];
      const mentorName = groupsRes?.data?.mentor_name || groupsRes?.mentor_name;
      
      // Get mentor info from token
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      setMentor({
        name: tokenData.mentor_name || mentorName,
        id: tokenData.mentor_id,
        contact: tokenData.contact_number
      });

      // Fetch detailed group information
      if (mentorGroups.length > 0) {
        const groupDetails = await Promise.all(
          mentorGroups.map(async (groupId) => {
            try {
              const studentsRes = await apiRequest(
                `/api/students/group/${groupId}`,
                "GET",
                null,
                token
              );
              const students = studentsRes?.data?.students || studentsRes?.students || [];
              
              return {
                groupId,
                students,
                studentCount: students.length
              };
            } catch (error) {
              console.error(`Error fetching group ${groupId}:`, error);
              return {
                groupId,
                students: [],
                studentCount: 0
              };
            }
          })
        );
        
        setGroups(groupDetails);
        
        // Calculate stats
        const totalStudents = groupDetails.reduce((sum, g) => sum + g.studentCount, 0);
        setStats({
          totalGroups: groupDetails.length,
          totalStudents,
          pendingReviews: 0, // TODO: Implement reviews count
          upcomingDeadlines: 0 // TODO: Implement deadlines count
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
      <MentorHeader 
        name={mentor.name} 
        id={mentor.id}
      />
   <div className="flex flex-1 flex-col lg:flex-row mt-[80px]">
        <MentorSidebar />
        <main className="flex-1 p-4 md:p-8 bg-gray-50 lg:ml-72 mb-16 lg:mb-0">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-3">
                Welcome, {mentor.name}!
              </h1>
              <p className="text-gray-600 text-base md:text-lg">
                Here's an overview of your assigned groups and upcoming activities.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-500/80 to-purple-600/80 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-10 h-10 opacity-90" />
                  <span className="text-4xl font-bold">{stats.totalGroups}</span>
                </div>
                <p className="text-purple-100 font-semibold text-lg">Total Groups</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/80 to-blue-600/80 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <BookOpen className="w-10 h-10 opacity-90" />
                  <span className="text-4xl font-bold">{stats.totalStudents}</span>
                </div>
                <p className="text-blue-100 font-semibold text-lg">Total Students</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500/80 to-orange-600/80 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <Award className="w-10 h-10 opacity-90" />
                  <span className="text-4xl font-bold">{stats.pendingReviews}</span>
                </div>
                <p className="text-orange-100 font-semibold text-lg">Pending Reviews</p>
              </div>

              <div className="bg-gradient-to-br from-green-500/80 to-green-600/80 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="w-10 h-10 opacity-90" />
                  <span className="text-4xl font-bold">{stats.upcomingDeadlines}</span>
                </div>
                <p className="text-green-100 font-semibold text-lg">Deadlines</p>
              </div>
            </div>

            {/* Assigned Groups Section */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6">Assigned Groups</h2>
              
              {groups.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-12 text-center border border-white/40">
                  <Users className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-xl font-medium">No groups assigned yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {groups.map((group) => (
                    <div
                      key={group.groupId}
                      className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-2 border-purple-200/50 hover:border-purple-400/70 transform hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-bold text-purple-700">
                          {group.groupId}
                        </h3>
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
                        onClick={() => navigate(`/mentor/groups/${group.groupId}`)}
                        className="mt-5 w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-8 border border-white/40">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <button 
                  onClick={() => navigate('/mentor/reviews')}
                  className="flex items-center gap-4 p-5 bg-purple-50/60 backdrop-blur-sm rounded-xl hover:bg-purple-100/60 transition-colors text-left border-2 border-purple-200/50 hover:border-purple-300/70 shadow-sm hover:shadow-md"
                >
                  <Award className="w-10 h-10 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-purple-800 text-lg">Review Projects</p>
                    <p className="text-sm text-gray-600 mt-1">Evaluate student work</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => navigate('/mentor/schedule')}
                  className="flex items-center gap-4 p-5 bg-blue-50/60 backdrop-blur-sm rounded-xl hover:bg-blue-100/60 transition-colors text-left border-2 border-blue-200/50 hover:border-blue-300/70 shadow-sm hover:shadow-md"
                >
                  <Calendar className="w-10 h-10 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-blue-800 text-lg">View Schedule</p>
                    <p className="text-sm text-gray-600 mt-1">Check deadlines</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => navigate('/mentor/groups')}
                  className="flex items-center gap-4 p-5 bg-green-50/60 backdrop-blur-sm rounded-xl hover:bg-green-100/60 transition-colors text-left border-2 border-green-200/50 hover:border-green-300/70 shadow-sm hover:shadow-md"
                >
                  <TrendingUp className="w-10 h-10 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-green-800 text-lg">Track Progress</p>
                    <p className="text-sm text-gray-600 mt-1">Monitor performance</p>
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

export default MentorDashboard;
