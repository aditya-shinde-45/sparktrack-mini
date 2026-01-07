import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Calendar,
  Settings,
  LogOut
} from "lucide-react";
import mitLogo from '../../assets/mitlogo.png';

const mentorRoutes = [
  { name: "Dashboard", path: "/mentor/dashboard", icon: LayoutDashboard },
  { name: "My Groups", path: "/mentor/groups", icon: Users },
  { name: "Reviews", path: "/mentor/reviews", icon: FileCheck },
  { name: "Schedule", path: "/mentor/schedule", icon: Calendar },
  { name: "Settings", path: "/mentor/settings", icon: Settings },
];

const MentorSidebar = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mentor_token');
    localStorage.removeItem('mentor');
    localStorage.removeItem('student_refresh_token');
    sessionStorage.clear();
    navigate('/mentor/login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      {isDesktop && (
        <div className="lg:fixed lg:top-[88px] lg:left-6 lg:w-60 bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] p-5 rounded-2xl shadow-xl flex flex-col lg:h-[calc(100%-6rem)] overflow-hidden mb-4 lg:mb-0">
          <div className="flex lg:flex-col gap-3 lg:space-y-3 pr-1 overflow-y-auto">
            {mentorRoutes.map(({ name, path, icon: Icon }, index) => (
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
          <div className="mt-auto pt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white text-[#4C1D95] font-semibold hover:bg-purple-100 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {!isDesktop && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#7B74EF] to-[#5D3FD3] p-3 shadow-2xl flex justify-around items-center z-50 rounded-t-3xl">
          {mentorRoutes.slice(0, 4).map(({ name, path, icon: Icon }, index) => (
            <NavLink
              key={index}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all
                ${isActive ? "bg-white text-[#4C1D95]" : "text-white"}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} color={isActive ? "#4C1D95" : "#FFFFFF"} />
                  <span className={`text-xs mt-1 ${isActive ? "text-[#4C1D95]" : "text-white"}`}>
                    {name}
                  </span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-xl text-white"
          >
            <LogOut size={20} />
            <span className="text-xs mt-1">Logout</span>
          </button>
        </div>
      )}
    </>
  );
};

export default MentorSidebar;
