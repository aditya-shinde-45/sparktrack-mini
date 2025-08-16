import React from "react";

const defaultStats = [
  { icon: "people", label: "Number of Students", value: 4185 },
  { icon: "groups", label: "Number Of Groups", value: 1158 },
  { icon: "support_agent", label: "Number Of Guides", value: 175 },
  { icon: "assignment", label: "Number of Examiner Assigned", value: 66 },
];

const StatsCards = ({ statsData, loading }) => {
  const stats = statsData ? [
    { icon: "people", label: "Number of Students", value: statsData.students || 0 },
    { icon: "groups", label: "Number Of Groups", value: statsData.groups || 0 },
    { icon: "support_agent", label: "Number Of Guides", value: statsData.guides || 0 },
    { icon: "assignment", label: "Number of Examiner Assigned", value: statsData.examiners || 0 },
  ] : defaultStats;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-4 md:p-6 rounded-2xl shadow-lg text-center flex flex-col justify-center items-center">
          <span className="material-icons text-3xl md:text-5xl text-purple-500 mb-1 md:mb-2">{stat.icon}</span>
          <p className="text-xs md:text-lg font-semibold text-gray-700">{stat.label}</p>
          <p className="text-xl md:text-3xl font-bold text-purple-600 mt-1">
            {loading ? "..." : stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
