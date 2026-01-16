import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api";
import backgroundImage from "../../assets/login.png";
import LoginHeader from "../../Components/Common/Navbar";

const StudentLogin = () => {
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    
    try {
      const res = await apiRequest("/api/student-auth/login", "POST", { 
        enrollment_no: enrollmentNo, 
        password
      });
      
      if (res.success === false) {
        setMessage(res.message || "Login failed.");
      } else if (res.data?.needsPasswordSetup) {
        setNeedsPasswordSetup(true);
        setMessage("Please set your password to continue.");
      } else {
        const token = res.data?.token || res.token;
        if (token) {
          localStorage.setItem("student_token", token);
        }
        const enrollmentId = res.data?.student?.enrollment_no || res.enrollment_no || enrollmentNo;
        if (enrollmentId || enrollmentNo) {
          localStorage.setItem("enrollmentNumber", enrollmentId || enrollmentNo);
        }
        navigate("/studentdashboard");
      }
    } catch (error) {
      setMessage("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    
    try {
      const res = await apiRequest("/api/student-auth/set-password", "POST", { 
        enrollment_no: enrollmentNo, 
        newPassword
      });
      
      if (res.success === false) {
        setMessage(res.message || "Failed to set password.");
      } else {
        setMessage("Password set successfully! Please login.");
        setTimeout(() => {
          setNeedsPasswordSetup(false);
          setPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }, 2000);
      }
    } catch (error) {
      setMessage("Failed to set password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOTP = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await apiRequest("/api/student-auth/forgot-password/send-otp", "POST", { email: forgotEmail });
      
      if (res.success === false) {
        setMessage(res.message || "Failed to send OTP.");
      } else {
        setMessage("OTP sent to your email successfully!");
        setOtpSent(true);
      }
    } catch (error) {
      setMessage("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (forgotNewPassword.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest("/api/student-auth/forgot-password/reset", "POST", { 
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword
      });
      
      if (res.success === false) {
        setMessage(res.message || "Failed to reset password.");
      } else {
        setMessage("Password reset successfully! Please login.");
        setTimeout(() => {
          setShowForgotPassword(false);
          setOtpSent(false);
          setForgotEmail("");
          setForgotOtp("");
          setForgotNewPassword("");
        }, 2000);
      }
    } catch (error) {
      setMessage("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#f8fafc]">
      {/* Login Header - Fixed at top */}
      <LoginHeader />

      {/* Background Image - Hidden on mobile */}
      <img
        src={backgroundImage}
        alt="Login background"
        className="absolute inset-0 w-full h-full hidden lg:block"
      />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:justify-start lg:pl-20 xl:pl-32">
        {/* Glass morphism login container with sidebar color theme */}
        <div className="relative w-full max-w-md">
          {/* Primary glass background with sidebar gradient colors */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] backdrop-blur-2xl rounded-2xl border-2 border-white/20 shadow-2xl"></div>
          
          {/* Secondary glass layer for extra depth */}
          <div className="absolute inset-1 bg-gradient-to-b from-white/10 to-white/5 rounded-2xl"></div>
          
          {/* Content container */}
          <div className="relative z-10 p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                {needsPasswordSetup ? "Set Password" : showForgotPassword ? "Reset Password" : "Login"}
              </h1>
              <p className="text-white/80 text-xs sm:text-sm drop-shadow-md">
                {needsPasswordSetup 
                  ? "Create a new password for your account" 
                  : showForgotPassword
                  ? "Enter your email to reset password"
                  : "SparkTrack Student Portal"}
              </p>
            </div>

            {/* Forms */}
            <div className="space-y-4 sm:space-y-6">
              {!needsPasswordSetup && !showForgotPassword ? (
                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                               text-white text-sm sm:text-base placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                               focus:border-white/60 transition-all duration-300 shadow-lg"
                      value={enrollmentNo}
                      onChange={(e) => setEnrollmentNo(e.target.value)}
                      required
                      placeholder="Enrollment Number"
                    />
                    <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-3 pr-12 sm:px-6 sm:py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                               text-white text-sm sm:text-base placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
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
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.97 0-9-3.582-9-8s4.03-8 9-8 9 3.582 9 8a9.06 9.06 0 01-2.125 5.825M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>



                <button
                  className="w-full py-3 sm:py-4 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold text-sm sm:text-base
                           rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                           border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm font-medium underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>
              ) : showForgotPassword ? (
                !otpSent ? (
                  <form onSubmit={handleSendForgotOTP} className="space-y-4 sm:space-y-6">
                    <div className="relative">
                      <input
                        type="email"
                        className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                                 text-white text-sm sm:text-base placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                                 focus:border-white/60 transition-all duration-300 shadow-lg"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
                      />
                    </div>

                    <button
                      className="w-full py-3 sm:py-4 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold text-sm sm:text-base
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
                        onClick={() => setShowForgotPassword(false)}
                        className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm font-medium"
                      >
                        ← Back to Login
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-6">
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                                 text-white text-sm sm:text-base placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                                 focus:border-white/60 transition-all duration-300 shadow-lg"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value)}
                        required
                        placeholder="Enter OTP"
                        maxLength="6"
                      />
                    </div>

                    <div className="relative">
                      <input
                        type="password"
                        className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                                 text-white text-sm sm:text-base placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                                 focus:border-white/60 transition-all duration-300 shadow-lg"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        required
                        placeholder="New Password (min 6 characters)"
                      />
                    </div>

                    <button
                      className="w-full py-3 sm:py-4 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold text-sm sm:text-base
                               rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                               border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>

                    <div className="text-center">
                      <button 
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setForgotOtp("");
                          setForgotNewPassword("");
                        }}
                        className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm font-medium"
                      >
                        ← Back
                      </button>
                    </div>
                  </form>
                )
              ) : (
                <form onSubmit={handleSetPassword} className="space-y-4 sm:space-y-6">
                  <div className="relative">
                    <input
                      type="password"
                      className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                               text-white text-sm sm:text-base placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                               focus:border-white/60 transition-all duration-300 shadow-lg"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="New Password (min 6 characters)"
                    />
                  </div>

                  <div className="relative">
                    <input
                      type="password"
                      className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                               text-white text-sm sm:text-base placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                               focus:border-white/60 transition-all duration-300 shadow-lg"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm Password"
                    />
                  </div>

                  <button
                    className="w-full py-3 sm:py-4 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold text-sm sm:text-base
                             rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                             border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Setting Password...' : 'Set Password'}
                  </button>

                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => {
                        setNeedsPasswordSetup(false);
                        setNewPassword("");
                        setConfirmPassword("");
                        setMessage("");
                      }}
                      className="text-white/80 hover:text-white transition-colors text-xs sm:text-sm font-medium"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              )}
            </div>

            {message && (
              <div className={`mt-4 sm:mt-6 p-3 sm:p-4 backdrop-blur-md border-2 rounded-xl text-center shadow-lg ${
                message.includes('successfully') || message.includes('Please set')
                  ? 'bg-green-500/20 border-green-300/50'
                  : 'bg-red-500/20 border-red-300/50'
              }`}>
                <p className="text-white font-medium text-xs sm:text-sm drop-shadow-md">
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