import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import mitlogo from "../../assets/mitlogo.png";
import { apiRequest } from "../../api.js";
import { User } from "lucide-react";

const Header = ({ name, id, welcomeText = "Welcome to your dashboard" }) => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [prevPassword, setPrevPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const menuRef = useRef(null);

  // Fetch student data - NOW GETS EVERYTHING IN ONE CALL
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem("student_token");
        if (!token) return;
        
        // Check localStorage first (for immediate display)
        const savedStudent = localStorage.getItem("student");
        if (savedStudent) {
          const parsedStudent = JSON.parse(savedStudent);
          setStudent(parsedStudent);
          setProfilePicture(parsedStudent.profile_picture_url);
        }

        const res = await apiRequest("/api/studentlogin/profile", "GET", null, token);
        
        // Check for API success
        if (res && res.success !== false && res.profile) {          
          setStudent(res.profile);
          setProfilePicture(res.profile.profile_picture_url);
          localStorage.setItem("student", JSON.stringify(res.profile));
        }
      } catch (err) {
        // Fallback to localStorage if API fails
        const savedStudent = localStorage.getItem("student");
        if (savedStudent) {
          const parsedStudent = JSON.parse(savedStudent);
          setStudent(parsedStudent);
          setProfilePicture(parsedStudent.profile_picture_url);
        }
      }
    };

    // Only fetch if no profile picture in localStorage or no props
    const savedStudent = localStorage.getItem("student");
    const hasProfilePicture = savedStudent ? JSON.parse(savedStudent).profile_picture_url : false;
    
    if (!name || !id || !hasProfilePicture) {
      fetchStudent();
    } else {
      // Just set from localStorage
      const parsedStudent = JSON.parse(savedStudent);
      setStudent(parsedStudent);
      setProfilePicture(parsedStudent.profile_picture_url);
    }
  }, [name, id]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.detail) {
        // Update the student state with new data
        setStudent(prevStudent => ({
          ...prevStudent,
          ...event.detail
        }));
        
        // Update profile picture specifically
        if (event.detail.profile_picture_url) {
          setProfilePicture(event.detail.profile_picture_url);
        }
        
        // Update localStorage
        const currentStudent = JSON.parse(localStorage.getItem("student") || '{}');
        const updatedStudent = {
          ...currentStudent,
          ...event.detail
        };
        localStorage.setItem("student", JSON.stringify(updatedStudent));
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("student_token");
    localStorage.removeItem("student");
    navigate("/studentlogin");
  };

  const handleViewProfile = () => {
    setShowMenu(false);
    navigate("/student/student-profile");
  };

  const handleResetPassword = async () => {
    if (!prevPassword || !newPassword) {
      setMessage("Please fill in both fields");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("student_token");

      await apiRequest(
        "/api/studentlogin/update-password",
        "PUT",
        {
          oldPassword: prevPassword,
          newPassword: newPassword,
        },
        token
      );

      setMessage("✅ Password updated successfully!");
      setShowModal(false);
      setPrevPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(`❌ ${err.message || "Something went wrong. Try again."}`);
    } finally {
      setLoading(false);
    }
  };

  // Get student info from props or fetched data
  const studentInfo = student || { 
    name_of_students: name, 
    name: name, 
    enrollment_no: id 
  };

  const displayName = studentInfo?.name_of_students || 
                     studentInfo?.name || 
                     name ||
                     "Loading...";

  const displayId = studentInfo?.enrollment_no || id || "----";

  return (
    <>
      {/* Main Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] p-3 sm:p-4 rounded-b-lg text-white shadow-lg">
        <div className="flex justify-between items-center">
          {/* Left side: Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              alt="University Logo"
              className="h-8 sm:h-12 w-auto object-contain"
              src={mitlogo}
            />
          </div>

          {/* Right section: User Info + Menu */}
          <div className="flex items-center relative" ref={menuRef}>
            {/* Student Info */}
            <div className="text-right mr-2 sm:mr-4">
              <p className="font-semibold text-xs sm:text-sm">{displayName}</p>
              <div className="text-[10px] sm:text-xs flex flex-wrap items-center gap-1 sm:gap-2">
                <span className="font-mono bg-white/20 px-2 py-1 rounded">
                  {displayId}
                </span>
                {studentInfo?.class && (
                  <span className="bg-white/10 px-2 py-1 rounded">
                    {studentInfo.class}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Picture + Dropdown Arrow */}
            <div
              className="flex items-center cursor-pointer select-none hover:bg-white/20 px-2 py-1 rounded-md transition"
              onClick={() => setShowMenu(!showMenu)}
            >
              {/* Profile Picture */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center mr-2">
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </div>
              
              <span className="material-icons text-lg sm:text-xl">
                {showMenu ? "expand_less" : "expand_more"}
              </span>
            </div>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-xl ring-1 ring-black/5 animate-fadeIn">
                <button
                  onClick={handleViewProfile}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition flex items-center gap-2"
                >
                  <span className="material-icons text-lg">person</span>
                  View Profile
                </button>
                
                <div className="border-t border-gray-200"></div>
                
                <button
                  onClick={() => {
                    setShowModal(true);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition flex items-center gap-2"
                >
                  <span className="material-icons text-lg">lock_reset</span>
                  Change Password
                </button>
                
                <div className="border-t border-gray-200"></div>
                
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 hover:text-red-600 transition flex items-center gap-2"
                >
                  <span className="material-icons text-lg">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Reset Password Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 animate-fadeIn">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Change Password
            </h2>

            {/* Previous Password */}
            <div className="mb-3">
              <label className="block text-sm mb-1 text-gray-800">
                Current Password
              </label>
              <input
                type="password"
                value={prevPassword}
                onChange={(e) => setPrevPassword(e.target.value)}
                className="w-full border border-gray-400 px-3 py-2 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter current password"
              />
            </div>

            {/* New Password */}
            <div className="mb-4">
              <label className="block text-sm mb-1 text-gray-800">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-400 px-3 py-2 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter new password"
              />
            </div>

            {/* Message */}
            {message && (
              <p className={`text-sm mb-2 ${message.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
                {message}
              </p>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPrevPassword("");
                  setNewPassword("");
                  setMessage("");
                }}
                className="px-4 py-2 text-sm rounded-md border border-gray-500 text-gray-800 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;