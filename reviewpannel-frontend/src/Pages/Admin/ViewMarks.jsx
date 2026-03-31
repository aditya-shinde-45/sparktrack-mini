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
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupOptions, setGroupOptions] = useState([]);
  const [formFields, setFormFields] = useState([]);
  const [formTotalMarks, setFormTotalMarks] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [allStudentsForCSV, setAllStudentsForCSV] = useState([]);
  const [sortBy, setSortBy] = useState("group_id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [savingRowKey, setSavingRowKey] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [dirtyRowKeys, setDirtyRowKeys] = useState(new Set());
  const rowsPerPage = 50;
  const csvLinkRef = React.useRef(null);

  const getRowKey = React.useCallback((student) => {
    return `${student.submission_id}:${student.enrollment_no || student.enrollement_no || ""}`;
  }, []);

  const normalizeFieldType = React.useCallback((field) => {
    return field?.type || (Number(field?.max_marks) === 0 ? "boolean" : "number");
  }, []);

  const clampNumberByField = React.useCallback((field, value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return "";
    const min = 0;
    const max = Number(field?.max_marks) || 0;
    if (parsed < min) return min;
    if (parsed > max) return max;
    return parsed;
  }, []);

  const calculateTotalFromMarks = React.useCallback((marks) => {
    return formFields.reduce((sum, field) => {
      if (normalizeFieldType(field) !== "number") return sum;
      return sum + (Number(marks?.[field.key]) || 0);
    }, 0);
  }, [formFields, normalizeFieldType]);

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

  const sortedStudents = React.useMemo(() => {
    const dataToSort = [...students];
    return dataToSort.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle numeric sorting for total
      if (sortBy === "total") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        // String sorting (case-insensitive)
        aVal = String(aVal || "").toLowerCase();
        bVal = String(bVal || "").toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [students, sortBy, sortOrder]);

  const csvData = React.useMemo(() => {
    const dataToUse = allStudentsForCSV.length > 0 ? allStudentsForCSV : students;
    return dataToUse.map((student) => {
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
  }, [students, allStudentsForCSV, formFields]);

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

  const fetchGroupOptions = async (formId) => {
    if (!formId) {
      setGroupOptions([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await apiRequest(
        `/api/admin/evaluation-forms/${formId}/submissions?page=1&limit=10000`,
        "GET",
        null,
        token
      );

      const studentsData = response?.data?.data || response?.data || [];
      const groups = Array.from(
        new Set((Array.isArray(studentsData) ? studentsData : []).map((row) => String(row.group_id || "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));
      setGroupOptions(groups);
    } catch (err) {
      console.error("Failed to load group options:", err);
      setGroupOptions([]);
    }
  };

  const handleFormMarkChange = React.useCallback((student, field, value) => {
    const enrollmentNo = student.enrollment_no || student.enrollement_no;
    if (!enrollmentNo) return;

    const fieldType = normalizeFieldType(field);
    const nextValue = fieldType === "number"
      ? (value === "" ? "" : clampNumberByField(field, value))
      : (fieldType === "boolean" ? Boolean(value) : value);

    setStudents((prev) => prev.map((row) => {
      const rowEnrollment = row.enrollment_no || row.enrollement_no;
      if (row.submission_id !== student.submission_id || rowEnrollment !== enrollmentNo) {
        return row;
      }

      const updatedMarks = {
        ...(row.marks || {}),
        [field.key]: nextValue
      };

      return {
        ...row,
        marks: updatedMarks,
        total: calculateTotalFromMarks(updatedMarks)
      };
    }));

    setAllStudentsForCSV((prev) => prev.map((row) => {
      const rowEnrollment = row.enrollment_no || row.enrollement_no;
      if (row.submission_id !== student.submission_id || rowEnrollment !== enrollmentNo) {
        return row;
      }

      const updatedMarks = {
        ...(row.marks || {}),
        [field.key]: nextValue
      };

      return {
        ...row,
        marks: updatedMarks,
        total: calculateTotalFromMarks(updatedMarks)
      };
    }));

    const rowKey = getRowKey(student);
    setDirtyRowKeys((prev) => {
      const next = new Set(prev);
      next.add(rowKey);
      return next;
    });
  }, [calculateTotalFromMarks, clampNumberByField, normalizeFieldType, getRowKey]);

  const handleSaveFormRow = React.useCallback(async (student) => {
    if (!selectedFormId) return;

    const enrollmentNo = student.enrollment_no || student.enrollement_no;
    if (!student.submission_id || !enrollmentNo) {
      alert("Missing submission/student identifier, cannot save marks.");
      return;
    }

    setSaveMessage("");
    const rowKey = `${student.submission_id}:${enrollmentNo}`;
    setSavingRowKey(rowKey);

    try {
      const token = localStorage.getItem("token");
      const response = await apiRequest(
        `/api/admin/evaluation-forms/${selectedFormId}/submissions/${student.submission_id}/students/${encodeURIComponent(enrollmentNo)}`,
        "PUT",
        { marks: student.marks || {} },
        token
      );

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update marks");
      }

      const updatedRow = response.data || {};

      setStudents((prev) => prev.map((row) => {
        const rowEnrollment = row.enrollment_no || row.enrollement_no;
        if (row.submission_id !== student.submission_id || rowEnrollment !== enrollmentNo) {
          return row;
        }
        return {
          ...row,
          ...updatedRow
        };
      }));

      setAllStudentsForCSV((prev) => prev.map((row) => {
        const rowEnrollment = row.enrollment_no || row.enrollement_no;
        if (row.submission_id !== student.submission_id || rowEnrollment !== enrollmentNo) {
          return row;
        }
        return {
          ...row,
          ...updatedRow
        };
      }));

      setDirtyRowKeys((prev) => {
        const next = new Set(prev);
        next.delete(rowKey);
        return next;
      });

      setSaveMessage(`Saved marks for ${updatedRow.student_name || student.student_name || enrollmentNo}`);
    } catch (err) {
      alert(err.message || "Failed to save marks");
    } finally {
      setSavingRowKey(null);
    }
  }, [selectedFormId]);

  // Fetch all students for CSV export (no pagination)
  const fetchAllStudentsForCSV = async (formId, search = "", groupId = "") => {
    setExportingCSV(true);
    try {
      const token = localStorage.getItem("token");
      let url = `/api/admin/evaluation-forms/${formId}/submissions?page=1&limit=10000`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (groupId) {
        url += `&groupId=${encodeURIComponent(groupId)}`;
      }
      
      const response = await apiRequest(url, "GET", null, token);
      
      if (response && response.data) {
        const studentsData = response.data.data || response.data;
        setAllStudentsForCSV(Array.isArray(studentsData) ? studentsData : []);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to fetch all students for CSV:", err);
      return false;
    } finally {
      setExportingCSV(false);
    }
  };

  // Fetch students API with pagination and search
  const fetchStudents = async (formId, page, search = "", groupId = "") => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      let url = `/api/admin/evaluation-forms/${formId}/submissions?page=${page}&limit=${rowsPerPage}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (groupId) {
        url += `&groupId=${encodeURIComponent(groupId)}`;
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
        setSaveMessage("");
        setDirtyRowKeys(new Set());
      } else {
        setStudents([]);
        setSaveMessage("");
        setDirtyRowKeys(new Set());
      }
    } catch (err) {
      setError(err.message || "Failed to fetch data.");
      setStudents([]);
      setSaveMessage("");
      setDirtyRowKeys(new Set());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    if (selectedFormId) {
      fetchFormDetails(selectedFormId);
      fetchGroupOptions(selectedFormId);
      fetchStudents(selectedFormId, currentPage, searchQuery, selectedGroupId);
    } else {
      setStudents([]);
      setGroupOptions([]);
      setSelectedGroupId("");
      setTotalPages(1);
      setTotalRecords(0);
    }
  }, [selectedFormId, selectedGroupId, currentPage, searchQuery]);

  return (
    <div className="font-sans min-h-screen bg-slate-100">
      <Header />
      <Sidebar />

      <main className="pt-[88px] pb-16 lg:pb-8 lg:ml-[18rem]">
        <div className="px-3 sm:px-5 lg:px-8 py-4 sm:py-6 max-w-[1500px] mx-auto space-y-6">
            {/* Header with Form Selection */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl shadow-lg p-6 border border-purple-400/30">
              <h1 className="text-3xl font-bold text-white mb-4">View Marks</h1>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Edit Enabled
                </span>
                {dirtyRowKeys.size > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                    Unsaved Rows: {dirtyRowKeys.size}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                  <select
                    value={selectedFormId}
                    onChange={(e) => {
                      setSelectedFormId(e.target.value);
                      setSelectedGroupId("");
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
                <div className="flex gap-2">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => {
                      setSelectedGroupId(e.target.value);
                      setCurrentPage(1);
                    }}
                    disabled={!selectedFormId}
                    className="px-4 py-2 rounded-lg font-semibold bg-white text-purple-700 shadow-lg disabled:bg-gray-200 disabled:text-gray-500"
                  >
                    <option value="">Select Group</option>
                    {groupOptions.map((groupId) => (
                      <option key={groupId} value={groupId}>
                        {groupId}
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-4">
              {saveMessage && (
                <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-md">
                  <p className="text-green-700 text-sm font-semibold">{saveMessage}</p>
                </div>
              )}
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
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sort By
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
                    >
                      <option value="group_id">Group ID</option>
                      <option value="enrollment_no">Enrollment No</option>
                      <option value="student_name">Student Name</option>
                      <option value="total">Total Marks</option>
                      <option value="external_name">External Name</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700 font-semibold"
                      title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
                    >
                      {sortOrder === "asc" ? "↑ ASC" : "↓ DESC"}
                    </button>
                  </div>
                </div>
                <div className="flex items-end">
                  <CSVLink
                    data={csvData}
                    headers={csvHeaders}
                    filename={`EvaluationForm_${selectedFormId || "marks"}.csv`}
                    ref={csvLinkRef}
                    className="hidden"
                  />
                  <button
                    onClick={async () => {
                      if (!selectedFormId) {
                        alert("Please select an evaluation form first");
                        return;
                      }
                      const success = await fetchAllStudentsForCSV(selectedFormId, searchQuery, selectedGroupId);
                      if (success) {
                        setTimeout(() => {
                          csvLinkRef.current?.link.click();
                        }, 100);
                      } else {
                        alert("Failed to fetch data for CSV export");
                      }
                    }}
                    disabled={exportingCSV || !selectedFormId}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {exportingCSV ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Exporting...</span>
                      </>
                    ) : (
                      "Export CSV"
                    )}
                  </button>
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <MarksTable
                    students={sortedStudents}
                    loading={loading}
                    error={error}
                    reviewType="form"
                    formFields={formFields}
                    totalMarks={formTotalMarks || computedTotal}
                    editableFormMarks={true}
                    onFormMarkChange={handleFormMarkChange}
                    onSaveFormRow={handleSaveFormRow}
                    savingRowKey={savingRowKey}
                    dirtyRowKeys={dirtyRowKeys}
                  />
                </div>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalRecords > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
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
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
                <span className="material-icons text-gray-400 text-6xl mb-4">inbox</span>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Records Found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query.</p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default ViewMarks;
