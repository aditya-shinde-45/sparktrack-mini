import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Student/Header";
import Sidebar from "../../Components/Student/sidebar";
import { 
  GitBranch, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Users, 
  MessageSquare, 
  Paperclip, 
  Plus,
  Search,
  Calendar,
  MoreHorizontal,
  AlertCircle,
  TrendingUp,
  Activity,
  User,
  Crown,
  Mail,
  Phone,
  ExternalLink,
  FileText,
  Target,
  Award
} from "lucide-react";
import { apiRequest } from "../../api";

const TeamWorkspace = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("team");
  const [student, setStudent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Team members from your data
  const teamMembers = [
    { 
      id: 1, 
      name: "ADITYA ANGAD KHADE", 
      enrollment: "ADT24SOCBD009",
      role: "Group Leader",
      isLeader: true,
      avatar: "AK",
      tasks: 5, 
      completed: 3,
      email: "aditya.khade@example.com",
      phone: "9876543210"
    },
    { 
      id: 2, 
      name: "ADITYA KRISHNAT SHINDE", 
      enrollment: "ADT24SOCBD013",
      role: "Team Member",
      isLeader: false,
      avatar: "AS",
      tasks: 6, 
      completed: 4,
      email: "aditya.shinde@example.com",
      phone: "9876543211"
    },
    { 
      id: 3, 
      name: "VIVEK JAGDISH SWAMI", 
      enrollment: "ADT24SOCBD142",
      role: "Team Member (You)",
      isLeader: false,
      isCurrentUser: true,
      avatar: "VS",
      tasks: 4, 
      completed: 2,
      email: "vivek.swami@example.com",
      phone: "9876543212"
    },
    { 
      id: 4, 
      name: "MONIKA RAJIV JADHAV", 
      enrollment: "ADT24SOCBD167",
      role: "Team Member",
      isLeader: false,
      avatar: "MJ",
      tasks: 3, 
      completed: 1,
      email: "monika.jadhav@example.com",
      phone: "9876543213"
    }
  ];

  useEffect(() => {
    fetchStudentData();
    fetchProjectData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("student_token");
      const profileRes = await apiRequest("/api/student-auth/profile", "GET", null, token);
      const profileData = profileRes?.data?.profile || profileRes?.profile;
      setStudent(profileData);
    } catch (error) {
      console.error("Failed to fetch student data:", error);
    }
  };

  const fetchProjectData = async () => {
    try {
      // Simulated data
      setTasks([
        {
          id: 1,
          title: "Design Database Schema",
          description: "Create ER diagram and define database structure",
          status: "completed",
          assignee: "ADITYA ANGAD KHADE",
          priority: "high",
          dueDate: "2024-01-15",
          comments: 5,
          attachments: 2
        },
        {
          id: 2,
          title: "Implement User Authentication",
          description: "Set up login/signup with JWT",
          status: "in_progress",
          assignee: "ADITYA KRISHNAT SHINDE",
          priority: "high",
          dueDate: "2024-01-20",
          comments: 3,
          attachments: 1
        },
        {
          id: 3,
          title: "Create Landing Page",
          description: "Design and develop homepage UI",
          status: "todo",
          assignee: "VIVEK JAGDISH SWAMI",
          priority: "medium",
          dueDate: "2024-01-25",
          comments: 1,
          attachments: 0
        },
        {
          id: 4,
          title: "Write API Documentation",
          description: "Document all REST API endpoints",
          status: "in_progress",
          assignee: "MONIKA RAJIV JADHAV",
          priority: "medium",
          dueDate: "2024-01-22",
          comments: 2,
          attachments: 3
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch project data:", error);
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
        return "text-red-600 bg-red-100 border-red-200";
      case "medium":
        return "text-amber-600 bg-amber-100 border-amber-200";
      case "low":
        return "text-green-600 bg-green-100 border-green-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filterStatus === "all" || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const projectStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    todo: tasks.filter(t => t.status === "todo").length
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
                      <GitBranch className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold">
                        {student?.group_id || "Team"} Workspace
                      </h1>
                      <p className="text-purple-100 text-sm mt-1">
                        Collaborative Project Management
                      </p>
                    </div>
                  </div>
                </div>
                
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 hover:bg-purple-50 font-semibold rounded-lg transition-all shadow-lg">
                  <Plus className="w-5 h-5" />
                  New Task
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Tasks"
                value={projectStats.total}
                icon={<Target className="w-5 h-5" />}
                color="purple"
              />
              <StatsCard
                title="Completed"
                value={projectStats.completed}
                icon={<CheckCircle2 className="w-5 h-5" />}
                color="green"
              />
              <StatsCard
                title="In Progress"
                value={projectStats.inProgress}
                icon={<Clock className="w-5 h-5" />}
                color="blue"
              />
              <StatsCard
                title="To Do"
                value={projectStats.todo}
                icon={<Circle className="w-5 h-5" />}
                color="gray"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { id: "team", label: "Team Members", icon: Users },
                  { id: "tasks", label: "Tasks", icon: CheckCircle2 },
                  { id: "progress", label: "Progress", icon: TrendingUp }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-all whitespace-nowrap ${
                      activeTab === tab.id
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
            {/* Team Members Tab */}
            {activeTab === "team" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{teamMembers.length} Members</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamMembers.map(member => (
                    <div
                      key={member.id}
                      className={`bg-white rounded-xl border-2 p-6 hover:shadow-lg transition-all ${
                        member.isCurrentUser 
                          ? "border-purple-300 bg-purple-50/50" 
                          : member.isLeader
                          ? "border-amber-300 bg-amber-50/50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className={`relative flex-shrink-0 ${
                          member.isLeader ? "ring-4 ring-amber-200" : ""
                        }`}>
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ${
                            member.isCurrentUser
                              ? "bg-purple-200 text-purple-700"
                              : member.isLeader
                              ? "bg-amber-200 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {member.avatar}
                          </div>
                          {member.isLeader && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                              <Crown className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Member Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="text-base font-bold text-gray-900 truncate">
                                {member.name}
                                {member.isCurrentUser && (
                                  <span className="ml-2 text-xs font-normal text-purple-600">(You)</span>
                                )}
                              </h3>
                              <p className="text-xs text-gray-600 font-medium">
                                {member.enrollment}
                              </p>
                            </div>
                          </div>

                          {/* Role Badge */}
                          <div className="mb-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              member.isLeader 
                                ? "bg-amber-100 text-amber-700" 
                                : member.isCurrentUser
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-700"
                            }`}>
                              {member.isLeader && <Crown className="w-3 h-3" />}
                              {member.role}
                            </span>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-1.5 mb-3 text-xs">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-3.5 h-3.5" />
                              <span className="truncate">{member.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{member.phone}</span>
                            </div>
                          </div>

                          {/* Task Stats */}
                          <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                            <div className="text-center">
                              <p className="text-xs text-gray-600">Tasks</p>
                              <p className="text-lg font-bold text-gray-900">{member.tasks}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600">Completed</p>
                              <p className="text-lg font-bold text-green-600">{member.completed}</p>
                            </div>
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${(member.completed / member.tasks) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* View Profile Button */}
                          <button className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                            View Full Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === "tasks" && (
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto">
                      {["all", "todo", "in_progress", "completed"].map(status => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                            filterStatus === status
                              ? "bg-purple-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                  {filteredTasks.map(task => (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(task.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="text-lg font-bold text-gray-900">
                              {task.title}
                            </h4>
                            <button className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg">
                              <MoreHorizontal className="w-5 h-5 text-gray-400" />
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4">
                            {task.description}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold ${getStatusColor(task.status)}`}>
                              {task.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                            
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg border font-semibold ${getPriorityColor(task.priority)}`}>
                              {task.priority.toUpperCase()}
                            </span>
                            
                            <span className="flex items-center gap-1.5 text-gray-600">
                              <User className="w-4 h-4" />
                              {task.assignee.split(' ')[0]}
                            </span>
                            
                            <span className="flex items-center gap-1.5 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                            
                            {task.comments > 0 && (
                              <span className="flex items-center gap-1.5 text-gray-600">
                                <MessageSquare className="w-4 h-4" />
                                {task.comments}
                              </span>
                            )}
                            
                            {task.attachments > 0 && (
                              <span className="flex items-center gap-1.5 text-gray-600">
                                <Paperclip className="w-4 h-4" />
                                {task.attachments}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === "progress" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Overall Project Progress
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                        <span className="text-sm font-bold text-purple-700">
                          {Math.round((projectStats.completed / projectStats.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${(projectStats.completed / projectStats.total) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-2xl font-bold text-green-600">{projectStats.completed}</p>
                        <p className="text-xs text-gray-600 mt-1">Completed</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-2xl font-bold text-blue-600">{projectStats.inProgress}</p>
                        <p className="text-xs text-gray-600 mt-1">In Progress</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-2xl font-bold text-gray-600">{projectStats.todo}</p>
                        <p className="text-xs text-gray-600 mt-1">To Do</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Performance */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Team Performance</h3>
                  <div className="space-y-4">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          member.isCurrentUser
                            ? "bg-purple-100 text-purple-700"
                            : member.isLeader
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {member.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {member.name.split(' ')[0]}
                              {member.isLeader && <Crown className="inline w-3 h-3 ml-1 text-amber-600" />}
                            </span>
                            <span className="text-xs text-gray-600">
                              {member.completed}/{member.tasks} tasks
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                member.isLeader
                                  ? "bg-amber-500"
                                  : member.isCurrentUser
                                  ? "bg-purple-500"
                                  : "bg-blue-500"
                              }`}
                              style={{ width: `${(member.completed / member.tasks) * 100}%` }}
                            />
                          </div>
                        </div>
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

// Stats Card Component
const StatsCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    green: "bg-green-50 text-green-600 border-green-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200"
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-600">{title}</span>
        <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

export default TeamWorkspace;
