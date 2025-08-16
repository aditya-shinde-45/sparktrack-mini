import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api.js";

const FilterSection = ({ onFilterChange }) => {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [availableClasses, setAvailableClasses] = useState([]);

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    onFilterChange && onFilterChange({ year, class: selectedClass });
  };

  const handleClassChange = (e) => {
    const classValue = e.target.value;
    setSelectedClass(classValue);
    onFilterChange && onFilterChange({ year: selectedYear, class: classValue });
  };

  const fetchClasses = async (year) => {
    try {
      const token = localStorage.getItem("token");
      const data = await apiRequest(
        `/api/admin/pbl?class=${year || 'TY'}`,
        "GET",
        null,
        token
      );
      const pblData = Array.isArray(data) ? data : [];
      const uniqueClasses = [...new Set(pblData.map(item => item.class).filter(Boolean))];
      setAvailableClasses(uniqueClasses);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setAvailableClasses([]);
    }
  };

  useEffect(() => {
    fetchClasses(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    fetchClasses('TY');
  }, []);

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg">
      <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Filter Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <select 
          value={selectedYear}
          onChange={handleYearChange}
          className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 text-gray-900"
        >
          <option value="">Select Year</option>
          <option value="TY">Third Year (TY)</option>
          <option value="SY">Second Year (SY)</option>
          <option value="LY">Final Year (LY)</option>
        </select>
        <select 
          value={selectedClass}
          onChange={handleClassChange}
          className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 text-gray-900"
        >
          <option value="">Select Class</option>
          {availableClasses.map((className, index) => (
            <option key={index} value={className}>{className}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterSection;
