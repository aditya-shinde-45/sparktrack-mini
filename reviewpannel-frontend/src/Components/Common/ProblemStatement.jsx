import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api.js';

const ProblemStatement = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hardwareCount, setHardwareCount] = useState(0);
  const [softwareCount, setSoftwareCount] = useState(0);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiRequest('/api/sih/problems', 'GET');
        const problemData = Array.isArray(res) ? res : [];
        setProblems(problemData);

        let hw = 0, sw = 0;
        problemData.forEach(p => {
          const category = (p.category || p.type || '').toLowerCase();
          if (category.includes('hardware')) hw++;
          else if (category.includes('software')) sw++;
        });

        setHardwareCount(hw);
        setSoftwareCount(sw);
      } catch (err) {
        console.error('Error fetching problems:', err);
        setProblems([]);
        setHardwareCount(0);
        setSoftwareCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const paginatedProblems = problems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(problems.length / itemsPerPage);

  const handleDownload = () => {
    const headers = ['S.No', 'Organization', 'Description', 'Category', 'PS Number', 'Theme'];
    const rows = problems.map((problem, index) => [
      index + 1,
      problem.department || 'N/A',
      (problem.description || '').replace(/[\n\r]+/g, ' ').replace(/,/g, ';'),
      problem.category || problem.type || '',
      problem.statement_id || problem.problem_id || '',
      problem.technology_bucket || problem.domain || '-',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'problem_statements_sih.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl shadow-2xl text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">TOTAL STATEMENTS</h1>
            <p className="opacity-80 mt-2 sm:mt-0">As per available data</p>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="custom-stat-card">
              <div>
                <p className="text-4xl sm:text-5xl font-bold">{hardwareCount}</p>
                <p className="text-base sm:text-lg opacity-90">Hardware</p>
              </div>
              <span className="material-icons text-5xl sm:text-6xl opacity-50">memory</span>
            </div>
            <div className="custom-stat-card">
              <div>
                <p className="text-4xl sm:text-5xl font-bold">{softwareCount}</p>
                <p className="text-base sm:text-lg opacity-90">Software</p>
              </div>
              <span className="material-icons text-5xl sm:text-6xl opacity-50">code</span>
            </div>
          </div>
        </div>
      </header>

      <main className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex justify-end mb-6">
          <button
            onClick={handleDownload}
            className="loginbutton  flex items-center justify-center gap-2"
          >
            <span className="material-icons">download</span>
            <span className="text-sm font-medium">Download Problem Statements</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-600 border">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th className="px-4 py-3">S.No.</th>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Problem Statement Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">PS Number</th>
                <th className="px-4 py-3">Theme</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedProblems.map((problem, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-4 py-2">{problem.department || 'N/A'}</td>
                  <td
                    className="px-4 py-2 cursor-pointer"
                    onClick={() => setSelectedProblem(problem)}
                  >
                    {(problem.title || problem.description)?.length > 100
                      ? (problem.title || problem.description).substring(0, 100) + "..."
                      : problem.title || problem.description}
                  </td>
                  <td className="px-4 py-2">{problem.category || problem.type}</td>
                  <td className="px-4 py-2">{problem.statement_id || problem.problem_id}</td>
                  <td className="px-4 py-2">{problem.technology_bucket || problem.domain || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
       <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
  <p className="text-xs sm:text-sm text-gray-600">
    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
    {Math.min(currentPage * itemsPerPage, problems.length)} of {problems.length} entries
  </p>
  <nav className="pagination">
    <ul className="inline-flex flex-wrap items-center gap-1">
      {/* Prev */}
      <li>
        <button
          className="px-2 sm:px-3 py-1 border rounded-l bg-purple-100 hover:bg-purple-200 text-purple-700 disabled:opacity-50 text-xs sm:text-sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
      </li>

      {/* Page numbers */}
      {Array.from({ length: totalPages }, (_, i) => {
        if (i === 0 || i === totalPages - 1 || Math.abs(i + 1 - currentPage) <= 1) {
          return (
            <li key={i}>
              <button
                onClick={() => setCurrentPage(i + 1)}
                className={`px-2 sm:px-3 py-1 border text-xs sm:text-sm ${
                  currentPage === i + 1
                    ? "bg-purple-600 text-white"
                    : "bg-white hover:bg-gray-100 text-gray-600"
                }`}
              >
                {i + 1}
              </button>
            </li>
          );
        } else if (
          (i === 1 && currentPage > 4) ||
          (i === totalPages - 2 && currentPage < totalPages - 3)
        ) {
          return (
            <li key={`ellipsis-${i}`}>
              <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm">...</span>
            </li>
          );
        }
        return null;
      })}

      {/* Next */}
      <li>
        <button
          className="px-2 sm:px-3 py-1 border rounded-r bg-purple-100 hover:bg-purple-200 text-purple-700 disabled:opacity-50 text-xs sm:text-sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </li>
    </ul>
  </nav>
</div>

      </main>

      {/* Modal */}
      {selectedProblem && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[80%] max-w-4xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={() => setSelectedProblem(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">{selectedProblem.title}</h2>
            <p className="mb-4 text-gray-700 text-sm whitespace-pre-line">
              {selectedProblem.description}
            </p>
            <div className="text-right">
              <button
                onClick={() => setSelectedProblem(null)}
                className="loginbutton text-white px-4 py-2 rounded-lg "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemStatement;
