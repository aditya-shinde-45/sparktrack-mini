import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import mitlogo from "../../assets/mitlogo.png";
import { apiRequest } from "../../api.js"; // centralized API wrapper

const Header = ({ name, id }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [prevPassword, setPrevPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const menuRef = useRef(null);

  const role = localStorage.getItem("role"); // ✅ Get role from storage

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
    // Clear all authentication-related data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("groups");
    localStorage.removeItem("id");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("student_token");
    
    // Redirect to home page
    navigate("/");
    
    // Force reload to clear any in-memory state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // ✅ Reset password allowed ONLY if role === mentor
  const handleResetPassword = async () => {
    if (role !== "Mentor") return; // 🔒 safety check

    if (!prevPassword || !newPassword) {
      setMessage("Please fill in both fields");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      await apiRequest(
        "/api/mentor/update-password",
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
      console.error("Reset password error:", err);
      setMessage(`❌ ${err.message || "Something went wrong. Try again."}`);
    } finally {
      setLoading(false);
    }
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
            {/* ✅ Show Reset Password only if role = mentor */}
            {role === "Mentor" && (
              <>
                <button
                  onClick={() => {
                    setShowModal(true);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition"
                >
                  Reset Password
                </button>
                <div className="border-t border-gray-200"></div>
              </>
            )}

            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 hover:text-red-600 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* ✅ Reset Password Modal - only for mentors */}
      {showModal && role === "Mentor" && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 animate-fadeIn">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Reset Password
            </h2>

            {/* Previous Password */}
            <div className="mb-3">
              <label className="block text-sm mb-1 text-gray-800">
                Previous Password
              </label>
              <input
                type="password"
                value={prevPassword}
                onChange={(e) => setPrevPassword(e.target.value)}
                className="w-full border border-gray-400 px-3 py-2 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter previous password"
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
            {message && <p className="text-sm mb-2 text-red-500">{message}</p>}

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-md border border-gray-500 text-gray-800 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-md loginbutton disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
