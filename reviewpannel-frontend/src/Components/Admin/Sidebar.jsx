import React from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  UserCheck, 
  FileSpreadsheet, 
  PlusSquare, 
  Edit, 
  GraduationCap  // ✅ import Mentor icon
} from "lucide-react";

const routes = [
  { name: "Dashboard", path: "/admin-dashboard", icon: LayoutDashboard },
  { name: "Mentors", path: "/mentor", icon: GraduationCap }, 
  { name: "Assigned External", path: "/assign-external", icon: UserCheck },
  { name: "View Marks", path: "/view-marks", icon: FileSpreadsheet },
  { name: "Edit Group", path: "/edit-group", icon: Edit },
];

const Sidebar = () => {
  return (
    <aside className="lg:fixed lg:top-[88px] lg:left-6 lg:w-60 bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] p-5 rounded-2xl shadow-xl flex flex-col lg:h-[calc(100%-6rem)] overflow-hidden mb-4 lg:mb-0">
      <div className="flex lg:flex-col gap-3 lg:space-y-3 pr-1 overflow-y-auto">
        {routes.map(({ name, path, icon: Icon }, index) => (
          <NavLink
            key={index}
            to={path}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-base transition-all duration-300 ease-in-out shadow-sm
              ${
                isActive
                  ? "bg-white text-[#4C1D95] shadow-lg"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} color={isActive ? "#4C1D95" : "#FFFFFF"} />
                <span className={isActive ? "text-[#4C1D95]" : "text-white"}>
                  {name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
