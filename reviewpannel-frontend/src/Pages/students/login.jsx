import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api"; // centralized API
import backgroundImage from "../../assets/login.png"; // Import your image
import LoginHeader from "../../Components/Common/Navbar"; // Import LoginHeader

const StudentLogin = () => {
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // 'login', 'firstTime', 'forgot'
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Auto-refresh token on page load if refresh token exists
  useEffect(() => {
    const refreshToken = localStorage.getItem("student_refresh_token");
    // Only auto-refresh if we have a token and we're coming from a direct link
    // Don't auto-refresh if user just logged out
    if (refreshToken && window.location.pathname === '/studentlogin') {
      refreshAccessToken(refreshToken);
    }
  }, []);

  // Reset state when mode changes
  useEffect(() => {
    setMessage("");
    setOtpSent(false);
    setOtp("");
    setNewPassword("");
    setPassword("");
    setEmail("");
    setEnrollmentNo("");
  }, [mode]);

  // Function to refresh access token using refresh token
  const refreshAccessToken = async (refreshToken) => {
    try {
      const res = await apiRequest("/api/student-auth/refresh-token", "POST", { refreshToken });
      if (res.success && res.data?.token) {
        localStorage.setItem("student_token", res.data.token);
        // Optionally redirect if already logged in
        const enrollmentId = res.data?.student?.enrollment_no;
        if (enrollmentId) {
          localStorage.setItem("enrollmentNumber", enrollmentId);
          // Use a small delay to ensure state is updated
          setTimeout(() => {
            navigate("/studentdashboard");
          }, 100);
        }
      } else {
        // Refresh token expired or invalid, remove it
        localStorage.removeItem("student_refresh_token");
      }
    } catch (error) {
      console.error("Failed to refresh token:", error);
      localStorage.removeItem("student_refresh_token");
    }
  };

  // Login handler (now with enrollment_no and rememberMe)
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    const res = await apiRequest("/api/student-auth/login", "POST", { 
      enrollment_no: enrollmentNo, 
      password,
      rememberMe 
    });
    if (res.success === false) {
      setMessage(res.message || "Login failed.");
    } else {
      setMessage(res.message || "Login successful.");
      // Save access token
      const token = res.data?.token || res.token;
      if (token) {
        localStorage.setItem("student_token", token);
      }
      // Save refresh token if remember me was checked
      const refreshToken = res.data?.refreshToken;
      if (refreshToken) {
        localStorage.setItem("student_refresh_token", refreshToken);
      } else {
        // Clear refresh token if not using remember me
        localStorage.removeItem("student_refresh_token");
      }
      const enrollmentId = res.data?.student?.enrollment_no || res.enrollment_no || enrollmentNo;
      if (enrollmentId || enrollmentNo) {
        localStorage.setItem("enrollmentNumber", enrollmentId || enrollmentNo);
      }
      // Redirect to student dashboard
      navigate("/studentdashboard");
    }
  };

  // Send OTP for first time user
  const handleSendFirstTimeOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    
    try {
      const res = await apiRequest("/api/student-auth/first-time/send-otp", "POST", { email });
      if (res.success === false) {
        setMessage(res.message || "Failed to send OTP.");
      } else {
        setMessage("✓ OTP sent successfully! Please check your email.");
        setOtpSent(true);
      }
    } catch (error) {
      setMessage("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Set password for first time user
  const handleSetNewUserPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await apiRequest("/api/student-auth/set-password", "POST", { email, otp, newPassword });
      if (res.success === false) {
        setMessage(res.message || "Failed to set password.");
      } else {
        setMessage("✓ Registration successful! You can now login.");
        setTimeout(() => {
          setOtpSent(false);
          setMode("login");
        }, 2000);
      }
    } catch (error) {
      setMessage("Failed to set password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Send OTP for forgot password
  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    
    try {
      const res = await apiRequest("/api/student-auth/forgot-password/send-otp", "POST", { email });
      if (res.success === false) {
        setMessage(res.message || "Failed to send OTP. Please check your email and try again.");
      } else {
        setMessage("✓ OTP sent successfully! Please check your email (including spam folder).");
        setOtpSent(true);
      }
    } catch (error) {
      setMessage("Failed to send OTP. Please try again.");
      console.error("Send OTP error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    
    // Validation
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return;
    }
    
    if (otp.length !== 6) {
      setMessage("Please enter a valid 6-digit OTP.");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await apiRequest("/api/student-auth/forgot-password/reset", "POST", { email, otp, newPassword });
      if (res.success === false) {
        setMessage(res.message || "Failed to reset password. Please check your OTP and try again.");
      } else {
        setMessage("✓ Password reset successful! You can now login with your new password.");
        // Wait 2 seconds before switching to login mode
        setTimeout(() => {
          setOtpSent(false);
          setMode("login");
        }, 2000);
      }
    } catch (error) {
      setMessage("Failed to reset password. Please try again.");
      console.error("Reset password error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#f8fafc]">
      {/* Login Header - Fixed at top */}
      <LoginHeader />

      {/* Background Image */}
      <img
        src={backgroundImage}
        alt="Login background"
        className="absolute inset-0 w-full h-full"
      />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-start pt-20 lg:pl-20 xl:pl-32">
        {/* Glass morphism login container with sidebar color theme */}
        <div className="relative w-full max-w-md mx-4 lg:mx-0">
          {/* Primary glass background with sidebar gradient colors */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] backdrop-blur-2xl rounded-2xl border-2 border-white/20 shadow-2xl"></div>
          
          {/* Secondary glass layer for extra depth */}
          <div className="absolute inset-1 bg-gradient-to-b from-white/10 to-white/5 rounded-2xl"></div>
          
          {/* Content container */}
          <div className="relative z-10 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                {mode === "login" ? "Login" : mode === "firstTime" ? "Register" : "Reset Password"}
              </h1>
              <p className="text-white/80 text-sm drop-shadow-md">
                SparkTrack Student Portal
              </p>
            </div>

            {/* Forms */}
            <div className="space-y-6">
              {/* Login Form */}
              {mode === "login" && (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                               text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                               focus:border-white/60 transition-all duration-300 shadow-lg"
                      value={enrollmentNo}
                      onChange={(e) => setEnrollmentNo(e.target.value)}
                      required
                      placeholder="Enrollment Number"
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-6 py-4 pr-12 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                               text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                               focus:border-white/60 transition-all duration-300 shadow-lg"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 
                               rounded-lg transition-all duration-200 border border-white/20"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.97 0-9-3.582-9-8s4.03-8 9-8 9 3.582 9 8a9.06 9.06 0 01-2.125 5.825M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center text-white/80 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mr-2 w-4 h-4 text-[#4C1D95] bg-white/20 border-white/30 rounded focus:ring-white/50 focus:ring-2"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      Remember me
                    </label>
                    <button 
                      type="button" 
                      className="text-white/80 hover:text-white transition-colors font-medium"
                      onClick={() => setMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    className="w-full py-4 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold 
                             rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                             border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>

                  <div className="text-center">
                    <p className="text-white/80 text-sm">
                      Don't have an account?{" "}
                      <button 
                        type="button"
                        onClick={() => setMode("firstTime")} 
                        className="text-white hover:text-white/80 font-medium transition-colors underline"
                      >
                        Register
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* First Time User Form */}
              {mode === "firstTime" && (
                <div className="space-y-6">
                  {!otpSent ? (
                    <form onSubmit={handleSendFirstTimeOtp} className="space-y-6">
                      <div className="relative">
                        <input
                          type="email"
                          className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                                   text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                                   focus:border-white/60 transition-all duration-300 shadow-lg"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="Email Address"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                      </div>
                      <button
                        className="w-full py-4 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold 
                                 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                                 border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                      </button>
                      <div className="text-center">
                        <button 
                          type="button"
                          onClick={() => setMode("login")} 
                          className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                        >
                          ← Back to Login
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleSetNewUserPassword} className="space-y-6">
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                                   text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                                   focus:border-white/60 transition-all duration-300 shadow-lg"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                          placeholder="Enter OTP"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                                   text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                                   focus:border-white/60 transition-all duration-300 shadow-lg"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          placeholder="Create Password"
                        />
                      </div>
                      <button
                        className="w-full py-4 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold 
                                 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                                 border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Setting Password...' : 'Set Password'}
                      </button>
                      <div className="flex justify-between items-center text-center">
                        <button 
                          type="button"
                          onClick={() => setOtpSent(false)} 
                          className="text-white/80 hover:text-white transition-colors text-sm font-medium underline"
                        >
                          Resend OTP
                        </button>
                        <button 
                          type="button"
                          onClick={() => setMode("login")} 
                          className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                        >
                          ← Back to Login
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Forgot Password Form */}
              {mode === "forgot" && (
                <div className="space-y-6">
                  {!otpSent ? (
                    <form onSubmit={handleSendForgotOtp} className="space-y-6">
                      <div className="relative">
                        <input
                          type="email"
                          className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                                   text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                                   focus:border-white/60 transition-all duration-300 shadow-lg"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="Email Address"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                      </div>
                      <button
                        className="w-full py-4 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold 
                                 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                                 border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Sending Code...' : 'Send Reset Code'}
                      </button>
                      <div className="text-center">
                        <button 
                          type="button"
                          onClick={() => setMode("login")} 
                          className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                        >
                          ← Back to Login
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                                   text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                                   focus:border-white/60 transition-all duration-300 shadow-lg"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                          placeholder="Enter Reset Code"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                                   text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                                   focus:border-white/60 transition-all duration-300 shadow-lg"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          placeholder="New Password"
                        />
                      </div>
                      <button
                        className="w-full py-4 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold 
                                 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                                 border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? 'Resetting Password...' : 'Reset Password'}
                      </button>
                      <div className="flex justify-between items-center text-center">
                        <button 
                          type="button"
                          onClick={() => setOtpSent(false)} 
                          className="text-white/80 hover:text-white transition-colors text-sm font-medium underline"
                        >
                          Resend Code
                        </button>
                        <button 
                          type="button"
                          onClick={() => setMode("login")} 
                          className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                        >
                          ← Back to Login
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Message display with success/error styling */}
            {message && (
              <div className={`mt-6 p-4 backdrop-blur-md border-2 rounded-xl text-center shadow-lg ${
                message.includes('✓') || message.includes('successful') 
                  ? 'bg-green-500/20 border-green-300/50' 
                  : 'bg-red-500/20 border-red-300/50'
              }`}>
                <p className="text-white font-medium text-sm drop-shadow-md">
                  {message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;