import React from "react";
import { NavLink } from "react-router-dom";

const routes = [
  { name: "Dashboard", path: "/admin-dashboard" },
  { name: "Assigned External", path: "/assign-external" },
  { name: "View Export Marks", path: "/view-marks" },
];

const Sidebar = () => {
  return (
    <aside className="lg:fixed lg:top-[88px] lg:left-6 lg:w-60 bg-gradient-to-r from-[#975BFF] to-[#7B74EF] p-4 rounded-lg shadow-lg flex flex-col lg:h-[calc(100%-6rem)] overflow-hidden mb-4 lg:mb-0">
      <div className="flex lg:flex-col gap-2 lg:space-y-2 pr-1 overflow-y-auto">
        {routes.map(({ name, path }, index) => (
          <NavLink
            key={index}
            to={path}
            className={({ isActive }) =>
              `w-full text-left py-2 px-3 md:py-3 md:px-4 rounded-lg font-medium text-xs md:text-base transition
              ${
                isActive
                  ? "bg-white text-[#975BFF]" // active link style: white bg and purple text
                  : "bg-white/10 text-white hover:bg-white/20"
              }`
            }
          >
            {name}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
