import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Common/Header";
import MarksTable from "../../Components/Admin/MarksTable";
import Pagination from "../../Components/Admin/Pagination";
import { Database, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "../../api";

const SubAdminDashboard = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [tablePermissions, setTablePermissions] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50); // Show 50 records per page
  const [showPassword, setShowPassword] = useState(false);
  const [mentorList, setMentorList] = useState([]);
  const [showMentorDropdown, setShowMentorDropdown] = useState(false);
  const [studentList, setStudentList] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [evaluationForms, setEvaluationForms] = useState([]);
  const [selectedEvaluationFormId, setSelectedEvaluationFormId] = useState("");
  const [evaluationFormFields, setEvaluationFormFields] = useState([]);
  const [evaluationFormTotal, setEvaluationFormTotal] = useState(0);
  const [evaluationSubmissions, setEvaluationSubmissions] = useState([]);
  const [evaluationSearchQuery, setEvaluationSearchQuery] = useState("");
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  const [evaluationCurrentPage, setEvaluationCurrentPage] = useState(1);
  const [evaluationTotalPages, setEvaluationTotalPages] = useState(1);
  const [evaluationTotalRecords, setEvaluationTotalRecords] = useState(0);
  const [evaluationSortBy, setEvaluationSortBy] = useState("group_id");
  const [evaluationSortOrder, setEvaluationSortOrder] = useState("asc");
  const [evaluationRowsPerPage] = useState(50);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const evaluationComputedTotal = React.useMemo(() => {
    return evaluationFormFields.reduce((sum, field) => sum + (Number(field.max_marks) || 0), 0);
  }, [evaluationFormFields]);

  const sortedEvaluationSubmissions = React.useMemo(() => {
    const dataToSort = [...evaluationSubmissions];
    return dataToSort.sort((a, b) => {
      let aVal = a[evaluationSortBy];
      let bVal = b[evaluationSortBy];

      if (evaluationSortBy === "total") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal || "").toLowerCase();
        bVal = String(bVal || "").toLowerCase();
      }

      if (aVal < bVal) return evaluationSortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return evaluationSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [evaluationSubmissions, evaluationSortBy, evaluationSortOrder]);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      const token = localStorage.getItem("token");
      const storedUserId = localStorage.getItem("user_id");
      const storedName = localStorage.getItem("name");
      const storedRole = localStorage.getItem("role");

      if (!token || !storedUserId) {
        navigate("/pblmanagementfacultydashboardlogin");
        return;
      }

      setUserId(storedUserId);
      setUserName(storedName || storedUserId);

      if (storedRole && storedRole.toLowerCase() === 'admin') {
        const adminTables = [
          'students',
          'pbl',
          'mentors',
          'evaluation_form_submission',
          'industrial_mentors'
        ];
        setTablePermissions(adminTables);
        const savedTable = localStorage.getItem("selectedTable");
        if (savedTable && adminTables.includes(savedTable)) {
          setSelectedTable(savedTable);
        } else if (adminTables.length > 0) {
          setSelectedTable(adminTables[0]);
          localStorage.setItem("selectedTable", adminTables[0]);
        }
        setLoading(false);
        return;
      }

      try {
        // Fetch current user's role details to get permissions
        const response = await apiRequest('/api/roles', 'GET', null, token);

        if (response.success && response.data) {
          const currentUser = response.data.find(r => r.user_id === storedUserId);
          
          if (currentUser && currentUser.table_permissions) {
            const permissions = currentUser.table_permissions;
            setTablePermissions(permissions);
            // Restore previously selected table or set first table as default
            const savedTable = localStorage.getItem("selectedTable");
            if (savedTable && permissions.includes(savedTable)) {
              setSelectedTable(savedTable);
            } else if (permissions.length > 0) {
              setSelectedTable(permissions[0]);
              localStorage.setItem("selectedTable", permissions[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [navigate]);

  // Fetch table data when selectedTable changes
  useEffect(() => {
    if (selectedTable) {
      if (selectedTable === 'evaluation_form_submission') {
        fetchEvaluationForms();
      } else {
        fetchTableData();
      }
    }
  }, [selectedTable]);

  const fetchTableData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const response = await apiRequest(`/api/role-access/${selectedTable}`, 'GET', null, token);

      console.log('Fetch table data response:', response);
      console.log('Selected table:', selectedTable);
      console.log('Records:', response?.data?.records);

      if (response.success && response.data) {
        setTableData(response.data.records || []);
      } else {
        console.error("Failed to fetch table data", response);
        setTableData([]);
      }
    } catch (error) {
      console.error("Error fetching table data:", error);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluationForms = async () => {
    const token = localStorage.getItem("token");
    setEvaluationLoading(true);
    setEvaluationError("");

    try {
      const response = await apiRequest('/api/role-access/evaluation_form_submission?forms=1', 'GET', null, token);
      if (response.success && response.data) {
        const forms = response.data.forms || [];
        setEvaluationForms(forms);
        if (!selectedEvaluationFormId && forms.length > 0) {
          setSelectedEvaluationFormId(forms[0].id);
        }
      } else {
        setEvaluationForms([]);
      }
    } catch (error) {
      console.error("Error fetching evaluation forms:", error);
      setEvaluationForms([]);
      setEvaluationError("Failed to load evaluation forms.");
    } finally {
      setEvaluationLoading(false);
    }
  };

  const fetchEvaluationSubmissions = async (formId, page, search = "") => {
    if (!formId) return;
    const token = localStorage.getItem("token");
    setEvaluationLoading(true);
    setEvaluationError("");

    try {
      const url = `/api/role-access/evaluation_form_submission?formId=${formId}&page=${page}&limit=${evaluationRowsPerPage}&search=${encodeURIComponent(search)}`;
      const response = await apiRequest(url, 'GET', null, token);

      if (response?.success && response.data) {
        const payload = response.data;
        const submissionsData = payload.data || [];
        const paginationInfo = payload.pagination || {};

        const incomingFields = Array.isArray(payload.form?.fields) ? payload.form.fields : [];
        const sortedFields = [...incomingFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setEvaluationFormFields(sortedFields);
        setEvaluationFormTotal(payload.form?.total_marks || 0);
        setEvaluationTotalPages(paginationInfo.totalPages || 1);
        setEvaluationTotalRecords(paginationInfo.totalRecords || 0);
        setEvaluationError("");
        setEvaluationSubmissions(submissionsData);
        return;
      }

      setEvaluationSubmissions([]);
      setEvaluationTotalPages(1);
      setEvaluationTotalRecords(0);
    } catch (error) {
      console.error("Error fetching evaluation submissions:", error);
      setEvaluationSubmissions([]);
      setEvaluationError("Failed to load evaluation submissions.");
    } finally {
      setEvaluationLoading(false);
    }
  };

  useEffect(() => {
    // Filter data based on search query
    if (searchQuery) {
      const filtered = tableData.filter(row => {
        // Convert all values to strings and search, handling nested objects
        const searchableText = Object.entries(row)
          .filter(([key]) => !key.includes('mentors')) // Exclude nested mentor objects
          .map(([_, value]) => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
          })
          .join(' ')
          .toLowerCase();
        
        return searchableText.includes(searchQuery.toLowerCase());
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(tableData);
    }
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, tableData]);

  // Reset to first page and clear search when table changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setEvaluationCurrentPage(1);
    setEvaluationSearchQuery('');
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable === 'evaluation_form_submission') {
      if (selectedEvaluationFormId) {
        fetchEvaluationSubmissions(selectedEvaluationFormId, evaluationCurrentPage, evaluationSearchQuery);
      } else {
        setEvaluationSubmissions([]);
        setEvaluationTotalRecords(0);
      }
    }
  }, [selectedTable, selectedEvaluationFormId, evaluationCurrentPage, evaluationSearchQuery]);

  // Fetch mentors and students when PBL table is selected and modal is opened
  useEffect(() => {
    if (selectedTable === 'pbl' && (showAddModal || showEditModal)) {
      fetchMentors();
      if (showAddModal) {
        fetchStudents();
      }
    }
  }, [selectedTable, showAddModal, showEditModal]);

  const fetchMentors = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await apiRequest('/api/role-access/mentors', 'GET', null, token);
      if (response.success && response.data) {
        setMentorList(response.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching mentors:", error);
    }
  };

  const fetchStudents = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await apiRequest('/api/role-access/students', 'GET', null, token);
      if (response.success && response.data) {
        setStudentList(response.data.records || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleMentorSelect = (mentor) => {
    setFormData({
      ...formData,
      mentor_name: mentor.mentor_name,
      mentor_code: mentor.mentor_code
    });
    setShowMentorDropdown(false);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudents((prev) => {
      const exists = prev.find((entry) => entry.enrollment_no === student.enrollment_no);
      if (exists) {
        return prev.filter((entry) => entry.enrollment_no !== student.enrollment_no);
      }
      if (prev.length >= 4) {
        alert("You can add up to 4 students per group.");
        return prev;
      }
      return [
        ...prev,
        {
          enrollment_no: student.enrollment_no,
          student_name: student.name_of_students,
          class: student.class_division || student.class || null
        }
      ];
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMentorDropdown && !event.target.closest('.mentor-dropdown-container')) {
        setShowMentorDropdown(false);
      }
      if (showStudentDropdown && !event.target.closest('.student-dropdown-container')) {
        setShowStudentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMentorDropdown, showStudentDropdown]);

  const handleAddRecord = () => {
    setFormData({});
    setSelectedStudents([]);
    setShowAddModal(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    // Exclude password from formData to avoid showing hashed password
    const { password, ...recordWithoutPassword } = record;
    setFormData(recordWithoutPassword);
    setShowPassword(false);
    setShowEditModal(true);
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm(`Are you sure you want to delete this record?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    // Get the correct ID field based on table type
    let recordId;
    if (selectedTable === 'students') {
      recordId = record.enrollment_no;
    } else if (selectedTable === 'mentors') {
      recordId = record.mentor_code;
    } else if (selectedTable === 'pbl') {
      recordId = record.enrollment_no;
    } else {
      recordId = record.id;
    }

    try {
      const response = await apiRequest(`/api/role-access/${selectedTable}/${recordId}`, 'DELETE', null, token);

      if (response.success) {
        alert("Record deleted successfully!");
        fetchTableData(); // Refresh data
      } else {
        alert(`Failed to delete record: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Error deleting record. Please try again.");
    }
  };

  const handleDeleteEvaluationGroup = async (groupId) => {
    if (!selectedEvaluationFormId || !groupId) return;

    if (!window.confirm(`Delete evaluation marks for group ${groupId}?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await apiRequest(
        `/api/role-access/evaluation_form_submission/${groupId}?formId=${selectedEvaluationFormId}`,
        'DELETE',
        null,
        token
      );

      if (response.success) {
        alert("Evaluation marks deleted successfully!");
        fetchEvaluationSubmissions(selectedEvaluationFormId, evaluationCurrentPage, evaluationSearchQuery);
      } else {
        alert(`Failed to delete marks: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting evaluation marks:", error);
      alert("Error deleting evaluation marks. Please try again.");
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      // For PBL, ensure mentor_code is included in the payload
      const dataToSubmit = { ...formData };
      
      // Remove mentor_name from payload if it's PBL (it's just for display, not in DB)
      // mentor_code is what gets stored in the database
      if (selectedTable === 'pbl' && dataToSubmit.mentor_name && dataToSubmit.mentor_code) {
        // mentor_code will be sent, mentor_name is just for selection UI
        delete dataToSubmit.mentor_name;
      }

      if (selectedTable === 'industrial_mentors') {
        delete dataToSubmit.industrial_mentor_code;
      }
      
      if (selectedTable === 'pbl') {
        if (!dataToSubmit.group_id) {
          alert("Group ID is required.");
          return;
        }
        if (selectedStudents.length === 0) {
          alert("Select at least one student for this group.");
          return;
        }
        if (!dataToSubmit.mentor_code) {
          alert("Select a mentor for this group.");
          return;
        }

        const payloads = selectedStudents.map((student) => ({
          group_id: dataToSubmit.group_id,
          enrollment_no: student.enrollment_no,
          student_name: student.student_name,
          class: student.class,
          mentor_code: dataToSubmit.mentor_code
        }));

        const responses = await Promise.all(
          payloads.map((payload) => apiRequest(`/api/role-access/${selectedTable}`, 'POST', payload, token))
        );

        const failed = responses.find((res) => !res?.success);
        if (failed) {
          alert(`Failed to create record: ${failed.message || "Unknown error"}`);
          return;
        }

        alert("Records created successfully!");
        setShowAddModal(false);
        setFormData({});
        setSelectedStudents([]);
        fetchTableData();
        return;
      }

      const response = await apiRequest(`/api/role-access/${selectedTable}`, 'POST', dataToSubmit, token);

      if (response.success) {
        alert("Record created successfully!");
        setShowAddModal(false);
        setFormData({});
        fetchTableData(); // Refresh data
      } else {
        alert(`Failed to create record: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating record:", error);
      alert("Error creating record. Please try again.");
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    // Get the correct ID field based on table type
    let recordId;
    if (selectedTable === 'students') {
      recordId = selectedRecord.enrollment_no;
    } else if (selectedTable === 'mentors') {
      recordId = selectedRecord.mentor_code;
    } else if (selectedTable === 'pbl') {
      recordId = selectedRecord.enrollment_no;
    } else {
      recordId = selectedRecord.id;
    }

    // Filter formData to only include valid columns from getTableColumns()
    const validColumns = getTableColumns();
    const filteredData = {};
    validColumns.forEach(col => {
      if (formData[col] !== undefined) {
        filteredData[col] = formData[col];
      }
    });

    // For PBL, handle mentor_name -> mentor_code conversion
    if (selectedTable === 'pbl') {
      // Remove mentor_name from payload if it exists (it's just for display, not in DB)
      delete filteredData.mentor_name;
      // Add mentor_code if it was set from mentor selection
      if (formData.mentor_code) {
        filteredData.mentor_code = formData.mentor_code;
      }
    }

    if (selectedTable === 'mentors') {
      delete filteredData.mentor_code;
    }

    if (selectedTable === 'industrial_mentors') {
      delete filteredData.industrial_mentor_code;
    }

    // Add password if it's provided and not empty (for students and mentors tables)
    if ((selectedTable === 'students' || selectedTable === 'mentors' || selectedTable === 'industrial_mentors') && formData.password && formData.password.trim() !== '') {
      filteredData.password = formData.password;
    }

    try {
      const response = await apiRequest(`/api/role-access/${selectedTable}/${recordId}`, 'PUT', filteredData, token);

      if (response.success) {
        setShowEditModal(false);
        setSelectedRecord(null);
        setFormData({});
        await fetchTableData(); // Refresh data
        alert("Record updated successfully!");
      } else {
        alert(`Failed to update record: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating record:", error);
      alert("Error updating record. Please try again.");
    }
  };

  const getTableColumns = () => {
    switch (selectedTable) {
      case 'students':
        return ['enrollment_no', 'name_of_students', 'email_id', 'contact', 'class'];
      case 'mentors':
        return ['mentor_code', 'mentor_name', 'contact_number', 'email', 'designation'];
      case 'pbl':
        return ['group_id', 'enrollment_no', 'student_name', 'team_name', 'class', 'is_leader', 'mentor_name'];
      case 'industrial_mentors':
        return ['industrial_mentor_code', 'name', 'company_name', 'designation', 'email', 'contact', 'mentor_name'];
      case 'evaluation_form_submission':
        return [];
      default:
        return [];
    }
  };

  const renderFormFields = () => {
    if (selectedTable === 'industrial_mentors' && showEditModal) {
      return null;
    }
    const fields = [...getTableColumns()];
    
    // Add password field for mentors in add modal
    if (selectedTable === 'mentors' && showAddModal) {
      fields.push('password');
    }
    
    return fields.map(field => {
      // Skip auto-generated or ID fields in add modal, and mentor_name for PBL (will be handled separately)
      if ((field === 'id' || field === 'mentor_id' || (field === 'mentor_code' && selectedTable === 'mentors') || (field === 'industrial_mentor_code' && selectedTable === 'industrial_mentors')) && showAddModal) return null;
      
      // Skip mentor_code and group_id in mentor edit modal - these should not be edited
      if ((field === 'mentor_code' || field === 'group_id') && selectedTable === 'mentors' && showEditModal) return null;

      // Skip industrial mentor code in edit modal
      if (field === 'industrial_mentor_code' && selectedTable === 'industrial_mentors' && showEditModal) return null;
      
      // Skip mentor_name in PBL add modal - it will be handled with special dropdown
      if (field === 'mentor_name' && selectedTable === 'pbl' && showAddModal) return null;
      
      // Skip mentor_name in PBL edit modal too - it will be handled with special dropdown
      if (field === 'mentor_name' && selectedTable === 'pbl' && showEditModal) return null;
      
      // Skip team_name and is_leader in PBL (both add and edit) - not needed
      if ((field === 'team_name' || field === 'is_leader') && selectedTable === 'pbl') return null;
      
      // Skip group_id, student_name, enrollment_no, and class in PBL add modal - handled with custom UI
      if ((field === 'group_id' || field === 'student_name' || field === 'enrollment_no' || field === 'class') && selectedTable === 'pbl' && showAddModal) return null;
      
      const isReadOnly = false;
      const baseRequired = field !== 'contact' && field !== 'contact_number' && field !== 'phone' && field !== 'department' && field !== 'specialization' && field !== 'class_prefix' && field !== 'mentor_code' && field !== 'status' && field !== 'is_leader' && field !== 'ps_id' && field !== 'review1' && field !== 'review2' && field !== 'final' && field !== 'email_id' && field !== 'guide_name' && field !== 'guide_contact' && field !== 'class' && field !== 'mentor_name' && field !== 'email' && field !== 'designation' && field !== 'company_name' && field !== 'industrial_mentor_code';
      const isRequired = selectedTable === 'industrial_mentors'
        ? ['name', 'email', 'contact'].includes(field)
        : baseRequired;
      

      
      return (
        <div key={field} className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
            {field.replace(/_/g, ' ')}
            {isReadOnly && field === 'mentor_name' && <span className="text-xs text-gray-500 ml-2">(from mentors table)</span>}
            {isReadOnly && field === 'guide_contact' && <span className="text-xs text-gray-500 ml-2">(auto-filled from mentor)</span>}
          </label>
          <input
            type="text"
            value={formData[field] || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className={`w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            required={isRequired}
            readOnly={isReadOnly}
          />
        </div>
      );
    });
  };

  const getTableDisplayName = (tableName) => {
    const names = {
      students: "Students",
      pbl: "PBL Groups",
      mentors: "Mentors",
      evaluation_form_submission: "Evaluation Form Submissions",
      industrial_mentors: "Industrial Mentors"
    };
    return names[tableName] || tableName;
  };

  if (loading) {
    return (
      <div className={embedded ? "w-full flex items-center justify-center" : "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"}>
        {!embedded && <Header name={userName} id={userId} />}
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (tablePermissions.length === 0) {
    return (
      <div className={embedded ? "w-full" : "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"}>
        {!embedded && <Header name={userName} id={userId} />}
        <div className={embedded ? "flex items-center justify-center min-h-[50vh]" : "flex items-center justify-center min-h-screen pt-24"}>
          <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <Database className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Access Granted</h3>
            <p className="text-gray-600">
              You don't have permission to access any tables. Please contact the administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "w-full" : "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"}>
      {!embedded && <Header name={userName} id={userId} />}
      
      <div className={embedded ? "px-4 py-4" : "pt-24 px-8 pb-8"}>
        {/* User Info Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{userName}</h1>
              <p className="text-gray-500">Sub-Administrator</p>
            </div>
            {tablePermissions.length > 1 && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Select Table:</label>
                <select
                  value={selectedTable}
                  onChange={(e) => {
                    const newTable = e.target.value;
                    setSelectedTable(newTable);
                    localStorage.setItem("selectedTable", newTable);
                  }}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-medium text-gray-900"
                >
                  {tablePermissions.map(table => (
                    <option key={table} value={table}>
                      {getTableDisplayName(table)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {selectedTable === 'evaluation_form_submission' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {getTableDisplayName(selectedTable)}
              </h2>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <select
                  value={selectedEvaluationFormId}
                  onChange={(e) => {
                    setSelectedEvaluationFormId(e.target.value);
                    setEvaluationCurrentPage(1);
                  }}
                  className="px-4 py-2 rounded-lg font-semibold bg-white text-purple-700 shadow-lg"
                >
                  <option value="">Select Evaluation Form</option>
                  {evaluationForms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.name}
                    </option>
                  ))}
                </select>
                <div className="text-white text-sm">
                  <span className="font-semibold">Total Records:</span> {evaluationTotalRecords}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search by Group ID, Enrollment No or Student Name..."
                    value={evaluationSearchQuery}
                    onChange={(e) => {
                      setEvaluationSearchQuery(e.target.value);
                      setEvaluationCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                  <div className="flex gap-2">
                    <select
                      value={evaluationSortBy}
                      onChange={(e) => setEvaluationSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
                    >
                      <option value="group_id">Group ID</option>
                      <option value="enrollment_no">Enrollment No</option>
                      <option value="student_name">Student Name</option>
                      <option value="total">Total Marks</option>
                      <option value="external_name">External Name</option>
                    </select>
                    <button
                      onClick={() => setEvaluationSortOrder(evaluationSortOrder === "asc" ? "desc" : "asc")}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700 font-semibold"
                      title={`Sort ${evaluationSortOrder === "asc" ? "Ascending" : "Descending"}`}
                    >
                      {evaluationSortOrder === "asc" ? "↑ ASC" : "↓ DESC"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {evaluationLoading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600 font-semibold">Loading data...</span>
              </div>
            )}

            {evaluationError && !evaluationLoading && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex items-center">
                  <span className="material-icons text-red-500 mr-2">error</span>
                  <p className="text-red-700 font-semibold">{evaluationError}</p>
                </div>
              </div>
            )}

            {!evaluationLoading && !evaluationError && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
                <div className="overflow-x-auto">
                  <MarksTable
                    students={sortedEvaluationSubmissions}
                    loading={evaluationLoading}
                    error={evaluationError}
                    reviewType="form"
                    formFields={evaluationFormFields}
                    totalMarks={evaluationFormTotal || evaluationComputedTotal}
                    onDeleteGroup={handleDeleteEvaluationGroup}
                  />
                </div>
              </div>
            )}

            {!evaluationLoading && !evaluationError && evaluationTotalRecords > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-purple-600">{((evaluationCurrentPage - 1) * evaluationRowsPerPage) + 1}</span> to{" "}
                    <span className="font-semibold text-purple-600">
                      {Math.min(evaluationCurrentPage * evaluationRowsPerPage, evaluationTotalRecords)}
                    </span>{" "}
                    of <span className="font-semibold text-purple-600">{evaluationTotalRecords}</span> entries
                  </div>
                  <Pagination
                    currentPage={evaluationCurrentPage}
                    totalPages={evaluationTotalPages}
                    setCurrentPage={setEvaluationCurrentPage}
                    totalItems={evaluationTotalRecords}
                    rowsPerPage={evaluationRowsPerPage}
                  />
                </div>
              </div>
            )}

            {!evaluationLoading && !evaluationError && evaluationTotalRecords === 0 && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mt-6">
                <span className="material-icons text-gray-400 text-6xl mb-4">inbox</span>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Records Found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {getTableDisplayName(selectedTable)}
                </h2>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {selectedTable !== 'industrial_mentors' && (
                  <button 
                    onClick={handleAddRecord}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium">
                    <Plus className="w-5 h-5" />
                    Add Record
                  </button>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900"
                />
              </div>
            </div>

            {/* Table */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-600 to-purple-700">
                      {getTableColumns().map(col => (
                        <th key={col} className="px-6 py-4 text-center text-sm font-semibold text-white capitalize">
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-center text-sm font-semibold text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(() => {
                      const startIndex = (currentPage - 1) * recordsPerPage;
                      const endIndex = startIndex + recordsPerPage;
                      const currentRecords = filteredData.slice(startIndex, endIndex);
                      
                      return currentRecords.length > 0 ? (
                        currentRecords.map((row, index) => (
                        <tr
                          key={row.id || row.enrollment_no || row.mentor_code || index}
                          className={`hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          {getTableColumns().map(col => (
                            <td key={col} className="px-6 py-4 text-center text-gray-900">
                              {row[col] || "-"}
                            </td>
                          ))}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleEditRecord(row)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit record"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              {selectedTable !== 'industrial_mentors' && (
                                <button 
                                  onClick={() => handleDeleteRecord(row)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete record"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={getTableColumns().length + 1} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                              <Database className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                            <p className="text-gray-600 mb-4">
                              {searchQuery ? "No results found for your search" : "Get started by adding new records"}
                            </p>
                            {!searchQuery && (
                              <button 
                                onClick={handleAddRecord}
                                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                                <Plus className="w-5 h-5" />
                                Add First Record
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {(() => {
              const totalPages = Math.ceil(filteredData.length / recordsPerPage);
              const startIndex = (currentPage - 1) * recordsPerPage;
              const endIndex = startIndex + recordsPerPage;
              
              const handlePageChange = (page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              };
              
              const getPageNumbers = () => {
                const pageNumbers = [];
                const maxVisiblePages = 5;
                
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                if (endPage - startPage < maxVisiblePages - 1) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(i);
                }
                
                return pageNumbers;
              };
              
              return totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span> of{' '}
                        <span className="font-medium">{filteredData.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                            currentPage === 1
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'text-gray-500 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>

                        {getPageNumbers().map((pageNumber) => (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNumber === currentPage
                                ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        ))}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                            currentPage === totalPages
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'text-gray-500 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-gray-900/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Record</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitAdd}>
              {selectedTable === 'pbl' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Group ID *
                    </label>
                    <input
                      type="text"
                      value={formData.group_id || ''}
                      onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                      placeholder="Enter group ID"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900"
                      required
                    />
                  </div>

                  <div className="relative student-dropdown-container">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Students (up to 4) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, index) => {
                        const student = selectedStudents[index];
                        return (
                          <div key={index} className="relative">
                            <input
                              type="text"
                              value={student ? `${student.student_name} (${student.enrollment_no})` : ''}
                              placeholder={`Student ${index + 1}`}
                              readOnly
                              className="w-full px-4 py-2 pr-10 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700"
                            />
                            {student && (
                              <button
                                type="button"
                                onClick={() => handleStudentSelect(student)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-red-200 text-red-600 hover:text-red-700 hover:border-red-300 flex items-center justify-center"
                                aria-label={`Remove ${student.student_name}`}
                              >
                                x
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-2">
                        Search and select students
                      </label>
                      <input
                        type="text"
                        value={formData.student_search || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, student_search: value });
                          if (value.length > 0) {
                            fetchStudents();
                            setShowStudentDropdown(true);
                          } else {
                            setShowStudentDropdown(false);
                          }
                        }}
                        onFocus={() => {
                          if ((formData.student_search || '').length > 0) {
                            fetchStudents();
                            setShowStudentDropdown(true);
                          }
                        }}
                        placeholder="Start typing student name or enrollment number..."
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900"
                        autoComplete="off"
                      />
                    </div>
                    {showStudentDropdown && studentList.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {studentList
                          .filter(student => 
                            student.name_of_students.toLowerCase().includes((formData.student_search || '').toLowerCase()) ||
                            student.enrollment_no.toLowerCase().includes((formData.student_search || '').toLowerCase())
                          )
                          .map((student) => (
                            <div
                              key={student.enrollment_no}
                              className="px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-0"
                            >
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.some((entry) => entry.enrollment_no === student.enrollment_no)}
                                  onChange={() => handleStudentSelect(student)}
                                  className="mt-1 h-4 w-4 accent-purple-600"
                                />
                                <div>
                                  <div className="font-medium text-gray-900">{student.name_of_students}</div>
                                  <div className="text-sm text-gray-600">Enrollment: {student.enrollment_no}</div>
                                  <div className="text-sm text-gray-500">Class: {student.class_division || student.class || 'N/A'}</div>
                                </div>
                              </label>
                            </div>
                          ))
                        }
                      </div>
                    )}
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: <span className="font-semibold">{selectedStudents.length}</span>/4
                    </div>
                  </div>
                </div>
              )}
              
              {renderFormFields()}
              
              {/* Mentor Name Dropdown for PBL - Add Modal */}
              {selectedTable === 'pbl' && showAddModal && (
                <div className="mb-4 relative mentor-dropdown-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mentor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.mentor_name || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, mentor_name: value });
                      if (value.length > 0) {
                        fetchMentors();
                        setShowMentorDropdown(true);
                      } else {
                        setShowMentorDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      if ((formData.mentor_name || '').length > 0) {
                        fetchMentors();
                        setShowMentorDropdown(true);
                      }
                    }}
                    placeholder="Start typing mentor name..."
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900"
                    autoComplete="off"
                    required
                  />
                  {showMentorDropdown && mentorList.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {mentorList
                        .filter(mentor => 
                          mentor.mentor_name.toLowerCase().includes((formData.mentor_name || '').toLowerCase())
                        )
                        .map((mentor) => (
                          <div
                            key={mentor.mentor_code}
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent input blur
                              handleMentorSelect(mentor);
                            }}
                            className="px-4 py-2 hover:bg-purple-50 cursor-pointer transition-colors"
                          >
                            <div className="font-medium text-gray-900">{mentor.mentor_name}</div>
                            <div className="text-sm text-gray-500">Code: {mentor.mentor_code}</div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold"
                >
                  Create Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-gray-900/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Update Record</h2>
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
              {renderFormFields()}
              
              {/* Mentor Name Dropdown for PBL - Edit Modal */}
              {selectedTable === 'pbl' && (
                <div className="mb-4 relative mentor-dropdown-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mentor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.mentor_name || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, mentor_name: value });
                      if (value.length > 0) {
                        fetchMentors();
                        setShowMentorDropdown(true);
                      } else {
                        setShowMentorDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      if ((formData.mentor_name || '').length > 0) {
                        fetchMentors();
                        setShowMentorDropdown(true);
                      }
                    }}
                    placeholder="Start typing mentor name..."
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900"
                    autoComplete="off"
                    required
                  />
                  {showMentorDropdown && mentorList.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {mentorList
                        .filter(mentor => 
                          mentor.mentor_name.toLowerCase().includes((formData.mentor_name || '').toLowerCase())
                        )
                        .map((mentor) => (
                          <div
                            key={mentor.mentor_code}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleMentorSelect(mentor);
                            }}
                            className="px-4 py-2 hover:bg-purple-50 cursor-pointer transition-colors"
                          >
                            <div className="font-medium text-gray-900">{mentor.mentor_name}</div>
                            <div className="text-sm text-gray-500">Code: {mentor.mentor_code}</div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}
              {(selectedTable === 'students' || selectedTable === 'mentors' || selectedTable === 'industrial_mentors') && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Update Password (Leave blank to keep current password)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter new password (optional)"
                      className="w-full px-4 py-2 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold"
                >
                  Update Record
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
    </div>
  );
};

export default SubAdminDashboard;
