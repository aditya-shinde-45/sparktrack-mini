import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './sidebar.css'; // Assuming you have a CSS file for styles
import mitLogo from '../../assets/mitlogo.png';

const Sidebar = () => {
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

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('student');
    sessionStorage.clear();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/student-dashboard' },
    { label: 'Team Workspace', icon: 'desktop_windows', path: '/teamwork-space' },
    { label: 'Project Planning', icon: 'list_alt', path: '/project-planning' },
    { label: 'Project Review', icon: 'rate_review', path: '/project-review' },
    { label: 'Documentation', icon: 'description', path: '/documentation' },
  ];

  return (
    <>
      {/* ✅ Desktop Sidebar (now w-48) */}
      {isDesktop && (
        <div className="flex flex-col fixed h-screen w-48 bg-[#7A4FAD] text-white shadow-lg z-40 justify-between">
          <div>
            <div className="flex justify-center p-4 mb-4">
              <img src={mitLogo} alt="MIT Logo" className="h-12" /> {/* smaller logo */}
            </div>

           <nav className="">
  {navItems.map((item, index) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={index}
        to={item.path}
        className={`flex items-center gap-x-3 px-4 py-4  text-sm transition-colors duration-200 ${
          isActive ? 'bg-[#9e7ccf] shadow-md' : 'hover:bg-[#9e7ccf]'
        }`}
      >
        <span className="material-icons text-white text-lg">{item.icon}</span>
        <span className="text-white">{item.label}</span>
      </Link>
    );
  })}
</nav>


          </div>

          <div className="p-3">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full p-2.5 rounded-md bg-white text-gray-700 hover:bg-gray-200 transition"
            >
              <span className="material-icons mr-2 text-base text-gray-700">logout</span>
              <span className="text-sm text-gray-700">Logout</span>
            </button>
          </div>
        </div>

      )}

      {/* ✅ Mobile Hamburger */}
      {!isDesktop && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className=" bg-purple-700 p-2 rounded-full "
          >
            <span className="material-icons-outlined">menu</span>
          </button>
        </div>
      )}

      {/* ✅ Mobile Dropdown */}
      {!isDesktop && showDropdown && (
        <div className="absolute top-16 left-4 right-4 mx-auto bg-white rounded-lg shadow-lg p-4 z-50 border max-w-sm w-full">
          <div className="flex justify-center mb-4">
            <img src={mitLogo} alt="MIT Logo" className="h-10" />
          </div>
          <ul className="space-y-3">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={index}>
                  <Link
                    to={item.path}
                    onClick={() => setShowDropdown(false)}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-md text-sm ${isActive ? 'bg-purple-100 text-purple-700' : 'hover:bg-purple-50 text-gray-800'
                      }`}
                  >
                    <span className="material-icons-outlined text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                onClick={() => {
                  handleLogout();
                  setShowDropdown(false);
                }}
                className="flex items-center space-x-3 px-4 py-2 rounded-md text-red-600 hover:bg-red-50 w-full text-sm"
              >
                <span className="material-icons-outlined text-base">logout</span>
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </>
  );
};

export default Sidebar;