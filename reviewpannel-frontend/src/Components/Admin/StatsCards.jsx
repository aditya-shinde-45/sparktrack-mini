import React from "react";

const StatsCards = ({ statsData, loading }) => {
  // Professional SVG Icons
  const StudentIcon = () => (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 14l9-5-9-5-9 5 9 5z"/>
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
    </svg>
  );

  const GroupIcon = () => (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="m22 21-3-3m0 0-3-3m3 3 3-3m-3 3-3 3"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8 0a4 4 0 0 0 0 8M23 21l-3-3 3-3"/>
    </svg>
  );

  const MentorIcon = () => (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
    </svg>
  );

  const ExternalIcon = () => (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
    </svg>
  );

  const stats = [
    { 
      label: "Total Students", 
      value: statsData?.students ?? 0,
      icon: <StudentIcon />,
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100",
      textColor: "text-blue-600",
      change: "+12%",
      trend: "up"
    },
    { 
      label: "Active Groups", 
      value: statsData?.groups ?? 0,
      icon: <GroupIcon />,
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100",
      textColor: "text-green-600",
      change: "+8%",
      trend: "up"
    },
    { 
      label: "Faculty Mentors", 
      value: statsData?.mentors ?? 0,
      icon: <MentorIcon />,
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100",
      textColor: "text-purple-600",
      change: "+5%",
      trend: "up"
    },
    { 
      label: "External Evaluators", 
      value: statsData?.externals ?? 0,
      icon: <ExternalIcon />,
      color: "from-orange-500 to-orange-600",
      bgColor: "from-orange-50 to-orange-100",
      textColor: "text-orange-600",
      change: "+3%",
      trend: "up"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`relative bg-gradient-to-br ${stat.bgColor} backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 p-6 hover:shadow-2xl transition-all duration-500 hover:scale-105 group overflow-hidden`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-white to-transparent"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-gradient-to-br from-white to-transparent"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Header with Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <div className="flex items-center space-x-1 text-sm font-semibold text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17l9.2-9.2M17 17V7h-10"/>
                </svg>
                <span>{stat.change}</span>
              </div>
            </div>

            {/* Main Value */}
            <div className="mb-3">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-gray-300 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <h3 className={`text-4xl font-bold ${stat.textColor} mb-1 group-hover:scale-110 transition-transform duration-300`}>
                    {stat.value.toLocaleString()}
                  </h3>
                  <p className="text-gray-600 font-semibold text-sm uppercase tracking-wide">
                    {stat.label}
                  </p>
                </>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/50 rounded-full h-2 mb-3">
              <div 
                className={`bg-gradient-to-r ${stat.color} h-2 rounded-full transition-all duration-1000 ease-out`}
                style={{ width: loading ? '0%' : '75%' }}
              ></div>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                Active Now
              </span>
              <span>Updated {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Hover Effect Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
