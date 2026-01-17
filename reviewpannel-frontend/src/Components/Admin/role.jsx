import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Check,
  AlertCircle,
  Search,
  Database,
  Eye,
  EyeOff
} from "lucide-react";
import { apiRequest } from "../../api";

const RolePermissionManager = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    userId: "",
    password: "",
    confirmPassword: "",
    tablePermissions: []
  });

  const [errors, setErrors] = useState({});

  // Available table permissions
  const availableTables = [
    { id: "students", label: "Students Table", description: "Manage student records and data", icon: Users },
    { id: "pbl", label: "PBL Table", description: "Manage PBL groups and projects", icon: Database },
    { id: "mentors", label: "Mentors Table", description: "Manage mentor information", icon: Shield }
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await apiRequest("/api/roles", "GET", null, token);
      
      if (response.success) {
        // Transform snake_case to camelCase
        const transformedRoles = (response.data || []).map(role => ({
          id: role.id,
          userId: role.user_id,
          tablePermissions: role.table_permissions || [],
          isActive: role.is_active,
          createdAt: role.created_at,
          lastLogin: role.last_login
        }));
        setRoles(transformedRoles);
      } else {
        console.error("Failed to fetch roles:", response.message);
        setRoles([]);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userId.trim()) {
      newErrors.userId = "User ID is required";
    } else if (formData.userId.length < 4) {
      newErrors.userId = "User ID must be at least 4 characters";
    }

    if (!showEditModal) {
      // Password is required for create
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    } else {
      // For edit, password is optional but must be valid if provided
      if (formData.password) {
        if (formData.password.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        }
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
      }
    }

    if (formData.tablePermissions.length === 0) {
      newErrors.tablePermissions = "Select at least one table permission";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateRole = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await apiRequest(
        "/api/roles",
        "POST",
        {
          userId: formData.userId,
          password: formData.password,
          tablePermissions: formData.tablePermissions
        },
        token
      );

      if (response.success) {
        // Refresh the roles list
        await fetchRoles();
        setShowCreateModal(false);
        resetForm();
        alert("Role created successfully!");
      } else {
        alert(response.message || "Failed to create role");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      alert("Failed to create role. Please try again.");
    }
  };

  const handleUpdateRole = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem("token");
      const updateData = {
        userId: formData.userId,
        tablePermissions: formData.tablePermissions
      };

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await apiRequest(
        `/api/roles/${selectedRole.id}`,
        "PUT",
        updateData,
        token
      );

      if (response.success) {
        // Refresh the roles list
        await fetchRoles();
        setShowEditModal(false);
        resetForm();
        alert("Role updated successfully!");
      } else {
        alert(response.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role. Please try again.");
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
      try {
        const token = localStorage.getItem("token");
        const response = await apiRequest(
          `/api/roles/${roleId}`,
          "DELETE",
          null,
          token
        );

        if (response.success) {
          // Refresh the roles list
          await fetchRoles();
          alert("Role deleted successfully!");
        } else {
          alert(response.message || "Failed to delete role");
        }
      } catch (error) {
        console.error("Error deleting role:", error);
        alert("Failed to delete role. Please try again.");
      }
    }
  };

  const toggleTablePermission = (tableId) => {
    setFormData(prev => ({
      ...prev,
      tablePermissions: prev.tablePermissions.includes(tableId)
        ? prev.tablePermissions.filter(p => p !== tableId)
        : [...prev.tablePermissions, tableId]
    }));
    setErrors(prev => ({ ...prev, tablePermissions: undefined }));
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      password: "",
      confirmPassword: "",
      tablePermissions: []
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSelectedRole(null);
  };

  const openEditModal = (role) => {
    setSelectedRole(role);
    setFormData({
      userId: role.userId,
      password: "",
      confirmPassword: "",
      tablePermissions: role.tablePermissions
    });
    setShowEditModal(true);
  };

  const getTableLabel = (tableId) => {
    const table = availableTables.find(t => t.id === tableId);
    return table ? table.label : tableId;
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.userId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                Role Management
              </h1>
              <p className="text-gray-600 text-lg ml-1">
                Create and manage user roles with table permissions
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create New Role
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by User ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-gray-900 placeholder:text-gray-400 bg-white"
            />
          </div>
        </div>

        {/* Roles Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-purple-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">User ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Table Permissions</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Created Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Last Login</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRoles.map((role, index) => (
                  <tr 
                    key={role.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="font-semibold text-gray-900">{role.userId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {role.tablePermissions.map(tableId => (
                          <span
                            key={tableId}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium"
                          >
                            <Database className="w-4 h-4" />
                            {getTableLabel(tableId)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">
                        {new Date(role.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {role.lastLogin ? (
                        <span className="text-gray-600">
                          {new Date(role.lastLogin).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(role)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Role"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Role"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRoles.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <AlertCircle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Roles Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? "No roles match your search criteria" 
                    : "Get started by creating your first role"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Role
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              resetForm();
            }}
          ></div>
          
          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {showCreateModal ? "Create New Role" : "Edit Role"}
                    </h2>
                    <p className="text-purple-100 text-sm mt-1">
                      {showCreateModal 
                        ? "Assign table permissions to new user" 
                        : "Update user table permissions"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* User ID */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  User ID *
                </label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => {
                    setFormData({ ...formData, userId: e.target.value });
                    setErrors({ ...errors, userId: undefined });
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
                    errors.userId 
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                  }`}
                  placeholder="e.g., coordinator001, mentor_admin"
                />
                {errors.userId && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.userId}
                  </p>
                )}
              </div>

              {/* Password Fields - Only for Create */}
              {showCreateModal && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          setErrors({ ...errors, password: undefined });
                        }}
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-all text-gray-900 placeholder:text-gray-400 bg-white ${
                          errors.password 
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                            : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                        }`}
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, confirmPassword: e.target.value });
                          setErrors({ ...errors, confirmPassword: undefined });
                        }}
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-all text-gray-900 placeholder:text-gray-400 bg-white ${
                          errors.confirmPassword 
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                            : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                        }`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Password Fields - Optional for Edit */}
              {showEditModal && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      New Password (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          setErrors({ ...errors, password: undefined });
                        }}
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-all text-gray-900 placeholder:text-gray-400 bg-white ${
                          errors.password 
                            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                            : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                        }`}
                        placeholder="Leave blank to keep current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {formData.password && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Shield className="w-4 h-4 text-purple-600" />
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => {
                            setFormData({ ...formData, confirmPassword: e.target.value });
                            setErrors({ ...errors, confirmPassword: undefined });
                          }}
                          className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-all text-gray-900 placeholder:text-gray-400 bg-white ${
                            errors.confirmPassword 
                              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                              : 'border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                          }`}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Table Permissions */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <Database className="w-4 h-4 text-purple-600" />
                  Table Permissions *
                </label>
                <div className="space-y-3">
                  {availableTables.map((table) => {
                    const Icon = table.icon;
                    const isSelected = formData.tablePermissions.includes(table.id);
                    return (
                      <div
                        key={table.id}
                        onClick={() => toggleTablePermission(table.id)}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isSelected ? 'bg-purple-600' : 'bg-gray-200'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              isSelected ? 'text-white' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold ${
                              isSelected ? 'text-purple-900' : 'text-gray-900'
                            }`}>
                              {table.label}
                            </h4>
                            <p className="text-sm text-gray-600">{table.description}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-purple-600 bg-purple-600'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.tablePermissions && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.tablePermissions}
                  </p>
                )}
              </div>

              {/* Selected Count */}
              {formData.tablePermissions.length > 0 && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <p className="text-sm text-purple-800 font-medium">
                    <Check className="w-4 h-4 inline mr-1" />
                    {formData.tablePermissions.length} table{formData.tablePermissions.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 bg-gray-50 p-6 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>* Required fields</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={showCreateModal ? handleCreateRole : handleUpdateRole}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {showCreateModal ? "Create Role" : "Update Role"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolePermissionManager;
