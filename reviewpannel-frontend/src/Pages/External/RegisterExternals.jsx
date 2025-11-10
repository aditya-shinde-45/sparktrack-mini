import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api.js";
import { UserPlus, Building2, ArrowLeft, CheckCircle, AlertCircle, Info, RefreshCw } from "lucide-react";
import Header from "../../Components/Common/Header.jsx";

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

  // Email verification disabled - No OTP states needed

  useEffect(() => {
    fetchMentorGroups();
    fetchPreviousExternals();
  }, []);

  const fetchMentorGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      // Fixed: Changed from /api/mentors/groups to /api/pbl3/mentor/groups
      const response = await apiRequest("/api/pbl3/mentor/groups", "GET", null, token);

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

  // Direct registration without OTP - simplified handler
  const handleProceedToEvaluation = async () => {
    setError("");
    setSubmitting(true);
    
    // Validation for External 1
    if (!external1Name.trim() || !external1Org.trim() || !external1Phone.trim() || !external1Email.trim()) {
      setError("Please fill all required fields for Primary External Evaluator");
      setSubmitting(false);
      return;
    }

    if (!validateEmail(external1Email)) {
      setError("Invalid email format for Primary External Evaluator");
      setSubmitting(false);
      return;
    }

    if (!validatePhone(external1Phone)) {
      setError("Phone number must be 10 digits for Primary External Evaluator");
      setSubmitting(false);
      return;
    }

    // Validation for External 2 if added
    if (addSecondExternal) {
      if (!external2Name.trim() || !external2Org.trim() || !external2Phone.trim() || !external2Email.trim()) {
        setError("Please fill all fields for Secondary External Evaluator or remove it");
        setSubmitting(false);
        return;
      }

      if (!validateEmail(external2Email)) {
        setError("Invalid email format for Secondary External Evaluator");
        setSubmitting(false);
        return;
      }

      if (!validatePhone(external2Phone)) {
        setError("Phone number must be 10 digits for Secondary External Evaluator");
        setSubmitting(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      
      // Prepare external evaluators data
      const externals = [
        {
          name: external1Name.trim(),
          organization: external1Org.trim(),
          phone: external1Phone.trim(),
          email: external1Email.trim(),
        }
      ];

      if (addSecondExternal) {
        externals.push({
          name: external2Name.trim(),
          organization: external2Org.trim(),
          phone: external2Phone.trim(),
          email: external2Email.trim(),
        });
      }

      // Call backend to register externals directly (no OTP verification)
      const response = await apiRequest(
        "/api/pbl3/verify-external-otp",
        "POST",
        { 
          externals, 
          group_ids: groups 
        },
        token
      );

      if (response && response.success) {
        // Save to localStorage
        localStorage.setItem("external1_name", external1Name.trim());
        localStorage.setItem("organization1_name", external1Org.trim());
        localStorage.setItem("external1_contact", external1Phone.trim());
        localStorage.setItem("external1_email", external1Email.trim());

        if (addSecondExternal) {
          localStorage.setItem("external2_name", external2Name.trim());
          localStorage.setItem("organization2_name", external2Org.trim());
          localStorage.setItem("external2_contact", external2Phone.trim());
          localStorage.setItem("external2_email", external2Email.trim());
        }

        localStorage.setItem("groups", JSON.stringify(groups));
        
        setSuccess("External evaluators registered successfully! Redirecting to evaluation...");
        
        setTimeout(() => {
          navigate("/external-home");
        }, 1500);
      } else {
        setError(response.message || "Failed to register external evaluators");
        setSubmitting(false);
      }
    } catch (err) {
      setError(err.message || "An error occurred during registration");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Get mentor details from localStorage
  const mentorName = localStorage.getItem("name") || "Mentor";
  const mentorId = localStorage.getItem("id") || localStorage.getItem("contact_number") || "";

  return (
    <>
      {/* Header Component */}
      <Header name={mentorName} id={mentorId} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20 md:pt-24 py-6 md:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Professional Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-700" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">External Evaluator Registration</h1>
                    <p className="text-slate-600 mt-1 text-sm sm:text-base">PBL Review 3 - Academic Year 2024-25</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/external-home")}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all text-slate-700 font-medium text-sm border border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">Error</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900 mb-1">Success</p>
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Info Banner for Previous Externals */}
          {previousExternals.length > 0 && !success && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Previously Registered Evaluators Available</p>
                <p className="text-sm text-blue-800">
                  Found <strong>{previousExternals.length}</strong> evaluator(s) from previous registrations. 
                  Click <strong>"Auto-fill from Previous"</strong> to reuse their information.
                </p>
              </div>
            </div>
          )}

          {/* Form - Remove onSubmit */}
          <div className="space-y-6">
            {/* Groups Assignment Display */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-indigo-700" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Assigned Groups</h2>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                External evaluators will be registered for <strong className="text-slate-900">all {groups.length} assigned group(s)</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <span key={group} className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-200">
                    {group}
                  </span>
                ))}
              </div>
            </div>

            {/* External Evaluator 1 */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-md uppercase tracking-wide">
                    Required
                  </span>
                  <h2 className="text-lg font-semibold text-slate-900">Primary External Evaluator</h2>
                </div>
                {previousExternals.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSuggestions1(!showSuggestions1)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Auto-fill from Previous
                  </button>
                )}
              </div>

              {/* Previous Externals Suggestions for External 1 */}
              {showSuggestions1 && previousExternals.length > 0 && (
                <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-56 overflow-y-auto">
                  <p className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Select from Previous Registrations</p>
                  <div className="space-y-2">
                    {previousExternals.map((ext, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => fillExternal1(ext)}
                        className="w-full text-left p-3 bg-white hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-all"
                      >
                        <p className="text-sm font-semibold text-slate-900">{ext.name}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{ext.organization}</p>
                        <p className="text-xs text-slate-500 mt-1">{ext.email} • {ext.phone}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={external1Name}
                    onChange={(e) => setExternal1Name(e.target.value)}
                    placeholder="Dr. John Doe"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Organization *</label>
                  <input
                    type="text"
                    value={external1Org}
                    onChange={(e) => setExternal1Org(e.target.value)}
                    placeholder="ABC Corporation"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={external1Phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) setExternal1Phone(value);
                    }}
                    placeholder="9876543210"
                    maxLength="10"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={external1Email}
                    onChange={(e) => setExternal1Email(e.target.value)}
                    placeholder="john.doe@example.com"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Add Second External Button */}
            {!addSecondExternal && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAddSecondExternal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add Second Evaluator (Optional)</span>
                </button>
              </div>
            )}

            {/* External Evaluator 2 - Similar structure */}
            {addSecondExternal && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md uppercase tracking-wide">
                      Optional
                    </span>
                    <h2 className="text-lg font-semibold text-slate-900">Secondary External Evaluator</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {previousExternals.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowSuggestions2(!showSuggestions2)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Auto-fill
                      </button>
                    )}
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
                      className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Previous Externals Suggestions for External 2 */}
                {showSuggestions2 && previousExternals.length > 0 && (
                  <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-56 overflow-y-auto">
                    <p className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">Select from Previous Registrations</p>
                    <div className="space-y-2">
                      {previousExternals.map((ext, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => fillExternal2(ext)}
                          className="w-full text-left p-3 bg-white hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-all"
                        >
                          <p className="text-sm font-semibold text-slate-900">{ext.name}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{ext.organization}</p>
                          <p className="text-xs text-slate-500 mt-1">{ext.email} • {ext.phone}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={external2Name}
                      onChange={(e) => setExternal2Name(e.target.value)}
                      placeholder="Dr. Jane Smith"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Organization</label>
                    <input
                      type="text"
                      value={external2Org}
                      onChange={(e) => setExternal2Org(e.target.value)}
                      placeholder="XYZ Institute"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={external2Phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 10) setExternal2Phone(value);
                      }}
                      placeholder="9876543210"
                      maxLength="10"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={external2Email}
                      onChange={(e) => setExternal2Email(e.target.value)}
                      placeholder="jane.smith@example.com"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Important Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Email Verification Disabled</p>
                <p className="text-sm text-blue-800">
                  Email verification is currently disabled. You can proceed directly to evaluation after filling the external evaluator details.
                </p>
              </div>
            </div>

            {/* Proceed Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleProceedToEvaluation}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed text-base"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    <span>Proceed to Evaluation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterExternals;
