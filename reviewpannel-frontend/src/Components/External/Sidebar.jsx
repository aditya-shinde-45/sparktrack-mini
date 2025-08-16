// Sidebar.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api.js";

const Sidebar = ({ onGroupSelect, role }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    if (role === "Mentor") {
      // Fetch mentor groups from API
      const token = localStorage.getItem("token");
      apiRequest("/api/mentor/groups", "GET", null, token)
        .then((data) => {
          setGroups(data.group_ids || []);
        })
        .catch(() => setGroups([]));
    } else {
      // External: use localStorage
      const storedGroups = JSON.parse(localStorage.getItem("groups")) || [];
      const uniqueGroups = [...new Set(storedGroups)];
      setGroups(uniqueGroups);
    }
  }, [role]);

  // Handle button click
  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    onGroupSelect(group);
  };

  return (
    <aside className="lg:fixed lg:top-[88px] lg:left-6 lg:w-60 bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] p-5 rounded-2xl shadow-xl flex flex-col lg:h-[calc(100%-6rem)] overflow-hidden mb-4 lg:mb-0">
      <h2 className="text-white text-lg font-semibold mb-4 border-b border-white/30 pb-2">
        Assigned Group
      </h2>
      <div className="flex lg:flex-col gap-3 lg:space-y-3 pr-1 overflow-y-auto">
        {groups.length > 0 ? (
          groups.map((group, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectGroup(group)}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-base transition-all duration-300 ease-in-out shadow-sm
                ${
                  group === selectedGroup
                    ? "bg-white text-[#4C1D95] shadow-lg"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
            >
              {group}
            </button>
          ))
        ) : (
          <p className="text-white/70">No groups assigned</p>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
