// Sidebar.jsx
import React, { useEffect, useState } from "react";
import "./Sidebar.css";

const Sidebar = ({ onGroupSelect }) => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const storedGroups = JSON.parse(localStorage.getItem("groups")) || [];
    const uniqueGroups = [...new Set(storedGroups)];
    setGroups(uniqueGroups);
  }, []);

  return (
    <aside className="lg:fixed lg:top-[88px] lg:left-6 lg:w-60 bg-gradient-to-r from-[#975BFF] to-[#7B74EF] p-4 rounded-lg shadow-lg flex flex-col lg:h-[calc(100%-6rem)] overflow-hidden lg:mb-4 mb-4">
      <h2 className="text-white text-lg font-semibold mb-4 border-b border-white/30 pb-2">
        Assigned Group
      </h2>
      <div className="flex lg:flex-col gap-3 lg:gap-0 lg:space-y-3 pr-1 overflow-y-auto">
        {groups.length > 0 ? (
          groups.map((group, idx) => (
            <button
              key={idx}
              onClick={() => onGroupSelect(group)}
              className="w-full text-left bg-white/10 text-white py-3 px-4 rounded-lg font-medium text-base hover:bg-white/20 transition"
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
