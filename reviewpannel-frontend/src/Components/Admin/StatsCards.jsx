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
      gradient: "from-blue-500 to-blue-700",
      bgGradient: "from-blue-50 to-blue-100/50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      hoverShadow: "hover:shadow-blue-200/50"
    },
    { 
      label: "Active Groups", 
      value: statsData?.groups ?? 0,
      icon: <GroupIcon />,
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-100/50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      hoverShadow: "hover:shadow-green-200/50"
    },
    { 
      label: "Faculty Mentors", 
      value: statsData?.mentors ?? 0,
      icon: <MentorIcon />,
      gradient: "from-purple-500 to-purple-700",
      bgGradient: "from-purple-50 to-purple-100/50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
      hoverShadow: "hover:shadow-purple-200/50"
    },
    { 
      label: "External Evaluators", 
      value: statsData?.externals ?? 0,
      icon: <ExternalIcon />,
      gradient: "from-orange-500 to-orange-700",
      bgGradient: "from-orange-50 to-orange-100/50",
      borderColor: "border-orange-200",
      textColor: "text-orange-700",
      hoverShadow: "hover:shadow-orange-200/50"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} rounded-2xl shadow-xl border-2 ${stat.borderColor} p-6 hover:shadow-2xl ${stat.hoverShadow} transition-all duration-300 transform hover:scale-105 group`}
        >
          {/* Decorative Background Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-500"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Header with Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                {stat.icon}
              </div>
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${stat.gradient} animate-pulse`}></div>
            </div>

            {/* Main Value */}
            <div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-white/50 rounded-lg mb-3"></div>
                  <div className="h-4 bg-white/30 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <h3 className={`text-4xl font-extrabold ${stat.textColor} mb-2 group-hover:scale-105 transition-transform duration-300`}>
                    {stat.value.toLocaleString()}
                  </h3>
                  <p className="text-gray-700 font-semibold text-sm tracking-wide">
                    {stat.label}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
