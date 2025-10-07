// ExternalHome.jsx
import React, { useState, useEffect } from "react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/External/Sidebar";
import EvaluationForm_1 from "../../Components/External/EvaluationForm_1";
import EvaluationForm_2 from "../../Components/External/EvaluationForm_2";
import { apiRequest } from "../../api";

const ExternalHome = () => {
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState("standard"); // "standard" or "pbl"
  const [deadlineControls, setDeadlineControls] = useState({});
  const [loading, setLoading] = useState(true);
  const [sidebarKey, setSidebarKey] = useState(0);
  const role = localStorage.getItem("role"); // "Mentor" or "External"
  const name = localStorage.getItem("name") || ""; // Get name from localStorage
  const externalId = localStorage.getItem("external_id") || "";
  const isMITADT = externalId.toUpperCase() === "MITADT";
  const selectedMentor = localStorage.getItem("selected_mentor");

  // Fetch deadline controls to determine which evaluation form to show
  useEffect(() => {
    const fetchDeadlineControls = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await apiRequest("/api/deadlines", "GET", null, token);
        
        if (response?.success && response?.data) {
          const controlsMap = {};
          response.data.forEach(control => {
            controlsMap[control.key] = control.enabled;
          });
          setDeadlineControls(controlsMap);
        }
      } catch (error) {
        console.error("Error fetching deadline controls:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeadlineControls();
  }, []);

  // Determine which evaluation form to show based on deadline controls
  const getActiveEvaluationForm = () => {
    if (deadlineControls.pbl_review_2) {
      return "pbl_review_2";
    } else if (deadlineControls.pbl_review_1) {
      return "pbl_review_1";
    }
    return "standard";
  };

  const activeEvaluationForm = getActiveEvaluationForm();

  // Handle successful form submission
  const handleSubmitSuccess = (groupId) => {
    // Force sidebar to refresh by updating key
    setSidebarKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0edf1]">
      <Header name={name} id="" />
      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar 
          key={sidebarKey} 
          onGroupSelect={setSelectedGroupId} 
          role={role} 
        />
        
        {/* Tab Selector */}
        {!loading && (
          <>
            <div className="flex justify-center mt-4 lg:hidden">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex">
                  {activeEvaluationForm === "pbl_review_1" && (
                    <div className="px-4 py-2 bg-purple-600 text-white font-medium">
                      PBL Review 1 - Active
                    </div>
                  )}
                  {activeEvaluationForm === "pbl_review_2" && (
                    <div className="px-4 py-2 bg-purple-600 text-white font-medium">
                      PBL Review 2 - Active
                    </div>
                  )}
                  {activeEvaluationForm === "standard" && (
                    <div className="px-4 py-2 bg-gray-500 text-white font-medium">
                      No Active PBL Review
                    </div>
                  )}
                </div>
              </div>
            </div>
        
            {/* Tab Selector for Desktop */}
            <div className="hidden lg:flex lg:absolute lg:right-6 lg:top-24 lg:z-10">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex">
                  {activeEvaluationForm === "pbl_review_1" && (
                    <div className="px-4 py-2 bg-purple-600 text-white font-medium">
                      PBL Review 1 - Active
                    </div>
                  )}
                  {activeEvaluationForm === "pbl_review_2" && (
                    <div className="px-4 py-2 bg-purple-600 text-white font-medium">
                      PBL Review 2 - Active
                    </div>
                  )}
                  {activeEvaluationForm === "standard" && (
                    <div className="px-4 py-2 bg-gray-500 text-white font-medium">
                      No Active PBL Review
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading evaluation form...</p>
            </div>
          </div>
        )}
        
        {/* Render appropriate evaluation form based on deadline controls */}
        {!loading && (
          <>
            {activeEvaluationForm === "pbl_review_1" && (
              <EvaluationForm_1 groupId={selectedGroupId} role={role} />
            )}
            {activeEvaluationForm === "pbl_review_2" && (
              <EvaluationForm_2 
                groupId={selectedGroupId} 
                role={role} 
                onSubmitSuccess={handleSubmitSuccess}
              />
            )}
            {activeEvaluationForm === "standard" && (
              <>
                {/* Show EvaluationForm_1 as default when no specific review is active */}
                <div className="flex-1 p-4 sm:p-6 bg-white m-4 lg:ml-72 rounded-lg shadow-lg space-y-6 mt-1 sm:mt-16 lg:mt-24 text-gray-900">
                  <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#5D3FD3] to-[#7B74EF] bg-clip-text text-transparent mb-2">
                      Evaluation Form
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-[#5D3FD3] to-[#7B74EF] rounded-full mx-auto"></div>
                    <p className="text-gray-600 mt-4">
                      No active PBL review period. Default evaluation form is displayed.
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExternalHome;
