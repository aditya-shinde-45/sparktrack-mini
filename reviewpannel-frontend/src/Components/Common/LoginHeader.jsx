import React from "react";
import mitlogo from "../../assets/mitlogo.png"; // ✅ Import image

const LoginHeader = () => {
  return (
    <header className="bg-gradient-to-r from-[#975BFF] to-[#7B74EF] p-4">
      <div className="container mx-auto">
        <img alt="University Logo" className="h-10" src={mitlogo} />
      </div>
    </header>
  );
};

export default LoginHeader;
