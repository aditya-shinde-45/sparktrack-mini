import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api.js";
import { UserPlus, Building2, Phone, Mail, ArrowLeft, Send, Shield, RefreshCw, CheckCircle, AlertCircle, Info, Check, Lock } from "lucide-react";
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

  // Enhanced OTP states for inline verification
  const [external1OtpSent, setExternal1OtpSent] = useState(false);
  const [external1OtpVerified, setExternal1OtpVerified] = useState(false);
  const [external1SessionToken, setExternal1SessionToken] = useState("");
  const [external1Countdown, setExternal1Countdown] = useState(0);
  const [sendingOtp1, setSendingOtp1] = useState(false);
  const [verifyingOtp1, setVerifyingOtp1] = useState(false);

  const [external2OtpSent, setExternal2OtpSent] = useState(false);
  const [external2OtpVerified, setExternal2OtpVerified] = useState(false);
  const [external2SessionToken, setExternal2SessionToken] = useState("");
  const [external2Countdown, setExternal2Countdown] = useState(0);
  const [sendingOtp2, setSendingOtp2] = useState(false);
  const [verifyingOtp2, setVerifyingOtp2] = useState(false);

  // OTP input states (ADD THESE)
  const [otp1, setOtp1] = useState("");
  const [otp2, setOtp2] = useState("");
  const [resendingOtp, setResendingOtp] = useState(false);

  useEffect(() => {
    fetchMentorGroups();
    fetchPreviousExternals();
  }, []);

  // Countdown timer for External 1
  useEffect(() => {
    if (external1Countdown > 0) {
      const timer = setTimeout(() => setExternal1Countdown(external1Countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [external1Countdown]);

  // Countdown timer for External 2
  useEffect(() => {
    if (external2Countdown > 0) {
      const timer = setTimeout(() => setExternal2Countdown(external2Countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [external2Countdown]);

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

  // Send OTP to External 1
  const handleSendOtp1 = async () => {
    setError("");
    
    // Validation
    if (!external1Name.trim() || !external1Org.trim() || !external1Phone.trim() || !external1Email.trim()) {
      setError("Please fill all required fields for Primary External Evaluator");
      return;
    }

    if (!validateEmail(external1Email)) {
      setError("Invalid email format for Primary External Evaluator");
      return;
    }

    if (!validatePhone(external1Phone)) {
      setError("Phone number must be 10 digits for Primary External Evaluator");
      return;
    }

    try {
      setSendingOtp1(true);
      const token = localStorage.getItem("token");

      const externals = [{
        name: external1Name.trim(),
        organization: external1Org.trim(),
        phone: external1Phone.trim(),
        email: external1Email.trim(),
      }];

      const response = await apiRequest(
        "/api/pbl3/send-external-otp",
        "POST",
        { externals, group_ids: groups },
        token
      );

      if (response && response.success) {
        setExternal1SessionToken(response.data.sessions[0]);
        setExternal1Countdown(response.data.expiresInMinutes * 60 || 600);
        setExternal1OtpSent(true);
        setSuccess("Verification code sent successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.message || "Failed to send verification code");
      }
    } catch (err) {
      setError(err.message || "An error occurred while sending verification code");
    } finally {
      setSendingOtp1(false);
    }
  };

  // Verify OTP for External 1
  const handleVerifyOtp1 = async () => {
    setError("");
    
    if (!otp1.trim()) {
      setError("Please enter verification code");
      return;
    }

    try {
      setVerifyingOtp1(true);
      const token = localStorage.getItem("token");

      const verifications = [{ sessionToken: external1SessionToken, otp: otp1.trim() }];

      const response = await apiRequest(
        "/api/pbl3/verify-external-otp",
        "POST",
        { verifications, group_ids: groups },
        token
      );

      if (response && response.success) {
        setExternal1OtpVerified(true);
        setOtp1("");
        
        // Save External 1 details to localStorage immediately after verification
        localStorage.setItem("external1_name", external1Name.trim());
        localStorage.setItem("organization1_name", external1Org.trim());
        localStorage.setItem("external1_contact", external1Phone.trim());
        localStorage.setItem("external1_email", external1Email.trim());
        
        setSuccess("Primary External Evaluator verified successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.message || "Verification failed. Please check your code.");
      }
    } catch (err) {
      setError(err.message || "An error occurred during verification");
    } finally {
      setVerifyingOtp1(false);
    }
  };

  // Send OTP to External 2
  const handleSendOtp2 = async () => {
    setError("");
    
    // Validation
    if (!external2Name.trim() || !external2Org.trim() || !external2Phone.trim() || !external2Email.trim()) {
      setError("Please fill all required fields for Secondary External Evaluator");
      return;
    }

    if (!validateEmail(external2Email)) {
      setError("Invalid email format for Secondary External Evaluator");
      return;
    }

    if (!validatePhone(external2Phone)) {
      setError("Phone number must be 10 digits for Secondary External Evaluator");
      return;
    }

    try {
      setSendingOtp2(true);
      const token = localStorage.getItem("token");

      const externals = [{
        name: external2Name.trim(),
        organization: external2Org.trim(),
        phone: external2Phone.trim(),
        email: external2Email.trim(),
      }];

      const response = await apiRequest(
        "/api/pbl3/send-external-otp",
        "POST",
        { externals, group_ids: groups },
        token
      );

      if (response && response.success) {
        setExternal2SessionToken(response.data.sessions[0]);
        setExternal2Countdown(response.data.expiresInMinutes * 60 || 600);
        setExternal2OtpSent(true);
        setSuccess("Verification code sent successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.message || "Failed to send verification code");
      }
    } catch (err) {
      setError(err.message || "An error occurred while sending verification code");
    } finally {
      setSendingOtp2(false);
    }
  };

  // Verify OTP for External 2
  const handleVerifyOtp2 = async () => {
    setError("");
    
    if (!otp2.trim()) {
      setError("Please enter verification code");
      return;
    }

    try {
      setVerifyingOtp2(true);
      const token = localStorage.getItem("token");

      const verifications = [{ sessionToken: external2SessionToken, otp: otp2.trim() }];

      const response = await apiRequest(
        "/api/pbl3/verify-external-otp",
        "POST",
        { verifications, group_ids: groups },
        token
      );

      if (response && response.success) {
        setExternal2OtpVerified(true);
        setOtp2("");
        
        // Save External 2 details to localStorage immediately after verification
        localStorage.setItem("external2_name", external2Name.trim());
        localStorage.setItem("organization2_name", external2Org.trim());
        localStorage.setItem("external2_contact", external2Phone.trim());
        localStorage.setItem("external2_email", external2Email.trim());
        
        setSuccess("Secondary External Evaluator verified successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.message || "Verification failed. Please check your code.");
      }
    } catch (err) {
      setError(err.message || "An error occurred during verification");
    } finally {
      setVerifyingOtp2(false);
    }
  };

  // Resend OTP handlers
  const handleResendOtp1 = async () => {
    setError("");
    try {
      setResendingOtp(true);
      const token = localStorage.getItem("token");

      const response = await apiRequest(
        "/api/pbl3/resend-external-otp",
        "POST",
        { sessionToken: external1SessionToken },
        token
      );

      if (response && response.success) {
        setExternal1Countdown(response.data.expiresInMinutes * 60 || 600);
        setSuccess("Verification code resent successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.message || "Failed to resend code");
      }
    } catch (err) {
      setError(err.message || "An error occurred while resending code");
    } finally {
      setResendingOtp(false);
    }
  };

  const handleResendOtp2 = async () => {
    setError("");
    try {
      setResendingOtp(true);
      const token = localStorage.getItem("token");

      const response = await apiRequest(
        "/api/pbl3/resend-external-otp",
        "POST",
        { sessionToken: external2SessionToken },
        token
      );

      if (response && response.success) {
        setExternal2Countdown(response.data.expiresInMinutes * 60 || 600);
        setSuccess("Verification code resent successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.message || "Failed to resend code");
      }
    } catch (err) {
      setError(err.message || "An error occurred while resending code");
    } finally {
      setResendingOtp(false);
    }
  };

  // Final registration submission - SIMPLIFIED (no database save needed)
  const handleProceed = async () => {
    setError("");
    
    if (!external1OtpVerified) {
      setError("Please verify Primary External Evaluator first");
      return;
    }

    if (addSecondExternal && !external2OtpVerified) {
      setError("Please verify Secondary External Evaluator or remove it");
      return;
    }

    localStorage.setItem("groups", JSON.stringify(groups));
    
    setSuccess("External evaluators registered successfully! Redirecting...");
    
    setTimeout(() => {
      navigate("/external-home");
    }, 1500);
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
                  {external1OtpVerified && (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-semibold">Verified</span>
                    </div>
                  )}
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

              {/* OTP Section for External 1 */}
              {!external1OtpVerified && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  {!external1OtpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp1}
                      disabled={sendingOtp1}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                    >
                      {sendingOtp1 ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                          Sending Code...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Verification Code
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-indigo-900">Verification Code Sent</p>
                          <p className="text-sm text-indigo-700 font-mono font-bold">
                            {formatTime(external1Countdown)}
                          </p>
                        </div>
                        <p className="text-xs text-indigo-700">
                          Check <strong>{external1Email}</strong> for the 6-digit code
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Enter Verification Code
                        </label>
                        <input
                          type="text"
                          value={otp1}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            if (value.length <= 6) setOtp1(value);
                          }}
                          placeholder="000000"
                          maxLength="6"
                          className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl font-mono font-bold tracking-[0.5em] text-slate-900"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleResendOtp1}
                          disabled={resendingOtp}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`w-4 h-4 ${resendingOtp ? 'animate-spin' : ''}`} />
                          Resend Code
                        </button>
                        <button
                          type="button"
                          onClick={handleVerifyOtp1}
                          disabled={verifyingOtp1 || !otp1 || external1Countdown <= 0}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                        >
                          {verifyingOtp1 ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                              </svg>
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Shield className="w-5 h-5" />
                              Verify
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Verified Badge */}
              {external1OtpVerified && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-900">Email Verified</p>
                      <p className="text-xs text-green-700">This evaluator has been successfully verified</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add Second External Button */}
            {!addSecondExternal && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAddSecondExternal(true)}
                  disabled={!external1OtpVerified}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 disabled:text-slate-400 font-medium rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 disabled:border-slate-200 transition-all disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add Second Evaluator (Optional)</span>
                  {!external1OtpVerified && <Lock className="w-4 h-4" />}
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
                    {external2OtpVerified && (
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-semibold">Verified</span>
                      </div>
                    )}
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

                {/* OTP Section for External 2 */}
                {!external2OtpVerified && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    {!external2OtpSent ? (
                      <button
                        type="button"
                        onClick={handleSendOtp2}
                        disabled={sendingOtp2}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                      >
                        {sendingOtp2 ? (
                          <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                            Sending Code...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Send Verification Code
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-indigo-900">Verification Code Sent</p>
                            <p className="text-sm text-indigo-700 font-mono font-bold">
                              {formatTime(external2Countdown)}
                            </p>
                          </div>
                          <p className="text-xs text-indigo-700">
                            Check <strong>{external2Email}</strong> for the 6-digit code
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Enter Verification Code
                          </label>
                          <input
                            type="text"
                            value={otp2}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              if (value.length <= 6) setOtp2(value);
                            }}
                            placeholder="000000"
                            maxLength="6"
                            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl font-mono font-bold tracking-[0.5em] text-slate-900"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleResendOtp2}
                            disabled={resendingOtp}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                          >
                            <RefreshCw className={`w-4 h-4 ${resendingOtp ? 'animate-spin' : ''}`} />
                            Resend Code
                          </button>
                          <button
                            type="button"
                            onClick={handleVerifyOtp2}
                            disabled={verifyingOtp2 || !otp2 || external2Countdown <= 0}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                          >
                            {verifyingOtp2 ? (
                              <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Shield className="w-5 h-5" />
                                Verify
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Verified Badge */}
                {external2OtpVerified && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-900">Email Verified</p>
                        <p className="text-xs text-green-700">This evaluator has been successfully verified</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Important Information */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">Verification Process</p>
                <p className="text-sm text-amber-800">
                  One-Time Passwords (OTP) will be sent to the provided email addresses for verification. 
                  Please ensure email addresses are correct and accessible.
                </p>
              </div>
            </div>

            {/* Proceed Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleProceed}
                disabled={!external1OtpVerified || (addSecondExternal && !external2OtpVerified) || submitting}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed text-base"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    <span>Proceed to evaluation</span>
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
