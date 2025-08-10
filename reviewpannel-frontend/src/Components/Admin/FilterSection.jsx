import React from "react";

const FilterSection = () => {
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
      <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Filter Statics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <select className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200">
          <option>Select Year</option>
        </select>
        <select className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200">
          <option>Select Class</option>
        </select>
      </div>
    </div>
  );
};

export default FilterSection;
