import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Edit3, 
  UserCheck, 
  Megaphone, 
  Camera,
  Shield,
  Calendar,
  UsersRound,
  CrownIcon,
  BellRing,
  ImageIcon
} from 'lucide-react';
import Header from '../../Components/Common/Header';
import AdminSidebar from './Sidebar';

const tabs = [
  { 
    label: 'Role & Permission', 
    icon: Shield, 
    path: '/admintools/role-permission' 
  },
  { 
    label: 'Deadline', 
    icon: Calendar, 
    path: '/admintools/deadline' 
  },
  { 
    label: 'Edit Group', 
    icon: Edit3, 
    path: '/admintools/edit-group' 
  },
  { 
    label: 'Assigned ClassLead', 
    icon: CrownIcon, 
    path: '/admintools/classlead' 
  },
  { 
    label: 'Announcement', 
    icon: BellRing, 
    path: '/admintools/announcement' 
  },
  { 
    label: 'Post', 
    icon: ImageIcon, 
    path: '/admintools/post' 
  },
];

const AdminToolTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    tabs.find(tab => location.pathname.includes(tab.path))?.label || tabs[0].label
  );

  // Redirect to first tab if on root admintools path
  useEffect(() => {
    if (location.pathname === '/admintools' || location.pathname === '/admintools/') {
      navigate(tabs[0].path, { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleTabClick = (tab) => {
    setActiveTab(tab.label);
    navigate(tab.path);
  };

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 flex-row mt-[70px] md:mt-[60px]">
        {/* Sidebar with fixed width */}
        <div className="w-64 min-h-full bg-white border-r border-gray-200">
          <AdminSidebar />
        </div>
        {/* Main content */}
        <main className="flex-1 p-3 md:p-6 bg-white space-y-6">
          <div className="mb-8">
            <div className="flex items-center gap-4 border-b border-gray-200 pb-2 flex-wrap">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.label}
                    onClick={() => handleTabClick(tab)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap
                      ${
                        activeTab === tab.label
                          ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700'
                          : 'bg-gray-50 text-gray-700 hover:bg-purple-50 hover:text-purple-700 border border-gray-200'
                      }
                    `}
                  >
                    <IconComponent 
                      size={18} 
                      className={`${
                        activeTab === tab.label ? 'text-white' : 'text-purple-600'
                      }`} 
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Nested routed content will appear here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminToolTabs;