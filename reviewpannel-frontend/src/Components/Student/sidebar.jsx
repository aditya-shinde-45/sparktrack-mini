import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import { apiRequest } from '../../api';
import './sidebar.css'; // Assuming you have a CSS file for styles
import {
  LayoutDashboard,
  UserCheck,
  FileSpreadsheet,
  PlusSquare,
  Edit,
  GraduationCap,
  Settings,
  Lock
} from "lucide-react";
import mitLogo from '../../assets/mitlogo.png';

const routes = [
  { name: "Dashboard", path: "/studentdashboard", icon: LayoutDashboard },
  { name: "Team Workspace", path: "/team-workspace", icon: PlusSquare },
  { name: "Project Planning", path: "/project-planning", icon: Edit },
  { name: "Project Review", path: "/project-review", icon: FileSpreadsheet },
  { name: "Documentation", path: "/documentation", icon: GraduationCap },
  { name: "Tools", path: "/studenttools", icon: Settings },
];

const Sidebar = ({ isOpen, onClose, isMobile }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('student_token');
      // Call backend to invalidate refresh token
      if (token) {
        await apiRequest('/api/student-auth/logout', 'POST', null, token);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear all tokens and data regardless of API result
      localStorage.removeItem('authToken');
      localStorage.removeItem('student');
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_refresh_token');
      localStorage.removeItem('enrollmentNumber');
      sessionStorage.clear();
      navigate('/studentlogin');
    }
  };

  return (
    <>
      {/* ✅ Desktop Sidebar (now w-48) */}
      {isDesktop && (
        <div className="lg:fixed lg:top-[88px] lg:left-6 lg:w-60 bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] p-5 rounded-2xl shadow-xl flex flex-col lg:h-[calc(100%-6rem)] overflow-hidden mb-4 lg:mb-0">
          <div className="flex lg:flex-col gap-3 lg:space-y-3 pr-1 overflow-y-auto">
            {routes.map(({ name, path, icon: Icon }, index) => {
              const isDisabled = name !== "Dashboard" && name !== "Tools";
              
              if (isDisabled) {
                return (
                  <div
                    key={index}
                    className="w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-base bg-white/10 text-white/50 cursor-not-allowed shadow-sm"
                  >
                    <Icon size={20} color="#FFFFFF80" />
                    <span className="flex-1">{name}</span>
                    <Lock size={16} color="#FFFFFF80" />
                  </div>
                );
              }
              
              return (
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
              );
            })}
          </div>
          <div className="mt-auto pt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center py-2 rounded-xl bg-white text-[#4C1D95] font-semibold hover:bg-purple-100 transition"
            >
              <span className="material-icons mr-2 text-base text-[#4C1D95]">logout</span>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar from Header */}
      {isMobile && isOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
          <div className="fixed top-16 left-4 right-4 mx-auto rounded-lg shadow-lg p-4 z-50 border max-w-sm w-full bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3]">
            <ul className="space-y-3">
              {routes.map(({ name, path, icon: Icon }, index) => {
                const isActive = location.pathname === path;
                const isDisabled = name !== "Dashboard" && name !== "Tools";
                
                if (isDisabled) {
                  return (
                    <li key={index}>
                      <div className="flex items-center justify-between px-4 py-2 rounded-md text-sm bg-white/10 text-white/50 cursor-not-allowed">
                        <div className="flex items-center space-x-3">
                          <Icon size={20} color="#FFFFFF80" />
                          <span>{name}</span>
                        </div>
                        <Lock size={16} color="#FFFFFF80" />
                      </div>
                    </li>
                  );
                }
                
                return (
                  <li key={index}>
                    <Link
                      to={path}
                      onClick={onClose}
                      className={`flex items-center space-x-3 px-4 py-2 rounded-md text-sm ${
                        isActive ? 'bg-white text-[#4C1D95]' : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Icon size={20} color={isActive ? "#4C1D95" : "#FFFFFF"} />
                      <span className={isActive ? "text-[#4C1D95]" : "text-white"}>{name}</span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <button
                  onClick={() => { handleLogout(); onClose(); }}
                  className="flex items-center space-x-3 px-4 py-2 rounded-md bg-white text-[#4C1D95] hover:bg-purple-100 w-full text-sm font-semibold"
                >
                  <span className="material-icons-outlined text-base">logout</span>
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;