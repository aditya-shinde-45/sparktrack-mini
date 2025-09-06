import React from "react";
import mitlogo from "../../assets/mitlogo2.png"; // ✅ Import MIT logo
import sparktrackLogo from "../../assets/sparktrack.png"; // ✅ Import SparkTrack logo

const LoginHeader = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white p-3 sm:p-4 rounded-b-lg text-gray-800 flex justify-between items-center shadow-lg border-b border-gray-200">
      {/* MIT Logo on Left */}
      <div className="flex items-center gap-2 sm:gap-3">
        <img
          alt="University Logo"
          className="h-8 sm:h-12 w-auto object-contain"
          src={mitlogo}
        />
      </div>

      {/* SparkTrack Logo on Right */}
      <div className="flex items-center">
        <img
          alt="SparkTrack Logo"
          className="h-8 sm:h-12 w-auto object-contain"
          src={sparktrackLogo}
        />
      </div>
    </header>
  );
};

export default LoginHeader;
