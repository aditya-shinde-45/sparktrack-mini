import React from "react";

const AssignedExternalTable = () => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            placeholder="Search..."
            type="text"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700" htmlFor="year-filter">Filter by Year:</label>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            id="year-filter"
          >
            <option>SY</option>
            <option>TY</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Group Assign</th>
              <th className="px-6 py-3">Guide Id</th>
              <th className="px-6 py-3">Guide Name</th>
              <th className="px-6 py-3">Guide Email</th>
              <th className="px-6 py-3">Guide Contact</th>
              <th className="px-6 py-3">Edit</th>
            </tr>
          </thead>
          <tbody>
            {/* You can map your data here */}
            <tr className="bg-white border-b">
              <td className="px-6 py-4">TYAIA101 - TYAJA121</td>
              <td className="px-6 py-4">415002</td>
              <td className="px-6 py-4">Prof. Suresh Kapre</td>
              <td className="px-6 py-4">suresh.kapre@mitu.edu.in</td>
              <td className="px-6 py-4">7972873499</td>
              <td className="px-6 py-4">
                <span className="material-icons text-purple-600 cursor-pointer">edit</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignedExternalTable;
