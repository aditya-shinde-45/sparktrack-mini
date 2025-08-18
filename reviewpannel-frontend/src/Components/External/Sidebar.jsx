// Sidebar.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api.js";

const Sidebar = ({ onGroupSelect, role }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    if (role === "Mentor") {
      const token = localStorage.getItem("token");
      apiRequest("/api/mentor/groups", "GET", null, token)
        .then((data) => {
          const fetchedGroups = data.group_ids || [];
          setGroups(fetchedGroups);

          if (fetchedGroups.length > 0) {
            setSelectedGroup(fetchedGroups[0]);
            onGroupSelect(fetchedGroups[0]);
          }
        })
        .catch(() => setGroups([]));
    } else {
      const storedGroups = JSON.parse(localStorage.getItem("groups")) || [];
      const uniqueGroups = [...new Set(storedGroups)];
      setGroups(uniqueGroups);

      if (uniqueGroups.length > 0) {
        setSelectedGroup(uniqueGroups[0]);
        onGroupSelect(uniqueGroups[0]);
      }
    }
  }, [role]);

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
              className={`w-full flex items-center gap-2 sm:gap-3 
                py-1 px-2 sm:py-1.5 sm:px-3 lg:py-2 lg:px-4 
                rounded-md sm:rounded-lg lg:rounded-xl 
                font-normal text-xs sm:text-sm lg:text-base 
                transition-all duration-300 ease-in-out shadow-sm
                ${group === selectedGroup
                  ? "bg-white text-[#4C1D95] shadow-lg"
                  : "bg-white/20 text-white hover:bg-white/30"
                }`}
            >
              {group}
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
