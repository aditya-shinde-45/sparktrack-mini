import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api";
import Sidebar from "../../Components/Student/sidebar";
import Header from "../../Components/Student/Header";
import Loading from "../../Components/Common/loading";
import { AlertCircle, Check, FileText, Download, Eye, Edit2, Trash2, Building2, Briefcase, Clock, Upload, Users, User, Calendar, X, Maximize2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const InternshipDetails = () => {
  const [student, setStudent] = useState(null);
  const [existingInternship, setExistingInternship] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    organization_name: "",
    internship_type: "",
    internship_duration: "",
    start_date: null,
    end_date: null,
    role: "",
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (!token) {
      setStudent(null);
      setFetchingData(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch student profile
        const profileRes = await apiRequest("/api/student-auth/profile", "GET", null, token);
        const profileData = profileRes?.data?.profile || profileRes?.profile;

        if (!profileData) {
          setStudent(null);
          return;
        }
        setStudent(profileData);

        // Fetch existing internship details
        const internshipRes = await apiRequest("/api/students/internship/my-internship", "GET", null, token);
        const internshipData = internshipRes?.data?.internship || internshipRes?.internship;
        
        if (internshipData) {
          setExistingInternship(internshipData);
          // Extract duration number from "X Month(s)" format
          const durationMatch = internshipData.internship_duration?.match(/\d+/);
          const durationNumber = durationMatch ? durationMatch[0] : "";
          
          setForm({
            organization_name: internshipData.organization_name || "",
            internship_type: internshipData.internship_type || "",
            internship_duration: durationNumber,
            start_date: internshipData.start_date ? new Date(internshipData.start_date) : null,
            end_date: internshipData.end_date ? new Date(internshipData.end_date) : null,
            role: internshipData.role || "",
            file: null,
          });
        }

        // Fetch previous group details
        const enrollmentNo = profileData?.enrollment_no;
        if (enrollmentNo) {
          try {
            const response = await fetch(`${import.meta.env.MODE === "development" ? import.meta.env.VITE_API_BASE_URL : import.meta.env.VITE_API_BASE_URL_PROD}/api/groups/previous/${enrollmentNo}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            const data = await response.json();
            console.log("Raw API Response:", data);
            
            if (data && data.success) {
              // Handle both response formats
              const previousGroup = data.previousGroup || data.data?.previousGroup;
              const members = data.members || data.data?.members;
              
              console.log("previousGroup:", previousGroup);
              console.log("members:", members);
              
              if (previousGroup && members && members.length > 0) {
                const groupData = {
                  group_id: previousGroup.group_id,
                  mentor_code: previousGroup.mentor_code,
                  members: members
                };
                console.log("Setting groupDetails:", groupData);
                setGroupDetails(groupData);
              }
            }
          } catch (groupError) {
            console.error("Error fetching previous group:", groupError);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (
      !form.organization_name ||
      !form.internship_type ||
      !form.internship_duration
    ) {
      setMessage("Organization name, internship type, and duration are required");
      setMessageType("error");
      return;
    }

    // File is required only for new submission (not for updates)
    if (!existingInternship && !form.file) {
      setMessage("Document is required for new submission");
      setMessageType("error");
      return;
    }

    if (form.file && form.file.type !== "application/pdf") {
      setMessage("Only PDF files are allowed");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const token = localStorage.getItem("student_token");

      const formData = new FormData();
      formData.append("organization_name", form.organization_name);
      formData.append("internship_type", form.internship_type);
      formData.append("internship_duration", `${form.internship_duration} Month${form.internship_duration !== '1' ? 's' : ''}`);
      if (form.start_date) formData.append("start_date", form.start_date.toISOString().split('T')[0]);
      if (form.end_date) formData.append("end_date", form.end_date.toISOString().split('T')[0]);
      if (form.role) formData.append("role", form.role);
      formData.append("student_name", student?.name_of_students || student?.name || "");
      if (groupDetails) {
        formData.append("group_id", groupDetails.group_id || "");
        formData.append("mentor", groupDetails.mentor_code || "");
      }
      if (form.file) {
        formData.append("internship_document", form.file);
      }

      const endpoint = existingInternship ? "/api/students/internship" : "/api/students/internship";
      const method = existingInternship ? "PUT" : "POST";

      const response = await apiRequest(endpoint, method, formData, token, true);

      setMessage(existingInternship ? "Internship details updated successfully!" : "Internship details submitted successfully!");
      setMessageType("success");
      
      // Refresh internship data
      const internshipRes = await apiRequest("/api/students/internship/my-internship", "GET", null, token);
      const internshipData = internshipRes?.data?.internship || internshipRes?.internship;
      if (internshipData) {
        setExistingInternship(internshipData);
        // Update form with latest data
        const durationMatch = internshipData.internship_duration?.match(/\d+/);
        const durationNumber = durationMatch ? durationMatch[0] : "";
        setForm({
          organization_name: internshipData.organization_name || "",
          internship_type: internshipData.internship_type || "",
          internship_duration: durationNumber,
          start_date: internshipData.start_date ? new Date(internshipData.start_date) : null,
          end_date: internshipData.end_date ? new Date(internshipData.end_date) : null,
          role: internshipData.role || "",
          file: null,
        });
      }
      
      setIsEditing(false);
      
      // Reset file input only
      if (document.getElementById("internship-file")) {
        document.getElementById("internship-file").value = "";
      }
    } catch (err) {
      setMessage(err?.message || "Submission failed. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your internship details?")) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("student_token");
      
      await apiRequest("/api/students/internship", "DELETE", null, token);
      
      setMessage("Internship details deleted successfully!");
      setMessageType("success");
      setExistingInternship(null);
      setForm({
        organization_name: "",
        internship_type: "",
        internship_duration: "",
        start_date: null,
        end_date: null,
        role: "",
        file: null,
      });
      setIsEditing(false);
    } catch (err) {
      setMessage(err?.message || "Deletion failed. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem("student_token");
      const enrollment_no = student?.enrollment_no;
      
      const response = await fetch(`/api/students/internship/download/${enrollment_no}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = existingInternship?.file_name || 'internship_document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setMessage("Failed to download document");
      setMessageType("error");
    }
  };

  const handlePreview = () => {
    if (existingInternship?.file_url && existingInternship.file_url !== 'pending_upload') {
      window.open(existingInternship.file_url, '_blank');
    } else {
      setMessage("Document preview not available");
      setMessageType("error");
    }
  };

  if (!student || fetchingData)
    return <Loading message="Loading internship details" />;

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header
        name={student?.name_of_students || student?.name || "Student"}
        id={student?.enrollment_no || "----"}
      />
      <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
        <Sidebar />
        <main className="flex-1 p-3 md:p-6 bg-gray-50 lg:ml-72">
          <div className="mb-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Internship Details</h1>
            </div>
            <p className="text-purple-100 ml-11">
              {existingInternship 
                ? "View and manage your internship information."
                : "Submit your internship information and upload the required documents."
              }
            </p>
          </div>

            {/* Existing Internship Card */}
            {existingInternship && !isEditing && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-purple-100">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-purple-100">
                  <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    Your Internship Information
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Pre-fill form with existing data
                        const durationMatch = existingInternship.internship_duration?.match(/\d+/);
                        const durationNumber = durationMatch ? durationMatch[0] : "";
                        setForm({
                          organization_name: existingInternship.organization_name || "",
                          internship_type: existingInternship.internship_type || "",
                          internship_duration: durationNumber,
                          start_date: existingInternship.start_date ? new Date(existingInternship.start_date) : null,
                          end_date: existingInternship.end_date ? new Date(existingInternship.end_date) : null,
                          role: existingInternship.role || "",
                          file: null,
                        });
                        setIsEditing(true);
                        setMessage("");
                      }}
                      className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md hover:bg-purple-700 hover:shadow-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md hover:bg-red-700 hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg mt-1">
                        <Building2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-semibold mb-1">Organization Name</p>
                        <p className="text-gray-800 font-semibold text-lg">{existingInternship.organization_name}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg mt-1">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-semibold mb-1">Internship Type</p>
                        <p className="text-gray-800 font-semibold text-lg">{existingInternship.internship_type}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 p-2 rounded-lg mt-1">
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-semibold mb-1">Duration</p>
                        <p className="text-gray-800 font-semibold text-lg">{existingInternship.internship_duration}</p>
                      </div>
                    </div>
                  </div>
                  
                  {existingInternship.group_id && (
                    <div className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-xl border-l-4 border-orange-500 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg mt-1">
                          <FileText className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-semibold mb-1">Group ID</p>
                          <p className="text-gray-800 font-semibold text-lg">{existingInternship.group_id}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {existingInternship.start_date && (
                    <div className="bg-gradient-to-br from-teal-50 to-white p-5 rounded-xl border-l-4 border-teal-500 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-teal-100 p-2 rounded-lg mt-1">
                          <Calendar className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-semibold mb-1">Start Date</p>
                          <p className="text-gray-800 font-semibold text-lg">{new Date(existingInternship.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {existingInternship.end_date && (
                    <div className="bg-gradient-to-br from-pink-50 to-white p-5 rounded-xl border-l-4 border-pink-500 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-pink-100 p-2 rounded-lg mt-1">
                          <Calendar className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-semibold mb-1">End Date</p>
                          <p className="text-gray-800 font-semibold text-lg">{new Date(existingInternship.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {existingInternship.role && (
                    <div className="bg-gradient-to-br from-violet-50 to-white p-5 rounded-xl border-l-4 border-violet-500 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-violet-100 p-2 rounded-lg mt-1">
                          <User className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="w-full">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm text-gray-500 font-semibold">Profile & Brief of Task Allocated/Project Details</p>
                            <button
                              onClick={() => setShowRoleModal(true)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-violet-600 hover:text-violet-800 hover:bg-violet-100 rounded-lg transition-colors"
                              title="View in full screen"
                            >
                              <Maximize2 className="w-3 h-3" />
                              Expand
                            </button>
                          </div>
                          <p className="text-gray-800 font-medium text-base whitespace-pre-wrap line-clamp-3 cursor-pointer hover:text-violet-600 transition-colors" onClick={() => setShowRoleModal(true)}>{existingInternship.role}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {existingInternship.file_name && (
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-200 shadow-sm">
                    <p className="text-sm text-indigo-700 font-bold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      INTERNSHIP LETTER
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-3 rounded-lg">
                          <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                        <span className="text-gray-800 font-medium">{existingInternship.file_name}</span>
                      </div>
                      <div className="flex gap-2">
                        {existingInternship.file_url && existingInternship.file_url !== 'pending_upload' && (
                          <button
                            onClick={handlePreview}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                        )}
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-green-700 hover:shadow-lg transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {existingInternship.created_at && (
                  <div className="mt-6 pt-4 border-t border-purple-100 flex items-center gap-2 text-sm text-gray-500">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Submitted on: <span className="font-semibold text-gray-700">{new Date(existingInternship.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span></span>
                  </div>
                )}
              </div>
            )}

            {/* Form - Show for new submissions or when editing */}
            {(!existingInternship || isEditing) && (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-purple-100"
              >
                <div className="flex items-center justify-between border-b-2 border-purple-100 pb-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Briefcase className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-purple-800">
                      {existingInternship ? "Update Internship Details" : "Submit Internship Details"}
                    </h2>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setMessage("");
                        // Reset file input
                        if (document.getElementById("internship-file")) {
                          document.getElementById("internship-file").value = "";
                        }
                      }}
                      className="text-gray-500 hover:text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-gray-700 font-bold mb-2.5 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.organization_name}
                    onChange={(e) =>
                      setForm({ ...form, organization_name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white font-medium shadow-sm hover:border-purple-300"
                    placeholder="Enter organization name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2.5 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    Internship Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.internship_type}
                    onChange={(e) =>
                      setForm({ ...form, internship_type: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white font-medium shadow-sm hover:border-purple-300"
                  >
                    <option value="">Select Internship Type</option>
                    <option value="Development Internship">Development Internship</option>
                    <option value="Research Internship">Research Internship</option>
                    <option value="Industrial Training">Industrial Training</option>
                    <option value="Virtual Internship">Virtual Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2.5 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Internship Duration <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.internship_duration}
                    onChange={(e) =>
                      setForm({ ...form, internship_duration: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white font-medium shadow-sm hover:border-purple-300"
                  >
                    <option value="">Select Duration</option>
                    <option value="1">1 Month</option>
                    <option value="2">2 Months</option>
                    <option value="3">3 Months</option>
                    <option value="4">4 Months</option>
                    <option value="5">5 Months</option>
                    <option value="6">6 Months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2.5 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Start Date
                  </label>
                  <DatePicker
                    selected={form.start_date}
                    onChange={(date) => setForm({ ...form, start_date: date })}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select start date (DD/MM/YYYY)"
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white font-medium shadow-sm hover:border-purple-300"
                    wrapperClassName="w-full"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <p className="mt-1 text-xs text-gray-500">Select internship start date (DD/MM/YYYY)</p>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2.5 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    End Date
                  </label>
                  <DatePicker
                    selected={form.end_date}
                    onChange={(date) => setForm({ ...form, end_date: date })}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select end date (DD/MM/YYYY)"
                    minDate={form.start_date}
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white font-medium shadow-sm hover:border-purple-300"
                    wrapperClassName="w-full"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <p className="mt-1 text-xs text-gray-500">Select internship end date (DD/MM/YYYY)</p>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2.5 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    Profile & Brief of Task Allocated / Project Details
                  </label>
                  <textarea
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white font-medium shadow-sm hover:border-purple-300 resize-y"
                    placeholder="Describe your profile, role, internship project, tasks, and responsibilities..."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2.5 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-purple-600" />
                    Internship Letter (PDF only) <span className="text-red-500">*</span>
                    {existingInternship && <span className="text-sm text-gray-500 font-normal">(Joining letter/Approval letter)</span>}
                  </label>
                  <div className="relative">
                    <input
                      id="internship-file"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        setForm({ ...form, file: e.target.files[0] })
                      }
                      required={!existingInternship}
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white shadow-sm hover:border-purple-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Upload your official internship offer letter or certificate
                  </p>
                </div>
              </div>

              {message && (
                <div className={`flex items-center gap-3 p-4 rounded-xl font-medium ${
                  messageType === 'success' ? 'bg-green-50 text-green-700 border-2 border-green-200' : 'bg-red-50 text-red-700 border-2 border-red-200'
                }`}>
                  {messageType === 'success' ? (
                    <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              <div className="flex gap-4 justify-end pt-4 border-t border-purple-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:from-purple-700 hover:to-purple-800 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                      {existingInternship ? "Updating..." : "Uploading..."}
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {existingInternship ? "Update Details" : "Submit Details"}
                    </>
                  )}
                </button>
              </div>
            </form>
            )}

          {/* Previous Group Info - Compact Version */}
          {groupDetails && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-bold text-gray-700">Previous Year PBL Group</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">Group ID:</span>
                  <span className="text-gray-800 font-semibold">{groupDetails.group_id}</span>
                </div>
                
                {groupDetails.mentor_code && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">Mentor:</span>
                    <span className="text-gray-800 font-semibold">{groupDetails.mentor_code}</span>
                  </div>
                )}
                
                {groupDetails.members && groupDetails.members.length > 0 && (
                  <div>
                    <span className="text-gray-500 font-medium">Members:</span>
                    <div className="mt-1 space-y-1">
                      {groupDetails.members.map((member, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-700 pl-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span>{member.name_of_student || member.name_of_students || member.name}</span>
                          <span className="text-gray-500">({member.enrollement_no || member.enrollment_no})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Role Details Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowRoleModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Profile & Brief of Task Allocated/Project Details</h2>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
                <pre className="text-gray-800 font-medium text-base whitespace-pre-wrap leading-relaxed font-sans">
                  {existingInternship?.role}
                </pre>
              </div>
              
              {/* Optional: Add copy to clipboard button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(existingInternship?.role || '');
                    setMessage("Copied to clipboard!");
                    setMessageType("success");
                    setTimeout(() => setMessage(""), 2000);
                  }}
                  className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipDetails;
