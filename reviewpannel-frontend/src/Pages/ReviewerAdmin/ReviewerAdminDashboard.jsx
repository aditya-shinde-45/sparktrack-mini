import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, RefreshCw, Trash2, Edit2, Save, X, SortAsc, SortDesc } from 'lucide-react';

const ReviewerAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pbl2'); // 'pbl2' or 'pbl3'
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedGroup, setSelectedGroup] = useState('');
  const [evaluationData, setEvaluationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(null); // student_id being edited
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // Fetch all groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  // Filter and sort groups when search or sort changes
  useEffect(() => {
    let filtered = groups.filter(group => 
      group.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort groups
    filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.localeCompare(b);
      } else {
        return b.localeCompare(a);
      }
    });

    setFilteredGroups(filtered);
  }, [groups, searchQuery, sortOrder]);

  // Fetch evaluation data when group or tab changes
  useEffect(() => {
    if (selectedGroup) {
      fetchEvaluationData();
    }
  }, [selectedGroup, activeTab]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/reviewer-admin/groups',
        axiosConfig
      );
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      if (error.response?.status === 401) {
        navigate('/reviewer-admin/login');
      }
    }
  };

  const fetchEvaluationData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'pbl2' 
        ? `http://localhost:5000/api/reviewer-admin/pbl2/evaluation/${selectedGroup}`
        : `http://localhost:5000/api/reviewer-admin/pbl3/evaluation/${selectedGroup}`;
      
      const response = await axios.get(endpoint, axiosConfig);
      
      // Map the API response to match frontend expectations
      const data = (response.data.data || []).map(student => ({
        ...student,
        student_id: student.enrollement_no || student.enrollement_no,
        student_name: student.name_of_student || student.student_name
      }));
      
      setEvaluationData(data);
    } catch (error) {
      console.error('Error fetching evaluation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetMarks = async () => {
    if (!selectedGroup) {
      alert('Please select a group first');
      return;
    }

    const confirmReset = window.confirm(
      `Are you sure you want to reset ALL ${activeTab.toUpperCase()} marks for group ${selectedGroup}? This action cannot be undone!`
    );

    if (!confirmReset) return;

    setLoading(true);
    try {
      const endpoint = activeTab === 'pbl2'
        ? `http://localhost:5000/api/reviewer-admin/reset-pbl2/${selectedGroup}`
        : `http://localhost:5000/api/reviewer-admin/reset-pbl3/${selectedGroup}`;

      const response = await axios.post(endpoint, {}, axiosConfig);
      
      if (response.data.success) {
        alert(`Successfully reset ${activeTab.toUpperCase()} marks for group ${selectedGroup}`);
        fetchEvaluationData(); // Refresh data
      }
    } catch (error) {
      console.error('Error resetting marks:', error);
      alert('Failed to reset marks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (student) => {
    setEditMode(student.student_id);
    setEditData({
      m1: student.m1 || '',
      m2: student.m2 || '',
      m3: student.m3 || '',
      m4: student.m4 || '',
      m5: student.m5 || '',
      m6: student.m6 || ''
    });
  };

  const handleEditChange = (field, value) => {
    setEditData({
      ...editData,
      [field]: value
    });
  };

  const handleSaveEdit = async (studentId) => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'pbl2'
        ? 'http://localhost:5000/api/reviewer-admin/edit-pbl2'
        : 'http://localhost:5000/api/reviewer-admin/edit-pbl3';

      const response = await axios.put(
        endpoint,
        {
          groupId: selectedGroup,
          studentId: studentId,
          marks: editData
        },
        axiosConfig
      );

      if (response.data.success) {
        alert('Marks updated successfully');
        setEditMode(null);
        fetchEvaluationData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating marks:', error);
      alert('Failed to update marks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(null);
    setEditData({});
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/reviewer-admin/login');
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      {/* Header with gradient matching theme */}
      <div className="bg-gradient-to-r from-[#7B74EF] to-[#5D3FD3] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                Reviewer Admin Dashboard
              </h1>
              <p className="text-indigo-100 mt-1">Manage PBL2 & PBL3 Evaluations</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl 
                       transition-all duration-200 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tab Selection */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Review Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('pbl2')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                    activeTab === 'pbl2'
                      ? 'bg-gradient-to-r from-[#7B74EF] to-[#5D3FD3] text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  PBL2
                </button>
                <button
                  onClick={() => setActiveTab('pbl3')}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                    activeTab === 'pbl3'
                      ? 'bg-gradient-to-r from-[#7B74EF] to-[#5D3FD3] text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  PBL3
                </button>
              </div>
            </div>

            {/* Group Search & Selection */}
            <div className="lg:col-span-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Group
              </label>
              <div className="space-y-3">
                {/* Search Box */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search groups..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 
                             focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 
                             placeholder-gray-400 bg-white"
                  />
                </div>
                
                {/* Group Dropdown with Sort */}
                <div className="flex gap-2">
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 
                             focus:ring-purple-500 focus:border-transparent transition-all font-medium
                             text-gray-900 bg-white"
                  >
                    <option value="" className="text-gray-900">-- Select Group ({filteredGroups.length}) --</option>
                    {filteredGroups.map((group) => (
                      <option key={group} value={group} className="text-gray-900">
                        {group}
                      </option>
                    ))}
                  </select>
                  
                  {/* Sort Button */}
                  <button
                    onClick={toggleSortOrder}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all 
                             border-2 border-gray-200 flex items-center gap-2"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Reset & Refresh Buttons */}
            <div className="lg:col-span-3 flex flex-col gap-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Actions
              </label>
              <button
                onClick={handleResetMarks}
                disabled={!selectedGroup || loading}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold 
                         transition-all duration-200 ${
                  !selectedGroup || loading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl'
                }`}
              >
                <Trash2 size={18} />
                Reset All
              </button>
              
              <button
                onClick={fetchEvaluationData}
                disabled={!selectedGroup || loading}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold 
                         transition-all duration-200 ${
                  !selectedGroup || loading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Evaluation Data Table */}
        {selectedGroup && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {activeTab.toUpperCase()} Evaluation
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Group: <span className="font-semibold text-purple-600">{selectedGroup}</span> • 
                    <span className="ml-1">{evaluationData.length} student(s)</span>
                  </p>
                </div>
                {evaluationData.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      {evaluationData.filter(s => s.m1 !== null).length} Evaluated
                    </div>
                    <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                      {evaluationData.filter(s => s.m1 === null).length} Pending
                    </div>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading evaluation data...</p>
              </div>
            ) : evaluationData.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="text-gray-400" size={32} />
                </div>
                <p className="text-gray-500 font-medium">No evaluation data found for this group</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        M1
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        M2
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        M3
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        M4
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        M5
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        M6
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {evaluationData.map((student) => (
                      <tr key={student.student_id} className="hover:bg-purple-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {student.student_name}
                        </td>
                        {editMode === student.student_id ? (
                          <>
                            {['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map((field) => (
                              <td key={field} className="px-4 py-4">
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={editData[field]}
                                  onChange={(e) => handleEditChange(field, e.target.value)}
                                  className="w-16 px-2 py-2 border-2 border-purple-300 rounded-lg text-center 
                                           focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold
                                           text-gray-900 bg-white"
                                />
                              </td>
                            ))}
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleSaveEdit(student.student_id)}
                                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
                                  title="Save"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                                  title="Cancel"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map((field) => (
                              <td key={field} className="px-4 py-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-lg font-semibold ${
                                  student[field] !== null && student[field] !== undefined
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {student[field] !== null && student[field] !== undefined
                                    ? student[field]
                                    : '-'}
                                </span>
                              </td>
                            ))}
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleEditClick(student)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7B74EF] to-[#5D3FD3] 
                                         text-white rounded-lg hover:shadow-lg transition-all font-medium"
                              >
                                <Edit2 size={14} />
                                Edit
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewerAdminDashboard;
