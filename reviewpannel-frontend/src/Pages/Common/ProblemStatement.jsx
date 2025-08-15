import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Style/ProblemStatement.css';
import Footer from "../../Components/Common/Footer";
import Navbar from "../../Components/Common/Navbar";

const ProblemStatementSih = () => {
  const [isSIH, setIsSIH] = useState(true);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hardwareCount, setHardwareCount] = useState(0);
  const [softwareCount, setSoftwareCount] = useState(0);

  const itemsPerPage = 10;

  const handleToggle = () => {
    setIsSIH(!isSIH);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = isSIH
          ? '/api/admin/problems'
          : '/api/problem-statements';

        const res = await axios.get(endpoint);

        const problemData = isSIH
          ? res.data
          : Array.isArray(res.data.data)
            ? res.data.data
            : [];

        setProblems(problemData);

        // Count hardware/software
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSIH]);

  const paginatedProblems = problems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(problems.length / itemsPerPage);

  const handleDownload = () => {
  const headers = ['S.No', isSIH ? 'Organization' : 'Submitted By', 'Description', 'Category', 'PS Number', 'Theme'];
  const rows = problems.map((problem, index) => [
    index + 1,
    isSIH ? (problem.department || 'N/A') : (problem.submitted_by || 'N/A'),
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
  link.download = `problem_statements_${isSIH ? 'sih' : 'others'}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

  return (
    <>
      <Navbar />
      <div className="max-w-screen-xl mx-auto p-4 md:p-6 lg:p-8">
        <header className="mb-8">
          <div className="  bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl shadow-2xl text-white">
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <label className="custom-toggle-container relative">
              <input
                type="checkbox"
                checked={!isSIH}
                onChange={handleToggle}
                className="sr-only"
              />
              <div className="custom-toggle-slider"></div>
              <div className={`custom-toggle-option ${isSIH ? 'active' : ''}`}>SIH Problems</div>
              <div className={`custom-toggle-option ${!isSIH ? 'active' : ''}`}>Others</div>
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
              <button
                onClick={handleDownload}
                className="custom-btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span className="material-icons">download</span>
                <span className="text-sm font-medium">Download Problem Statements</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
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
                {paginatedProblems.map((problem, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-4 py-2">
                      {isSIH ? problem.department || 'N/A' : problem.submitted_by || 'N/A'}
                    </td>
                    <td className="px-4 py-2">
                      {problem.description?.length > 300 ? (
                        <>
                          {problem.description.substring(0, 300)}...
                          <button
                            className="text-blue-600 ml-2 underline"
                            onClick={() => setSelectedProblem(problem)}
                          >
                            Read More
                          </button>
                        </>
                      ) : (
                        problem.description
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

          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, problems.length)} of {problems.length} entries
            </p>
            <nav className="pagination">
              <ul className="inline-flex flex-wrap items-center gap-1">
                <li>
                  <button
                    className="px-3 py-1 border rounded-l bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => {
                  if (i === 0 || i === totalPages - 1 || Math.abs(i + 1 - currentPage) <= 1) {
                    return (
                      <li key={i}>
                        <button
                          onClick={() => setCurrentPage(i + 1)}
                          className={`px-3 py-1 border ${currentPage === i + 1
                            ? "bg-purple-600 text-white"
                            : "bg-white hover:bg-gray-100 text-gray-600"
                            }`}
                        >
                          {i + 1}
                        </button>
                      </li>
                    );
                  } else if (
                    i === 1 && currentPage > 4 ||
                    i === totalPages - 2 && currentPage < totalPages - 3
                  ) {
                    return <li key={`ellipsis-${i}`}><span className="px-3 py-1">...</span></li>;
                  }
                  return null;
                })}
                <li>
                  <button
                    className="px-3 py-1 border rounded-r bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50"
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
      </div>

      {/* Modal */}
      {selectedProblem && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg w-[80%] max-w-4xl h-auto relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={() => setSelectedProblem(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-2">{selectedProblem.title}</h2>
            <p className="mb-4 text-sm text-gray-700">{selectedProblem.description}</p>
            <div className="text-right">
              <button
                onClick={() => setSelectedProblem(null)}
                className="custom-btn-primary px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default ProblemStatementSih;

