import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Common/Header";
import { Database, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "../../api";

const SubAdminDashboard = () => {
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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchUserPermissions = async () => {
      const token = localStorage.getItem("token");
      const storedUserId = localStorage.getItem("user_id");
      const storedName = localStorage.getItem("name");

      if (!token || !storedUserId) {
        navigate("/login");
        return;
      }

      setUserId(storedUserId);
      setUserName(storedName || storedUserId);

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
      fetchTableData();
    }
  }, [selectedTable]);

  const fetchTableData = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const response = await apiRequest(`/api/role-access/${selectedTable}`, 'GET', null, token);

      if (response.success && response.data) {
        setTableData(response.data.records || []);
      } else {
        console.error("Failed to fetch table data");
        setTableData([]);
      }
    } catch (error) {
      console.error("Error fetching table data:", error);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter data based on search query
    if (searchQuery) {
      const filtered = tableData.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
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
  }, [selectedTable]);

  const handleAddRecord = () => {
    setFormData({});
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

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const response = await apiRequest(`/api/role-access/${selectedTable}`, 'POST', formData, token);

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

    // Add password if it's provided and not empty (for students and mentors tables)
    if ((selectedTable === 'students' || selectedTable === 'mentors') && formData.password && formData.password.trim() !== '') {
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
        return ['enrollment_no', 'name_of_students', 'email_id', 'contact', 'class', 'specialization'];
      case 'mentors':
        return ['mentor_code', 'mentor_name', 'contact_number', 'group_id'];
      case 'pbl':
        return ['group_id', 'enrollment_no', 'student_name', 'team_name', 'class', 'is_leader', 'mentor_code'];
      default:
        return [];
    }
  };

  const renderFormFields = () => {
    const fields = getTableColumns();
    return fields.map(field => {
      // Skip auto-generated or ID fields in add modal
      if ((field === 'id' || field === 'mentor_id' || field === 'mentor_code' || (field === 'enrollment_no' && selectedTable === 'pbl')) && showAddModal) return null;
      
      return (
        <div key={field} className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
            {field.replace(/_/g, ' ')}
          </label>
          <input
            type="text"
            value={formData[field] || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900"
            required={field !== 'contact' && field !== 'contact_number' && field !== 'phone' && field !== 'department' && field !== 'specialization' && field !== 'class_prefix' && field !== 'group_id' && field !== 'mentor_code' && field !== 'status' && field !== 'is_leader' && field !== 'ps_id' && field !== 'review1' && field !== 'review2' && field !== 'final'}
          />
        </div>
      );
    });
  };

  const getTableDisplayName = (tableName) => {
    const names = {
      students: "Students",
      pbl: "PBL Groups",
      mentors: "Mentors"
    };
    return names[tableName] || tableName;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Header name={userName} id={userId} />
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (tablePermissions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header name={userName} id={userId} />
        <div className="flex items-center justify-center min-h-screen pt-24">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header name={userName} id={userId} />
      
      <div className="pt-24 px-8 pb-8">
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

        {/* Table Name and Actions */}
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
              <button 
                onClick={handleAddRecord}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium">
                <Plus className="w-5 h-5" />
                Add Record
              </button>
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
                            <button 
                              onClick={() => handleDeleteRecord(row)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
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
              {renderFormFields()}
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
              {(selectedTable === 'students' || selectedTable === 'mentors') && (
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
