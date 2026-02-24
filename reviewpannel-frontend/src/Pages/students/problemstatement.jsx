import React, { useState, useEffect, useMemo } from 'react';
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

const technologyOptions = [
  "Artificial Intelligence (AI)", "Machine Learning (ML)", "Deep Learning",
  "Data Science & Analytics", "Big Data", "Internet of Things (IoT)",
  "Cloud Computing", "Edge Computing", "Blockchain", "Cyber Security",
  "Web Development", "Mobile Application Development", "Full Stack Development",
  "DevOps", "AR / VR / XR", "Computer Vision", "Natural Language Processing (NLP)",
  "Robotics & Automation", "Embedded Systems", "Digital Signal Processing (DSP)",
  "Networking & Communication", "Quantum Computing", "Low-Code / No-Code Platforms",
  "Software Engineering Tools", "Game Development"
];

const domainOptions = [
  "Education (EdTech)", "Healthcare & Medical", "Agriculture & AgriTech",
  "Smart Cities", "FinTech & Banking", "E-Governance", "Transportation & Logistics",
  "Energy & Power", "Environment & Sustainability", "Climate & Disaster Management",
  "Retail & E-Commerce", "Manufacturing & Industry 4.0", "Defence & Security",
  "Media & Entertainment", "Tourism & Hospitality", "Sports & Fitness",
  "Social Welfare & NGOs", "Rural Development", "Urban Development",
  "Telecommunications", "Supply Chain Management", "LegalTech",
  "HR & Workforce Management", "Real Estate & Infrastructure", "Space & Research",
  "Open Innovation / Cross-Domain"
];

const normalizeChoice = (value) => {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] || "";
  if (typeof value === "string" && value.includes(",")) return value.split(",")[0].trim();
  return value;
};

const ProblemStatementForm = ({ groupId, groupName, existing, onSubmit, onDelete }) => {
  const [form, setForm] = useState(
    existing || {
      title: '',
      type: '',
      technologyBucket: [],
      domain: '',
      description: '',
    }
  );
  const selectedTechnologies = Array.isArray(form.technologyBucket) ? form.technologyBucket : [];
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [techSearch, setTechSearch] = useState('');
  const [showTechDropdown, setShowTechDropdown] = useState(false);

  // Check if PS is approved
  const isApproved = existing?.status === 'APPROVED';
  const isRejected = existing?.status === 'REJECTED';
  const isPending = existing?.status === 'PENDING';

  const filteredTechOptions = useMemo(() =>
    technologyOptions.filter((tech) => tech.toLowerCase().includes(techSearch.toLowerCase())),
    [techSearch]
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setShowTechDropdown(false);
      }
    };
    if (showTechDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTechDropdown]);

  useEffect(() => {
    if (existing) {
      const techValue = normalizeChoice(existing.technologyBucket || existing.technology_bucket || existing.technologybucket || '');
      const techList = techValue
        ? techValue.split(',').map((value) => value.trim()).filter(Boolean)
        : [];
      setForm({
        title: existing.title || '',
        type: existing.type || '',
        technologyBucket: techList,
        domain: normalizeChoice(existing.domain || ''),
        description: existing.description || '',
      });
    }
  }, [existing]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const removeTech = (value) => {
    setForm({
      ...form,
      technologyBucket: selectedTechnologies.filter((item) => item !== value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const endpoint = existing
      ? `/api/students/student/problem-statement/${groupId}`
      : `/api/students/student/problem-statement`;
    const method = existing ? 'PUT' : 'POST';
    const body = {
      group_id: groupId,
      ...form,
      technologyBucket: form.technologyBucket.join(', ')
    };
    const token = localStorage.getItem('student_token');
    const res = await apiRequest(endpoint, method, body, token);
    setLoading(false);
    
    // Check for deadline block error
    if (res.success === false && res.status === 403 && res.message?.includes('disabled')) {
      setMessage('This task has been closed by the administrator. Submissions are no longer accepted.');
      setMessageType('error');
      return;
    }

    // Check for approved status error
    if (res.success === false && res.status === 403 && res.message?.includes('approved')) {
      setMessage('Cannot edit an approved problem statement.');
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

    // Check for approved status error
    if (res.success === false && res.status === 403 && res.message?.includes('approved')) {
      setMessage('Cannot delete an approved problem statement.');
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

      {/* Approval Status Banner */}
      {existing && existing.status && (
        <div className={`px-6 py-4 ${
          isApproved 
            ? 'bg-green-50 border-b-2 border-green-200' 
            : isRejected
            ? 'bg-red-50 border-b-2 border-red-200'
            : 'bg-yellow-50 border-b-2 border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            {isApproved ? (
              <Check className="w-6 h-6 text-green-600" />
            ) : isRejected ? (
              <X className="w-6 h-6 text-red-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            )}
            <div className="flex-1">
              <p className={`font-bold ${
                isApproved ? 'text-green-800' : isRejected ? 'text-red-800' : 'text-yellow-800'
              }`}>
                Status: {existing.status}
              </p>
              {isApproved && (
                <p className="text-green-700 text-sm mt-1">
                  Your problem statement has been approved by your mentor. Editing is now disabled.
                </p>
              )}
              {isRejected && existing.review_feedback && (
                <div className="mt-2">
                  <p className="text-red-700 text-sm font-semibold mb-1">Mentor Feedback:</p>
                  <p className="text-red-800 text-sm bg-white p-3 rounded border border-red-200">
                    {existing.review_feedback}
                  </p>
                  <p className="text-red-700 text-sm mt-2">
                    Please update your problem statement based on the feedback and resubmit.
                  </p>
                </div>
              )}
              {isPending && (
                <p className="text-yellow-700 text-sm mt-1">
                  Your problem statement is awaiting mentor review.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
            disabled={isApproved}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-gray-800 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              disabled={isApproved}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-gray-800 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            <div className="relative dropdown-container rounded-xl border border-gray-200 bg-white p-4">
              {selectedTechnologies.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  {selectedTechnologies.slice(0, 3).map((tech) => (
                    <span key={tech} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-full text-sm">
                      {tech}
                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => removeTech(tech)}
                          className="hover:bg-purple-700 rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          x
                        </button>
                      )}
                    </span>
                  ))}
                  {selectedTechnologies.length > 3 && (
                    <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      +{selectedTechnologies.length - 3} more
                    </span>
                  )}
                  {!isApproved && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, technologyBucket: [] })}
                      className="text-sm text-purple-600 hover:text-purple-800 underline ml-2"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}

              <div
                onClick={() => !isApproved && setShowTechDropdown(!showTechDropdown)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between ${
                  isApproved ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-purple-400 bg-white'
                }`}
              >
                <span className="text-gray-500 text-sm">
                  {selectedTechnologies.length === 0 ? "Select technologies..." : `${selectedTechnologies.length} selected`}
                </span>
                <span className="text-gray-400">{showTechDropdown ? "▲" : "▼"}</span>
              </div>

              {showTechDropdown && !isApproved && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-72 overflow-hidden">
                  <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <input
                      type="text"
                      value={techSearch}
                      onChange={(e) => setTechSearch(e.target.value)}
                      placeholder="Search technology..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="overflow-y-auto max-h-60">
                    {filteredTechOptions.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No technologies found</div>
                    ) : (
                      filteredTechOptions.map((tech) => (
                        <label
                          key={tech}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-purple-50 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTechnologies.includes(tech)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, technologyBucket: [...selectedTechnologies, tech] });
                              } else {
                                setForm({ ...form, technologyBucket: selectedTechnologies.filter((t) => t !== tech) });
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{tech}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
              <Globe className="w-5 h-5 text-orange-600" />
              Domain
            </label>
            <select
              name="domain"
              value={form.domain}
              onChange={handleChange}
              disabled={isApproved}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-gray-800 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Domain</option>
              {domainOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
            disabled={isApproved}
            rows={6}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-gray-800 bg-white resize-vertical disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          {existing && !isApproved && (
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
          {!isApproved && (
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
          )}
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
          
          const group = groupRes?.data?.groupDetails || groupRes?.groupDetails || groupRes?.data?.group || groupRes?.group;
          
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
          name={student?.name_of_student || student?.name_of_students || student?.name || "Student"}
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
        name={student?.name_of_student || student?.name_of_students || student?.name || "Student"}
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
                    <p className="text-gray-600 text-sm mb-1">Guide</p>
                    <p className="text-lg font-bold text-gray-900">{groupData.mentor_name || groupData.mentor_code || 'Not Assigned'}</p>
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
