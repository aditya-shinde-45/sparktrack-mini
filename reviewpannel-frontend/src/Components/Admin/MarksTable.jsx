import React from "react";

const MarksTable = ({ students, loading, error }) => {

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Group Id</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment No</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name Of Student</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">A</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">B</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">C</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">E</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Guide Name</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">External</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan="11" className="px-6 py-4 text-center text-gray-600">Loading...</td>
              </tr>
            )}
            {error && !loading && (
              <tr>
                <td colSpan="11" className="px-6 py-4 text-center text-red-600">{error}</td>
              </tr>
            )}
            {!loading && !error && students.map((student, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.group_id || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.enrollement_no || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name_of_student || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.A || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.B || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.C || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.D || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.E || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.total || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.guide_name || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.external_name || '-'}</td>
              </tr>
            ))}
            {!loading && !error && students.length === 0 && (
              <tr>
                <td colSpan="11" className="px-6 py-4 text-center text-gray-900">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarksTable;
