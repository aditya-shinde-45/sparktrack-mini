import React, { useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import { apiRequest } from "../../api.js";

const StudentTable = () => {
  const [students, setStudents] = useState([]);
  const [filterClass, setFilterClass] = useState("TY");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchStudents = async (classFilter) => {
    setLoading(true);
    setError("");
    try {
      console.log("Fetching students for class:", classFilter);
      const token = localStorage.getItem("token");
      const data = await apiRequest(
        `/api/admin/pbl?class=${classFilter}`,
        "GET",
        null,
        token
      );
      console.log("Fetched data:", data);

      if (!Array.isArray(data) || data.length === 0) {
        setStudents([]);
        setError("No students found for this class.");
      } else {
        setStudents(data);
      }
    } catch (err) {
      console.error("Error fetching students:", err.message);
      setError(err.message || "Failed to fetch data.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents(filterClass);
    setCurrentPage(1);
  }, [filterClass]);

  const headers = [
    "group_id",
    "enrollement_no",
    "name_of_student",
    "class",
    "email_id",
    "contact",
    "guide_name",
    "guide_contact",
    "A",
    "B",
    "C",
    "D",
    "E",
    "total",
    "feedback",
  ];

  // Filtered students by search query
  const filteredStudents = students.filter((s) =>
    searchQuery
      ? s.group_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.enrollement_no.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  // Pagination logic
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full overflow-x-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-2">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
          >
            <option value="TY">Third Year (TY)</option>
            <option value="SY">Second Year (SY)</option>
            <option value="LY">Final Year (LY)</option>
          </select>

          <input
            type="text"
            placeholder="Search by Group ID or Enrollment No"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900 placeholder-gray-400"
          />
        </div>

        <CSVLink
          data={filteredStudents}
          headers={headers.map((h) => ({
            label: h.replaceAll("_", " ").toUpperCase(),
            key: h,
          }))}
          filename={`${filterClass}_PBL.csv`}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-medium transition"
        >
          Download CSV
        </CSVLink>
      </div>

      {loading && <p className="text-gray-600 font-semibold my-4">Loading...</p>}
      {error && !loading && (
        <p className="text-red-600 font-semibold my-4">{error}</p>
      )}

      <div className="overflow-auto max-h-[600px] border rounded">
        <table className="w-full border-collapse text-sm text-gray-800 min-w-[1200px]">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {headers.map((head, index) => (
                <th
                  key={index}
                  className="p-3 font-semibold text-left border-b border-gray-300 uppercase tracking-wider bg-gray-200"
                >
                  {head.replaceAll("_", " ").toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentStudents.map((student, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition duration-200">
                {headers.map((h, i) => (
                  <td key={i} className="p-2 md:p-3 border text-gray-900">
                    {student[h] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
            {!loading && currentStudents.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="text-center p-4 text-gray-900">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination buttons */}
      {filteredStudents.length > rowsPerPage && (
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded font-medium border ${
              currentPage === 1
                ? "bg-gray-200 text-gray-500"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            Prev
          </button>
          <span className="px-2 py-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded font-medium border ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-500"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentTable;
