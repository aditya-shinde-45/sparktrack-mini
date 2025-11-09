import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Student/Header";
import Sidebar from "../../Components/Student/sidebar";
import { 
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  Search,
  Filter,
  File,
  Image as ImageIcon,
  Video,
  Code
} from "lucide-react";
import { apiRequest } from "../../api";

const Documentation = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dummy documentation data
  const documentCategories = [
    { id: "all", name: "All Documents", icon: FileText },
    { id: "reports", name: "Reports", icon: FileText },
    { id: "presentations", name: "Presentations", icon: ImageIcon },
    { id: "code", name: "Code/Repository", icon: Code },
    { id: "videos", name: "Videos/Demos", icon: Video }
  ];

  useEffect(() => {
    fetchStudentData();
    fetchDocuments();
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

  const fetchDocuments = async () => {
    try {
      // Simulated document data
      setDocuments([
        {
          id: 1,
          name: "Project Proposal Document.pdf",
          category: "reports",
          size: "2.5 MB",
          uploadedBy: "ADITYA ANGAD KHADE",
          uploadedDate: "2024-07-15",
          status: "approved",
          description: "Initial project proposal with problem statement"
        },
        {
          id: 2,
          name: "System Design Presentation.pptx",
          category: "presentations",
          size: "5.8 MB",
          uploadedBy: "VIVEK JAGDISH SWAMI",
          uploadedDate: "2024-08-20",
          status: "pending",
          description: "System architecture and design presentation"
        },
        {
          id: 3,
          name: "GitHub Repository Link.txt",
          category: "code",
          size: "1 KB",
          uploadedBy: "ADITYA KRISHNAT SHINDE",
          uploadedDate: "2024-09-10",
          status: "approved",
          description: "Link to project GitHub repository"
        },
        {
          id: 4,
          name: "Project Demo Video.mp4",
          category: "videos",
          size: "45.2 MB",
          uploadedBy: "MONIKA RAJIV JADHAV",
          uploadedDate: "2024-10-05",
          status: "approved",
          description: "Complete project demonstration video"
        },
        {
          id: 5,
          name: "Final Report Draft.pdf",
          category: "reports",
          size: "8.3 MB",
          uploadedBy: "ADITYA ANGAD KHADE",
          uploadedDate: "2024-10-12",
          status: "pending",
          description: "Final project report - draft version"
        }
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getFileIcon = (category) => {
    switch (category) {
      case "reports":
        return <FileText className="w-5 h-5 text-blue-600" />;
      case "presentations":
        return <ImageIcon className="w-5 h-5 text-purple-600" />;
      case "code":
        return <Code className="w-5 h-5 text-green-600" />;
      case "videos":
        return <Video className="w-5 h-5 text-red-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const documentStats = {
    total: documents.length,
    approved: documents.filter(d => d.status === "approved").length,
    pending: documents.filter(d => d.status === "pending").length,
    rejected: documents.filter(d => d.status === "rejected").length
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
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold">
                        Project Documentation
                      </h1>
                      <p className="text-purple-100 text-sm mt-1">
                        {student?.group_id || "Team"} - Manage Project Files
                      </p>
                    </div>
                  </div>
                </div>
                
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 hover:bg-purple-50 font-semibold rounded-lg transition-all shadow-lg">
                  <Plus className="w-5 h-5" />
                  Upload Document
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Files"
                value={documentStats.total}
                icon={<FileText className="w-5 h-5" />}
                color="purple"
              />
              <StatsCard
                title="Approved"
                value={documentStats.approved}
                icon={<CheckCircle className="w-5 h-5" />}
                color="green"
              />
              <StatsCard
                title="Pending"
                value={documentStats.pending}
                icon={<Clock className="w-5 h-5" />}
                color="amber"
              />
              <StatsCard
                title="Rejected"
                value={documentStats.rejected}
                icon={<AlertCircle className="w-5 h-5" />}
                color="red"
              />
            </div>
          </div>

          {/* Filters and Search */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto">
                  {documentCategories.map(category => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setFilterCategory(category.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                          filterCategory === category.id
                            ? "bg-purple-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="space-y-3">
              {filteredDocuments.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className="flex-shrink-0 p-3 bg-gray-50 rounded-lg">
                      {getFileIcon(doc.category)}
                    </div>

                    {/* File Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-gray-900 mb-1">
                            {doc.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {doc.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {doc.size}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(doc.uploadedDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              Uploaded by: <strong>{doc.uploadedBy.split(' ')[0]}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs ${getStatusColor(doc.status)}`}>
                          {getStatusIcon(doc.status)}
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredDocuments.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
                  <p className="text-gray-600">
                    {searchQuery || filterCategory !== "all" 
                      ? "Try adjusting your search or filter" 
                      : "Upload your first document to get started"}
                  </p>
                </div>
              )}
            </div>
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
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200"
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

export default Documentation;
