// ExternalHome.jsx
import React, { useState } from "react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/External/Sidebar";
import EvaluationForm from "../../Components/External/EvaluationForm";
import PBLEvaluationForm from "../../Components/External/PBLEvaluationForm";

const ExternalHome = () => {
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState("standard"); // "standard" or "pbl"
  const role = localStorage.getItem("role"); // "Mentor" or "External"
  const name = localStorage.getItem("name") || ""; // Get name from localStorage

  return (
    <div className="flex flex-col min-h-screen bg-[#f0edf1]">
      <Header name={name} id="" />
      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar onGroupSelect={setSelectedGroupId} role={role} />
        
        {/* Tab Selector */}
        <div className="flex justify-center mt-4 lg:hidden">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex">
              <button 
                onClick={() => setActiveTab("standard")} 
                className={`px-4 py-2 ${activeTab === "standard" ? "bg-purple-600 text-white" : "text-gray-700"}`}
              >
                Standard Evaluation
              </button>
              <button 
                onClick={() => setActiveTab("pbl")} 
                className={`px-4 py-2 ${activeTab === "pbl" ? "bg-purple-600 text-white" : "text-gray-700"}`}
              >
                PBL Evaluation
              </button>
            </div>
          </div>
        </div>
        
        {/* Tab Selector for Desktop */}
        <div className="hidden lg:flex lg:absolute lg:right-6 lg:top-24 lg:z-10">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex">
              <button 
                onClick={() => setActiveTab("standard")} 
                className={`px-4 py-2 font-medium ${activeTab === "standard" ? "bg-purple-600 text-white" : "text-gray-700 hover:bg-purple-100"}`}
              >
                Standard Evaluation
              </button>
              <button 
                onClick={() => setActiveTab("pbl")} 
                className={`px-4 py-2 font-medium ${activeTab === "pbl" ? "bg-purple-600 text-white" : "text-gray-700 hover:bg-purple-100"}`}
              >
                PBL Evaluation
              </button>
            </div>
          </div>
        </div>
        
        {/* Render appropriate evaluation form based on selected tab */}
        {activeTab === "standard" ? (
          <EvaluationForm groupId={selectedGroupId} role={role} />
        ) : (
          <PBLEvaluationForm groupId={selectedGroupId} role={role} />
        )}
      </div>
    </div>
  );
};

export default ExternalHome;
