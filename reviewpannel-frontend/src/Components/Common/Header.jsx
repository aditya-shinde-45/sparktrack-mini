import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import mitlogo from "../../assets/mitlogo.png";
import { apiRequest } from "../../api.js"; // centralized API wrapper

const Header = ({ name, id }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const role = localStorage.getItem("role");
  const externalId = localStorage.getItem("external_id");
  const isMITADT = role?.toLowerCase() === "external" && externalId?.toUpperCase() === "MITADT";

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

  const handleUpdate = () => {
    // Remove groups from localStorage but keep other data
    localStorage.removeItem("groups");
    setShowMenu(false);
    navigate("/mentor-selection");
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
            {/* ✅ Show Update option only for MITADT externals */}
            {isMITADT && (
              <>
                <button
                  onClick={handleUpdate}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-purple-700 transition flex items-center gap-2"
                >
                  <span className="material-icons text-base">edit</span>
                  Update
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
    </header>
  );
};

export default Header;
