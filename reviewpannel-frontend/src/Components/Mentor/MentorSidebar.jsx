import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Calendar,
  UserCog,
  LogOut,
  ClipboardCheck,
  ChevronRight,
  GraduationCap,
} from "lucide-react";

const mentorRoutes = [
  { name: "Dashboard",      path: "/mentor/dashboard",    icon: LayoutDashboard, disabled: false },
  { name: "My Groups",      path: "/mentor/groups",       icon: Users,           disabled: false },
  { name: "Reviews",        path: "/mentor/evaluation",   icon: FileCheck,       disabled: false },
  { name: "Zeroth Review",  path: "/mentor/zeroth-review",icon: ClipboardCheck,  disabled: true  },
  { name: "Schedule",       path: "/mentor/schedule",     icon: Calendar,        disabled: true  },
  { name: "Industry Mentor",path: "/mentor/settings",     icon: UserCog,         disabled: false },
];

/* Read mentor name & id from JWT stored in localStorage */
const getMentorFromToken = () => {
  try {
    const token = localStorage.getItem('mentor_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { name: payload.mentor_name || 'Mentor', id: payload.mentor_id || '—' };
  } catch {
    return null;
  }
};

const MentorSidebar = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [mentor, setMentor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setMentor(getMentorFromToken());
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mentor_token');
    localStorage.removeItem('mentor');
    localStorage.removeItem('student_refresh_token');
    sessionStorage.clear();
    navigate('/pblmanagementfacultydashboardlogin');
  };

  const initials = mentor?.name
    ? mentor.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'M';

  return (
    <>
      {/* ─────────────────────── DESKTOP SIDEBAR ─────────────────────── */}
      {isDesktop && (
        <aside className="fixed top-[88px] left-5 w-[240px] h-[calc(100vh-104px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl z-40"
          style={{ background: 'linear-gradient(160deg,#6d58f0 0%,#4e38c7 55%,#3b2aad 100%)' }}
        >
          {/* Subtle grid texture overlay */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '20px 20px' }}
          />

          {/* ── Profile Card ── */}
          <div className="relative flex items-center gap-3 px-4 pt-5 pb-4 border-b border-white/10">
            <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-inner">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">
                {mentor?.name || 'Mentor'}
              </p>
              <p className="text-purple-200 text-xs mt-0.5 font-medium">
                ID: <span className="text-white/80">{mentor?.id || '—'}</span>
              </p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
            </div>
          </div>

          {/* ── Navigation ── */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-none">
            <p className="text-purple-300/70 text-[10px] font-bold uppercase tracking-widest px-2 pb-1">
              Navigation
            </p>

            {mentorRoutes.map(({ name, path, icon: Icon, disabled }, index) =>
              disabled ? (
                <div
                  key={index}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed select-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon size={17} className="text-white/25" />
                  </div>
                  <span className="text-white/30 text-sm font-medium flex-1">{name}</span>
                  <span className="text-[9px] font-bold bg-white/10 text-white/40 rounded-full px-2 py-0.5 uppercase tracking-wide">
                    Soon
                  </span>
                </div>
              ) : (
                <NavLink
                  key={index}
                  to={path}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-white shadow-lg shadow-black/20'
                      : 'hover:bg-white/10 active:bg-white/15'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active left accent bar */}
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
              )
            )}
          </div>

          {/* ── Footer / Logout ── */}
          <div className="px-3 pb-4 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl bg-white/5">
              <GraduationCap size={15} className="text-purple-300 flex-shrink-0" />
              <span className="text-purple-200/70 text-xs font-medium truncate">Faculty Portal</span>
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

      {/* ─────────────────────── MOBILE BOTTOM NAV ─────────────────────── */}
      {!isDesktop && (
        <div className="fixed bottom-0 left-0 right-0 z-50"
          style={{ background: 'linear-gradient(180deg,#5b48e8 0%,#4530c2 100%)' }}
        >
          {/* Top highlight line */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="flex items-stretch max-w-screen-md mx-auto px-1 py-1.5">
            {mentorRoutes.slice(0, 4).map(({ name, path, icon: Icon, disabled }, index) =>
              disabled ? (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 opacity-35 cursor-not-allowed"
                >
                  <div className="p-2 rounded-xl">
                    <Icon size={20} className="text-white" strokeWidth={1.8} />
                  </div>
                  <span className="text-[9px] mt-0.5 font-semibold text-white/60 truncate max-w-full leading-none">
                    {name}
                  </span>
                </div>
              ) : (
                <NavLink
                  key={index}
                  to={path}
                  className="flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all duration-200 active:scale-95"
                >
                  {({ isActive }) => (
                    <>
                      <div className={`relative p-2 rounded-xl transition-all duration-200 ${
                        isActive ? 'bg-white/25 shadow-lg' : ''
                      }`}>
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
                        {name}
                      </span>
                    </>
                  )}
                </NavLink>
              )
            )}

            {/* More / Logout */}
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

export default MentorSidebar;
