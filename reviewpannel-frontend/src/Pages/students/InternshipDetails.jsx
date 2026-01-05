


import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api";
import Sidebar from "../../Components/Student/sidebar";
import Header from "../../Components/Student/Header";
import { AlertCircle, Check, FileText, Download, Eye, Edit2, Trash2 } from "lucide-react";

const InternshipDetails = () => {
  const [student, setStudent] = useState(null);
  const [existingInternship, setExistingInternship] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    organization_name: "",
    internship_type: "",
    internship_duration: "",
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'

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
            file: null,
          });
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
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header
        name={student?.name_of_students || student?.name || "Student"}
        id={student?.enrollment_no || "----"}
      />
      <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
        <Sidebar />
        <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-purple-800 mb-2">Internship Details</h1>
              <p className="text-gray-600">
                {existingInternship 
                  ? "View and manage your internship information."
                  : "Submit your internship information and upload the required documents."
                }
              </p>
            </div>

            {/* Existing Internship Card */}
            {existingInternship && !isEditing && (
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6 mb-6 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-purple-700 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Your Internship Details
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
                          file: null,
                        });
                        setIsEditing(true);
                        setMessage("");
                      }}
                      className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-red-700 transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg border border-purple-100">
                    <p className="text-sm text-gray-500 font-semibold mb-1">Organization</p>
                    <p className="text-gray-800 font-medium">{existingInternship.organization_name}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-purple-100">
                    <p className="text-sm text-gray-500 font-semibold mb-1">Internship Type</p>
                    <p className="text-gray-800 font-medium">{existingInternship.internship_type}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-purple-100">
                    <p className="text-sm text-gray-500 font-semibold mb-1">Duration</p>
                    <p className="text-gray-800 font-medium">{existingInternship.internship_duration}</p>
                  </div>
                  {existingInternship.group_id && (
                    <div className="bg-white p-4 rounded-lg border border-purple-100">
                      <p className="text-sm text-gray-500 font-semibold mb-1">Group ID</p>
                      <p className="text-gray-800 font-medium">{existingInternship.group_id}</p>
                    </div>
                  )}
                </div>

                {existingInternship.file_name && (
                  <div className="bg-white p-4 rounded-lg border border-purple-100">
                    <p className="text-sm text-gray-500 font-semibold mb-2">Uploaded Document</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <span className="text-gray-800 font-medium">{existingInternship.file_name}</span>
                      </div>
                      <div className="flex gap-2">
                        {existingInternship.file_url && existingInternship.file_url !== 'pending_upload' && (
                          <button
                            onClick={handlePreview}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                        )}
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-green-700 transition"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {existingInternship.created_at && (
                  <div className="mt-4 text-sm text-gray-500">
                    Submitted on: {new Date(existingInternship.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Form - Show for new submissions or when editing */}
            {(!existingInternship || isEditing) && (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow p-6 space-y-6 border border-purple-100"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-purple-700 mb-2">
                    {existingInternship ? "Update Internship Details" : "Submit Internship Details"}
                  </h2>
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
                      className="text-gray-600 hover:text-gray-800 font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={form.organization_name}
                    onChange={(e) =>
                      setForm({ ...form, organization_name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white"
                    placeholder="Organization Name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Internship Type
                  </label>
                  <select
                    value={form.internship_type}
                    onChange={(e) =>
                      setForm({ ...form, internship_type: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white"
                  >
                    <option value="">Select Internship Type</option>
                    <option value="Internship">Internship</option>
                    <option value="Research Internship">Research Internship</option>
                    <option value="Industrial Training">Industrial Training</option>
                    <option value="Virtual Internship">Virtual Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Internship Duration (Months)
                  </label>
                  <select
                    value={form.internship_duration}
                    onChange={(e) =>
                      setForm({ ...form, internship_duration: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white"
                  >
                    <option value="">Select Duration</option>
                    <option value="1">1 Month</option>
                    <option value="2">2 Months</option>
                    <option value="3">3 Months</option>
                    <option value="4">4 Months</option>
                    <option value="5">5 Months</option>
                    <option value="6">6 Months</option>
                    <option value="7">7 Months</option>
                    <option value="8">8 Months</option>
                    <option value="9">9 Months</option>
                    <option value="10">10 Months</option>
                    <option value="11">11 Months</option>
                    <option value="12">12 Months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Upload Document (PDF only) {existingInternship && "(Optional - leave blank to keep current file)"}
                  </label>
                  <input
                    id="internship-file"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      setForm({ ...form, file: e.target.files[0] })
                    }
                    required={!existingInternship}
                    className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition text-gray-800 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                </div>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      {existingInternship ? "Updating..." : "Uploading..."}
                    </span>
                  ) : (
                    existingInternship ? "Update" : "Submit"
                  )}
                </button>
              </div>
            </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default InternshipDetails;
