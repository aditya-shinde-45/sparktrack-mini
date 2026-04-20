import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import mitlogo from "../../assets/mitlogo.png";
import { apiRequest } from "../../api.js";
import { User, ChevronDown, KeyRound, LogOut, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

const Header = ({ name, id }) => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [prevPassword, setPrevPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPrev, setShowPrev] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", ok: null });
  const [profilePicture, setProfilePicture] = useState(null);
  const menuRef = useRef(null);

  // Fetch student data - NOW GETS EVERYTHING IN ONE CALL
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem("student_token");
        const enrollmentNo = localStorage.getItem("enrollmentNumber") || id;
        if (!token || !enrollmentNo) return;
        
        // Check localStorage first (for immediate display)
        const savedStudent = localStorage.getItem("student");
        if (savedStudent) {
          const parsedStudent = JSON.parse(savedStudent);
          setStudent(parsedStudent);
          setProfilePicture(parsedStudent.profile_picture_url);
        }

        const res = await apiRequest(`/api/students/student/profile/${enrollmentNo}`, "GET", null, token);
        
        // Check for API success
        if (res && res.success !== false) {
          // Extract profile from the correct location
          const profileData = res.data?.profile || res.profile || res;
          
          setStudent(profileData);
          
          // Handle profile picture URL (if it exists)
          if (profileData.profile_picture_url) {
            setProfilePicture(profileData.profile_picture_url);
          } else {
            setProfilePicture(null); // Explicitly set to null if not available
          }
          
          localStorage.setItem("student", JSON.stringify(profileData));
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

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('student_token');
      // Call backend to invalidate refresh token
      if (token) {
        await apiRequest('/api/student-auth/logout', 'POST', null, token);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear all tokens and data regardless of API result
      localStorage.removeItem("student_token");
      localStorage.removeItem("student_refresh_token");
      localStorage.removeItem("student");
      localStorage.removeItem("enrollmentNumber");
      navigate("/studentlogin");
    }
  };

  const handleViewProfile = () => {
    setShowMenu(false);
    navigate("/student/student-profile");
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/studentdashboard');
  };

  const handleResetPassword = async () => {
    if (!prevPassword || !newPassword) {
      setMessage({ text: "Please fill in both fields.", ok: false });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: "New password must be at least 6 characters.", ok: false });
      return;
    }

    setLoading(true);
    setMessage({ text: "", ok: null });

    try {
      const token = localStorage.getItem("student_token");

      const response = await apiRequest(
        "/api/student-auth/update-password",
        "PUT",
        {
          oldPassword: prevPassword,
          newPassword: newPassword,
        },
        token
      );

      if (response?.success) {
        setMessage({ text: "Password updated successfully!", ok: true });
        setTimeout(() => {
          setShowModal(false);
          setPrevPassword("");
          setNewPassword("");
          setShowPrev(false);
          setShowNew(false);
          setMessage({ text: "", ok: null });
        }, 1500);
      } else {
        setMessage({ text: response?.message || "Current password is incorrect.", ok: false });
      }
    } catch (err) {
      setMessage({ text: err.message || "Something went wrong. Try again.", ok: false });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setPrevPassword("");
    setNewPassword("");
    setShowPrev(false);
    setShowNew(false);
    setMessage({ text: "", ok: null });
  };

  // Get student info from props or fetched data
  const studentInfo = student || { 
    name_of_students: name, 
    name: name, 
    enrollment_no: id 
  };

  const displayName = studentInfo?.name_of_student ||
                     studentInfo?.name_of_students || 
                     studentInfo?.name || 
                     name ||
                     "Loading...";

  const displayId = studentInfo?.enrollment_no || id || "----";

  return (
    <>
      {/* Main Header */}
      <header
        className="fixed top-0 left-0 w-full z-50 h-[72px] flex items-center px-4 sm:px-6"
        style={{
          background: "linear-gradient(100deg, rgba(109,88,240,0.9) 0%, rgba(78,56,199,0.92) 55%, rgba(59,42,173,0.94) 100%)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "0 4px 24px rgba(78,56,199,0.28)",
        }}
      >
        <div className="relative flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleBack}
            className="sm:hidden w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>

          <img src={mitlogo} alt="Logo" className="h-12 sm:h-14 w-auto object-contain" />
        </div>

        <div className="relative ml-auto flex items-center gap-3" ref={menuRef}>
          <div className="hidden sm:block text-right">
            <p className="text-white font-semibold text-sm leading-tight truncate max-w-[220px]">{displayName}</p>
            <p className="text-purple-200 text-[11px] font-mono mt-0.5">{displayId}</p>
          </div>

          <button
            onClick={() => setShowMenu((value) => !value)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-all duration-200 hover:bg-white/10"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={18} className="text-white" />
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-purple-700" />
            </div>
            <ChevronDown size={15} className={`text-white/75 transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`} />
          </button>

          {showMenu && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-52 bg-white rounded-2xl shadow-xl ring-1 ring-purple-200 overflow-hidden z-50">
                <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
                  <p className="text-xs font-bold text-purple-800 truncate">{displayName}</p>
                  <p className="text-[11px] text-purple-500 font-mono mt-0.5">{displayId}</p>
                </div>
                <div className="py-1.5">
                <button
                  onClick={handleViewProfile}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-150"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-purple-600" />
                  </div>
                  View Profile
                </button>

                <button
                  onClick={() => {
                    setShowModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors duration-150"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <KeyRound size={14} className="text-purple-600" />
                  </div>
                  Change Password
                </button>

                <div className="my-1.5 mx-3 border-t border-purple-100" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
                >
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <LogOut size={14} className="text-red-500" />
                  </div>
                  Sign Out
                </button>
                </div>
              </div>
          )}
        </div>
      </header>

      {/* Reset Password Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <KeyRound size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Change Password</p>
                  <p className="text-purple-200 text-[11px]">Update your login credentials</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-white/60 hover:text-white transition-colors">
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPrev ? "text" : "password"}
                    value={prevPassword}
                    onChange={(e) => setPrevPassword(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPrev((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPrev ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {message.text && (
                <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
                  message.ok
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}>
                  {message.ok ? <CheckCircle2 size={16} className="flex-shrink-0" /> : <XCircle size={16} className="flex-shrink-0" />}
                  {message.text}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Updating…" : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;