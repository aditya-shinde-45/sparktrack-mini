import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { apiRequest } from '../../api';
import './sidebar.css'; // Assuming you have a CSS file for styles
import {
  LayoutDashboard,
  GraduationCap,
  FileSpreadsheet,
  FileCheck,
  Settings,
  LogOut,
} from "lucide-react";

const routes = [
  { name: "Dashboard", mobileLabel: "Home", path: "/studentdashboard", icon: LayoutDashboard },
  { name: "Tracker Sheet", mobileLabel: "Tracker", path: "/tracker-sheet", icon: FileSpreadsheet },
  { name: "NOC", mobileLabel: "NOC", path: "/noc", icon: FileCheck },
  { name: "Documentation", mobileLabel: "Docs", path: "/documentation", icon: GraduationCap },
  { name: "Tools", mobileLabel: "Tools", path: "/studenttools", icon: Settings },
];

const Sidebar = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const navigate = useNavigate();

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
      {/* Desktop Sidebar */}
      {isDesktop && (
        <aside
          className="fixed top-[80px] left-4 w-[240px] h-[calc(100vh-92px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-purple-500/20 bg-gradient-to-b from-[#7B6BF6] via-[#6854E7] to-[#5639D7] z-40"
        >
          <div className="flex-1 overflow-hidden px-3 py-4 space-y-2 scrollbar-none">
            {routes.map(({ name, path, icon: Icon }, index) => {

              return (
                <NavLink
                  key={index}
                  to={path}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                    ${isActive ? 'bg-white/26 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]' : 'bg-white/10 hover:bg-white/18 active:bg-white/22'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isActive ? 'bg-white/20' : 'bg-white/10 group-hover:bg-white/20'
                      }`}>
                        <Icon size={17} className="text-white" />
                      </div>
                      <span className={`text-sm font-semibold flex-1 transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-white/90'
                      }`}>
                        {name}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          <div className="px-3 pb-4 pt-2 border-t border-white/15">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-[#5639D7] text-sm font-semibold transition-all duration-200 group hover:bg-purple-50"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
              Logout
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Bottom Navigation */}
      {!isDesktop && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-purple-800 to-purple-700 border-t border-white/15 shadow-[0_-6px_16px_rgba(76,29,149,0.35)]">
          <div className="flex items-stretch max-w-screen-md mx-auto px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
            {routes.slice(0, 4).map(({ name, mobileLabel, path, icon: Icon }) => {
              return (
                <NavLink
                  key={name}
                  to={path}
                  className="flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all duration-200 active:scale-95"
                >
                  {({ isActive }) => (
                    <>
                      <div className={`relative p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-white/25 shadow-sm' : ''}`}>
                        <Icon
                          size={20}
                          className={isActive ? 'text-white' : 'text-white/65'}
                          strokeWidth={isActive ? 2.5 : 1.8}
                        />
                        {isActive && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-purple-700" />
                        )}
                      </div>
                      <span className={`text-[9px] mt-0.5 font-semibold truncate max-w-full leading-none transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-white/60'
                      }`}>
                        {mobileLabel || name}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}

            <button
              onClick={handleLogout}
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 active:scale-95 transition-all duration-200 group"
            >
              <div className="p-2 rounded-xl group-hover:bg-red-500/30 transition-colors duration-200">
                <LogOut size={20} className="text-white/65 group-hover:text-white transition-colors duration-200" strokeWidth={1.8} />
              </div>
              <span className="text-[9px] mt-0.5 font-semibold text-white/60 leading-none">Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;