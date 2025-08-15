import React from 'react';

const ProblemTable = ({ problems, isSIH, onReadMore, currentPage, itemsPerPage }) => {
  return (
    <div className="overflow-x-auto max-h-120 min-h-120 overflow-y-auto">
      <table className="min-w-full text-sm text-left text-gray-600 border">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th className="px-4 py-3">S.No.</th>
            <th className="px-4 py-3">{isSIH ? 'Organization' : 'Submitted By'}</th>
            <th className="px-4 py-3">Problem Statement Title</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">PS Number</th>
            <th className="px-4 py-3">Theme</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {problems.map((problem, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
              <td className="px-4 py-2">
                {isSIH ? problem.department || 'N/A' : problem.submitted_by || 'N/A'}
              </td>
              <td className="px-4 py-2">
                {(problem.title || problem.description)?.length > 100 ? (
                  <>
                    {(problem.title || problem.description).substring(0, 100)}...
                    <button
                      className="text-blue-600 ml-2 underline"
                      onClick={() => onReadMore(problem)}
                    >
                      Read More
                    </button>
                  </>
                ) : (
                  problem.title || problem.description
                )}
              </td>
              <td className="px-4 py-2">{problem.category || problem.type}</td>
              <td className="px-4 py-2">{problem.statement_id || problem.problem_id}</td>
              <td className="px-4 py-2">{problem.technology_bucket || problem.domain || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProblemTable;