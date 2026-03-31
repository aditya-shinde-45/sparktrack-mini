import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Common/Header";
import MarksTable from "../../Components/Admin/MarksTable";
import Pagination from "../../Components/Admin/Pagination";
import MentorEditGroupManager from "../../Components/Admin/MentorEditGroupManager";
import { Database, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Download, Filter, X, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown, BarChart3, User, Shield, Mail } from "lucide-react";
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
  const [evaluationSearchInput, setEvaluationSearchInput] = useState("");
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  const [evaluationCurrentPage, setEvaluationCurrentPage] = useState(1);
  const [evaluationTotalPages, setEvaluationTotalPages] = useState(1);
  const [evaluationTotalRecords, setEvaluationTotalRecords] = useState(0);
  const [evaluationSortBy, setEvaluationSortBy] = useState("group_id");
  const [evaluationSortOrder, setEvaluationSortOrder] = useState("asc");
  const [evaluationRowsPerPage] = useState(50);
  const [evaluationSavingRowKey, setEvaluationSavingRowKey] = useState(null);
  const [evaluationSaveMessage, setEvaluationSaveMessage] = useState("");
  const [evaluationDirtyRowKeys, setEvaluationDirtyRowKeys] = useState(new Set());
  const [groupPrefixInput, setGroupPrefixInput] = useState("");
  const [groupPrefixFilter, setGroupPrefixFilter] = useState("");
  const [teacherClassFilter, setTeacherClassFilter] = useState('ALL');
  const [resetGroupIdInput, setResetGroupIdInput] = useState("");
  const [teacherStatusLoading, setTeacherStatusLoading] = useState(false);
  const [teacherStatusError, setTeacherStatusError] = useState("");
  const [teachersCompleteMarks, setTeachersCompleteMarks] = useState([]);
  const [teachersPartialMarks, setTeachersPartialMarks] = useState([]);
  const [teachersNotGivenMarks, setTeachersNotGivenMarks] = useState([]);
  const [teacherReminderSubject, setTeacherReminderSubject] = useState("");
  const [teacherReminderMessage, setTeacherReminderMessage] = useState("");
  const [teacherReminderLoading, setTeacherReminderLoading] = useState(false);
  const [teacherSummary, setTeacherSummary] = useState({
    totalTeachers: 0,
    teachersFullyGiven: 0,
    teachersPartiallyGiven: 0,
    teachersWithSubmissions: 0,
    teachersWithoutSubmissions: 0,
  });
  const [expandedTeacherKey, setExpandedTeacherKey] = useState(null);
  const [evaluationCanScrollLeft, setEvaluationCanScrollLeft] = useState(false);
  const [evaluationCanScrollRight, setEvaluationCanScrollRight] = useState(false);
  const [evaluationTopRailWidth, setEvaluationTopRailWidth] = useState(0);
  const [mentorEditEnabledGroups, setMentorEditEnabledGroups] = useState([]);
  const [togglingGroupId, setTogglingGroupId] = useState(null);
  const [toast, setToast] = useState({ type: "info", message: "", visible: false });
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: "Confirm",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    tone: "default"
  });
  const confirmResolverRef = React.useRef(null);
  const dataTablesTabsRef = React.useRef(null);
  const evaluationTableScrollRef = React.useRef(null);
  const evaluationTopRailRef = React.useRef(null);
  const evaluationScrollSyncLockRef = React.useRef(false);



  const evaluationComputedTotal = React.useMemo(() => {
    return evaluationFormFields.reduce((sum, field) => sum + (Number(field.max_marks) || 0), 0);
  }, [evaluationFormFields]);

  const showToast = React.useCallback((type, message, duration = 3000) => {
    if (!message) return;
    setToast({ type, message, visible: true });
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  const requestConfirm = React.useCallback((options = {}) => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmModal({
        visible: true,
        title: options.title || "Confirm",
        message: options.message || "",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        tone: options.tone || "default"
      });
    });
  }, []);

  const closeConfirm = React.useCallback((result) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }
    setConfirmModal((prev) => ({ ...prev, visible: false }));
  }, []);

  const canEditEvaluationMarks = React.useMemo(() => {
    return tablePermissions.includes('evaluation_form_submission');
  }, [tablePermissions]);

  const getEvaluationRowKey = React.useCallback((student) => {
    return `${student.submission_id}:${student.enrollment_no || student.enrollement_no || ""}`;
  }, []);

  const isMainAdminUser = React.useMemo(() => {
    return String(localStorage.getItem("isMainAdmin") || "").toLowerCase() === "true";
  }, []);

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

  const evaluationGroupOptions = React.useMemo(() => {
    const unique = new Set();
    (evaluationSubmissions || []).forEach((row) => {
      if (row?.group_id) {
        unique.add(String(row.group_id));
      }
    });
    return Array.from(unique).sort();
  }, [evaluationSubmissions]);

  const sortedEvaluationSubmissionsWithUniqueGroups = React.useMemo(() => {
    const groupMap = new Map();
    sortedEvaluationSubmissions.forEach((student) => {
      const groupId = student.group_id;
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, []);
      }
      groupMap.get(groupId).push(student);
    });
    
    const result = [];
    groupMap.forEach((students, groupId) => {
      students.forEach((student, index) => {
        result.push({
          ...student,
          _isFirstInGroup: index === 0,
          _groupRowSpan: students.length
        });
      });
    });
    
    return result;
  }, [sortedEvaluationSubmissions]);

  const normalizeEvaluationFieldType = React.useCallback((field) => {
    return field?.type || (Number(field?.max_marks) === 0 ? "boolean" : "number");
  }, []);

  const clampEvaluationNumberByField = React.useCallback((field, value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return "";
    const min = 0;
    const max = Number(field?.max_marks) || 0;
    if (parsed < min) return min;
    if (parsed > max) return max;
    return parsed;
  }, []);

  const calculateEvaluationTotalFromMarks = React.useCallback((marks) => {
    return evaluationFormFields.reduce((sum, field) => {
      if (normalizeEvaluationFieldType(field) !== "number") return sum;
      return sum + (Number(marks?.[field.key]) || 0);
    }, 0);
  }, [evaluationFormFields, normalizeEvaluationFieldType]);

  const updateEvaluationScrollState = React.useCallback(() => {
    const node = evaluationTableScrollRef.current;
    if (!node) {
      setEvaluationCanScrollLeft(false);
      setEvaluationCanScrollRight(false);
      setEvaluationTopRailWidth(0);
      return;
    }

    const maxScrollLeft = Math.max(0, node.scrollWidth - node.clientWidth);
    setEvaluationCanScrollLeft(node.scrollLeft > 4);
    setEvaluationCanScrollRight(node.scrollLeft < maxScrollLeft - 4);
    setEvaluationTopRailWidth(node.scrollWidth || 0);
  }, []);

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

  const fetchEvaluationSubmissions = async (formId, page, search = "", groupPrefix = "") => {
    if (!formId) return;
    const token = localStorage.getItem("token");
    setEvaluationLoading(true);
    setEvaluationError("");

    try {
      const url = `/api/role-access/evaluation_form_submission?formId=${formId}&page=${page}&limit=${evaluationRowsPerPage}&search=${encodeURIComponent(search)}&groupPrefix=${encodeURIComponent(groupPrefix)}`;
      const response = await apiRequest(url, 'GET', null, token);

      if (response?.success && response.data) {
        const payload = response.data;
        const submissionsData = payload.data || [];
        const paginationInfo = payload.pagination || {};

        const incomingFields = Array.isArray(payload.form?.fields) ? payload.form.fields : [];
        const sortedFields = [...incomingFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setEvaluationFormFields(sortedFields);
        setEvaluationFormTotal(payload.form?.total_marks || 0);
        setMentorEditEnabledGroups(Array.isArray(payload.form?.mentor_edit_enabled_groups) ? payload.form.mentor_edit_enabled_groups : []);
        setEvaluationTotalPages(paginationInfo.totalPages || 1);
        setEvaluationTotalRecords(paginationInfo.totalRecords || 0);
        setEvaluationError("");
        setEvaluationSaveMessage("");
        setEvaluationDirtyRowKeys(new Set());
        setEvaluationSubmissions(submissionsData);
        return;
      }

      setEvaluationSaveMessage("");
      setEvaluationDirtyRowKeys(new Set());
      setEvaluationSubmissions([]);
      setEvaluationTotalPages(1);
      setEvaluationTotalRecords(0);
    } catch (error) {
      console.error("Error fetching evaluation submissions:", error);
      setEvaluationSaveMessage("");
      setEvaluationDirtyRowKeys(new Set());
      setEvaluationSubmissions([]);
      setEvaluationError("Failed to load evaluation submissions.");
    } finally {
      setEvaluationLoading(false);
    }
  };

  const fetchTeacherSubmissionStatus = async (formId, groupPrefix = "", classFilter = 'ALL') => {
    if (!formId) {
      setTeachersCompleteMarks([]);
      setTeachersPartialMarks([]);
      setTeachersNotGivenMarks([]);
      setTeacherSummary({ totalTeachers: 0, teachersFullyGiven: 0, teachersPartiallyGiven: 0, teachersWithSubmissions: 0, teachersWithoutSubmissions: 0 });
      return;
    }

    const token = localStorage.getItem("token");
    setTeacherStatusLoading(true);
    setTeacherStatusError("");

    try {
      const url = `/api/role-access/evaluation_form_submission?formId=${formId}&teachersStatus=1&groupPrefix=${encodeURIComponent(groupPrefix)}&classFilter=${encodeURIComponent(classFilter)}`;
      const response = await apiRequest(url, 'GET', null, token);

      if (response?.success && response.data) {
        setTeachersCompleteMarks(response.data.completeMarks || response.data.gaveMarks || []);
        setTeachersPartialMarks(response.data.partialMarks || []);
        setTeachersNotGivenMarks(response.data.notGivenMarks || []);
        setTeacherSummary(response.data.summary || { totalTeachers: 0, teachersFullyGiven: 0, teachersPartiallyGiven: 0, teachersWithSubmissions: 0, teachersWithoutSubmissions: 0 });
      } else {
        setTeachersCompleteMarks([]);
        setTeachersPartialMarks([]);
        setTeachersNotGivenMarks([]);
        setTeacherSummary({ totalTeachers: 0, teachersFullyGiven: 0, teachersPartiallyGiven: 0, teachersWithSubmissions: 0, teachersWithoutSubmissions: 0 });
        setTeacherStatusError(response?.message || 'Failed to load teacher submission status.');
      }
    } catch (error) {
      console.error("Error fetching teacher submission status:", error);
      setTeachersCompleteMarks([]);
      setTeachersPartialMarks([]);
      setTeachersNotGivenMarks([]);
      setTeacherSummary({ totalTeachers: 0, teachersFullyGiven: 0, teachersPartiallyGiven: 0, teachersWithSubmissions: 0, teachersWithoutSubmissions: 0 });
      setTeacherStatusError('Failed to load teacher submission status.');
    } finally {
      setTeacherStatusLoading(false);
    }
  };

  // ── Secure CSV export: fetch with Authorization header, trigger blob download ──
  const handleExportCSV = async () => {
    if (!selectedEvaluationFormId) {
      showToast("warning", "Please select an evaluation form before exporting.");
      return;
    }
    const token = localStorage.getItem("token");
    const apiBase =
      import.meta.env.MODE === "development"
        ? import.meta.env.VITE_API_BASE_URL
        : import.meta.env.VITE_API_BASE_URL_PROD;

    const params = new URLSearchParams();
    params.append("formId", selectedEvaluationFormId);
    if (groupPrefixFilter.trim()) params.append("groupPrefix", groupPrefixFilter.trim());

    try {
      const response = await fetch(`${apiBase}/api/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Export failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = groupPrefixFilter.trim()
        ? `evaluations_${groupPrefixFilter.trim()}.csv`
        : "evaluations_all.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error:", err);
      showToast("error", `Export failed: ${err.message || "Please try again."}`);
    }
  };

  const handleSendTeacherReminderEmails = async () => {
    if (!selectedEvaluationFormId) {
      showToast("warning", "Please select an evaluation form first.");
      return;
    }

    const targetTeachers = (teachersPartialMarks?.length || 0) + (teachersNotGivenMarks?.length || 0);
    if (targetTeachers === 0) {
      showToast("info", "No pending teachers found for the selected filters.");
      return;
    }

    const confirmed = await requestConfirm({
      title: "Send Reminder Emails",
      message: `Send reminder emails to ${targetTeachers} teacher(s)? This will include each teacher's pending groups in the email body.`,
      confirmText: "Send",
      cancelText: "Cancel",
      tone: "info"
    });
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    setTeacherReminderLoading(true);

    try {
      const response = await apiRequest(
        '/api/role-access/evaluation_form_submission/teacher-reminder',
        'POST',
        {
          formId: selectedEvaluationFormId,
          groupPrefix: groupPrefixFilter,
          classFilter: teacherClassFilter,
          subject: teacherReminderSubject.trim() || undefined,
          message: teacherReminderMessage.trim() || undefined,
        },
        token,
        false,
        120000
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to send teacher reminder emails.');
      }

      const data = response?.data || {};
      const sent = Number(data.sentCount || 0);
      const failed = Number(data.failedCount || 0);
      const skipped = Number(data.skippedCount || 0);

      showToast("success", `Teacher reminders completed. Sent: ${sent}, Failed: ${failed}, Skipped: ${skipped}.`, 6000);
    } catch (error) {
      console.error('Teacher reminder email error:', error);
      showToast("error", `Failed to send teacher reminders: ${error?.message || 'Please try again.'}`);
    } finally {
      setTeacherReminderLoading(false);
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
    setEvaluationSearchInput('');
    setGroupPrefixInput('');
    setGroupPrefixFilter('');
  }, [selectedTable]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setEvaluationSearchQuery(evaluationSearchInput.trim());
    }, 350);

    return () => window.clearTimeout(handle);
  }, [evaluationSearchInput]);

  useEffect(() => {
    if (selectedTable === 'evaluation_form_submission') {
      if (selectedEvaluationFormId) {
        fetchEvaluationSubmissions(selectedEvaluationFormId, evaluationCurrentPage, evaluationSearchQuery, groupPrefixFilter);
        fetchTeacherSubmissionStatus(selectedEvaluationFormId, groupPrefixFilter, teacherClassFilter);
      } else {
        setEvaluationSubmissions([]);
        setEvaluationTotalRecords(0);
        setTeachersCompleteMarks([]);
        setTeachersPartialMarks([]);
        setTeachersNotGivenMarks([]);
        setTeacherSummary({ totalTeachers: 0, teachersFullyGiven: 0, teachersPartiallyGiven: 0, teachersWithSubmissions: 0, teachersWithoutSubmissions: 0 });
      }
    }
  }, [selectedTable, selectedEvaluationFormId, evaluationCurrentPage, evaluationSearchQuery, groupPrefixFilter, teacherClassFilter]);

  useEffect(() => {
    setExpandedTeacherKey(null);
  }, [selectedEvaluationFormId, teacherClassFilter, groupPrefixFilter]);

  useEffect(() => {
    if (selectedTable !== 'evaluation_form_submission') return;
    const node = evaluationTableScrollRef.current;
    if (node) {
      node.scrollLeft = 0;
    }
    updateEvaluationScrollState();
  }, [selectedTable, selectedEvaluationFormId, evaluationCurrentPage, groupPrefixFilter, evaluationSearchQuery, updateEvaluationScrollState]);

  useEffect(() => {
    if (selectedTable !== 'evaluation_form_submission') return;
    const node = evaluationTableScrollRef.current;
    const topNode = evaluationTopRailRef.current;
    if (!node || !topNode) return;

    const handleTableScroll = () => {
      if (evaluationScrollSyncLockRef.current) return;
      evaluationScrollSyncLockRef.current = true;
      topNode.scrollLeft = node.scrollLeft;
      updateEvaluationScrollState();
      requestAnimationFrame(() => {
        evaluationScrollSyncLockRef.current = false;
      });
    };

    const handleTopRailScroll = () => {
      if (evaluationScrollSyncLockRef.current) return;
      evaluationScrollSyncLockRef.current = true;
      node.scrollLeft = topNode.scrollLeft;
      updateEvaluationScrollState();
      requestAnimationFrame(() => {
        evaluationScrollSyncLockRef.current = false;
      });
    };

    const handleResize = () => updateEvaluationScrollState();

    handleTableScroll();
    node.addEventListener('scroll', handleTableScroll, { passive: true });
    topNode.addEventListener('scroll', handleTopRailScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      node.removeEventListener('scroll', handleTableScroll);
      topNode.removeEventListener('scroll', handleTopRailScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedTable, selectedEvaluationFormId, evaluationSubmissions, updateEvaluationScrollState]);

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
        showToast("warning", "You can add up to 4 students per group.");
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
    const confirmed = await requestConfirm({
      title: "Delete Record",
      message: "Are you sure you want to delete this record?",
      confirmText: "Delete",
      cancelText: "Cancel",
      tone: "danger"
    });
    if (!confirmed) return;

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
        showToast("success", "Record deleted successfully!");
        fetchTableData(); // Refresh data
      } else {
        showToast("error", `Failed to delete record: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      showToast("error", "Error deleting record. Please try again.");
    }
  };

  const handleDeleteEvaluationGroup = async (groupId) => {
    if (!selectedEvaluationFormId || !groupId) return;

    const confirmed = await requestConfirm({
      title: "Delete Evaluation Marks",
      message: `Delete evaluation marks for group ${groupId}?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      tone: "danger"
    });
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    try {
      const response = await apiRequest(
        `/api/role-access/evaluation_form_submission/${groupId}?formId=${selectedEvaluationFormId}`,
        'DELETE',
        null,
        token
      );

      if (response.success) {
        showToast("success", "Evaluation marks deleted successfully!");
        fetchEvaluationSubmissions(selectedEvaluationFormId, evaluationCurrentPage, evaluationSearchQuery, groupPrefixFilter);
      } else {
        showToast("error", `Failed to delete marks: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting evaluation marks:", error);
      showToast("error", "Error deleting evaluation marks. Please try again.");
    }
  };

  const handleEvaluationFormMarkChange = React.useCallback((student, field, value) => {
    if (!canEditEvaluationMarks) return;

    const enrollmentNo = student.enrollment_no || student.enrollement_no;
    if (!enrollmentNo) return;

    const fieldType = normalizeEvaluationFieldType(field);
    const nextValue = fieldType === "number"
      ? (value === "" ? "" : clampEvaluationNumberByField(field, value))
      : (fieldType === "boolean" ? Boolean(value) : value);

    setEvaluationSubmissions((prev) => prev.map((row) => {
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
        total: calculateEvaluationTotalFromMarks(updatedMarks)
      };
    }));

    const rowKey = getEvaluationRowKey(student);
    setEvaluationDirtyRowKeys((prev) => {
      const next = new Set(prev);
      next.add(rowKey);
      return next;
    });
  }, [canEditEvaluationMarks, normalizeEvaluationFieldType, clampEvaluationNumberByField, calculateEvaluationTotalFromMarks, getEvaluationRowKey]);

  const handleSaveEvaluationFormRow = React.useCallback(async (student) => {
    if (!canEditEvaluationMarks || !selectedEvaluationFormId) return;

    const enrollmentNo = student.enrollment_no || student.enrollement_no;
    if (!student.submission_id || !enrollmentNo) {
      showToast("error", "Missing submission/student identifier, cannot save marks.");
      return;
    }

    setEvaluationSaveMessage("");
    const rowKey = `${student.submission_id}:${enrollmentNo}`;
    setEvaluationSavingRowKey(rowKey);

    try {
      const token = localStorage.getItem("token");
      const response = await apiRequest(
        `/api/admin/evaluation-forms/${selectedEvaluationFormId}/submissions/${student.submission_id}/students/${encodeURIComponent(enrollmentNo)}`,
        'PUT',
        { marks: student.marks || {} },
        token
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to update marks');
      }

      const updatedRow = response.data || {};

      setEvaluationSubmissions((prev) => prev.map((row) => {
        const rowEnrollment = row.enrollment_no || row.enrollement_no;
        if (row.submission_id !== student.submission_id || rowEnrollment !== enrollmentNo) {
          return row;
        }
        return {
          ...row,
          ...updatedRow
        };
      }));

      setEvaluationDirtyRowKeys((prev) => {
        const next = new Set(prev);
        next.delete(rowKey);
        return next;
      });

      setEvaluationSaveMessage(`Saved marks for ${updatedRow.student_name || student.student_name || enrollmentNo}`);
    } catch (error) {
      showToast("error", error?.message || 'Failed to save marks');
    } finally {
      setEvaluationSavingRowKey(null);
    }
  }, [canEditEvaluationMarks, selectedEvaluationFormId]);

  const handleToggleMentorEditForGroup = async (groupId) => {
    console.log('🎯 handleToggleMentorEditForGroup called with:', groupId);
    
    if (!selectedEvaluationFormId) {
      showToast("warning", "Please select an evaluation form first.");
      return;
    }

    if (!canEditEvaluationMarks) {
      showToast("warning", "You don't have permission to toggle mentor edit settings.");
      return;
    }

    if (!groupId) {
      showToast("warning", "Group ID is required.");
      return;
    }

    const isCurrentlyEnabled = mentorEditEnabledGroups.includes(groupId);
    const newState = !isCurrentlyEnabled;
    
    console.log('📊 Toggle state:', { groupId, isCurrentlyEnabled, newState });
    
    const confirmMessage = newState
      ? `Enable mentor editing for group ${groupId}? The mentor assigned to this group will be able to edit marks.`
      : `Disable mentor editing for group ${groupId}? The mentor will no longer be able to edit marks.`;

    const confirmed = await requestConfirm({
      title: newState ? "Enable Mentor Editing" : "Disable Mentor Editing",
      message: confirmMessage,
      confirmText: newState ? "Enable" : "Disable",
      cancelText: "Cancel",
      tone: newState ? "info" : "warning"
    });
    if (!confirmed) {
      console.log('❌ User cancelled toggle');
      return;
    }

    setTogglingGroupId(groupId);

    try {
      const token = localStorage.getItem("token");
      const url = `/api/admin/evaluation-forms/${selectedEvaluationFormId}/toggle-mentor-edit`;
      const method = 'PATCH';
      const body = { groupId: groupId, enabled: newState };
      
      console.log('🚀 Making API request:');
      console.log('  URL:', url);
      console.log('  Method:', method);
      console.log('  Body:', body);
      console.log('  Has Token:', !!token);
      
      const response = await apiRequest(url, method, body, token);
      
      console.log('📥 API Response:', response);

      if (response?.success) {
        setMentorEditEnabledGroups(response.data.mentor_edit_enabled_groups || []);
        showToast("success", `Mentor editing ${newState ? 'enabled' : 'disabled'} for group ${groupId}.`);
        console.log('✅ Toggle successful');
      } else {
        throw new Error(response?.message || 'Failed to toggle mentor edit permission');
      }
    } catch (error) {
      console.error("❌ Error toggling mentor edit:", error);
      showToast("error", `Failed to toggle mentor edit: ${error?.message || 'Please try again.'}`);
    } finally {
      setTogglingGroupId(null);
    }
  };

  const handleResetEvaluationGroup = async () => {
    const groupId = resetGroupIdInput.trim();

    if (!selectedEvaluationFormId) {
      showToast("warning", "Please select an evaluation form first.");
      return;
    }

    if (!groupId) {
      showToast("warning", "Please enter a Group ID to reset.");
      return;
    }

    const confirmed = await requestConfirm({
      title: "Reset Evaluation Submission",
      message: `Reset evaluation submission for group ${groupId}? This action cannot be undone.`,
      confirmText: "Reset",
      cancelText: "Cancel",
      tone: "danger"
    });
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    try {
      const response = await apiRequest(
        `/api/role-access/evaluation_form_submission/${encodeURIComponent(groupId)}?formId=${selectedEvaluationFormId}`,
        'DELETE',
        null,
        token
      );

      if (response.success) {
        showToast("success", `Evaluation submission reset for group ${groupId}.`);
        setResetGroupIdInput("");
        fetchEvaluationSubmissions(selectedEvaluationFormId, evaluationCurrentPage, evaluationSearchQuery, groupPrefixFilter);
      } else {
        showToast("error", `Failed to reset submission: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error resetting evaluation submission:", error);
      showToast("error", "Error resetting evaluation submission. Please try again.");
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
          showToast("warning", "Group ID is required.");
          return;
        }
        if (selectedStudents.length === 0) {
          showToast("warning", "Select at least one student for this group.");
          return;
        }
        if (!dataToSubmit.mentor_code) {
          showToast("warning", "Select a mentor for this group.");
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
          showToast("error", `Failed to create record: ${failed.message || "Unknown error"}`);
          return;
        }

        showToast("success", "Records created successfully!");
        setShowAddModal(false);
        setFormData({});
        setSelectedStudents([]);
        fetchTableData();
        return;
      }

      const response = await apiRequest(`/api/role-access/${selectedTable}`, 'POST', dataToSubmit, token);

      if (response.success) {
        showToast("success", "Record created successfully!");
        setShowAddModal(false);
        setFormData({});
        fetchTableData(); // Refresh data
      } else {
        showToast("error", `Failed to create record: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating record:", error);
      showToast("error", "Error creating record. Please try again.");
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
        showToast("success", "Record updated successfully!");
      } else {
        showToast("error", `Failed to update record: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating record:", error);
      showToast("error", "Error updating record. Please try again.");
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">
            {field.replace(/_/g, ' ')}
            {isReadOnly && field === 'mentor_name' && <span className="text-xs text-gray-400 ml-1.5">(from mentors table)</span>}
          </label>
          <input
            type="text"
            value={formData[field] || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
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

  const formatCellValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Object]';
      }
    }

    return String(value);
  };

  const scrollDataTableTabs = (direction) => {
    const node = dataTablesTabsRef.current;
    if (!node) return;
    const delta = direction === 'left' ? -220 : 220;
    node.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const scrollEvaluationTable = (direction) => {
    const node = evaluationTableScrollRef.current;
    if (!node) return;
    const delta = direction === 'left' ? -320 : 320;
    node.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className={embedded ? "w-full flex items-center justify-center" : "min-h-screen bg-gray-50 flex items-center justify-center"}>
        {!embedded && <Header name={userName} id={userId} />}
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (tablePermissions.length === 0) {
    return (
      <div className={embedded ? "w-full" : "min-h-screen bg-gray-50"}>
        {!embedded && <Header name={userName} id={userId} />}
        <div className={embedded ? "flex items-center justify-center min-h-[50vh]" : "flex items-center justify-center min-h-screen pt-24"}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Database className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No Access Granted</h3>
            <p className="text-sm text-gray-500">
              You don't have permission to access any tables. Please contact the administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "w-full" : "min-h-screen bg-gray-50"}>
      {!embedded && <Header name={userName} id={userId} />}

      {toast.visible && (
        <div className="fixed top-6 right-6 z-50">
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm max-w-sm ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : toast.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : toast.type === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <div className="flex-1">
              <p className="font-semibold capitalize">{toast.type}</p>
              <p className="mt-0.5 text-xs leading-relaxed">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
              className="text-xs font-semibold px-2 py-1 rounded-md border border-transparent hover:border-current"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {confirmModal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">{confirmModal.title}</h3>
              {confirmModal.message && (
                <p className="mt-1 text-sm text-slate-600">{confirmModal.message}</p>
              )}
            </div>
            <div className="px-5 py-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                {confirmModal.cancelText}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold text-white ${
                  confirmModal.tone === "danger"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : confirmModal.tone === "warning"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : confirmModal.tone === "info"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={embedded ? "px-4 py-4" : "w-full max-w-[1800px] mx-auto px-6 lg:px-10 pt-[88px] pb-12 space-y-5"}>

        {/* ── Compact Header Card ──────────────────────────── */}
        {!embedded && (
          <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{userName}</h1>
                  <p className="text-sm text-gray-500">Admin Portal · Manage students, mentors, PBL and evaluations</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Sub-Admin
                </span>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                  {(userName || "A").charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Table Tabs ──────────────────────────────────────── */}
        {tablePermissions.length > 0 && (
          <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Data Tables</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollDataTableTabs('left')}
                  className="p-1.5 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-100"
                  title="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollDataTableTabs('right')}
                  className="p-1.5 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-100"
                  title="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div
              ref={dataTablesTabsRef}
              className="overflow-x-auto overflow-y-hidden pb-1"
              onWheel={(e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
            >
              <div className="flex flex-nowrap gap-2 min-w-max">
              {tablePermissions.map(table => (
                <button
                  key={table}
                  onClick={() => {
                    setSelectedTable(table);
                    localStorage.setItem("selectedTable", table);
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedTable === table
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {table === "evaluation_form_submission" ? <FileSpreadsheet className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                  {getTableDisplayName(table)}
                </button>
              ))}
              </div>
            </div>
          </div>
        )}

        {selectedTable === 'evaluation_form_submission' ? (
          <div className="flex flex-col gap-4 md:gap-5 mb-6">

            {/* ── Section Header + Form Selector ───────────────────── */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-4 md:gap-5">
                {/* Left: title + form select */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Evaluation Form Submissions</h2>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${canEditEvaluationMarks ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${canEditEvaluationMarks ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {canEditEvaluationMarks ? 'Edit Enabled' : 'View Only'}
                    </span>
                    {canEditEvaluationMarks && evaluationDirtyRowKeys.size > 0 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                        Unsaved Rows: {evaluationDirtyRowKeys.size}
                      </span>
                    )}
                    {canEditEvaluationMarks && selectedEvaluationFormId && mentorEditEnabledGroups.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>{mentorEditEnabledGroups.length} group{mentorEditEnabledGroups.length !== 1 ? 's' : ''} can edit</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">View, filter, and export evaluation results</p>
                  {canEditEvaluationMarks && (
                    <p className="text-xs text-emerald-700 mb-3">Edit marks directly in cells, then click Save on the row. Scroll horizontally to reach the Save column.</p>
                  )}
                  <div className="relative max-w-full md:max-w-sm">
                    <FileSpreadsheet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      value={selectedEvaluationFormId}
                      onChange={(e) => { setSelectedEvaluationFormId(e.target.value); setEvaluationCurrentPage(1); }}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer transition-all"
                    >
                      <option value="">— Select a form —</option>
                      {evaluationForms.map((form) => (
                        <option key={form.id} value={form.id}>{form.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Right: stats + export */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-2 md:gap-3 items-stretch xl:justify-end">
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-center min-w-[80px]">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Records</p>
                    <p className="text-lg md:text-xl font-semibold text-gray-900 mt-0.5">{evaluationTotalRecords.toLocaleString()}</p>
                  </div>
                  {evaluationTotalPages > 1 && (
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-center min-w-[80px]">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pages</p>
                      <p className="text-lg md:text-xl font-semibold text-gray-900 mt-0.5">{evaluationTotalPages}</p>
                    </div>
                  )}
                  <button
                    onClick={handleExportCSV}
                    disabled={!selectedEvaluationFormId}
                    className="col-span-2 sm:col-span-1 xl:col-span-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 text-sm whitespace-nowrap"
                    title={!selectedEvaluationFormId ? 'Select a form first to export' : 'Download filtered data as CSV'}
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>

              {isMainAdminUser && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4 overflow-visible">
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 xl:items-end">
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">Reset Group Submission</p>
                      <p className="text-xs text-amber-700">This action resets only the exact Group ID in the currently selected form.</p>
                    </div>
                    <div className="w-full xl:w-[560px] flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Enter exact Group ID"
                        value={resetGroupIdInput}
                        onChange={(e) => setResetGroupIdInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleResetEvaluationGroup(); }}
                        className="min-w-0 flex-1 px-3 py-2.5 border border-amber-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                      />
                      <button
                        onClick={handleResetEvaluationGroup}
                        disabled={!selectedEvaluationFormId || !resetGroupIdInput.trim()}
                        className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                        title={!selectedEvaluationFormId ? 'Select a form first' : 'Reset only this group submission'}
                      >
                        Reset Group
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Active filter chips */}
              {(evaluationTotalRecords > 0 || groupPrefixFilter) && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                  {evaluationTotalRecords > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      {evaluationTotalRecords.toLocaleString()} records
                    </span>
                  )}
                  {groupPrefixFilter && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                      <Filter className="w-3 h-3" />
                      {groupPrefixFilter}*
                      <button onClick={() => { setGroupPrefixInput(''); setGroupPrefixFilter(''); setEvaluationCurrentPage(1); }} className="ml-0.5 hover:text-purple-900 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {canEditEvaluationMarks && (
              <MentorEditGroupManager
                canEdit={canEditEvaluationMarks}
                selectedFormId={selectedEvaluationFormId}
                enabledGroups={mentorEditEnabledGroups}
                groupOptions={evaluationGroupOptions}
                onToggleGroup={handleToggleMentorEditForGroup}
                togglingGroupId={togglingGroupId}
              />
            )}

            {/* ── Teacher Submission Status ───────────────────────── */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-5 order-last">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Teacher Marks Status</h3>
                  <p className="text-xs text-gray-500">Based on mentor-wise assigned groups for selected evaluation form</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 w-full sm:w-auto">
                  <select
                    value={teacherClassFilter}
                    onChange={(e) => setTeacherClassFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs font-semibold border border-gray-300 rounded-full text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    title="Filter teacher status by class/year"
                  >
                    <option value="ALL">All Classes</option>
                    <option value="FY">FY</option>
                    <option value="SY">SY</option>
                    <option value="TY">TY</option>
                    <option value="LY">LY</option>
                  </select>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    Total Teachers: {teacherSummary.totalTeachers}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    Complete: {teacherSummary.teachersFullyGiven || 0}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                    Partial: {teacherSummary.teachersPartiallyGiven || 0}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
                    Not Given: {teacherSummary.teachersWithoutSubmissions}
                  </span>
                </div>
              </div>

              {isMainAdminUser && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 md:p-4">
                <div className="flex flex-col xl:flex-row gap-3 xl:items-end">
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="text-xs font-semibold text-blue-900">Reminder Subject (optional)</label>
                      <input
                        type="text"
                        value={teacherReminderSubject}
                        onChange={(e) => setTeacherReminderSubject(e.target.value)}
                        placeholder="Reminder: Please submit pending evaluation marks"
                        className="mt-1 w-full px-3 py-2 border border-blue-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-blue-900">Reminder Body (optional)</label>
                      <textarea
                        value={teacherReminderMessage}
                        onChange={(e) => setTeacherReminderMessage(e.target.value)}
                        placeholder={"Dear {{mentor_name}} ({{mentor_code}}),\n\nPlease submit marks for pending groups in {{form_title}}.\n\nPending groups:\n{{pending_groups}}\n\nRegards,\nSparkTrack Admin"}
                        className="mt-1 w-full px-3 py-2 border border-blue-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[96px]"
                        maxLength={5000}
                      />
                      <p className="mt-1 text-[11px] text-blue-800">
                        Supported placeholders: {'{{mentor_name}}'}, {'{{mentor_code}}'}, {'{{pending_groups}}'}, {'{{pending_count}}'}, {'{{form_title}}'}, {'{{form_id}}'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full xl:w-auto flex xl:flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleSendTeacherReminderEmails}
                      disabled={teacherReminderLoading || !selectedEvaluationFormId || ((teachersPartialMarks?.length || 0) + (teachersNotGivenMarks?.length || 0) === 0)}
                      className="w-full xl:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold"
                    >
                      <Mail className="w-4 h-4" />
                      {teacherReminderLoading ? 'Sending…' : 'Send Reminder To Pending Teachers'}
                    </button>
                    <p className="text-[11px] text-blue-900 leading-relaxed">
                      Target teachers: {(teachersPartialMarks?.length || 0) + (teachersNotGivenMarks?.length || 0)}
                    </p>
                  </div>
                </div>
              </div>
              )}

              {teacherStatusLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">Loading teacher status…</div>
              ) : teacherStatusError ? (
                <div className="py-3 px-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">{teacherStatusError}</div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-emerald-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200">
                      <p className="text-sm font-semibold text-emerald-800">Teachers Who Completed All Marks</p>
                    </div>
                    <div className="max-h-72 overflow-auto">
                      {teachersCompleteMarks.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-500">No teachers found.</p>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {teachersCompleteMarks.map((teacher) => (
                            (() => {
                              const itemKey = `complete-${teacher.mentor_code}`;
                              const isExpanded = expandedTeacherKey === itemKey;
                              const pendingGroups = Array.isArray(teacher.pending_group_ids) ? teacher.pending_group_ids : [];
                              return (
                                <li key={itemKey} className="px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedTeacherKey(isExpanded ? null : itemKey)}
                                    className="w-full text-left"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-semibold text-gray-900">{teacher.mentor_name} ({teacher.mentor_code})</p>
                                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{teacher.submitted_groups}/{teacher.total_groups}</span>
                                    </div>
                                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                      <div
                                        className="h-full bg-emerald-500"
                                        style={{ width: `${teacher.total_groups > 0 ? Math.min(100, Math.round((teacher.submitted_groups / teacher.total_groups) * 100)) : 0}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Submitted groups: {teacher.submitted_groups} / {teacher.total_groups} · Click to view pending groups</p>
                                  </button>
                                  {isExpanded && (
                                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2.5">
                                      <p className="text-xs font-semibold text-amber-800 mb-1">Groups with marks not filled:</p>
                                      {pendingGroups.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                          {pendingGroups.map((groupId) => (
                                            <span key={`${itemKey}-${groupId}`} className="px-2 py-0.5 rounded-full bg-white border border-amber-200 text-xs text-amber-800 font-medium">
                                              {groupId}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-emerald-700">All assigned groups are filled.</p>
                                      )}
                                    </div>
                                  )}
                                </li>
                              );
                            })()
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-amber-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200">
                      <p className="text-sm font-semibold text-amber-800">Teachers Who Gave Marks Partially</p>
                    </div>
                    <div className="max-h-72 overflow-auto">
                      {teachersPartialMarks.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-500">No teachers found.</p>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {teachersPartialMarks.map((teacher) => (
                            (() => {
                              const itemKey = `partial-${teacher.mentor_code}`;
                              const isExpanded = expandedTeacherKey === itemKey;
                              const pendingGroups = Array.isArray(teacher.pending_group_ids) ? teacher.pending_group_ids : [];
                              return (
                                <li key={itemKey} className="px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedTeacherKey(isExpanded ? null : itemKey)}
                                    className="w-full text-left"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-semibold text-gray-900">{teacher.mentor_name} ({teacher.mentor_code})</p>
                                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{teacher.submitted_groups}/{teacher.total_groups}</span>
                                    </div>
                                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                      <div
                                        className="h-full bg-amber-500"
                                        style={{ width: `${teacher.total_groups > 0 ? Math.min(100, Math.round((teacher.submitted_groups / teacher.total_groups) * 100)) : 0}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Submitted groups: {teacher.submitted_groups} / {teacher.total_groups} · Click to view pending groups</p>
                                  </button>
                                  {isExpanded && (
                                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2.5">
                                      <p className="text-xs font-semibold text-amber-800 mb-1">Groups with marks not filled:</p>
                                      {pendingGroups.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                          {pendingGroups.map((groupId) => (
                                            <span key={`${itemKey}-${groupId}`} className="px-2 py-0.5 rounded-full bg-white border border-amber-200 text-xs text-amber-800 font-medium">
                                              {groupId}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-emerald-700">All assigned groups are filled.</p>
                                      )}
                                    </div>
                                  )}
                                </li>
                              );
                            })()
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-rose-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-200">
                      <p className="text-sm font-semibold text-rose-800">Teachers Who Have Not Given Marks</p>
                    </div>
                    <div className="max-h-72 overflow-auto">
                      {teachersNotGivenMarks.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-500">No teachers found.</p>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {teachersNotGivenMarks.map((teacher) => (
                            (() => {
                              const itemKey = `pending-${teacher.mentor_code}`;
                              const isExpanded = expandedTeacherKey === itemKey;
                              const pendingGroups = Array.isArray(teacher.pending_group_ids) ? teacher.pending_group_ids : [];
                              return (
                                <li key={itemKey} className="px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedTeacherKey(isExpanded ? null : itemKey)}
                                    className="w-full text-left"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-semibold text-gray-900">{teacher.mentor_name} ({teacher.mentor_code})</p>
                                      <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">{teacher.pending_groups}/{teacher.total_groups}</span>
                                    </div>
                                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                      <div
                                        className="h-full bg-rose-500"
                                        style={{ width: `${teacher.total_groups > 0 ? Math.min(100, Math.round((teacher.pending_groups / teacher.total_groups) * 100)) : 0}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Pending groups: {teacher.pending_groups} / {teacher.total_groups} · Click to view pending groups</p>
                                  </button>
                                  {isExpanded && (
                                    <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2.5">
                                      <p className="text-xs font-semibold text-rose-800 mb-1">Groups with marks not filled:</p>
                                      {pendingGroups.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                          {pendingGroups.map((groupId) => (
                                            <span key={`${itemKey}-${groupId}`} className="px-2 py-0.5 rounded-full bg-white border border-rose-200 text-xs text-rose-800 font-medium">
                                              {groupId}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-600">No pending groups found.</p>
                                      )}
                                    </div>
                                  )}
                                </li>
                              );
                            })()
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Toolbar: Prefix Filter • Search • Sort ─────── */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-5">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 md:gap-4 items-end">

                {/* Group prefix filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Group ID Prefix</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="e.g. LYAIA1"
                        value={groupPrefixInput}
                        onChange={(e) => setGroupPrefixInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setGroupPrefixFilter(groupPrefixInput.trim()); setEvaluationCurrentPage(1); } }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                      {groupPrefixInput && (
                        <button onClick={() => setGroupPrefixInput('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => { setGroupPrefixFilter(groupPrefixInput.trim()); setEvaluationCurrentPage(1); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all duration-200 text-sm whitespace-nowrap"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Apply
                    </button>
                    {groupPrefixFilter && (
                      <button
                        onClick={() => { setGroupPrefixInput(''); setGroupPrefixFilter(''); setEvaluationCurrentPage(1); }}
                        className="p-2 border border-gray-300 hover:bg-red-50 hover:border-red-300 text-gray-500 hover:text-red-600 rounded-lg transition-all text-sm"
                        title="Clear prefix filter"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Full-text search */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1"><Search className="w-3.5 h-3.5" /> Search Records</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Group ID, Enrollment No or Student Name…"
                        value={evaluationSearchInput}
                        onChange={(e) => { setEvaluationSearchInput(e.target.value); setEvaluationCurrentPage(1); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEvaluationSearchQuery(evaluationSearchInput.trim());
                            setEvaluationCurrentPage(1);
                          }
                        }}
                        className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                      {evaluationSearchInput && (
                        <button
                          type="button"
                          onClick={() => { setEvaluationSearchInput(''); setEvaluationSearchQuery(''); setEvaluationCurrentPage(1); }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          title="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setEvaluationSearchQuery(evaluationSearchInput.trim()); setEvaluationCurrentPage(1); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all duration-200 text-sm whitespace-nowrap"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Apply
                    </button>
                  </div>
                </div>

                {/* Sort controls */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1"><ArrowUpDown className="w-3.5 h-3.5" /> Sort</label>
                  <div className="flex gap-2">
                    <select
                      value={evaluationSortBy}
                      onChange={(e) => setEvaluationSortBy(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    >
                      <option value="group_id">Group ID</option>
                      <option value="enrollment_no">Enrollment No</option>
                      <option value="student_name">Student Name</option>
                      <option value="total">Total Marks</option>
                      <option value="external_name">External</option>
                    </select>
                    <button
                      onClick={() => setEvaluationSortOrder(evaluationSortOrder === "asc" ? "desc" : "asc")}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-100 text-gray-600 rounded-lg transition-all text-sm font-medium"
                      title={evaluationSortOrder === "asc" ? "Currently ascending" : "Currently descending"}
                    >
                      {evaluationSortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      {evaluationSortOrder === "asc" ? "ASC" : "DESC"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Active filter chips */}
              {(groupPrefixFilter || evaluationSearchQuery) && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 font-medium">Active:</span>
                  {groupPrefixFilter && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                      <Filter className="w-3 h-3" />
                      {groupPrefixFilter}*
                      <button onClick={() => { setGroupPrefixInput(''); setGroupPrefixFilter(''); setEvaluationCurrentPage(1); }} className="ml-0.5 hover:text-purple-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {evaluationSearchQuery && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                      <Search className="w-3 h-3" />
                      "{evaluationSearchQuery}"
                      <button onClick={() => { setEvaluationSearchInput(''); setEvaluationSearchQuery(''); setEvaluationCurrentPage(1); }} className="ml-0.5 hover:text-purple-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── Loading state ──────────────────────────────────────── */}
            {evaluationLoading && (
              <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-14 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading submissions…</p>
              </div>
            )}

            {/* ── Error state ────────────────────────────────────────── */}
            {evaluationError && !evaluationLoading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <X className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{evaluationError}</p>
              </div>
            )}

            {evaluationSaveMessage && !evaluationLoading && !evaluationError && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-700 font-medium">{evaluationSaveMessage}</p>
              </div>
            )}

            {/* ── Data Table ─────────────────────────────────────────── */}
            {!evaluationLoading && !evaluationError && evaluationTotalRecords > 0 && (
              <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-600 font-medium">Horizontal navigation</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[11px] text-gray-500 font-medium">
                      Shift + Mouse Wheel
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => scrollEvaluationTable('left')}
                      disabled={!evaluationCanScrollLeft}
                      className="p-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Scroll table left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollEvaluationTable('right')}
                      disabled={!evaluationCanScrollRight}
                      className="p-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Scroll table right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-2 border-b border-gray-100 bg-white">
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
                      Quick Scroll Rail
                    </span>
                    <div
                      ref={evaluationTopRailRef}
                      className="flex-1 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
                      aria-label="Top horizontal scrollbar"
                    >
                      <div
                        style={{ width: `${Math.max(evaluationTopRailWidth, 1)}px` }}
                        className="h-2 rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
                      />
                    </div>
                  </div>
                </div>
                <div className="relative">
                  {evaluationCanScrollLeft && (
                    <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-20" />
                  )}
                  {evaluationCanScrollRight && (
                    <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-20" />
                  )}
                  <MarksTable
                    students={sortedEvaluationSubmissionsWithUniqueGroups}
                    loading={evaluationLoading}
                    error={evaluationError}
                    reviewType="form"
                    formFields={evaluationFormFields}
                    totalMarks={evaluationFormTotal || evaluationComputedTotal}
                    onDeleteGroup={isMainAdminUser ? handleDeleteEvaluationGroup : undefined}
                    editableFormMarks={canEditEvaluationMarks}
                    onFormMarkChange={handleEvaluationFormMarkChange}
                    onSaveFormRow={handleSaveEvaluationFormRow}
                    savingRowKey={evaluationSavingRowKey}
                    dirtyRowKeys={evaluationDirtyRowKeys}
                    scrollContainerRef={evaluationTableScrollRef}
                    enableWheelHorizontal
                    mentorEditEnabledGroups={mentorEditEnabledGroups}
                    onToggleMentorEditForGroup={canEditEvaluationMarks ? handleToggleMentorEditForGroup : undefined}
                    togglingGroupId={togglingGroupId}
                  />
                </div>
                {/* Pagination bar */}
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{((evaluationCurrentPage - 1) * evaluationRowsPerPage) + 1}</span>–
                    <span className="font-medium text-gray-900">{Math.min(evaluationCurrentPage * evaluationRowsPerPage, evaluationTotalRecords)}</span>{" "}
                    of <span className="font-medium text-gray-900">{evaluationTotalRecords.toLocaleString()}</span> entries
                  </p>
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

            {/* ── Empty state ────────────────────────────────────────── */}
            {!evaluationLoading && !evaluationError && evaluationTotalRecords === 0 && (
              <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-14 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">No submissions found</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {!selectedEvaluationFormId
                      ? "Select an evaluation form above to get started."
                      : groupPrefixFilter || evaluationSearchQuery
                        ? "No records match your current filters."
                        : "This evaluation form has no submissions yet."}
                  </p>
                </div>
                {(groupPrefixFilter || evaluationSearchQuery) && (
                  <button
                    onClick={() => { setGroupPrefixInput(''); setGroupPrefixFilter(''); setEvaluationSearchQuery(''); setEvaluationCurrentPage(1); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-gray-100 hover:bg-purple-100 rounded-lg transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

            {/* ── Card header ─────────────────────────────────── */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Database className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{getTableDisplayName(selectedTable)}</h2>
                    <p className="text-xs text-gray-500">Manage {getTableDisplayName(selectedTable).toLowerCase()} records</p>
                  </div>
                </div>
                {selectedTable !== "industrial_mentors" && (
                  <button
                    onClick={handleAddRecord}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm transition-all duration-200 hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    Add Record
                  </button>
                )}
              </div>
            </div>

            {/* ── Search + record count toolbar ───────────────── */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={`Search ${getTableDisplayName(selectedTable)}…`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium px-3 py-2 bg-white border border-gray-200 rounded-lg shrink-0">
                  <Database className="w-4 h-4 text-purple-500" />
                  {filteredData.length.toLocaleString()} record{filteredData.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* ── Table ───────────────────────────────────────── */}
            <div className="w-full overflow-x-auto bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-600 to-purple-500">
                      {getTableColumns().map(col => (
                        <th key={col} className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide">
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(() => {
                      const startIndex = (currentPage - 1) * recordsPerPage;
                      const endIndex = startIndex + recordsPerPage;
                      const currentRecords = filteredData.slice(startIndex, endIndex);
                      
                      return currentRecords.length > 0 ? (
                        currentRecords.map((row, index) => (
                        <tr
                          key={row.id || row.enrollment_no || row.mentor_code || index}
                          className="hover:bg-gray-50 transition-all duration-200"
                        >
                          {getTableColumns().map(col => (
                            <td key={col} className="px-4 py-3 text-center">
                              <span className={`text-sm ${ (row[col] === null || row[col] === undefined || row[col] === '') ? "text-gray-400" : "text-gray-700" }`}>
                                {formatCellValue(row[col])}
                              </span>
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditRecord(row)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-all duration-200"
                                title="Edit record"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {selectedTable !== "industrial_mentors" && (
                                <button
                                  onClick={() => handleDeleteRecord(row)}
                                  className="bg-red-50 text-red-600 hover:bg-red-100 rounded-md px-3 py-1 text-sm transition-all duration-200"
                                  title="Delete record"
                                >
                                  Delete
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

            {/* Pagination */}
            {filteredData.length > recordsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-900">{((currentPage - 1) * recordsPerPage) + 1}</span>–
                  <span className="font-medium text-gray-900">{Math.min(currentPage * recordsPerPage, filteredData.length)}</span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-900">{filteredData.length.toLocaleString()}</span>{" "}
                  entries
                </p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredData.length / recordsPerPage)}
                  setCurrentPage={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  totalItems={filteredData.length}
                  rowsPerPage={recordsPerPage}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Add {getTableDisplayName(selectedTable)}</h2>
                  <p className="text-xs text-gray-500">Fill in the details below</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
            <form onSubmit={handleSubmitAdd}>
              {selectedTable === 'pbl' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Group ID *
                    </label>
                    <input
                      type="text"
                      value={formData.group_id || ''}
                      onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                      placeholder="Enter group ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
                              className="w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700"
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
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              autoComplete="off"
                            />
                    </div>
                    {showStudentDropdown && studentList.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    autoComplete="off"
                    required
                  />
                  {showMentorDropdown && mentorList.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                            className="px-4 py-2.5 hover:bg-purple-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0">
                            <div className="text-sm font-medium text-gray-900">{mentor.mentor_name}</div>
                            <div className="text-xs text-gray-500">Code: {mentor.mentor_code}</div>
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
                  className="flex-1 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-all duration-200 hover:scale-[1.02]"
                >
                  Create Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Edit className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Update {getTableDisplayName(selectedTable)}</h2>
                  <p className="text-xs text-gray-500">Edit the record details below</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
            <form onSubmit={handleSubmitEdit}>
              {renderFormFields()}
              
              {/* Mentor Name Dropdown for PBL - Edit Modal */}
              {selectedTable === 'pbl' && (
                <div className="mb-4 relative mentor-dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    autoComplete="off"
                    required
                  />
                  {showMentorDropdown && mentorList.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                            className="px-4 py-2.5 hover:bg-purple-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="text-sm font-medium text-gray-900">{mentor.mentor_name}</div>
                            <div className="text-xs text-gray-500">Code: {mentor.mentor_code}</div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}
              {(selectedTable === 'students' || selectedTable === 'mentors' || selectedTable === 'industrial_mentors') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Update Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter new password (optional)"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
                  className="flex-1 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-all duration-200 hover:scale-[1.02]"
                >
                  Update Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAdminDashboard;
