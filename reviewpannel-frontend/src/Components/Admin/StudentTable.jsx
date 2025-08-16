import React from "react";

const StudentTable = ({ students, searchQuery, setSearchQuery, setCurrentPage, onAddGroup }) => {
  const data = students && students.length > 0 ? students : [];

  return (
    <>
      {/* Search Bar & Add Group Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-0">
        <button
          onClick={onAddGroup}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl shadow hover:bg-purple-700 transition duration-200 font-medium w-full sm:w-auto"
        >
          Add Group
        </button>

        <input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage && setCurrentPage(1);
          }}
          className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900 placeholder-gray-400"
          placeholder="Search by Group ID, Enrollment No, or Name"
          type="text"
        />
      </div>

      {/* Table with horizontal scroll on mobile */}
      <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[600px] text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Group ID</th>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Enrollment No</th>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Name Of Student</th>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Class</th>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Guide Name</th>
              <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">External Name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length > 0 ? data.map((student, index) => (
              <tr key={index} className="hover:bg-gray-50 transition duration-200">
                <td className="p-4">{student.group_id}</td>
                <td className="p-4">{student.enrollement_no}</td>
                <td className="p-4">{student.name_of_student}</td>
                <td className="p-4">{student.class}</td>
                <td className="p-4">{student.guide_name}</td>
                <td className="p-4">{student.external_name || '-'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default StudentTable;
