import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Components/Student/sidebar";
import Header from "../../Components/Student/Header";
import GroupDetails from "../../Components/Student/GroupDetails";
import InfoDrawer from "../../Components/Student/InfoDrawer";
import { DashboardCards } from "../../Components/Student/DashboardCards";
import StudentPosts from "../../Components/Student/posts";
import Loading from "../../Components/Common/loading";
import { Download, FileText, Image, File, ExternalLink, Megaphone, Calendar, Paperclip, Lightbulb, Target, Code, Globe, BookOpen, Plus } from "lucide-react";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [problem, setProblem] = useState(null);
  const [review1Marks, setReview1Marks] = useState(null);
  const [review2Marks, setReview2Marks] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState({ title: "", message: "" });
  const [announcements, setAnnouncements] = useState([]);
  
  // Posts modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [triggerPostsFetch, setTriggerPostsFetch] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (!token) {
      setStudent(null);
      return;
    }

    const fetchProblemStatement = async (groupId, token) => {
      try {
        console.log('Fetching problem statement for group_id:', groupId);
        const psRes = await apiRequest(`/api/students/student/problem-statement/${groupId}`, "GET", null, token);
        console.log('Problem statement response:', psRes);
        const problemStatement = psRes?.data?.problemStatement || psRes?.problemStatement;

        if (problemStatement) {
          console.log('Setting problem statement:', problemStatement);
          setProblem(problemStatement);
        } else {
          console.log('No problem statement found');
          setProblem(null);
        }
      } catch (error) {
        console.error('Error fetching problem statement:', error);
        setProblem(null);
      }
    };

    const fetchStudent = async () => {
      try {
        const profileRes = await apiRequest("/api/student-auth/profile", "GET", null, token);
        const profileData = profileRes?.data?.profile || profileRes?.profile;

        if (!profileData) {
          setStudent(null);
          return;
        }
        setStudent(profileData);

        // Fetch group details and problem statement
        console.log('Fetching group details for enrollment:', profileData.enrollment_no);
        const groupDetailsRes = await apiRequest(`/api/students/student/group-details/${profileData.enrollment_no}`, "GET", null, token);
        console.log('Group details response:', groupDetailsRes);
        const groupDetails = groupDetailsRes?.data?.group || groupDetailsRes?.group;
        
        // If group_id exists, fetch problem statement
        if (groupDetails?.group_id) {
          console.log('Found group_id:', groupDetails.group_id);
          await fetchProblemStatement(groupDetails.group_id, token);
        } else {
          console.log('No group_id found in group details');
        }

        // Fetch PBL Review 1 marks (pass enrollement_no as query param)
        fetchReview1Marks(profileData.enrollment_no, token);

        // Fetch PBL Review 2 marks (pass enrollement_no as query param)
        fetchReview2Marks(profileData.enrollment_no, token);
      } catch (error) {
        console.error('Error in fetchStudent:', error);
      }
    };

    // Use /api/announcement/review1marks?enrollement_no=...
    const fetchReview1Marks = async (enrollment_no, token) => {
      const res = await apiRequest(
        `/api/announcements/announcement/review1marks?enrollement_no=${enrollment_no}`,
        "GET",
        null,
        token
      );
      setReview1Marks(res?.data?.review1Marks || res?.review1Marks || null);
    };

    // Use /api/announcement/review2marks?enrollement_no=...
    const fetchReview2Marks = async (enrollment_no, token) => {
      const res = await apiRequest(
        `/api/announcements/announcement/review2marks?enrollement_no=${enrollment_no}`,
        "GET",
        null,
        token
      );
      setReview2Marks(res?.data?.review2Marks || res?.review2Marks || null);
    };

    fetchStudent();
  }, []);

  const formatTaskName = (name) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleDownloadFile = async (id, fileName) => {
    try {
      const token = localStorage.getItem("student_token");
      const API_BASE_URL = import.meta.env.MODE === "development"
        ? import.meta.env.VITE_API_BASE_URL
        : import.meta.env.VITE_API_BASE_URL_PROD;
      
      const response = await fetch(`${API_BASE_URL}/api/announcements/announcement/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Download failed');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <File className="w-5 h-5 text-gray-500" />;
    
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const canPreviewFile = (fileType) => {
    return fileType && (fileType.startsWith('image/') || fileType === 'application/pdf');
  };

  const openFilePreview = (fileUrl, fileType) => {
    // For images and PDFs, open in new tab for preview
    if (canPreviewFile(fileType)) {
      window.open(fileUrl, '_blank');
    }
  };

  // Updated to fetch and store announcements as objects
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("student_token");
      const res = await apiRequest("/api/announcements/", "GET", null, token);
      const announcementData = res?.data?.announcements || res?.announcements;

      if (announcementData) {
        setAnnouncements(announcementData);
      }
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }
  };

  // Updated card click handler to include file preview and download
  const handleCardClick = async (type) => {
    try {
      let title = "";
      let message = "";
      const token = localStorage.getItem("student_token");

      switch (type) {
        case "Announcements":
          await fetchAnnouncements();
          title = "Announcements";
          setDrawerContent({ 
            title, 
            message: "Loading announcements...",
            isAnnouncementView: true 
          });
          setDrawerOpen(true);
          return;

        case "Events & Posts":
          // Open posts modal instead of drawer
          setTriggerPostsFetch(true);
          setShowPostModal(true);
          return; // Don't open drawer

        case "Upload Document":
          title = "Upload Document";
          message =
            "⚠️ After group creation and Mentor Allocation, you can upload documents related to your project.";
          break;

        case "Team Chat":
          title = "Team Chat";
          message =
            "💬 After group creation and Mentor Allocation, Team Chat will be available!";
          break;

        case "Internship Details":
          navigate("/student/InternshipDetails");
          return;

        default:
          return;
      }

      setDrawerContent({ title, message });
      setDrawerOpen(true);
    } catch (err) {
      setDrawerContent({
        title: "Error",
        message: "Something went wrong. Please try again later.",
      });
      setDrawerOpen(true);
    }
  };

  // Handle closing posts modal
  const handleClosePostModal = () => {
    setShowPostModal(false);
    setTriggerPostsFetch(false);
  };

  // Custom announcement drawer content
  const AnnouncementsContent = () => {
    if (announcements.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Megaphone className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No announcements available</p>
          <p className="text-gray-400 text-sm mt-1">Check back later for updates</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div 
            key={announcement.id} 
            className="group bg-gradient-to-br from-white to-purple-50 rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white text-base flex-1">
                {announcement.title}
              </h3>
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {announcement.message}
              </p>
              
              {/* File attachment section */}
              {announcement.file_url && (
                <div className="mt-4 pt-4 border-t border-purple-100">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getFileIcon(announcement.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700 font-medium truncate">
                            {announcement.file_name || 'Attachment'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {announcement.file_type?.split('/')[1]?.toUpperCase() || 'File'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-3">
                      {/* Preview button for supported files */}
                      {canPreviewFile(announcement.file_type) && (
                        <button
                          onClick={() => openFilePreview(announcement.file_url, announcement.file_type)}
                          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          title="Preview file"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Download button for all files */}
                      <button
                        onClick={() => handleDownloadFile(announcement.id, announcement.file_name)}
                        className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Timestamp */}
              <div className="mt-3 flex items-center justify-end">
                <span className="text-xs text-gray-400">
                  {new Date(announcement.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!student)
    return <Loading message="Loading your dashboard" />;

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header
        name={student?.name_of_students || student?.name || "Student"}
        id={student?.enrollment_no || "----"}
      />
      <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
        <Sidebar />
        <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 space-y-6">
          <DashboardCards onCardClick={handleCardClick} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <GroupDetails enrollmentNo={student.enrollment_no} />

              {/* PBL Review 1 & 2 Marks */}
              <div className="bg-white p-6 rounded-xl shadow-sm mt-8 flex flex-col">
                <h2 className="text-xl font-bold text-purple-800 mb-4">PBL Review Marks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4 bg-purple-50">
                    <h3 className="font-semibold text-purple-700 mb-2">Review 1</h3>
                    {review1Marks ? (
                      <>
                        <p className="text-gray-700">
                          <span className="font-bold">Marks:</span> {review1Marks.total}/50
                        </p>
                        <p className="text-gray-700 text-sm mt-1">
                          <span className="font-bold">Date:</span> August 11, 2024
                        </p>
                        <p className="text-gray-700 mt-2">
                          <span className="font-bold">Feedback:</span> {review1Marks.feedback}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">Marks not available.</p>
                    )}
                  </div>
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold text-blue-700 mb-2">Review 2</h3>
                    {review2Marks ? (
                      <>
                        <p className="text-gray-700">
                          <span className="font-bold">Marks:</span> {review2Marks.total}/50
                        </p>
                        <p className="text-gray-700 text-sm mt-1">
                          <span className="font-bold">Date:</span> November 6, 2024
                        </p>
                        <p className="text-gray-700 mt-2">
                          <span className="font-bold">Feedback:</span> {review2Marks.feedback}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">Marks not available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Problem Statement
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {problem ? (
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                        {problem.title}
                      </h3>
                    </div>

                    {/* Metadata Grid */}
                    {(problem.type || problem.technologybucket || problem.domain) && (
                      <div className="grid grid-cols-1 gap-3">
                        {problem.type && (
                          <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <Target className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-blue-600 font-medium">Type</p>
                              <p className="text-sm text-gray-900 font-semibold">{problem.type}</p>
                            </div>
                          </div>
                        )}
                        
                        {problem.technologybucket && (
                          <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3 border border-green-100">
                            <Code className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-green-600 font-medium">Technology</p>
                              <p className="text-sm text-gray-900 font-semibold">{problem.technologybucket}</p>
                            </div>
                          </div>
                        )}
                        
                        {problem.domain && (
                          <div className="flex items-center gap-3 bg-orange-50 rounded-lg p-3 border border-orange-100">
                            <Globe className="w-5 h-5 text-orange-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-orange-600 font-medium">Domain</p>
                              <p className="text-sm text-gray-900 font-semibold">{problem.domain}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {problem.description && (
                      <div className="mt-4 pt-4 border-t border-purple-100">
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">Description</h4>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                          {problem.description}
                        </p>
                      </div>
                    )}

                    {/* Edit Button */}
                    <div className="pt-4 border-t border-purple-100">
                      <a
                        href="/student/problem-statement"
                        className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Edit Problem Statement
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                      <Lightbulb className="w-12 h-12 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-4 text-center">
                      No problem statement submitted yet
                    </p>
                    <a
                      href="/student/problem-statement"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Add Problem Statement
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Enhanced Info Drawer with custom content for announcements */}
      <InfoDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerContent.title}
        message={drawerContent.isAnnouncementView ? null : drawerContent.message}
        customContent={
          drawerContent.isAnnouncementView ? <AnnouncementsContent /> : null
        }
      />

      {/* Posts Modal */}
      <StudentPosts
        isModalOpen={showPostModal}
        onCloseModal={handleClosePostModal}
        triggerFetch={triggerPostsFetch}
      />
    </div>
  );
};

export default StudentDashboard;