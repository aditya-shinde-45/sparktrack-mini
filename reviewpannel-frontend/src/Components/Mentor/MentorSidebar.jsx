import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Calendar,
  Settings,
  LogOut,
  ClipboardCheck,
  Lock
} from "lucide-react";
import mitLogo from '../../assets/mitlogo.png';

const mentorRoutes = [
  { name: "Dashboard", path: "/mentor/dashboard", icon: LayoutDashboard, disabled: false },
  { name: "My Groups", path: "/mentor/groups", icon: Users, disabled: true },
  { name: "Reviews", path: "/mentor/reviews", icon: FileCheck, disabled: true },
  { name: "Zeroth Review", path: "/mentor/zeroth-review", icon: ClipboardCheck, disabled: false },
  { name: "Schedule", path: "/mentor/schedule", icon: Calendar, disabled: true },
  { name: "Settings", path: "/mentor/settings", icon: Settings, disabled: true },
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
            {mentorRoutes.map(({ name, path, icon: Icon, disabled }, index) => (
              disabled ? (
                <div
                  key={index}
                  className="w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-base transition-all duration-300 ease-in-out shadow-sm bg-white/10 text-white/40 cursor-not-allowed opacity-50"
                >
                  <Icon size={20} color="#FFFFFF" opacity={0.4} />
                  <span className="text-white/40">{name}</span>
                  <Lock size={16} className="ml-auto text-white/40" />
                </div>
              ) : (
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
              )
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
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
          <div className="flex justify-around items-stretch max-w-screen-md mx-auto px-2 py-2 safe-area-inset-bottom">
            {mentorRoutes.slice(0, 4).map(({ name, path, icon: Icon, disabled }, index) => (
              disabled ? (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl mx-1 opacity-40 cursor-not-allowed"
                >
                  <div className="relative p-2.5 rounded-xl bg-gray-100">
                    <Icon 
                      size={24} 
                      color="#9CA3AF" 
                      strokeWidth={2}
                    />
                    <Lock size={12} className="absolute -top-1 -right-1 text-gray-400 bg-white rounded-full p-0.5" />
                  </div>
                  <span className="text-[9px] mt-1 font-semibold tracking-tight text-gray-400 truncate max-w-full">
                    {name}
                  </span>
                </div>
              ) : (
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
              )
            ))}
            <button
              onClick={handleLogout}
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-gray-600 hover:bg-red-50 active:scale-95 transition-all duration-300 mx-1"
            >
              <div className="p-2.5 rounded-xl bg-transparent transition-all duration-300 hover:bg-red-100">
                <LogOut size={24} strokeWidth={2} className="text-red-500" />
              </div>
              <span className="text-[9px] mt-1 font-semibold tracking-tight text-gray-500">Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MentorSidebar;
