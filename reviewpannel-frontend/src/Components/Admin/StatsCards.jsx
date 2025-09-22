import React from "react";

const StatsCards = ({ statsData, loading }) => {
  const stats = [
    { label: "Students", value: statsData?.students ?? 0 },
    { label: "Groups", value: statsData?.groups ?? 0 },
    { label: "Mentors", value: statsData?.mentors ?? 0 },
    { label: "Externals", value: statsData?.externals ?? 0 },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white text-[#5D3FD3] rounded-xl shadow-lg flex flex-col items-center justify-center py-6 px-4 border border-gray-200"
        >
          <h3 className="text-3xl font-bold mb-1">{loading ? "..." : stat.value}</h3>
          <span className="text-base font-medium">{stat.label}</span>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
