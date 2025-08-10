import React from "react";
import mitlogo from "../../assets/mitlogo.png"; // ✅ Import image


const Header = ({ name, id }) => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#975BFF] to-[#7B74EF] p-4 rounded-b-lg text-white flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-3">
        <img alt="University Logo" className="h-12 w-auto object-contain" src={mitlogo} />
      </div>

      <div className="flex items-center mt-2 sm:mt-0">
        <div className="text-right mr-4">
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs">{id}</p>
        </div>
        <div className="flex items-center">
          <span className="material-icons text-3xl mr-2">account_circle</span>
          <a
            className="bg-white text-purple-700 py-1.5 px-3 rounded-md font-semibold hover:bg-gray-100 text-sm transition"
            href="#"
          >
            Logout
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
