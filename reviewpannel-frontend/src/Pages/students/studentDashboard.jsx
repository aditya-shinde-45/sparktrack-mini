import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import Sidebar from "../../Components/Student/sidebar";
import Header from "../../Components/Student/Header"; // <-- Use Common Header
import GroupDetails from "../../Components/Student/GroupDetails";
import InfoDrawer from "../../Components/Student/InfoDrawer";
import { DashboardCards } from "../../Components/Student/DashboardCards";
import StudentPosts from "../../Components/Student/posts"; // Import posts modal

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [problem, setProblem] = useState(null);
  const [review1Marks, setReview1Marks] = useState(null);
  const [review2Marks, setReview2Marks] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState({ title: "", message: "" });
  
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
      const profileRes = await apiRequest("/api/studentlogin/profile", "GET", null, token);
      if (!profileRes || !profileRes.profile) {
        setStudent(null);
        return;
      }
      setStudent(profileRes.profile);

      // Fetch group details
      fetchGroup(profileRes.profile.enrollment_no, token);

      // Fetch problem statement using group_id
      if (profileRes.profile.group_id) {
        fetchProblemStatement(profileRes.profile.group_id, token);
      }

      // Fetch PBL Review 1 marks (pass enrollement_no as query param)
      fetchReview1Marks(profileRes.profile.enrollment_no, token);

      // Fetch PBL Review 2 marks (pass enrollement_no as query param)
      fetchReview2Marks(profileRes.profile.enrollment_no, token);
    };

    const fetchGroup = async (enrollment, token) => {
      await apiRequest(`/api/pbl/gp/${enrollment}`, "GET", null, token);
    };

    const fetchProblemStatement = async (groupId, token) => {
      const psRes = await apiRequest(`/api/student/problem-statement/${groupId}`, "GET", null, token);
      if (psRes && psRes.problemStatement) {
        setProblem(psRes.problemStatement);
      } else {
        setProblem(null);
      }
    };

    // Use /api/announcement/review1marks?enrollement_no=...
    const fetchReview1Marks = async (enrollment_no, token) => {
      const res = await apiRequest(
        `/api/announcement/review1marks?enrollement_no=${enrollment_no}`,
        "GET",
        null,
        token
      );
      setReview1Marks(res?.review1Marks || null);
    };

    // Use /api/announcement/review2marks?enrollement_no=...
    const fetchReview2Marks = async (enrollment_no, token) => {
      const res = await apiRequest(
        `/api/announcement/review2marks?enrollement_no=${enrollment_no}`,
        "GET",
        null,
        token
      );
      setReview2Marks(res?.review2Marks || null);
    };

    fetchStudent();
  }, []);

  const formatTaskName = (name) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Updated card click handler to include posts modal
  const handleCardClick = async (type) => {
    try {
      let res;
      let title = "";
      let message = "";
      const token = localStorage.getItem("student_token");

      switch (type) {
        case "Announcements":
          res = await apiRequest("/api/announcement", "GET", null, token);
          title = "Announcements";
          message = res?.announcements?.length
            ? res.announcements
                .map(
                  (a) => `
                  <div class="mb-3">
                    <p class="font-semibold text-purple-700">📢 ${a.title}</p>
                    <p class="text-sm text-gray-600">${a.message}</p>
                    <p class="text-xs text-gray-400">${new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                `
                )
                .join("")
            : "📢 No announcements available.";
          break;

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
                          <span className="font-bold">Marks:</span> {review1Marks.total}
                        </p>
                        <p className="text-gray-700">
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
                          <span className="font-bold">Marks:</span> {review2Marks.total}
                        </p>
                        <p className="text-gray-700">
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
      
      {/* Info Drawer */}
      <InfoDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerContent.title}
        message={drawerContent.message}
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