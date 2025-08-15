import React, { useState, useEffect } from "react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import SearchFilters from "../../Components/Admin/SearchFilters";
import MarksTable from "../../Components/Admin/MarksTable";
import Pagination from "../../Components/Admin/Pagination";
import { apiRequest } from "../../api.js";

const ViewMarks = () => {
  const [students, setStudents] = useState([]);
  const [filterClass, setFilterClass] = useState("TY");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchStudents = async (classFilter) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const data = await apiRequest(
        `/api/admin/pbl?class=${classFilter}`,
        "GET",
        null,
        token
      );
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch data.");
      setStudents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents(filterClass);
    setCurrentPage(1);
  }, [filterClass]);

  const filteredStudents = students.filter((s) =>
    searchQuery
      ? s.group_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.enrollement_no?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

  return (
    <div className="font-sans bg-gray-50">
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
          <Sidebar />
          <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 space-y-6 mt-16">
            <SearchFilters 
              filterClass={filterClass}
              setFilterClass={setFilterClass}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setCurrentPage={setCurrentPage}
              students={filteredStudents}
            />
            <MarksTable 
              students={currentStudents}
              loading={loading}
              error={error}
            />
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              totalItems={filteredStudents.length}
              rowsPerPage={rowsPerPage}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ViewMarks;
