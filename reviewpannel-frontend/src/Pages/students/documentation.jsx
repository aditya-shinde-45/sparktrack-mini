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
  Code,
  X
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    file: null,
    category: "",
    description: "",
    uploadType: "file",
    link: "",
    customCategory: ""
  });

  const documentCategories = [
    { id: "all", name: "All Documents", icon: FileText },
    { id: "reports", name: "Reports", icon: FileText },
    { id: "presentations", name: "Presentations", icon: ImageIcon },
    { id: "code", name: "Code/Repository", icon: Code },
    { id: "videos", name: "Videos/Demos", icon: Video },
    { id: "tracker", name: "Tracker Sheet", icon: FileText }
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
      const token = localStorage.getItem("student_token");
      const response = await apiRequest("/api/student/documents", "GET", null, token);
      const docs = response?.data?.documents || [];
      setDocuments(docs);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setDocuments([]);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData({ ...uploadData, file });
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    const finalCategory = uploadData.category === "custom" ? uploadData.customCategory : uploadData.category;
    
    if (!finalCategory) {
      alert("Please select or enter document type");
      return;
    }

    if (uploadData.uploadType === "file" && !uploadData.file) {
      alert("Please select a file");
      return;
    }

    if (uploadData.uploadType === "link" && !uploadData.link) {
      alert("Please enter a link");
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem("student_token");
      
      if (uploadData.uploadType === "link") {
        const payload = {
          category: finalCategory,
          description: uploadData.description,
          document_url: uploadData.link,
          document_name: uploadData.description || "Link Document"
        };
        
        const response = await apiRequest("/api/student/documents/link", "POST", payload, token);
        
        if (response?.success) {
          alert("Link added successfully!");
          setShowUploadModal(false);
          setUploadData({ file: null, category: "", description: "", uploadType: "file", link: "", customCategory: "" });
          await fetchDocuments();
        } else {
          throw new Error(response?.message || "Failed to add link");
        }
      } else {
        const formData = new FormData();
        formData.append("file", uploadData.file);
        formData.append("category", finalCategory);
        formData.append("description", uploadData.description);

        const response = await apiRequest("/api/student/documents/upload", "POST", formData, token, true);
        
        if (response?.success) {
          alert("Document uploaded successfully!");
          setShowUploadModal(false);
          setUploadData({ file: null, category: "", description: "", uploadType: "file", link: "", customCategory: "" });
          await fetchDocuments();
        } else {
          throw new Error(response?.message || "Upload failed");
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        const token = localStorage.getItem("student_token");
        await apiRequest(`/api/student/documents/${docId}`, "DELETE", null, token);
        alert("Document deleted successfully!");
        // Refresh document list
        await fetchDocuments();
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete document");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-900 border-green-400 font-bold";
      case "pending":
        return "bg-amber-100 text-amber-900 border-amber-400 font-bold";
      case "rejected":
        return "bg-red-100 text-red-900 border-red-400 font-bold";
      default:
        return "bg-gray-200 text-gray-900 border-gray-400 font-bold";
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
        return <FileText className="w-5 h-5 text-blue-700" />;
      case "presentations":
        return <ImageIcon className="w-5 h-5 text-purple-700" />;
      case "code":
        return <Code className="w-5 h-5 text-green-700" />;
      case "videos":
        return <Video className="w-5 h-5 text-red-700" />;
      default:
        return <File className="w-5 h-5 text-gray-700" />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    // Use document_name or name, and description fallback
    const docName = (doc.document_name || doc.name || "").toLowerCase();
    const docDesc = (doc.description || "").toLowerCase();
    const matchesSearch = docName.includes(searchQuery.toLowerCase()) ||
                         docDesc.includes(searchQuery.toLowerCase());
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
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-purple-100 rounded-lg">
                      <FileText className="w-6 h-6 text-purple-700" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Documentation
                      </h1>
                      <p className="text-gray-600 text-sm mt-0.5">
                        {student?.group_id || "Team"} • Manage your project files
                      </p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white hover:bg-purple-700 font-semibold rounded-lg transition-colors shadow-sm">
                  <Plus className="w-5 h-5" />
                  Upload Document
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 placeholder-gray-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto">
                  {documentCategories.map(category => {
                    const Icon = category.icon;
                    const isActive = filterCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setFilterCategory(category.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                          isActive
                            ? "bg-purple-600 text-white"
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
                  className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {getFileIcon(doc.category)}
                      </div>
                    </div>

                    {/* File Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-gray-900 mb-1">
                            {doc.document_name || doc.name}
                          </h4>
                          <p className="text-sm text-gray-700 mb-2">
                            {doc.description || "No description provided"}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(doc.created_at || doc.uploadedDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm ${getStatusColor(doc.status)}`}>
                          {getStatusIcon(doc.status)}
                          <span className="uppercase tracking-wide">
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </span>
                        </span>
                      </div>

                      {/* Rejection Feedback */}
                      {doc.status === 'rejected' && doc.rejection_feedback && (
                        <div className="mt-3 bg-red-50 border-l-4 border-red-500 p-3 rounded">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-red-800 mb-1">Rejection Feedback:</p>
                              <p className="text-xs text-red-700">{doc.rejection_feedback}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <a 
                          href={doc.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-300">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </a>
                        <a 
                          href={doc.document_url}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-800 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-300">
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                        {doc.status === 'rejected' && (
                          <button 
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-300">
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredDocuments.length === 0 && (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Documents Found</h3>
                  <p className="text-gray-700 mb-4">
                    {searchQuery || filterCategory !== "all" 
                      ? "Try adjusting your search or filter to find what you're looking for" 
                      : "Upload your first document to get started"}
                  </p>
                  {!searchQuery && filterCategory === "all" && (
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
                      <Plus className="w-5 h-5" />
                      Upload Your First Document
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Upload className="w-5 h-5 text-purple-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Upload Document</h2>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadData({ file: null, category: "", description: "", uploadType: "file", link: "", customCategory: "" });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
              {/* Upload Type Toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Upload Method
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadData({ ...uploadData, uploadType: "file", link: "" })}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                      uploadData.uploadType === "file"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadData({ ...uploadData, uploadType: "link", file: null })}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                      uploadData.uploadType === "link"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Add Link
                  </button>
                </div>
              </div>

              {/* Document Type Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData({ ...uploadData, category: e.target.value, customCategory: "" })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 bg-white"
                  required
                >
                  <option value="">Select document type...</option>
                  {documentCategories
                    .filter(cat => cat.id !== "all")
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  <option value="custom">Other (Type your own)</option>
                </select>
              </div>

              {/* Custom Category Input */}
              {uploadData.category === "custom" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Custom Document Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadData.customCategory}
                    onChange={(e) => setUploadData({ ...uploadData, customCategory: e.target.value })}
                    placeholder="Enter document type..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 placeholder-gray-500 bg-white"
                    required
                  />
                </div>
              )}

              {/* File Upload or Link Input */}
              {uploadData.uploadType === "file" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Choose File <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer bg-white"
                      required={uploadData.uploadType === "file"}
                    />
                  </div>
                  {uploadData.file && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-900 flex items-center gap-2">
                        <File className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold">{uploadData.file.name}</span>
                        <span className="text-gray-600">({(uploadData.file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Document Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={uploadData.link}
                    onChange={(e) => setUploadData({ ...uploadData, link: e.target.value })}
                    placeholder="https://example.com/document"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 placeholder-gray-500 bg-white"
                    required={uploadData.uploadType === "link"}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Add a brief description..."
                  rows="4"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 placeholder-gray-500 resize-none bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadData({ file: null, category: "", description: "", uploadType: "file", link: "", customCategory: "" });
                  }}
                  className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className={`flex-1 px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors ${
                    uploading ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200"
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200"
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200"
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200"
    }
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <div className={`p-2 rounded-lg ${colors.bg} ${colors.text} border ${colors.border}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

export default Documentation;
