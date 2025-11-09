import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Student/Header";
import Sidebar from "../../Components/Student/sidebar";
import { 
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Target,
  TrendingUp,
  Users,
  FileText,
  Filter,
  Search,
  MoreVertical,
  Flag
} from "lucide-react";
import { apiRequest } from "../../api";

const ProjectPlanning = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("timeline");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Project phases and milestones - Updated timeline
  const [phases, setPhases] = useState([
    {
      id: 1,
      name: "Project Initiation",
      status: "completed",
      progress: 100,
      startDate: "2024-07-01",
      endDate: "2024-07-15",
      tasks: [
        { id: 1, title: "Problem Statement Selection", status: "completed", assignee: "All Members" },
        { id: 2, title: "Team Formation", status: "completed", assignee: "All Members" },
        { id: 3, title: "Mentor Assignment", status: "completed", assignee: "All Members" }
      ]
    },
    {
      id: 2,
      name: "Requirement Analysis",
      status: "completed",
      progress: 100,
      startDate: "2024-07-16",
      endDate: "2024-08-05",
      tasks: [
        { id: 4, title: "Gather Requirements", status: "completed", assignee: "ADITYA ANGAD KHADE" },
        { id: 5, title: "Create Use Cases", status: "completed", assignee: "VIVEK JAGDISH SWAMI" },
        { id: 6, title: "System Design", status: "completed", assignee: "ADITYA KRISHNAT SHINDE" }
      ]
    },
    {
      id: 3,
      name: "Development Phase",
      status: "completed",
      progress: 100,
      startDate: "2024-08-06",
      endDate: "2024-09-15",
      tasks: [
        { id: 7, title: "Backend Development", status: "completed", assignee: "ADITYA KRISHNAT SHINDE" },
        { id: 8, title: "Frontend Development", status: "completed", assignee: "VIVEK JAGDISH SWAMI" },
        { id: 9, title: "Database Setup", status: "completed", assignee: "ADITYA ANGAD KHADE" },
        { id: 10, title: "API Integration", status: "completed", assignee: "MONIKA RAJIV JADHAV" }
      ]
    },
    {
      id: 4,
      name: "Testing & QA",
      status: "completed",
      progress: 100,
      startDate: "2024-09-16",
      endDate: "2024-09-30",
      tasks: [
        { id: 11, title: "Unit Testing", status: "completed", assignee: "All Members" },
        { id: 12, title: "Integration Testing", status: "completed", assignee: "MONIKA RAJIV JADHAV" },
        { id: 13, title: "User Acceptance Testing", status: "completed", assignee: "All Members" }
      ]
    },
    {
      id: 5,
      name: "Deployment & Documentation",
      status: "in_progress",
      progress: 67,
      startDate: "2024-10-01",
      endDate: "2024-10-20",
      tasks: [
        { id: 14, title: "Write Documentation", status: "completed", assignee: "MONIKA RAJIV JADHAV" },
        { id: 15, title: "Deploy to Production", status: "completed", assignee: "ADITYA ANGAD KHADE" },
        { id: 16, title: "Final Presentation", status: "in_progress", assignee: "All Members" }
      ]
    }
  ]);

  // Upcoming deadlines - Updated dates
  const [upcomingDeadlines] = useState([
    { id: 1, title: "PBL Review 3", date: "2024-10-18", priority: "high", daysLeft: 3 },
    { id: 2, title: "Final Presentation", date: "2024-10-20", priority: "high", daysLeft: 5 },
    { id: 3, title: "Project Submission", date: "2024-10-20", priority: "high", daysLeft: 5 }
  ]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("student_token");
      const profileRes = await apiRequest("/api/student-auth/profile", "GET", null, token);
      const profileData = profileRes?.data?.profile || profileRes?.profile;
      setStudent(profileData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch student data:", error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "todo":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "todo":
        return <Circle className="w-4 h-4 text-gray-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const calculateOverallProgress = () => {
    const totalTasks = phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
    const completedTasks = phases.reduce((sum, phase) => 
      sum + phase.tasks.filter(t => t.status === "completed").length, 0
    );
    return Math.round((completedTasks / totalTasks) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header
        name={student?.name_of_students || student?.name || "Student"}
        id={student?.enrollment_no || "----"}
      />
      
      <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[70px]">
        <Sidebar />
        
        <main className="flex-1 lg:ml-72 bg-gray-50">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold">
                        Project Planning
                      </h1>
                      <p className="text-purple-100 text-sm mt-1">
                        {student?.group_id || "Team"} - Timeline & Milestones
                      </p>
                    </div>
                  </div>
                </div>
                
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 hover:bg-purple-50 font-semibold rounded-lg transition-all shadow-lg">
                  <Plus className="w-5 h-5" />
                  Add Milestone
                </button>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-6">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Overall Progress</h3>
                <span className="text-2xl font-bold text-purple-700">{calculateOverallProgress()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-4 rounded-full transition-all"
                  style={{ width: `${calculateOverallProgress()}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 text-center text-sm">
                <div>
                  <p className="text-gray-600">Total Tasks</p>
                  <p className="text-xl font-bold text-gray-900">
                    {phases.reduce((sum, p) => sum + p.tasks.length, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Completed</p>
                  <p className="text-xl font-bold text-green-600">
                    {phases.reduce((sum, p) => sum + p.tasks.filter(t => t.status === "completed").length, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">In Progress</p>
                  <p className="text-xl font-bold text-blue-600">
                    {phases.reduce((sum, p) => sum + p.tasks.filter(t => t.status === "in_progress").length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { id: "timeline", label: "Timeline View", icon: TrendingUp },
                  { id: "phases", label: "Phases", icon: Target },
                  { id: "deadlines", label: "Deadlines", icon: Flag }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all whitespace-nowrap ${
                      activeView === tab.id
                        ? "border-purple-600 text-purple-700 bg-purple-50"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Timeline View */}
            {activeView === "timeline" && (
              <div className="space-y-6">
                {phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                  >
                    {/* Phase Header */}
                    <div className={`p-6 ${
                      phase.status === "completed" ? "bg-green-50" :
                      phase.status === "in_progress" ? "bg-blue-50" : "bg-gray-50"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            phase.status === "completed" ? "bg-green-500" :
                            phase.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{phase.name}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(phase.status)}`}>
                          {phase.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            phase.status === "completed" ? "bg-green-500" :
                            phase.status === "in_progress" ? "bg-blue-500" : "bg-gray-300"
                          }`}
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{phase.progress}% Complete</p>
                    </div>

                    {/* Tasks List */}
                    <div className="p-6 space-y-3">
                      {phase.tasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all"
                        >
                          <div className="flex-shrink-0">
                            {getStatusIcon(task.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900">{task.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">
                              <Users className="w-3 h-3 inline mr-1" />
                              {task.assignee}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${getStatusColor(task.status)}`}>
                            {task.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Phases View */}
            {activeView === "phases" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                        phase.status === "completed" ? "bg-green-500" :
                        phase.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(phase.status)}`}>
                        {phase.progress}%
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{phase.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {new Date(phase.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                      {new Date(phase.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className={`h-2 rounded-full ${
                          phase.status === "completed" ? "bg-green-500" :
                          phase.status === "in_progress" ? "bg-blue-500" : "bg-gray-300"
                        }`}
                        style={{ width: `${phase.progress}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{phase.tasks.filter(t => t.status === "completed").length}/{phase.tasks.length} tasks</span>
                      {getStatusIcon(phase.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Deadlines View */}
            {activeView === "deadlines" && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-purple-600" />
                    Upcoming Deadlines
                  </h3>
                  
                  <div className="space-y-3">
                    {upcomingDeadlines.map(deadline => (
                      <div
                        key={deadline.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          deadline.priority === "high" ? "border-red-500 bg-red-50" :
                          deadline.priority === "medium" ? "border-amber-500 bg-amber-50" :
                          "border-green-500 bg-green-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{deadline.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(deadline.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(deadline.priority)}`}>
                              {deadline.daysLeft} days left
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Phase Deadlines */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Phase Deadlines</h3>
                  <div className="space-y-3">
                    {phases.map(phase => (
                      <div
                        key={phase.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(phase.status)}
                          <div>
                            <h4 className="font-semibold text-gray-900">{phase.name}</h4>
                            <p className="text-sm text-gray-600">
                              Ends: {new Date(phase.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(phase.status)}`}>
                          {phase.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectPlanning;
