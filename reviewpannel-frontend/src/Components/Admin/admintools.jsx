import React, { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Header from '../../Components/Common/Header';
import AdminSidebar from './Sidebar';

const tabs = [
  { label: 'Role & Permission', icon: 'people_alt', path: '/admintools/role-permission' },
  { label: 'Deadline', icon: 'schedule', path: '/admintools/deadline' },
  { label: 'Edit Group', icon: 'dynamic_form', path: '/admintools/edit-group' },
  { label: 'Assigned ClassLead', icon: 'person', path: '/admintools/classlead' },
  { label: 'Announcement', icon: 'campaign', path: '/admintools/announcement' }, // Added tab
];

const AdminToolTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    tabs.find(tab => location.pathname.includes(tab.path))?.label || tabs[0].label
  );

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
            <div className="flex items-center gap-4 border-b border-gray-200 pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => handleTabClick(tab)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-md text-base font-semibold transition-all duration-150
                    ${
                      activeTab === tab.label
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-gray-50 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                    }
                  `}
                >
                  <span className={`material-icons text-lg ${activeTab === tab.label ? 'text-white' : 'text-purple-600'}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
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