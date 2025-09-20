import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api';
import Sidebar from "../../Components/Student/sidebar";
import Header from "../../Components/Student/Header";
import { AlertCircle, Check, X } from "lucide-react";

const ProblemStatementForm = ({ groupId, existing, onSubmit, onDelete }) => {
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
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const endpoint = existing
      ? `/api/student/problem-statement/${groupId}`
      : `/api/student/problem-statement`;
    const method = existing ? 'PUT' : 'POST';
    const body = { group_id: groupId, ...form };
    const token = localStorage.getItem('student_token');
    const res = await apiRequest(endpoint, method, body, token);
    setLoading(false);
    
    if (res.success !== false) {
      setMessage(res.message || (existing ? 'Problem statement updated successfully!' : 'Problem statement submitted successfully!'));
      setMessageType('success');
      if (onSubmit) onSubmit(res.problemStatement || form);
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
    const res = await apiRequest(`/api/student/problem-statement/${groupId}`, 'DELETE', null, token);
    setLoading(false);
    
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
      className="bg-white rounded-xl shadow p-6 space-y-6 border border-purple-100"
    >
      <h2 className="text-xl font-bold text-purple-700 mb-2">
        {existing ? 'Edit' : 'Submit'} Problem Statement
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white"
            placeholder="Title"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Type</label>
          <input
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white"
            placeholder="Type (e.g. Hardware/Software)"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Technology Bucket</label>
          <input
            name="technologyBucket"
            value={form.technologyBucket}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white"
            placeholder="Technology Bucket"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Domain</label>
          <input
            name="domain"
            value={form.domain}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white"
            placeholder="Domain"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-gray-700 font-semibold mb-2">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          rows={5}
          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white resize-vertical"
          placeholder="Describe your problem statement"
        />
      </div>
      
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {messageType === 'success' ? (
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}
      
      <div className="flex gap-4 justify-end">
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold transition"
          >
            Delete
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              {existing ? 'Updating...' : 'Submitting...'}
            </span> : 
            (existing ? 'Update' : 'Submit')
          }
        </button>
      </div>
    </form>
  );
};

const ProblemStatementSih = () => {
  const [student, setStudent] = useState(null);
  const [groupId, setGroupId] = useState('');
  const [existingPS, setExistingPS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchingGroup, setFetchingGroup] = useState(false);

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
        const profileRes = await apiRequest('/api/studentlogin/profile', 'GET', null, token);
        if (!profileRes || !profileRes.profile) {
          setLoading(false);
          setError("Could not retrieve student profile.");
          return;
        }
        
        setStudent(profileRes.profile);
        console.log("Student profile:", profileRes.profile);
        
        // Check if student has a group ID directly in profile
        const studentGroupId = profileRes.profile.group_id || 
                               profileRes.profile.groupId || 
                               profileRes.profile.group || 
                               '';
        
        if (studentGroupId) {
          console.log("Found group ID in profile:", studentGroupId);
          setGroupId(studentGroupId);
          
          // Fetch existing problem statement for this group
          fetchProblemStatement(studentGroupId, token);
        } else {
          // No group ID in profile, try fetch from group endpoint
          await fetchGroupDetails(profileRes.profile, token);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        setError("An error occurred while fetching data.");
        setLoading(false);
      }
    };

    const fetchGroupDetails = async (profile, token) => {
      setFetchingGroup(true);
      try {
        // Try both enrollment_no and enrollement_no (with typo)
        const enrollmentNo = profile.enrollment_no || profile.enrollement_no;
        
        if (!enrollmentNo) {
          console.error("No enrollment number found in profile");
          setLoading(false);
          return;
        }

        console.log("Fetching group details for enrollment:", enrollmentNo);
        
        // Call the group details API
        const groupRes = await apiRequest(`/api/pbl/gp/${enrollmentNo}`, "GET", null, token);
        console.log("Group API response:", groupRes);
        
        if (groupRes && groupRes.group && groupRes.group.id) {
          console.log("Found group ID from API:", groupRes.group.id);
          setGroupId(groupRes.group.id);
          fetchProblemStatement(groupRes.group.id, token);
        } else if (groupRes && groupRes.group_id) {
          // Alternative response format
          console.log("Found alternate group ID format:", groupRes.group_id);
          setGroupId(groupRes.group_id);
          fetchProblemStatement(groupRes.group_id, token);
        } else if (groupRes && groupRes.data && groupRes.data.group_id) {
          // Another possible response format
          console.log("Found nested group ID:", groupRes.data.group_id);
          setGroupId(groupRes.data.group_id);
          fetchProblemStatement(groupRes.data.group_id, token);
        } else {
          // Special case for ADT24SOCBD142 - hardcode their group ID
          // This is a temporary fix for this specific student
          if (enrollmentNo === 'ADT24SOCBD142') {
            console.log("Using hardcoded group ID for student ADT24SOCBD142");
            const fixedGroupId = "G123"; // Replace with the actual group ID from the database
            setGroupId(fixedGroupId);
            fetchProblemStatement(fixedGroupId, token);
          } else {
            console.error("No group found for student");
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching group details:", error);
        setLoading(false);
      } finally {
        setFetchingGroup(false);
      }
    };

    const fetchProblemStatement = async (gid, token) => {
      try {
        console.log("Fetching problem statement for group:", gid);
        const psRes = await apiRequest(`/api/student/problem-statement/${gid}`, 'GET', null, token);
        console.log("Problem statement response:", psRes);
        
        if (psRes && psRes.problemStatement) {
          setExistingPS(psRes.problemStatement);
        }
      } catch (error) {
        console.error("Error fetching problem statement:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  // Special function to manually set group ID from input
  // This is a fallback for when automatic detection fails
  const handleManualGroupIdSubmit = (e) => {
    e.preventDefault();
    const manualId = document.getElementById('manual-group-id').value;
    if (manualId && manualId.trim()) {
      console.log("Setting manual group ID:", manualId);
      setGroupId(manualId);
      
      const token = localStorage.getItem('student_token');
      if (token) {
        fetchProblemStatement(manualId, token);
      }
    }
  };

  const fetchProblemStatement = async (gid, token) => {
    try {
      console.log("Fetching problem statement for group:", gid);
      const psRes = await apiRequest(`/api/student/problem-statement/${gid}`, 'GET', null, token);
      console.log("Problem statement response:", psRes);
      
      if (psRes && psRes.problemStatement) {
        setExistingPS(psRes.problemStatement);
      }
    } catch (error) {
      console.error("Error fetching problem statement:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">
          {fetchingGroup ? "Retrieving your group information..." : "Loading..."}
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-red-600">
          {error || "Session expired. Please log in again."}
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-purple-800 mb-2">Problem Statement</h1>
              <p className="text-gray-600">
                Submit or edit your group's problem statement. Only one statement per group is allowed.
              </p>
            </div>
            
            {!groupId ? (
              <div className="bg-white rounded-xl shadow p-6 border border-orange-200 bg-orange-50 text-orange-800">
                <div className="flex flex-col items-center text-center mb-6">
                  <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />
                  <h3 className="text-lg font-bold mb-2">Group Information</h3>
                  <p className="mb-4">
                    Your group data couldn't be retrieved automatically. Please enter your group ID manually.
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-orange-200 mb-6">
                  <h4 className="font-semibold mb-2">Student Information:</h4>
                  <p><strong>Student ID:</strong> {student.enrollment_no || student.enrollement_no}</p>
                  <p><strong>Student Name:</strong> {student.name_of_students || student.name}</p>
                  
                  {/* Manual Group ID Entry Form */}
                  <div className="mt-4 pt-4 border-t border-orange-200">
                    <h4 className="font-semibold mb-2">Enter Your Group ID:</h4>
                    <form onSubmit={handleManualGroupIdSubmit} className="flex items-center gap-2">
                      <input
                        id="manual-group-id"
                        type="text"
                        className="px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-gray-800 bg-white"
                        placeholder="e.g. G123"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                      >
                        Submit
                      </button>
                    </form>
                    <p className="mt-2 text-xs text-orange-600">
                      You can find your group ID in your dashboard or ask your group members.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <a
                    href="/student/dashboard"
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition mr-4"
                  >
                    Return to Dashboard
                  </a>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-orange-700 transition"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-purple-700">Group ID:</span>
                    <span className="font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-md">
                      {groupId}
                    </span>
                  </div>
                </div>
              
                <ProblemStatementForm
                  groupId={groupId}
                  existing={existingPS}
                  onSubmit={setExistingPS}
                  onDelete={() => setExistingPS(null)}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProblemStatementSih;