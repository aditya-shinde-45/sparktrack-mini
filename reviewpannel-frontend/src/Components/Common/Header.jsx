import React from "react";
import { useNavigate } from "react-router-dom";
import mitlogo from "../../assets/mitlogo.png"; // ✅ Import image

const Header = ({ name, id }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("groups");
    // Add any other keys you store for user session
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] p-3 sm:p-4 rounded-b-lg text-white flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Logo - smaller on mobile */}
        <img
          alt="University Logo"
          className="h-8 sm:h-12 w-auto object-contain"
          src={mitlogo}
        />
      </div>

      <div className="flex items-center mt-1 sm:mt-0">
        <div className="text-right mr-2 sm:mr-4">
          <p className="font-semibold text-xs sm:text-sm">{name}</p>
          <p className="text-[10px] sm:text-xs">{id}</p>
        </div>
        <div className="flex items-center">
          <span className="material-icons text-2xl sm:text-3xl mr-1 sm:mr-2">
            account_circle
          </span>
          {/* Button - smaller font & padding on mobile */}
          <button
            className="bg-white text-purple-700 py-1 px-2 sm:py-1.5 sm:px-3 rounded-md font-semibold hover:bg-gray-100 text-xs sm:text-sm transition"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
