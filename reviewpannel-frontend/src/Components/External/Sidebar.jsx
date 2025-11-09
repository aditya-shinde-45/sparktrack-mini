// Sidebar.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api.js";

const Sidebar = ({ onGroupSelect, role, activeEvaluationForm = "pbl_review_2" }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [submittedGroups, setSubmittedGroups] = useState(new Set());

  useEffect(() => {
    const fetchGroupsAndStatus = async () => {
      const token = localStorage.getItem("token");
      
      // Determine the correct API endpoint based on active evaluation form
      const getEvaluationEndpoint = (groupId) => {
        if (activeEvaluationForm === "pbl_review_3") {
          return `/api/pbl3/evaluation/${groupId}`;
        } else if (activeEvaluationForm === "pbl_review_2") {
          return `/api/evaluation/review2/group/${groupId}`;
        } else if (activeEvaluationForm === "pbl_review_1") {
          return `/api/evaluation/review1/group/${groupId}`;
        }
        // Default to review2 for backward compatibility
        return `/api/evaluation/review2/group/${groupId}`;
      };

      // Determine which fields to check based on evaluation form
      const checkMarksFields = (student) => {
        if (activeEvaluationForm === "pbl_review_3") {
          // PBL3 uses m1-m6
          return student.m1 != null || student.m2 != null || student.m3 != null || 
                 student.m4 != null || student.m5 != null || student.m6 != null;
        } else {
          // PBL1 and PBL2 use A-G
          return student.A != null || student.B != null || student.C != null || 
                 student.D != null || student.E != null || student.F != null || student.G != null;
        }
      };
      
      if (role === "Mentor" || role === "mentor") {
        try {
          const data = await apiRequest("/api/mentors/groups", "GET", null, token);
          const fetchedGroups = data.data?.groups || data.groups || [];
          setGroups(fetchedGroups);

          // Fetch submission status for each group
          const submitted = new Set();
          for (const groupId of fetchedGroups) {
            try {
              const endpoint = getEvaluationEndpoint(groupId);
              const response = await apiRequest(endpoint, "GET", null, token);
              // Check if any student has marks filled
              const evaluations = response?.data?.evaluations || response?.evaluations || [];
              const hasMarks = evaluations.some(student => checkMarksFields(student));
              if (hasMarks) {
                submitted.add(groupId);
              }
            } catch (err) {
              console.error(`Error checking status for group ${groupId}:`, err);
            }
          }
          setSubmittedGroups(submitted);

          if (fetchedGroups.length > 0) {
            setSelectedGroup(fetchedGroups[0]);
            onGroupSelect(fetchedGroups[0]);
          }
        } catch (err) {
          setGroups([]);
        }
      } else {
        const storedGroups = JSON.parse(localStorage.getItem("groups")) || [];
        const uniqueGroups = [...new Set(storedGroups)];
        setGroups(uniqueGroups);

        // Fetch submission status for each group
        const submitted = new Set();
        for (const groupId of uniqueGroups) {
          try {
            const endpoint = getEvaluationEndpoint(groupId);
            const response = await apiRequest(endpoint, "GET", null, token);
            // Check if any student has marks filled
            const evaluations = response?.data?.evaluations || response?.evaluations || [];
            const hasMarks = evaluations.some(student => checkMarksFields(student));
            if (hasMarks) {
              submitted.add(groupId);
            }
          } catch (err) {
            console.error(`Error checking status for group ${groupId}:`, err);
          }
        }
        setSubmittedGroups(submitted);

        if (uniqueGroups.length > 0) {
          setSelectedGroup(uniqueGroups[0]);
          onGroupSelect(uniqueGroups[0]);
        }
      }
    };

    fetchGroupsAndStatus();
  }, [role, activeEvaluationForm]);

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    onGroupSelect(group);
  };

  return (
    <aside
      className="lg:fixed lg:top-[88px] lg:w-60 
      bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] 
      p-3 sm:p-4 lg:p-5 rounded-xl lg:rounded-2xl shadow-xl 
      flex flex-col lg:h-[calc(100%-6rem)] overflow-hidden 
      mt-14 sm:mt-16 lg:mt-0 mb-2 lg:mb-0"
    >
      <h2
        className="text-white text-base sm:text-lg lg:text-xl font-semibold 
  mb-2 sm:mb-3 lg:mb-4 border-b border-white/30 pb-1 sm:pb-2"
      >
        Assigned Group
      </h2>

      <div className="flex lg:flex-col gap-2 sm:gap-3 lg:space-y-3 pr-1 overflow-y-auto">
        {groups.length > 0 ? (
          groups.map((group, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectGroup(group)}
              className={`w-full flex items-center justify-between gap-2 sm:gap-3 
                py-1 px-2 sm:py-1.5 sm:px-3 lg:py-2 lg:px-4 
                rounded-md sm:rounded-lg lg:rounded-xl 
                font-normal text-xs sm:text-sm lg:text-base 
                transition-all duration-300 ease-in-out shadow-sm
                ${group === selectedGroup
                  ? "bg-white text-[#4C1D95] shadow-lg"
                  : "bg-white/20 text-white hover:bg-white/30"
                }`}
            >
              <span>{group}</span>
              {submittedGroups.has(group) && (
                <svg 
                  className="w-5 h-5 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ 
                    color: group === selectedGroup ? '#10b981' : '#86efac',
                    strokeWidth: 3 
                  }}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </button>
          ))
        ) : (
          <p className="text-white/70 text-xs sm:text-sm lg:text-base">
            No groups assigned
          </p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
