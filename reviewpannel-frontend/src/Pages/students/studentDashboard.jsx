import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import Sidebar from "../../Components/Student/sidebar";
import Header from "../../Components/Student/Header";
import GroupDetails from "../../Components/Student/GroupDetails";
import InfoDrawer from "../../Components/Student/InfoDrawer";

const CARD_COLORS = {
  blue: {
    bg: "bg-blue-100",
    border: "border-blue-300",
    text: "text-blue-800",
    icon: "text-blue-500",
    hover: "hover:bg-blue-200",
    shadow: "shadow-blue-200",
  },
  green: {
    bg: "bg-green-100",
    border: "border-green-300",
    text: "text-green-800",
    icon: "text-green-500",
    hover: "hover:bg-green-200",
    shadow: "shadow-green-200",
  },
  yellow: {
    bg: "bg-yellow-100",
    border: "border-yellow-300",
    text: "text-yellow-800",
    icon: "text-yellow-500",
    hover: "hover:bg-yellow-200",
    shadow: "shadow-yellow-200",
  },
  red: {
    bg: "bg-red-100",
    border: "border-red-300",
    text: "text-red-800",
    icon: "text-red-500",
    hover: "hover:bg-red-200",
    shadow: "shadow-red-200",
  },
};

const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [problem, setProblem] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState({ title: "", message: "" });

  useEffect(() => {
    console.log("StudentDashboard useEffect running");
    const token = localStorage.getItem("student_token");
    console.log("Token:", token);

    const fetchStudent = async () => {
      const token = localStorage.getItem("student_token");
      if (!token) {
        setStudent(null);
        return;
      }
      // Use /api/ prefix for all endpoints
      const profileRes = await apiRequest("/api/student/profile", "GET", null, token);
      console.log("Profile API response:", profileRes);
      if (!profileRes || !profileRes.profile) {
        setStudent(null);
        return;
      }
      setStudent(profileRes.profile);

      // Fetch announcements for class prefix
      const classPrefix = profileRes.profile.class?.substring(0, 2);
      if (classPrefix) fetchAnnouncements(classPrefix, token);

      // Fetch group details
      fetchGroup(profileRes.profile.enrollment_no, token);
    };

    const fetchGroup = async (enrollment, token) => {
      const groupRes = await apiRequest(`/api/pbl/gp/${enrollment}`, "GET", null, token);
      console.log("Group API response:", groupRes);
      if (groupRes?.group?.studentproblemstatement) {
        setProblem(groupRes.group.studentproblemstatement);
      }
    };

    const fetchAnnouncements = async (prefix, token) => {
      const annRes = await apiRequest(`/api/admintools/class/${prefix}`, "GET", null, token);
      console.log("Announcements API response:", annRes);
      setAnnouncements(annRes || []);
    };

    fetchStudent();
  }, []);

  const formatTaskName = (name) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleCardClick = async (type) => {
    try {
      let res;
      let title = "";
      let message = "";
      const token = localStorage.getItem("student_token");

      switch (type) {
        case "Announcements":
          res = await apiRequest("/admintools", "GET", null, token);
          title = "Announcements";
          message = res?.length
            ? res
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

        case "Deadlines":
          res = await apiRequest("/admintools/timelines", "GET", null, token);
          title = "Deadlines";
          message = res?.length
            ? res
                .map(
                  (d) => `
                    <div class="mb-3">
                      <p class="font-semibold text-purple-700">📌 ${formatTaskName(d.task_name)}</p>
                      <p class="text-sm text-gray-600">Start: ${new Date(d.start_datetime).toLocaleDateString()}</p>
                      <p class="text-sm text-gray-600">End: ${new Date(d.end_datetime).toLocaleDateString()}</p>
                    </div>
                  `
                )
                .join("")
            : "🗓 No deadlines found.";
          break;

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

  if (!student)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading student data...</div>
      </div>
    );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto lg:ml-48">
        <Header student={student} welcomeText="Welcome to Project Planning" />

        <main className="p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
            <Card
              color="blue"
              title="Announcements"
              subtitle="Check for updates"
              icon="campaign"
              onClick={handleCardClick}
            />
            <Card
              color="green"
              title="Upload Document"
              subtitle="Submit your work"
              icon="upload_file"
              onClick={handleCardClick}
            />
            <Card
              color="yellow"
              title="Deadlines"
              subtitle="View upcoming dates"
              icon="event_available"
              onClick={handleCardClick}
            />
            <Card
              color="red"
              title="Team Chat"
              subtitle="Communicate with group"
              icon="chat"
              onClick={handleCardClick}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <GroupDetails enrollmentNo={student.enrollment_no} />

              <div className="bg-white p-6 rounded-xl shadow-sm h-64 mt-8 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                  <a
                    className="text-purple-600 hover:underline"
                    href="/announcements"
                  >
                    View All
                  </a>
                </div>
                <div className="flex-grow overflow-y-auto">
                  {announcements.length === 0 ? (
                    <div className="text-gray-500 text-center">
                      No announcements for your class.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((a, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            idx % 3 === 0
                              ? "bg-violet-50 border-violet-200 text-violet-700"
                              : idx % 3 === 1
                              ? "bg-sky-50 border-sky-200 text-sky-700"
                              : "bg-amber-50 border-amber-200 text-amber-700"
                          }`}
                        >
                          <p className="font-medium text-sm">{a.title}</p>
                          <p className="text-sm">{a.message}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(a.created_at).toLocaleDateString()}
                          </p>
                          {a.file_path && (
                            <a
                              href={a.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 underline"
                            >
                              View Attachment
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
                    href="/problem-statement"
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

      {/* Drawer Component */}
      <InfoDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerContent.title}
        message={drawerContent.message}
      />
    </div>
  );
};

const Card = ({ color, title, subtitle, icon, onClick }) => {
  const styles = CARD_COLORS[color] || CARD_COLORS.blue;
  return (
    <div
      onClick={() => onClick(title)}
      className={`group ${styles.bg} ${styles.border} border p-6 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 ${styles.shadow} ${styles.hover} hover:scale-[1.03]`}
      style={{ minHeight: "120px" }}
    >
      <div>
        <h3 className={`font-bold text-lg ${styles.text}`}>{title}</h3>
        <p className={`text-sm mt-1 ${styles.text} opacity-80`}>{subtitle}</p>
      </div>
      <span className={`material-icons ${styles.icon} text-4xl group-hover:scale-110 transition-transform`}>
        {icon}
      </span>
    </div>
  );
};

export default StudentDashboard;