import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { apiRequest } from '../../api';
import './sidebar.css'; // Assuming you have a CSS file for styles
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusSquare,
  Edit,
  GraduationCap,
  Settings,
  Lock,
  LogOut,
  ChevronRight
} from "lucide-react";

const routes = [
  { name: "Dashboard", mobileLabel: "Home", path: "/studentdashboard", icon: LayoutDashboard },
  { name: "Team Workspace", mobileLabel: "Team", path: "/team-workspace", icon: PlusSquare },
  { name: "Project Planning", mobileLabel: "Plan", path: "/project-planning", icon: Edit },
  { name: "Project Review", mobileLabel: "Review", path: "/project-review", icon: FileSpreadsheet },
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
          className="fixed top-[80px] left-5 w-[240px] h-[calc(100vh-92px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl z-40"
          style={{ background: 'linear-gradient(160deg,#6d58f0 0%,#4e38c7 55%,#3b2aad 100%)' }}
        >
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '20px 20px' }}
          />

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-none">
            <p className="text-purple-300/70 text-[10px] font-bold uppercase tracking-widest px-2 pb-1">
              Navigation
            </p>
            {routes.map(({ name, path, icon: Icon }, index) => {
              const isDisabled = name !== "Dashboard" && name !== "Tools" && name !== "Documentation";
              
              if (isDisabled) {
                return (
                  <div
                    key={index}
                    className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed select-none"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Icon size={17} className="text-white/25" />
                    </div>
                    <span className="text-white/30 text-sm font-medium flex-1">{name}</span>
                    <span className="text-[9px] font-bold bg-white/10 text-white/40 rounded-full px-2 py-0.5 uppercase tracking-wide inline-flex items-center gap-1">
                      <Lock size={10} className="text-white/40" />
                      Soon
                    </span>
                  </div>
                );
              }
              
              return (
                <NavLink
                  key={index}
                  to={path}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive ? 'bg-white shadow-lg shadow-black/20' : 'hover:bg-white/10 active:bg-white/15'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-purple-600" />
                      )}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isActive ? 'bg-purple-100' : 'bg-white/10 group-hover:bg-white/20'
                      }`}>
                        <Icon size={17} className={isActive ? 'text-purple-700' : 'text-white'} />
                      </div>
                      <span className={`text-sm font-semibold flex-1 transition-colors duration-200 ${
                        isActive ? 'text-purple-800' : 'text-white/90'
                      }`}>
                        {name}
                      </span>
                      <ChevronRight size={14} className={`transition-all duration-200 ${
                        isActive ? 'text-purple-400 opacity-100' : 'text-white/0 group-hover:text-white/40 group-hover:opacity-100'
                      }`} />
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          <div className="px-3 pb-4 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl bg-white/5">
              <GraduationCap size={15} className="text-purple-300 flex-shrink-0" />
              <span className="text-purple-200/70 text-xs font-medium truncate">Student Portal</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/80 border border-white/10 hover:border-red-400/50 text-white text-sm font-semibold transition-all duration-200 group shadow-sm hover:shadow-red-500/20"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform duration-200" />
              Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Bottom Navigation */}
      {!isDesktop && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50"
          style={{ background: 'linear-gradient(180deg,#5b48e8 0%,#4530c2 100%)' }}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="flex items-stretch max-w-screen-md mx-auto px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
            {routes.slice(0, 4).map(({ name, mobileLabel, path, icon: Icon }) => {
              const isDisabled = name !== "Dashboard";

              return isDisabled ? (
                <div
                  key={name}
                  className="flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 opacity-35 cursor-not-allowed"
                >
                  <div className="p-2 rounded-xl">
                    <Icon size={20} className="text-white" strokeWidth={1.8} />
                  </div>
                  <span className="text-[9px] mt-0.5 font-semibold text-white/60 truncate max-w-full leading-none">{mobileLabel || name}</span>
                </div>
              ) : (
                <NavLink
                  key={name}
                  to={path}
                  className="flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all duration-200 active:scale-95"
                >
                  {({ isActive }) => (
                    <>
                      <div className={`relative p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-white/25 shadow-lg' : ''}`}>
                        <Icon
                          size={20}
                          className={isActive ? 'text-white' : 'text-white/60'}
                          strokeWidth={isActive ? 2.5 : 1.8}
                        />
                        {isActive && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-purple-600 shadow-[0_0_4px_rgba(74,222,128,0.9)]" />
                        )}
                      </div>
                      <span className={`text-[9px] mt-0.5 font-semibold truncate max-w-full leading-none transition-colors duration-200 ${
                        isActive ? 'text-white' : 'text-white/55'
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
                <LogOut size={20} className="text-white/60 group-hover:text-white transition-colors duration-200" strokeWidth={1.8} />
              </div>
              <span className="text-[9px] mt-0.5 font-semibold text-white/55 leading-none">Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;