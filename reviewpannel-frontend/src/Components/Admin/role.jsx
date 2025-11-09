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
  Lock,
  Unlock,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
  EyeOff,
  UserPlus,
  Key,
  TrendingUp
} from "lucide-react";
import { apiRequest } from "../../api";

const RolePermissionManager = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expandedRoles, setExpandedRoles] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [],
    isActive: true,
    priority: 0,
    users: [] // Add users array
  });

  // Add user credentials state
  const [userCredentials, setUserCredentials] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showAddUser, setShowAddUser] = useState(false);

  // Available permissions categorized
  const permissionCategories = {
    "User Management": [
      { id: "users.view", label: "View Users", description: "View user list and profiles" },
      { id: "users.create", label: "Create Users", description: "Add new users" },
      { id: "users.edit", label: "Edit Users", description: "Modify user information" },
      { id: "users.delete", label: "Delete Users", description: "Remove users from system" },
      { id: "users.manage_roles", label: "Manage User Roles", description: "Assign/remove user roles" }
    ],
    "Student Management": [
      { id: "students.view", label: "View Students", description: "View student profiles" },
      { id: "students.edit", label: "Edit Students", description: "Modify student data" },
      { id: "students.grades", label: "Manage Grades", description: "View and edit grades" },
      { id: "students.reports", label: "Generate Reports", description: "Create student reports" }
    ],
    "Project Management": [
      { id: "projects.view", label: "View Projects", description: "View all projects" },
      { id: "projects.create", label: "Create Projects", description: "Add new projects" },
      { id: "projects.edit", label: "Edit Projects", description: "Modify project details" },
      { id: "projects.delete", label: "Delete Projects", description: "Remove projects" },
      { id: "projects.assign", label: "Assign Projects", description: "Assign projects to students" },
      { id: "projects.review", label: "Review Projects", description: "Review and grade projects" }
    ],
    "Mentor Management": [
      { id: "mentors.view", label: "View Mentors", description: "View mentor list" },
      { id: "mentors.create", label: "Create Mentors", description: "Add new mentors" },
      { id: "mentors.edit", label: "Edit Mentors", description: "Modify mentor data" },
      { id: "mentors.delete", label: "Delete Mentors", description: "Remove mentors" },
      { id: "mentors.assign", label: "Assign Groups", description: "Assign student groups to mentors" }
    ],
    "External Evaluators": [
      { id: "externals.view", label: "View Externals", description: "View external evaluators" },
      { id: "externals.create", label: "Create Externals", description: "Add external evaluators" },
      { id: "externals.edit", label: "Edit Externals", description: "Modify external data" },
      { id: "externals.delete", label: "Delete Externals", description: "Remove externals" }
    ],
    "System Settings": [
      { id: "settings.view", label: "View Settings", description: "View system settings" },
      { id: "settings.edit", label: "Edit Settings", description: "Modify system configuration" },
      { id: "deadlines.manage", label: "Manage Deadlines", description: "Set and modify deadlines" },
      { id: "notifications.send", label: "Send Notifications", description: "Send system notifications" }
    ],
    "Reports & Analytics": [
      { id: "reports.view", label: "View Reports", description: "Access all reports" },
      { id: "reports.export", label: "Export Reports", description: "Export data and reports" },
      { id: "analytics.view", label: "View Analytics", description: "Access analytics dashboard" }
    ],
    "Role Management": [
      { id: "roles.view", label: "View Roles", description: "View all roles" },
      { id: "roles.create", label: "Create Roles", description: "Create new roles" },
      { id: "roles.edit", label: "Edit Roles", description: "Modify roles" },
      { id: "roles.delete", label: "Delete Roles", description: "Remove roles" }
    ]
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      // Replace with actual API endpoint
      const response = await apiRequest("/api/roles", "GET");
      setRoles(response.data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      // Mock data for demonstration
      setRoles([
        {
          id: 1,
          name: "Super Admin",
          description: "Full system access with all permissions",
          permissions: Object.values(permissionCategories).flat().map(p => p.id),
          isActive: true,
          priority: 100,
          userCount: 2,
          createdAt: "2024-01-15"
        },
        {
          id: 2,
          name: "Project Coordinator",
          description: "Manages projects and student assignments",
          permissions: ["projects.view", "projects.create", "projects.edit", "projects.assign", "students.view"],
          isActive: true,
          priority: 50,
          userCount: 5,
          createdAt: "2024-02-01"
        },
        {
          id: 3,
          name: "Mentor",
          description: "Reviews and grades assigned projects",
          permissions: ["projects.view", "projects.review", "students.view", "students.grades"],
          isActive: true,
          priority: 30,
          userCount: 15,
          createdAt: "2024-02-10"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      // Replace with actual API call
      const newRole = {
        ...formData,
        id: Date.now(),
        userCount: 0,
        createdAt: new Date().toISOString()
      };
      setRoles([...roles, newRole]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Error creating role:", error);
    }
  };

  const handleUpdateRole = async () => {
    try {
      // Replace with actual API call
      setRoles(roles.map(role => 
        role.id === selectedRole.id 
          ? { ...role, ...formData }
          : role
      ));
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        // Replace with actual API call
        setRoles(roles.filter(role => role.id !== roleId));
      } catch (error) {
        console.error("Error deleting role:", error);
      }
    }
  };

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const selectAllInCategory = (category) => {
    const categoryPermissions = permissionCategories[category].map(p => p.id);
    const allSelected = categoryPermissions.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !categoryPermissions.includes(p))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...categoryPermissions])]
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: [],
      isActive: true,
      priority: 0,
      users: []
    });
    setUserCredentials({
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    });
    setShowAddUser(false);
    setSelectedRole(null);
  };

  const handleAddUser = () => {
    if (!userCredentials.username || !userCredentials.email || !userCredentials.password) {
      alert("Please fill all user fields");
      return;
    }
    if (userCredentials.password !== userCredentials.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setFormData(prev => ({
      ...prev,
      users: [...prev.users, {
        id: Date.now(),
        username: userCredentials.username,
        email: userCredentials.email,
        createdAt: new Date().toISOString()
      }]
    }));

    setUserCredentials({
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    });
    setShowAddUser(false);
  };

  const removeUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== userId)
    }));
  };

  const openEditModal = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive,
      priority: role.priority
    });
    setShowEditModal(true);
  };

  const toggleRoleExpansion = (roleId) => {
    setExpandedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const getPermissionLabel = (permissionId) => {
    for (const category of Object.values(permissionCategories)) {
      const perm = category.find(p => p.id === permissionId);
      if (perm) return perm.label;
    }
    return permissionId;
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || 
                         (filterType === "active" && role.isActive) ||
                         (filterType === "inactive" && !role.isActive);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-600" />
              Role & Permission Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create roles and assign permissions to control system access
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create New Role
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Roles</p>
                <p className="text-2xl font-bold text-green-600">
                  {roles.filter(r => r.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">
                  {roles.reduce((sum, role) => sum + role.userCount, 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Permission Sets</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Object.keys(permissionCategories).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Key className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setFilterType("active")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "active"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterType("inactive")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === "inactive"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {filteredRoles.map(role => (
          <div
            key={role.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{role.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      role.isActive 
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {role.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      Priority: {role.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{role.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {role.userCount} users
                    </span>
                    <span className="flex items-center gap-1">
                      <Key className="w-4 h-4" />
                      {role.permissions.length} permissions
                    </span>
                    <span>
                      Created: {new Date(role.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRoleExpansion(role.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {expandedRoles.includes(role.id) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(role)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Expanded Permissions */}
              {expandedRoles.includes(role.id) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Assigned Permissions:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {role.permissions.map(perm => (
                      <div
                        key={perm}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg text-sm"
                      >
                        <Check className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700">{getPermissionLabel(perm)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredRoles.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Roles Found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal - Redesigned as Pop-up */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              resetForm();
            }}
          ></div>
          
          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-fadeIn">
            {/* Header - Gradient with theme colors */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
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
                        ? "Define a new role with custom permissions" 
                        : "Modify role settings and permissions"}
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

            {/* Content - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
              <div className="space-y-6">
                {/* Step 1: Role Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">1</div>
                    <h3 className="text-lg font-bold text-gray-900">Role Information</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Shield className="w-4 h-4 text-purple-600" />
                        Role Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                        placeholder="e.g., Project Coordinator, Faculty Member"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Settings className="w-4 h-4 text-purple-600" />
                        Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                        rows="2"
                        placeholder="Brief description of this role..."
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Quick Permission Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">2</div>
                    <h3 className="text-lg font-bold text-gray-900">Select Permissions</h3>
                  </div>
                  
                  {/* Quick selection buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {Object.keys(permissionCategories).map(category => {
                      const categoryPerms = permissionCategories[category].map(p => p.id);
                      const isSelected = categoryPerms.every(p => formData.permissions.includes(p));
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => selectAllInCategory(category)}
                          className={`p-3 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <Lock className="w-4 h-4 mx-auto mb-1" />
                          {category.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-sm text-purple-800">
                      <strong>{formData.permissions.length}</strong> of {Object.values(permissionCategories).flat().length} permissions selected
                    </p>
                  </div>
                </div>

                {/* Step 3: Add Users */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">3</div>
                      <h3 className="text-lg font-bold text-gray-900">Assign Users (Optional)</h3>
                    </div>
                    {!showAddUser && (
                      <button
                        type="button"
                        onClick={() => setShowAddUser(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add User
                      </button>
                    )}
                  </div>

                  {showAddUser && (
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Username *"
                          value={userCredentials.username}
                          onChange={(e) => setUserCredentials({ ...userCredentials, username: e.target.value })}
                          className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                        <input
                          type="email"
                          placeholder="Email *"
                          value={userCredentials.email}
                          onChange={(e) => setUserCredentials({ ...userCredentials, email: e.target.value })}
                          className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                        <input
                          type="password"
                          placeholder="Password *"
                          value={userCredentials.password}
                          onChange={(e) => setUserCredentials({ ...userCredentials, password: e.target.value })}
                          className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                        <input
                          type="password"
                          placeholder="Confirm Password *"
                          value={userCredentials.confirmPassword}
                          onChange={(e) => setUserCredentials({ ...userCredentials, confirmPassword: e.target.value })}
                          className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddUser(false);
                            setUserCredentials({ username: "", email: "", password: "", confirmPassword: "" });
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddUser}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Add User
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Users List */}
                  {formData.users.length > 0 && (
                    <div className="space-y-2">
                      {formData.users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{user.username}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.users.length === 0 && !showAddUser && (
                    <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No users assigned yet</p>
                      <p className="text-xs text-gray-500 mt-1">You can add users now or later</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="border-t-2 border-gray-200 bg-gray-50 p-6">
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
                    disabled={!formData.name || !formData.description || formData.permissions.length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
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
