import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import Sidebar from "../../Components/Student/sidebar";
import Header from "../../Components/Student/Header";
import { 
  AlertCircle, 
  Check, 
  X, 
  FileText, 
  Users, 
  BookOpen, 
  Lightbulb, 
  Target, 
  Code, 
  Globe, 
  Layers,
  Edit3,
  Trash2,
  Save,
  RefreshCw
} from "lucide-react";

const ProblemStatementForm = ({ groupId, groupName, existing, onSubmit, onDelete }) => {
  const [form, setForm] = useState(
    existing || {
      title: '',
      type: '',
      technologyBucket: '',
      domain: '',
      description: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || '',
        type: existing.type || '',
        technologyBucket: existing.technologyBucket || existing.technology_bucket || existing.technologybucket || '',
        domain: existing.domain || '',
        description: existing.description || '',
      });
    }
  }, [existing]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const endpoint = existing
      ? `/api/students/student/problem-statement/${groupId}`
      : `/api/students/student/problem-statement`;
    const method = existing ? 'PUT' : 'POST';
    const body = { group_id: groupId, ...form };
    const token = localStorage.getItem('student_token');
    const res = await apiRequest(endpoint, method, body, token);
    setLoading(false);
    
    // Check for deadline block error
    if (res.success === false && res.status === 403 && res.message?.includes('disabled')) {
      setMessage('This task has been closed by the administrator. Submissions are no longer accepted.');
      setMessageType('error');
      return;
    }
    
    if (res.success !== false) {
      setMessage(res.message || (existing ? 'Problem statement updated successfully!' : 'Problem statement submitted successfully!'));
      setMessageType('success');
      const updatedStatement = res?.data?.problemStatement || res?.problemStatement || form;
      if (onSubmit) onSubmit(updatedStatement);
    } else {
      setMessage(res.message || 'An error occurred. Please try again.');
      setMessageType('error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this problem statement?')) return;
    setLoading(true);
    setMessage('');
    const token = localStorage.getItem('student_token');
    const res = await apiRequest(`/api/students/student/problem-statement/${groupId}`, 'DELETE', null, token);
    setLoading(false);
    
    // Check for deadline block error
    if (res.success === false && res.status === 403 && res.message?.includes('disabled')) {
      setMessage('This task has been closed by the administrator. Modifications are no longer allowed.');
      setMessageType('error');
      return;
    }
    
    if (res.success !== false) {
      setMessage(res.message || 'Problem statement deleted successfully!');
      setMessageType('success');
      if (onDelete) onDelete();
    } else {
      setMessage(res.message || 'Failed to delete problem statement.');
      setMessageType('error');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Form Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {existing ? 'Edit' : 'Submit'} Problem Statement
            </h2>
            <p className="text-gray-600 text-sm">Define your project scope and objectives</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Title Field */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            Project Title *
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-gray-800 bg-white"
            placeholder="Enter your project title"
          />
        </div>

        {/* Grid Layout for Secondary Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
              <Target className="w-5 h-5 text-blue-600" />
              Type
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-gray-800 bg-white"
            >
              <option value="">Select Type</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
              <Code className="w-5 h-5 text-green-600" />
              Technology Bucket
            </label>
            <input
              name="technologyBucket"
              value={form.technologyBucket}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-gray-800 bg-white"
              placeholder="e.g., AI/ML, IoT"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
              <Globe className="w-5 h-5 text-orange-600" />
              Domain
            </label>
            <input
              name="domain"
              value={form.domain}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-gray-800 bg-white"
              placeholder="e.g., Healthcare"
            />
          </div>
        </div>

        {/* Description Field */}
        <div>
          <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Problem Description *
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-gray-800 bg-white resize-vertical"
            placeholder="Describe your problem statement in detail..."
          />
          <p className="text-gray-500 text-sm mt-2">
            Provide a clear and concise description of the problem you aim to solve
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
            messageType === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            {messageType === 'success' ? (
              <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            )}
            <span className={`font-medium ${
              messageType === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          {existing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                {existing ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {existing ? 'Update' : 'Submit'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

const ProblemStatementSih = () => {
  const [student, setStudent] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [existingPS, setExistingPS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('student_token');
    if (!token) {
      setLoading(false);
      setError("No authentication token found. Please login again.");
      return;
    }

    const fetchStudentData = async () => {
      try {
        // Get student profile
        const profileRes = await apiRequest('/api/student-auth/profile', 'GET', null, token);
        const profileData = profileRes?.data?.profile || profileRes?.profile;

        if (!profileData) {
          setLoading(false);
          setError("Could not retrieve student profile.");
          return;
        }
        
        setStudent(profileData);
        const enrollmentNo = profileData.enrollment_no || profileData.enrollement_no;
        
        // Fetch group details from pbl table
        try {
          const groupRes = await apiRequest(
            `/api/students/student/group-details/${enrollmentNo}`, 
            "GET", 
            null, 
            token
          );
          
          const group = groupRes?.data?.group || groupRes?.group;
          
          if (group && group.group_id) {
            setGroupData(group);
            
            // Fetch existing problem statement
            try {
              const psRes = await apiRequest(
                `/api/students/student/problem-statement/${group.group_id}`, 
                'GET', 
                null, 
                token
              );
              const statement = psRes?.data?.problemStatement || psRes?.problemStatement;
              if (statement) {
                setExistingPS(statement);
              }
            } catch (error) {
              console.log("No existing problem statement found");
            }
          } else {
            setError("You are not part of any group yet. Please create or join a group first.");
          }
        } catch (error) {
          console.error("Error fetching group details:", error);
          setError("You are not part of any group yet. Please create or join a group first.");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching student data:", error);
        setError("An error occurred while fetching data.");
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-lg text-gray-600 font-medium">Loading your data...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
        <Header
          name={student?.name_of_students || student?.name || "Student"}
          id={student?.enrollment_no || student?.enrollement_no || "----"}
        />
        <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
          <Sidebar />
          <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72">
            <div>
              <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-8 max-w-2xl">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 bg-amber-100 rounded-full mb-6">
                    <AlertCircle className="w-16 h-16 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-amber-900 mb-3">Group Required</h3>
                  <p className="text-amber-800 mb-6 leading-relaxed">
                    {error || "You need to be part of a group to submit a problem statement. Please create or join a group first."}
                  </p>
                  <a
                    href="/student-dashboard"
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-all"
                  >
                    <Users className="w-5 h-5" />
                    Go to Dashboard
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header
        name={student?.name_of_students || student?.name || "Student"}
        id={student?.enrollment_no || student?.enrollement_no || "----"}
      />
      <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
        <Sidebar />
        <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Layers className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Problem Statement</h1>
                  <p className="text-gray-600">
                    Define and document your project's problem statement to guide your development process
                  </p>
                </div>
              </div>
            </div>

            {/* Group Information Card */}
            {groupData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Group Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-600 text-sm mb-1">Group ID</p>
                    <p className="text-lg font-bold text-gray-900">{groupData.group_id}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-600 text-sm mb-1">Team Name</p>
                    <p className="text-lg font-bold text-gray-900">{groupData.team_name || 'Not Set'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-600 text-sm mb-1">Mentor</p>
                    <p className="text-lg font-bold text-gray-900">{groupData.mentor_code || 'Not Assigned'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Problem Statement Form */}
            {groupData && (
              <ProblemStatementForm
                groupId={groupData.group_id}
                groupName={groupData.team_name}
                existing={existingPS}
                onSubmit={setExistingPS}
                onDelete={() => setExistingPS(null)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProblemStatementSih;
