import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  UserCheck, 
  FileSpreadsheet, 
  PlusSquare, 
  Edit, 
  GraduationCap,
  Settings
} from "lucide-react";

const routes = [
  { name: "Dashboard", path: "/admin-dashboard", icon: LayoutDashboard },
  { name: "Mentors", path: "/mentor", icon: GraduationCap }, 
  { name: "Assigned External", path: "/assign-external", icon: UserCheck },
  { name: "View Marks", path: "/view-marks", icon: FileSpreadsheet },
  { name: "Evaluation Forms", path: "/admin-evaluation-forms", icon: Edit },
  { name: "Tools", path: "/admintools", icon: Settings },
];

const Sidebar = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      {isDesktop && (
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
      )}

      {/* Mobile Bottom Navigation */}
      {!isDesktop && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
          <div className="flex justify-around items-stretch max-w-screen-md mx-auto px-2 py-2 safe-area-inset-bottom">
            {routes.slice(0, 5).map(({ name, path, icon: Icon }, index) => (
              <NavLink
                key={index}
                to={path}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-300 ease-out mx-1
                  ${isActive ? "scale-105" : "hover:bg-gray-50 active:scale-95"}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`relative p-2.5 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? "bg-gradient-to-br from-[#7B74EF] via-[#6B64DF] to-[#5D3FD3] shadow-lg shadow-purple-500/30" 
                        : "bg-transparent"
                    }`}>
                      <Icon 
                        size={24} 
                        color={isActive ? "#FFFFFF" : "#6B7280"} 
                        strokeWidth={isActive ? 2.5 : 2}
                        className="transition-all duration-300"
                      />
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <span className={`text-[9px] mt-1 font-semibold tracking-tight transition-all duration-300 truncate max-w-full ${
                      isActive ? "text-[#4C1D95]" : "text-gray-500"
                    }`}>
                      {name}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
