import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import mitlogo from "../../assets/mitlogo.png";
import { apiRequest } from "../../api.js"; // centralized API wrapper

const Header = ({ name, id }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const menuRef = useRef(null);

  const role = localStorage.getItem("role");

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("user_id");
      
      // First verify current password by attempting login
      const loginResponse = await apiRequest("/api/roles/login", "POST", {
        userId: userId,
        password: currentPassword
      });

      if (!loginResponse.success) {
        setPasswordError("Current password is incorrect");
        return;
      }

      // Get the role ID to update password
      const rolesResponse = await apiRequest("/api/roles", "GET", null, token);
      const currentRole = rolesResponse.data.find(r => r.user_id === userId);

      if (!currentRole) {
        setPasswordError("Role not found");
        return;
      }

      // Update password
      const updateResponse = await apiRequest(
        `/api/roles/${currentRole.id}`,
        "PUT",
        {
          userId: userId,
          password: newPassword,
          tablePermissions: currentRole.table_permissions
        },
        token
      );

      if (updateResponse.success) {
        alert("Password changed successfully!");
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
      } else {
        setPasswordError(updateResponse.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      setPasswordError(error.message || "Failed to change password");
    }
  };

  const handleLogout = () => {
    // Clear all authentication-related data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("groups");
    localStorage.removeItem("id");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("student_token");
    localStorage.removeItem("student_refresh_token");
    localStorage.removeItem("external_id");
    localStorage.removeItem("selected_mentor");
    
    // Clear external evaluator details
    localStorage.removeItem("external1_name");
    localStorage.removeItem("external2_name");
    localStorage.removeItem("organization1_name");
    localStorage.removeItem("organization2_name");
    localStorage.removeItem("external1_contact");
    localStorage.removeItem("external2_contact");
    localStorage.removeItem("external1_email");
    localStorage.removeItem("external2_email");
    localStorage.removeItem("google_meet_link");
    localStorage.removeItem("meet_screenshot_url");

    // Redirect to login page
    navigate("/login");
    
    // Force reload to clear any in-memory state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] p-3 sm:p-4 rounded-b-lg text-white flex justify-between items-center shadow-lg">
      {/* Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <img
          alt="University Logo"
          className="h-8 sm:h-12 w-auto object-contain"
          src={mitlogo}
        />
      </div>

      {/* Right section */}
      <div className="flex items-center relative" ref={menuRef}>
        <div className="text-right mr-2 sm:mr-4">
          <p className="font-semibold text-xs sm:text-sm">{name}</p>
          <p className="text-[10px] sm:text-xs">{id}</p>
        </div>

        {/* Account Icon + Dropdown Arrow */}
        <div
          className="flex items-center cursor-pointer select-none hover:bg-white/20 px-2 py-1 rounded-md transition"
          onClick={() => setShowMenu(!showMenu)}
        >
          <span className="material-icons text-2xl sm:text-3xl">
            account_circle
          </span>
          <span className="material-icons text-lg sm:text-xl ml-1">
            {showMenu ? "expand_less" : "expand_more"}
          </span>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-xl ring-1 ring-black/5 animate-fadeIn">
            {/* ✅ Show Change Password option for admin role */}
            {role === "admin" && (
              <>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowPasswordModal(true);
                  }}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition flex items-center gap-2"
                >
                  <span className="material-icons text-base">lock</span>
                  Change Password
                </button>
                <div className="border-t border-gray-200"></div>
              </>
            )}

            {/* ✅ Logout option for everyone */}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 hover:text-red-600 transition flex items-center gap-2"
            >
              <span className="material-icons text-base">logout</span>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="material-icons text-gray-600">close</span>
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm flex items-center gap-2">
                    <span className="material-icons text-base">error</span>
                    {passwordError}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError("");
                  }}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
