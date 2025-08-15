// ExternalHome.jsx
import React, { useState } from "react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/External/Sidebar";
import EvaluationForm from "../../Components/External/EvaluationForm";

const ExternalHome = () => {
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const role = localStorage.getItem("role"); // "Mentor" or "External"
  const name = localStorage.getItem("name") || ""; // Get name from localStorage

  return (
    <div className="flex flex-col min-h-screen bg-[#f3e5f5]">
      <Header name={name} id="" />
      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar onGroupSelect={setSelectedGroupId} role={role} />
        <EvaluationForm groupId={selectedGroupId} role={role} />
      </div>
    </div>
  );
};

export default ExternalHome;
