import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api.js";
import { UserPlus, Building2, Phone, Mail, ArrowLeft, Send } from "lucide-react";

const RegisterExternals = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // External 1 (Required)
  const [external1Name, setExternal1Name] = useState("");
  const [external1Org, setExternal1Org] = useState("");
  const [external1Phone, setExternal1Phone] = useState("");
  const [external1Email, setExternal1Email] = useState("");

  // External 2 (Optional)
  const [external2Name, setExternal2Name] = useState("");
  const [external2Org, setExternal2Org] = useState("");
  const [external2Phone, setExternal2Phone] = useState("");
  const [external2Email, setExternal2Email] = useState("");

  const [addSecondExternal, setAddSecondExternal] = useState(false);
  
  // Previous externals data
  const [previousExternals, setPreviousExternals] = useState([]);
  const [showSuggestions1, setShowSuggestions1] = useState(false);
  const [showSuggestions2, setShowSuggestions2] = useState(false);

  useEffect(() => {
    fetchMentorGroups();
    fetchPreviousExternals();
  }, []);

  const fetchMentorGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiRequest("/api/mentors/groups", "GET", null, token);

      if (response && response.data && response.data.groups) {
        setGroups(response.data.groups);
      } else {
        setError("No groups assigned to you");
      }
    } catch (err) {
      setError(err.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousExternals = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await apiRequest("/api/pbl3/previous-externals", "GET", null, token);

      if (response && response.data && response.data.externals) {
        setPreviousExternals(response.data.externals);
      }
    } catch (err) {
      console.error("Failed to load previous externals:", err);
      // Not a critical error, just log it
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const fillExternal1 = (external) => {
    setExternal1Name(external.name);
    setExternal1Org(external.organization);
    setExternal1Phone(external.phone);
    setExternal1Email(external.email);
    setShowSuggestions1(false);
  };

  const fillExternal2 = (external) => {
    setExternal2Name(external.name);
    setExternal2Org(external.organization);
    setExternal2Phone(external.phone);
    setExternal2Email(external.email);
    setShowSuggestions2(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!external1Name.trim() || !external1Org.trim() || !external1Phone.trim() || !external1Email.trim()) {
      setError("Please fill all required fields for External Evaluator 1");
      return;
    }

    if (!validateEmail(external1Email)) {
      setError("Invalid email format for External Evaluator 1");
      return;
    }

    if (!validatePhone(external1Phone)) {
      setError("Phone number must be 10 digits for External Evaluator 1");
      return;
    }

    // Validate second external if provided
    if (addSecondExternal) {
      if (!external2Name.trim() || !external2Org.trim() || !external2Phone.trim() || !external2Email.trim()) {
        setError("Please fill all fields for External Evaluator 2 or remove it");
        return;
      }

      if (!validateEmail(external2Email)) {
        setError("Invalid email format for External Evaluator 2");
        return;
      }

      if (!validatePhone(external2Phone)) {
        setError("Phone number must be 10 digits for External Evaluator 2");
        return;
      }
    }

    // Check if mentor has groups assigned
    if (!groups || groups.length === 0) {
      setError("No groups assigned to you. Please contact administrator.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const externals = [
        {
          name: external1Name.trim(),
          organization: external1Org.trim(),
          phone: external1Phone.trim(),
          email: external1Email.trim(),
        },
      ];

      if (addSecondExternal) {
        externals.push({
          name: external2Name.trim(),
          organization: external2Org.trim(),
          phone: external2Phone.trim(),
          email: external2Email.trim(),
        });
      }

      // Register externals to ALL groups assigned to this mentor
      let successCount = 0;
      let failedGroups = [];

      for (const groupId of groups) {
        try {
          const response = await apiRequest(
            "/api/pbl3/register-externals",
            "POST",
            {
              group_id: groupId,
              externals,
            },
            token
          );

          if (response && response.success) {
            successCount++;
          } else {
            failedGroups.push(groupId);
          }
        } catch (err) {
          console.error(`Failed to register externals for group ${groupId}:`, err);
          failedGroups.push(groupId);
        }
      }

      if (successCount > 0) {
        setSuccess(`External evaluators registered successfully to ${successCount} group(s)! OTP: 123456`);
        
        // Store all successfully registered groups in localStorage
        const successfulGroups = groups.filter(g => !failedGroups.includes(g));
        localStorage.setItem("groups", JSON.stringify(successfulGroups));
        
        // Reset form after 3 seconds and navigate
        setTimeout(() => {
          navigate("/external-home");
        }, 3000);
      } else {
        setError("Failed to register external evaluators to any group");
      }

      if (failedGroups.length > 0) {
        console.warn(`Failed groups: ${failedGroups.join(", ")}`);
      }
    } catch (err) {
      setError(err.message || "An error occurred while registering externals");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-4 md:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
                <span className="leading-tight">Register External Evaluators</span>
              </h1>
              <p className="text-gray-700 mt-2 text-sm sm:text-base">PBL Review 3 - Add 1-2 external evaluators for your group</p>
            </div>
            <button
              onClick={() => navigate("/external-home")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-800 font-medium text-sm sm:text-base whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 mb-4 md:mb-6 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-3 text-sm sm:text-base text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 mb-4 md:mb-6 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-3 text-sm sm:text-base text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Info Banner for Previous Externals */}
        {previousExternals.length > 0 && !success && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 mb-4 md:mb-6 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">💡</span>
              </div>
              <div className="ml-3">
                <p className="text-sm sm:text-base text-blue-800 font-semibold mb-1">Quick Tip!</p>
                <p className="text-xs sm:text-sm text-blue-700">
                  We found <strong>{previousExternals.length}</strong> external evaluator(s) you've registered before. 
                  Click <strong>"💡 Use Previous"</strong> to quickly autofill their details.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Groups Info Display */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-lg p-4 sm:p-6 border-2 border-purple-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-purple-600">📋</span>
              <span>Your Assigned Groups</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-700 mb-3">
              External evaluators will be registered to <strong className="text-purple-700">all {groups.length} groups</strong> assigned to you:
            </p>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <span key={group} className="bg-white px-3 py-1.5 rounded-full text-sm font-semibold text-purple-700 border-2 border-purple-300 shadow-sm">
                  {group}
                </span>
              ))}
            </div>
          </div>

          {/* External Evaluator 1 */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded text-xs sm:text-sm font-semibold">Required</span>
                <span>External Evaluator 1</span>
              </h2>
              {previousExternals.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSuggestions1(!showSuggestions1)}
                  className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                >
                  💡 Use Previous
                </button>
              )}
            </div>

            {/* Previous Externals Suggestions for External 1 */}
            {showSuggestions1 && previousExternals.length > 0 && (
              <div className="mb-4 bg-purple-50 border-2 border-purple-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-purple-700 mb-2">Click to autofill:</p>
                <div className="space-y-2">
                  {previousExternals.map((ext, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => fillExternal1(ext)}
                      className="w-full text-left p-2 bg-white hover:bg-purple-100 rounded border border-purple-200 transition-colors"
                    >
                      <p className="text-sm font-semibold text-gray-800">{ext.name}</p>
                      <p className="text-xs text-gray-600">{ext.organization}</p>
                      <p className="text-xs text-gray-500">{ext.email} • {ext.phone}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Name *</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={external1Name}
                    onChange={(e) => setExternal1Name(e.target.value)}
                    placeholder="Dr. John Doe"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Organization *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={external1Org}
                    onChange={(e) => setExternal1Org(e.target.value)}
                    placeholder="ABC Corporation"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    value={external1Phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) setExternal1Phone(value);
                    }}
                    placeholder="9876543210"
                    maxLength="10"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={external1Email}
                    onChange={(e) => setExternal1Email(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add Second External Button */}
          {!addSecondExternal && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setAddSecondExternal(true)}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold rounded-lg transition-colors text-sm sm:text-base"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add Second External Evaluator (Optional)</span>
              </button>
            </div>
          )}

          {/* External Evaluator 2 */}
          {addSecondExternal && (
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded text-xs sm:text-sm font-semibold">Optional</span>
                    <span>External Evaluator 2</span>
                  </h2>
                  {previousExternals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowSuggestions2(!showSuggestions2)}
                      className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                    >
                      💡 Use Previous
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAddSecondExternal(false);
                    setExternal2Name("");
                    setExternal2Org("");
                    setExternal2Phone("");
                    setExternal2Email("");
                    setShowSuggestions2(false);
                  }}
                  className="text-red-700 hover:text-red-800 text-sm font-semibold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>

              {/* Previous Externals Suggestions for External 2 */}
              {showSuggestions2 && previousExternals.length > 0 && (
                <div className="mb-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold text-blue-700 mb-2">Click to autofill:</p>
                  <div className="space-y-2">
                    {previousExternals.map((ext, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => fillExternal2(ext)}
                        className="w-full text-left p-2 bg-white hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        <p className="text-sm font-semibold text-gray-800">{ext.name}</p>
                        <p className="text-xs text-gray-600">{ext.organization}</p>
                        <p className="text-xs text-gray-500">{ext.email} • {ext.phone}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Name</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={external2Name}
                      onChange={(e) => setExternal2Name(e.target.value)}
                      placeholder="Dr. Jane Smith"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Organization</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={external2Org}
                      onChange={(e) => setExternal2Org(e.target.value)}
                      placeholder="XYZ Institute"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input
                      type="tel"
                      value={external2Phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 10) setExternal2Phone(value);
                      }}
                      placeholder="9876543210"
                      maxLength="10"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={external2Email}
                      onChange={(e) => setExternal2Email(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm sm:text-base text-blue-900">
                  <strong className="font-bold">Note:</strong> OTP will be sent to the provided email addresses. For testing purposes, the OTP is: <strong className="font-bold bg-blue-100 px-2 py-0.5 rounded">123456</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center sm:justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Register External Evaluators</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterExternals;
