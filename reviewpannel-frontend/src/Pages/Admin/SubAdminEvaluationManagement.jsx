import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import { Database, Edit, Search, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { apiRequest } from "../../api";

const SubAdminEvaluationManagement = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  
  // Evaluation Form related states
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [formFields, setFormFields] = useState([]);
  const [formTotalMarks, setFormTotalMarks] = useState(0);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState("group_id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editMarks, setEditMarks] = useState({});
  const rowsPerPage = 50;

  const computedTotal = React.useMemo(() => {
    return formFields.reduce((sum, field) => sum + (Number(field.max_marks) || 0), 0);
  }, [formFields]);

  const sortedStudents = React.useMemo(() => {
    const dataToSort = [...students];
    return dataToSort.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "total") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal || "").toLowerCase();
        bVal = String(bVal || "").toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [students, sortBy, sortOrder]);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const storedUserId = localStorage.getItem("user_id");
      const storedName = localStorage.getItem("name");

      if (!token || !storedUserId) {
        navigate("/login");
        return false;
      }

      setUserId(storedUserId);
      setUserName(storedName || storedUserId);
      return true;
    };

    if (checkAuth()) {
      fetchForms();
    }
  }, [navigate]);

  const fetchForms = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await apiRequest("/api/admin/evaluation-forms", "GET", null, token);
      if (response?.success) {
        setForms(response.data || []);
        if (!selectedFormId && response.data?.length) {
          setSelectedFormId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
      setError("Failed to fetch evaluation forms");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormDetails = async (formId) => {
    if (!formId) return;
    const token = localStorage.getItem("token");
    try {
      const response = await apiRequest(`/api/admin/evaluation-forms/${formId}`, "GET", null, token);
      if (response?.success) {
        const form = response.data;
        const incomingFields = Array.isArray(form?.fields) ? form.fields : [];
        const sortedFields = [...incomingFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setFormFields(sortedFields);
        setFormTotalMarks(form?.total_marks || 0);
      } else {
        setFormFields([]);
        setFormTotalMarks(0);
      }
    } catch (error) {
      console.error("Error fetching form details:", error);
    }
  };

  const fetchStudents = async (formId, page, search = "") => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      let url = `/api/admin/evaluation-forms/${formId}/submissions?page=${page}&limit=${rowsPerPage}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await apiRequest(url, "GET", null, token);
      
      if (response && response.data) {
        const studentsData = response.data.data || response.data;
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        
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
    if (selectedFormId) {
      fetchFormDetails(selectedFormId);
      fetchStudents(selectedFormId, currentPage, searchQuery);
    } else {
      setStudents([]);
      setTotalPages(1);
      setTotalRecords(0);
    }
  }, [selectedFormId, currentPage, searchQuery]);

  const handleEditMarks = (student) => {
    setSelectedStudent(student);
    setEditMarks(student.marks || {});
    setShowEditModal(true);
  };

  const handleResetMarks = async (student) => {
    if (!window.confirm(`Are you sure you want to reset marks for the ENTIRE GROUP ${student.group_id}?\n\nThis will delete all marks for all students in this group as marks are stored together.`)) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await apiRequest(
        `/api/admin/evaluation-forms/${selectedFormId}/submissions/${student.submission_id}`,
        "DELETE",
        null,
        token
      );

      if (response?.success) {
        alert("Group marks reset successfully!");
        fetchStudents(selectedFormId, currentPage, searchQuery);
      } else {
        alert(`Failed to reset marks: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error resetting marks:", error);
      alert("Error resetting marks. Please try again.");
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // Calculate total
    let total = 0;
    formFields.forEach((field) => {
      const value = Number(editMarks[field.key]) || 0;
      total += value;
    });

    const payload = {
      marks: editMarks,
      total: total,
      feedback: editMarks.feedback || ""
    };

    try {
      const response = await apiRequest(
        `/api/admin/evaluation-forms/${selectedFormId}/submissions/${selectedStudent.submission_id}`,
        "PUT",
        payload,
        token
      );

      if (response?.success) {
        alert("Marks updated successfully!");
        setShowEditModal(false);
        setSelectedStudent(null);
        setEditMarks({});
        fetchStudents(selectedFormId, currentPage, searchQuery);
      } else {
        alert(`Failed to update marks: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating marks:", error);
      alert("Error updating marks. Please try again.");
    }
  };

  if (loading && !selectedFormId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header name={userName} id={userId} />
        <div className="flex pt-24 lg:pt-28">
          <Sidebar />
          <main className="flex-1 lg:ml-72 mb-16 lg:mb-0 px-4 sm:px-8 py-6 overflow-x-hidden">
            <div className="max-w-full">
              <div className="text-center flex items-center justify-center min-h-[60vh]">
                <div>
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header name={userName} id={userId} />
      <div className="flex pt-24 lg:pt-28">
        <Sidebar />
        <main className="flex-1 lg:ml-72 mb-16 lg:mb-0 px-4 sm:px-8 py-6 overflow-x-hidden">
        <div className="max-w-full">
        {/* User Info Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{userName}</h1>
              <p className="text-gray-500">Evaluation Management</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">Select Evaluation Form:</label>
              <select
                value={selectedFormId}
                onChange={(e) => {
                  setSelectedFormId(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-medium text-gray-900"
              >
                <option value="">Select Evaluation Form</option>
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedFormId && (
          <>
            {/* Statistics */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Evaluation Submissions</h2>
                  <p className="text-purple-100">Total Records: {totalRecords}</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl">
                  <Database className="w-12 h-12" />
                </div>
              </div>
            </div>

            {/* Search and Sort */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by Group ID, Enrollment No or Student Name..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sort By
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900"
                    >
                      <option value="group_id">Group ID</option>
                      <option value="enrollment_no">Enrollment No</option>
                      <option value="student_name">Student Name</option>
                      <option value="total">Total Marks</option>
                      <option value="external_name">External Name</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-700 font-semibold"
                      title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
                    >
                      {sortOrder === "asc" ? "↑ ASC" : "↓ DESC"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600 font-semibold">Loading data...</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-6">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠</span>
                  <p className="text-red-700 font-semibold">{error}</p>
                </div>
              </div>
            )}

            {/* Table */}
            {!loading && !error && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-w-full">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-600 to-purple-700">
                        <th className="px-2 py-3 text-center text-xs font-semibold text-white whitespace-nowrap">Actions</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-white whitespace-nowrap">Group ID</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-white whitespace-nowrap">Enrollment No</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-white whitespace-nowrap">Student Name</th>
                        {formFields.map((field, index) => (
                          <th key={field.key} className="px-2 py-3 text-center text-xs font-semibold text-white whitespace-nowrap" title={field.label}>
                            {String.fromCharCode(65 + index)}
                            <br />
                            <span className="text-xs text-purple-200">({field.max_marks})</span>
                          </th>
                        ))}
                        <th className="px-2 py-3 text-center text-xs font-semibold text-white whitespace-nowrap">
                          Total
                          <br />
                          <span className="text-xs text-purple-200">({formTotalMarks || computedTotal})</span>
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-white whitespace-nowrap">External</th>
                        <th className="px-2 py-3 text-center text-xs font-semibold text-white whitespace-nowrap">Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedStudents.length > 0 ? (
                        sortedStudents.map((student, index) => (
                          <tr
                            key={student.submission_id || index}
                            className={`hover:bg-gray-50 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                            }`}
                          >
                            <td className="px-2 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditMarks(student)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit marks"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleResetMarks(student)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Reset marks"
                                >
                                  <RotateCcw className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center text-gray-900 text-sm whitespace-nowrap">{student.group_id || "-"}</td>
                            <td className="px-3 py-3 text-center text-gray-900 text-sm whitespace-nowrap">{student.enrollment_no || "-"}</td>
                            <td className="px-3 py-3 text-center text-gray-900 text-sm whitespace-nowrap">{student.student_name || "-"}</td>
                            {formFields.map((field) => (
                              <td key={field.key} className="px-2 py-3 text-center text-gray-900 text-sm whitespace-nowrap">
                                {student.marks?.[field.key] ?? "-"}
                              </td>
                            ))}
                            <td className="px-2 py-3 text-center text-gray-900 text-sm font-semibold whitespace-nowrap">
                              {student.total || 0}
                            </td>
                            <td className="px-2 py-3 text-center text-gray-900 text-sm whitespace-nowrap">{student.external_name || "-"}</td>
                            <td className="px-2 py-3 text-center text-gray-600 text-xs max-w-[150px] truncate">
                              {student.feedback || "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={formFields.length + 8} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                <Database className="w-8 h-8 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                              <p className="text-gray-600">
                                {searchQuery ? "No results found for your search" : "No submissions found for this evaluation form"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalRecords > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-purple-600">{((currentPage - 1) * rowsPerPage) + 1}</span> to{" "}
                    <span className="font-semibold text-purple-600">
                      {Math.min(currentPage * rowsPerPage, totalRecords)}
                    </span>{" "}
                    of <span className="font-semibold text-purple-600">{totalRecords}</span> entries
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-3 py-2 rounded-l-xl border border-gray-300 text-sm font-medium ${
                          currentPage === 1
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            : 'text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === currentPage
                                ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-3 py-2 rounded-r-xl border border-gray-300 text-sm font-medium ${
                          currentPage === totalPages
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            : 'text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* No Form Selected */}
        {!selectedFormId && !loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
              <Database className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select an Evaluation Form</h3>
            <p className="text-gray-600">
              Please select an evaluation form from the dropdown above to view and manage submissions.
            </p>
          </div>
        )}
        </div>

      {/* Edit Marks Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 backdrop-blur-md bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Marks</h2>
                <p className="text-gray-600 mt-1">
                  {selectedStudent.student_name} ({selectedStudent.enrollment_no})
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitEdit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {formFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {field.label} <span className="text-gray-500 font-normal">(Max: {field.max_marks})</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={field.max_marks}
                      step="0.01"
                      value={editMarks[field.key] || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || (Number(value) >= 0 && Number(value) <= field.max_marks)) {
                          setEditMarks({ ...editMarks, [field.key]: value });
                        }
                      }}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Feedback (Optional)
                </label>
                <textarea
                  value={editMarks.feedback || ""}
                  onChange={(e) => setEditMarks({ ...editMarks, feedback: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900"
                  placeholder="Enter feedback for the student..."
                ></textarea>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg"
                >
                  Update Marks
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
};

export default SubAdminEvaluationManagement;
