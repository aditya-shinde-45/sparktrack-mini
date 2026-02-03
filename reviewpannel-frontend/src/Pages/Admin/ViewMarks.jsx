import React, { useState, useEffect } from "react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import MarksTable from "../../Components/Admin/MarksTable";
import Pagination from "../../Components/Admin/Pagination";
import { apiRequest } from "../../api.js";
import { CSVLink } from "react-csv";

const ViewMarks = () => {
  const [students, setStudents] = useState([]);
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [formFields, setFormFields] = useState([]);
  const [formTotalMarks, setFormTotalMarks] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const rowsPerPage = 50;

  const computedTotal = React.useMemo(() => {
    return formFields.reduce((sum, field) => sum + (Number(field.max_marks) || 0), 0);
  }, [formFields]);

  const csvHeaders = React.useMemo(() => {
    const baseHeaders = [
      { label: "GROUP ID", key: "group_id" },
      { label: "ENROLLMENT NO", key: "enrollment_no" },
      { label: "STUDENT NAME", key: "student_name" }
    ];

    const fieldHeaders = formFields.map((field) => ({
      label: field.label?.toUpperCase() || field.key,
      key: field.key
    }));

    return [
      ...baseHeaders,
      ...fieldHeaders,
      { label: "TOTAL", key: "total" },
      { label: "EXTERNAL", key: "external_name" },
      { label: "FEEDBACK", key: "feedback" }
    ];
  }, [formFields]);

  const csvData = React.useMemo(() => {
    return students.map((student) => {
      const flattened = {
        group_id: student.group_id,
        enrollment_no: student.enrollment_no,
        student_name: student.student_name,
        total: student.total,
        external_name: student.external_name,
        feedback: student.feedback
      };

      formFields.forEach((field) => {
        flattened[field.key] = student.marks?.[field.key] ?? "";
      });

      return flattened;
    });
  }, [students, formFields]);

  const fetchForms = async () => {
    const token = localStorage.getItem("token");
    const response = await apiRequest("/api/admin/evaluation-forms", "GET", null, token);
    if (response?.success) {
      setForms(response.data || []);
      if (!selectedFormId && response.data?.length) {
        setSelectedFormId(response.data[0].id);
      }
    }
  };

  const fetchFormDetails = async (formId) => {
    if (!formId) return;
    const token = localStorage.getItem("token");
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
  };

  // Fetch students API with pagination and search
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
    fetchForms();
  }, []);

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

  return (
    <div className="font-sans bg-gray-50">
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
          <Sidebar />
          <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 space-y-6 mt-16">
            {/* Header with Form Selection */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 mb-6">
              <h1 className="text-3xl font-bold text-white mb-4">View Marks</h1>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                  <select
                    value={selectedFormId}
                    onChange={(e) => {
                      setSelectedFormId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 rounded-lg font-semibold bg-white text-purple-700 shadow-lg"
                  >
                    <option value="">Select Evaluation Form</option>
                    {forms.map((form) => (
                      <option key={form.id} value={form.id}>
                        {form.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-white text-sm">
                  <span className="font-semibold">Total Records:</span> {totalRecords}
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by Group ID, Enrollment No or Student Name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
                  />
                </div>
                <div className="flex items-end">
                  <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename={`EvaluationForm_${selectedFormId || "marks"}.csv`}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                  >
                    Export CSV
                  </CSVLink>
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
                    reviewType="form"
                    formFields={formFields}
                    totalMarks={formTotalMarks || computedTotal}
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
