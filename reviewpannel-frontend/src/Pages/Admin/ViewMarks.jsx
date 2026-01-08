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
  const [reviewType, setReviewType] = useState("review1");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewStatus, setReviewStatus] = useState("all"); // all, done, notdone
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const rowsPerPage = 50;

  // Fetch students API with pagination and search
  const fetchStudents = async (classFilter, reviewType, page, search = "", status = "all") => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      let url;
      
      // Different endpoint for zero review
      if (reviewType === "zeroreview") {
        url = `/api/evaluation/zero-review?page=${page}&limit=${rowsPerPage}`;
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }
        if (status && status !== "all") {
          url += `&status=${status}`;
        }
      } else {
        // Original PBL review endpoints
        url = `/api/pbl/pbl?class=${classFilter}&review=${reviewType}&page=${page}&limit=${rowsPerPage}`;
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }
      }
      
      const response = await apiRequest(url, "GET", null, token);
      
      if (response && response.data) {
        // Backend returns nested structure: response.data.data
        const studentsData = response.data.data || response.data;
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        
        // Pagination info is in response.data.pagination
        const paginationInfo = response.data.pagination || {};
        setTotalPages(paginationInfo.totalPages || 1);
        setTotalRecords(paginationInfo.totalRecords || 0);
      } else {
        setStudents([]);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch data.");
      setStudents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents(filterClass, reviewType, currentPage, searchQuery, reviewStatus);
  }, [filterClass, reviewType, currentPage, searchQuery, reviewStatus]);

  return (
    <div className="font-sans bg-gray-50">
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
          <Sidebar />
          <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 space-y-6 mt-16">
            {/* Header with Review Type Selection */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 mb-6">
              <h1 className="text-3xl font-bold text-white mb-4">View Marks</h1>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setReviewType("review1");
                      setFilterClass("TY");
                      setCurrentPage(1);
                    }}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                      reviewType === "review1"
                        ? "bg-white text-purple-700 shadow-lg"
                        : "bg-purple-500 text-white hover:bg-purple-400"
                    }`}
                  >
                    PBL Review 1
                  </button>
                  <button
                    onClick={() => {
                      setReviewType("review2");
                      setFilterClass("TY");
                      setCurrentPage(1);
                    }}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                      reviewType === "review2"
                        ? "bg-white text-purple-700 shadow-lg"
                        : "bg-purple-500 text-white hover:bg-purple-400"
                    }`}
                  >
                    PBL Review 2
                  </button>
                  <button
                    onClick={() => {
                      setReviewType("zeroreview");
                      setFilterClass("LY");
                      setReviewStatus("all");
                      setCurrentPage(1);
                    }}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                      reviewType === "zeroreview"
                        ? "bg-white text-purple-700 shadow-lg"
                        : "bg-purple-500 text-white hover:bg-purple-400"
                    }`}
                  >
                    Zero Review
                  </button>
                </div>
                <div className="text-white text-sm">
                  <span className="font-semibold">Total Records:</span> {totalRecords}
                </div>
              </div>
            </div>

            {/* Filters */}
            {reviewType !== "zeroreview" && (
              <SearchFilters
                filterClass={filterClass}
                setFilterClass={(value) => {
                  setFilterClass(value);
                  setCurrentPage(1);
                }}
                searchQuery={searchQuery}
                setSearchQuery={(value) => {
                  setSearchQuery(value);
                  setCurrentPage(1);
                }}
                setCurrentPage={setCurrentPage}
                students={students}
              />
            )}
            
            {/* Search only for zero review */}
            {reviewType === "zeroreview" && (
              <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Search
                    </label>
                    <input
                      type="text"
                      placeholder="Search by Enrollment No or Student Name..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("token");
                          let url = `/api/evaluation/zero-review/download`;
                          if (searchQuery) {
                            url += `?search=${encodeURIComponent(searchQuery)}`;
                          }
                          if (reviewStatus && reviewStatus !== "all") {
                            url += `${searchQuery ? '&' : '?'}status=${reviewStatus}`;
                          }
                          
                          const baseURL = import.meta.env.MODE === "development" 
                            ? import.meta.env.VITE_API_BASE_URL 
                            : import.meta.env.VITE_API_BASE_URL_PROD;
                          
                          const response = await fetch(`${baseURL}${url}`, {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          
                          if (!response.ok) throw new Error('Download failed');
                          
                          const blob = await response.blob();
                          const downloadUrl = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = downloadUrl;
                          a.download = `zero_review_data_${new Date().toISOString().split('T')[0]}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(downloadUrl);
                          document.body.removeChild(a);
                        } catch (err) {
                          setError('Failed to download CSV');
                        }
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download CSV
                    </button>
                  </div>
                </div>
                
                {/* Review Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Review Status
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setReviewStatus("all");
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        reviewStatus === "all"
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setReviewStatus("done");
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        reviewStatus === "done"
                          ? "bg-green-600 text-white shadow-md"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Review Done
                    </button>
                    <button
                      onClick={() => {
                        setReviewStatus("notdone");
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        reviewStatus === "notdone"
                          ? "bg-orange-600 text-white shadow-md"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Review Not Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600 font-semibold">Loading data...</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex items-center">
                  <span className="material-icons text-red-500 mr-2">error</span>
                  <p className="text-red-700 font-semibold">{error}</p>
                </div>
              </div>
            )}

            {/* Table inside scrollable wrapper */}
            {!loading && !error && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <MarksTable
                    students={students}
                    loading={loading}
                    error={error}
                    reviewType={reviewType}
                  />
                </div>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalRecords > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-purple-600">{((currentPage - 1) * rowsPerPage) + 1}</span> to{" "}
                    <span className="font-semibold text-purple-600">
                      {Math.min(currentPage * rowsPerPage, totalRecords)}
                    </span>{" "}
                    of <span className="font-semibold text-purple-600">{totalRecords}</span> entries
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                    totalItems={totalRecords}
                    rowsPerPage={rowsPerPage}
                  />
                </div>
              </div>
            )}

            {/* No Data State */}
            {!loading && !error && totalRecords === 0 && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <span className="material-icons text-gray-400 text-6xl mb-4">inbox</span>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Records Found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ViewMarks;
