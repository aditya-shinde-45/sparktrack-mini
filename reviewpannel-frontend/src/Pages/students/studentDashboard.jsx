import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import Sidebar from "../../Components/Student/sidebar";
import Header from "../../Components/Student/Header";
import GroupDetails from "../../Components/Student/GroupDetails";
import InfoDrawer from "../../Components/Student/InfoDrawer";
import { DashboardCards } from "../../Components/Student/DashboardCards";
import StudentPosts from "../../Components/Student/posts";
import { Download, FileText, Image, File, ExternalLink } from "lucide-react";

const StudentDashboard = () => {
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

    const fetchStudent = async () => {
      const profileRes = await apiRequest("/api/student-auth/profile", "GET", null, token);
      const profileData = profileRes?.data?.profile || profileRes?.profile;

      if (!profileData) {
        setStudent(null);
        return;
      }
      setStudent(profileData);

      // Fetch group details
      fetchGroup(profileData.enrollment_no, token);

      // Fetch problem statement using group_id
      if (profileData.group_id) {
        fetchProblemStatement(profileData.group_id, token);
      }

      // Fetch PBL Review 1 marks (pass enrollement_no as query param)
      fetchReview1Marks(profileData.enrollment_no, token);

      // Fetch PBL Review 2 marks (pass enrollement_no as query param)
      fetchReview2Marks(profileData.enrollment_no, token);
    };

    const fetchGroup = async (enrollment, token) => {
      await apiRequest(`/api/students/pbl/gp/${enrollment}`, "GET", null, token);
    };

    const fetchProblemStatement = async (groupId, token) => {
      const psRes = await apiRequest(`/api/students/student/problem-statement/${groupId}`, "GET", null, token);
      const problemStatement = psRes?.data?.problemStatement || psRes?.problemStatement;

      if (problemStatement) {
        setProblem(problemStatement);
      } else {
        setProblem(null);
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
      const res = await apiRequest("/api/announcements/announcement", "GET", null, token);
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
      return <div className="text-center text-gray-500">No announcements available.</div>;
    }
    
    return (
      <div className="space-y-6">
        {announcements.map((announcement) => (
          <div 
            key={announcement.id} 
            className="p-4 bg-white rounded-lg border border-purple-100 shadow-sm"
          >
            <h3 className="font-bold text-purple-700 text-lg mb-2">
              📢 {announcement.title}
            </h3>
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">
              {announcement.message}
            </p>
            
            {/* File attachment section */}
            {announcement.file_url && (
              <div className="mt-3 border-t pt-3">
                <div className="flex items-center gap-3">
                  {getFileIcon(announcement.file_type)}
                  <span className="text-sm text-gray-600 font-medium">
                    {announcement.file_name || 'Attachment'}
                  </span>
                  
                  <div className="ml-auto flex gap-2">
                    {/* Preview button for supported files */}
                    {canPreviewFile(announcement.file_type) && (
                      <button
                        onClick={() => openFilePreview(announcement.file_url, announcement.file_type)}
                        className="p-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        title="Preview file"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Download button for all files */}
                    <button
                      onClick={() => handleDownloadFile(announcement.id, announcement.file_name)}
                      className="p-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-2 text-right">
              <span className="text-xs text-gray-400">
                {new Date(announcement.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!student)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading student data...</div>
      </div>
    );

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

            <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col items-center text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Problem Statement
              </h2>
              {problem ? (
                <div className="max-w-xl text-left">
                  <h3 className="text-lg font-bold text-purple-700 mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed text-justify">
                    {problem.description}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">
                    No problem statement has been selected yet.
                  </p>
                  <a
                    href="/student/problem-statement"
                    className="text-white font-medium py-2 px-6 rounded-lg transition duration-300 bg-purple-600 hover:bg-purple-700"
                  >
                    Choose Problem Statement
                  </a>
                </>
              )}
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