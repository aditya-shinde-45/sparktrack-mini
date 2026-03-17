import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Common/Navbar";
import { apiRequest } from "../../api.js"; // Import helper
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  // Mentor password setup states
  const [showMentorPasswordModal, setShowMentorPasswordModal] = useState(false);
  const [mentorPassword, setMentorPassword] = useState("");
  const [mentorConfirmPassword, setMentorConfirmPassword] = useState("");
  const [mentorContactNumber, setMentorContactNumber] = useState("");
  const [mentorName, setMentorName] = useState("");
  // OTP flow states
  const [otpStep, setOtpStep] = useState('otp'); // 'otp' | 'password'
  const [mentorOtp, setMentorOtp] = useState("");
  const [mentorSessionToken, setMentorSessionToken] = useState("");
  const [otpMaskedEmail, setOtpMaskedEmail] = useState("");
  const [otpExpiresIn, setOtpExpiresIn] = useState(10);
  const [otpModalLoading, setOtpModalLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Forgot Password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpStep, setFpStep] = useState('contact'); // 'contact' | 'otp' | 'password'
  const [fpContact, setFpContact] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpSessionToken, setFpSessionToken] = useState('');
  const [fpMaskedEmail, setFpMaskedEmail] = useState('');
  const [fpExpiresIn, setFpExpiresIn] = useState(10);
  const [fpPassword, setFpPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');

  // External login removed

  const validatePasswordStrength = (pw) => {
    if (!pw || pw.length < 8) return { valid: false, message: 'Password must be at least 8 characters long.' };
    if (!/[A-Z]/.test(pw)) return { valid: false, message: 'Password must contain at least one uppercase letter.' };
    if (!/[a-z]/.test(pw)) return { valid: false, message: 'Password must contain at least one lowercase letter.' };
    if (!/[0-9]/.test(pw)) return { valid: false, message: 'Password must contain at least one number.' };
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pw)) return { valid: false, message: 'Password must contain at least one special character.' };
    return { valid: true };
  };

  const toErrorText = (value, fallback = "An unexpected error occurred") => {
    if (!value) return fallback;
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      if (typeof value.message === "string") return value.message;
      try {
        return JSON.stringify(value);
      } catch {
        return fallback;
      }
    }
    return String(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!role) {
      setErrorMsg("Please select a role to log in.");
      return;
    }

    let endpoint = "";
    let payload = {};

    // Standardize role format for API (lowercase)
    const apiRole = role.toLowerCase();

    try {
      setLoading(true);
      
      // Handle Admin login with role-based authentication first
      if (role === "Admin") {
        // Try role login first for all admin logins
        console.log("Attempting role login for username:", username);
        try {
          const roleLoginResponse = await apiRequest("/api/roles/login", "POST", {
            userId: username,
            password: password
          });

          console.log("Role login response:", roleLoginResponse);

          // If we get here without exception, check success
          if (roleLoginResponse && roleLoginResponse.success) {
            // This is a role-based login - SUCCESS
            const token = roleLoginResponse.data?.token || roleLoginResponse.token;
            const user = roleLoginResponse.data?.user || roleLoginResponse.user;
            
            console.log("Role login successful, token:", token ? "received" : "missing");
            
            if (!token) {
              setErrorMsg("Login successful but no token received");
              return;
            }
            
            localStorage.setItem("token", token);
            localStorage.setItem("role", "admin");
            localStorage.setItem("user_id", username);
            localStorage.setItem("name", username);
            localStorage.setItem("isAuthenticated", "true");
            
            // Check if this is the main admin (8698078603) or sub-admin
            if (username === "8698078603") {
              localStorage.setItem("isMainAdmin", "true");
              console.log("Redirecting to main admin dashboard");
              navigate("/admin-dashboard");
            } else {
              localStorage.setItem("isMainAdmin", "false");
              console.log("Redirecting to sub-admin dashboard");
              navigate("/sub-admin-dashboard");
            }
            return;
          } else if (roleLoginResponse && !roleLoginResponse.success) {
            // If 404 → user is not in roles table at all, fall through to regular admin login
            if (roleLoginResponse.status === 404) {
              console.log("User not in roles table, trying regular admin login");
              // fall through
            } else {
              // 401/403 → user exists but wrong password or disabled — stop here
              console.log("Role login failed:", roleLoginResponse.message);
              setErrorMsg(toErrorText(roleLoginResponse.message, "Invalid credentials"));
              return;
            }
          }
        } catch (roleError) {
          // Role login threw error - check if it's 401 (user not found) or other error
          console.log("Role login caught error:", roleError);
          
          // If the error message explicitly says "Invalid credentials", it means
          // the user exists but password is wrong - don't try regular admin login
          if (roleError.message && roleError.message.includes("Invalid credentials")) {
            console.log("Invalid credentials for role user, not trying regular admin");
            setErrorMsg("Invalid credentials");
            return;
          }
          
          // Otherwise, user might not exist in roles table, try regular admin login
          console.log("User not found in roles table, trying regular admin login");
        }
        
        // Try regular admin login only if role user not found
        console.log("Attempting regular admin login for username:", username);
        endpoint = "/api/auth/login";
        payload = { username, password, role: apiRole };
      } else if (role === "Mentor") {
        // For mentor login, send credentials directly
        // Backend will handle first-time login with default password 'ideabliss2305'
        endpoint = "/api/mentors/login";
        payload = { username, password };
      } else if (role === "Industry Mentor") {
        endpoint = "/api/industrial-mentors/login";
        payload = { username, password };
      } else {
        setErrorMsg("Selected role is not supported for login.");
        return;
      }

      const data = await apiRequest(endpoint, "POST", payload);
      
      // Check for success flag to determine if request was successful
      if (!data || data.success === false) {
        setErrorMsg(toErrorText(data?.message, "Login failed. Invalid credentials."));
        return;
      }

      if (role === "Mentor") {
        const mentorData = data.data || data;

        // First-time login: backend returns no token, just a requirePasswordChange flag
        if (mentorData.requirePasswordChange) {
          // Reset OTP flow and open modal
          const contactNum = mentorData.contact_number || username;
          setMentorContactNumber(contactNum);
          setMentorName(mentorData.mentor_name || username);
          setOtpStep('otp');
          setMentorOtp('');
          setMentorSessionToken('');
          setOtpMaskedEmail('');
          setOtpError('');
          setMentorPassword('');
          setMentorConfirmPassword('');
          setShowMentorPasswordModal(true);
          setLoading(false);
          // Auto-send OTP
          try {
            setOtpModalLoading(true);
            const otpRes = await apiRequest('/api/mentors/request-otp', 'POST', { contact_number: contactNum });
            if (otpRes && otpRes.success) {
              setMentorSessionToken(otpRes.data.session_token);
              setOtpMaskedEmail(otpRes.data.email);
              setOtpExpiresIn(otpRes.data.expires_in_minutes);
            } else {
              setOtpError(otpRes?.message || 'Failed to send OTP. Please try again.');
            }
          } catch (err) {
            setOtpError(err.message || 'Failed to send OTP.');
          } finally {
            setOtpModalLoading(false);
          }
          return;
        }

        // Normal mentor login — extract and store token
        const token = data.token || (data.data && data.data.token);
        if (!token) {
          setErrorMsg("Login successful but no token received");
          return;
        }

        localStorage.removeItem('student_token');
        sessionStorage.clear();
        localStorage.setItem("token", token);
        localStorage.setItem("role", "mentor");
        // Store mentor token separately for mentor routes
        localStorage.setItem("mentor_token", token);
        localStorage.setItem("name", mentorData.mentor_name || username);
        localStorage.setItem("mentor_id", mentorData.mentor_id || "");
        localStorage.setItem("contact_number", mentorData.contact_number || username);
        
        // Fetch mentor's assigned groups
        try {
          const groupData = await apiRequest(
            "/api/mentors/groups",
            "GET",
            null,
            token
          );
          
          if (groupData && groupData.data) {
            localStorage.setItem("groups", JSON.stringify(groupData.data.groups || []));
          }
        } catch (error) {
          console.error("Error fetching groups:", error);
        }
        
        // Redirect to mentor dashboard
        navigate("/mentor/dashboard");
        return;
      }

      if (role === "Industry Mentor") {
        const mentorData = data.data || data;
        const token = data.token || (data.data && data.data.token);
        if (!token) {
          setErrorMsg("Login successful but no token received");
          return;
        }
        localStorage.removeItem('student_token');
        sessionStorage.clear();
        localStorage.setItem("token", token);
        localStorage.setItem("role", "industry_mentor");
        localStorage.setItem("industry_mentor_token", token);
        localStorage.setItem("name", mentorData.name || username);
        localStorage.setItem("industry_mentor_code", mentorData.industrial_mentor_code || "");
        localStorage.setItem("mentor_code", mentorData.mentor_code || "");
        localStorage.setItem("contact_number", mentorData.contact || username);

        navigate("/industry-mentor/dashboard");
        return;
      }

      if (role === "Admin") {
        // Admin login already handled above before the apiRequest
        // This code should only run if regular admin login succeeded
        console.log("Regular admin login response:", data);
        
        if (!data || data.success === false) {
          setErrorMsg(toErrorText(data?.message, "Login failed. Invalid credentials."));
          return;
        }

        const token = data.token || (data.data && data.data.token);
        if (!token) {
          setErrorMsg("Login successful but no token received");
          return;
        }

        localStorage.setItem("token", token);
        localStorage.setItem("role", "admin");
        
        const user = data.user || (data.data && data.data.user);
        if (user) {
          localStorage.setItem("name", user.username);
          localStorage.setItem("id", user.id);
          localStorage.setItem("user_id", user.username);
        } else {
          localStorage.setItem("name", username);
          localStorage.setItem("user_id", username);
        }
        
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("isMainAdmin", "true");
        console.log("Regular admin login successful, redirecting to admin dashboard");
        navigate("/admin-dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg(toErrorText(error?.message || error, "An unexpected error occurred"));
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Resend OTP
  const handleResendOtp = async () => {
    setOtpError('');
    setMentorOtp('');
    try {
      setOtpModalLoading(true);
      const otpRes = await apiRequest('/api/mentors/request-otp', 'POST', { contact_number: mentorContactNumber });
      if (otpRes && otpRes.success) {
        setMentorSessionToken(otpRes.data.session_token);
        setOtpMaskedEmail(otpRes.data.email);
        setOtpExpiresIn(otpRes.data.expires_in_minutes);
      } else {
        setOtpError(otpRes?.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setOtpError(err.message || 'Failed to resend OTP.');
    } finally {
      setOtpModalLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (!mentorOtp || mentorOtp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP.');
      return;
    }
    try {
      setOtpModalLoading(true);
      const res = await apiRequest('/api/mentors/verify-otp', 'POST', {
        session_token: mentorSessionToken,
        otp: mentorOtp,
      });
      if (res && res.success) {
        setOtpStep('password');
        setOtpError('');
      } else {
        setOtpError(res?.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed.');
    } finally {
      setOtpModalLoading(false);
    }
  };

  // Step 3: Set Password
  const handleMentorPasswordSetup = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (!mentorPassword || !mentorConfirmPassword) {
      setOtpError('Please enter and confirm your password.');
      return;
    }
    if (mentorPassword !== mentorConfirmPassword) {
      setOtpError('Passwords do not match.');
      return;
    }
    const pwCheck = validatePasswordStrength(mentorPassword);
    if (!pwCheck.valid) {
      setOtpError(pwCheck.message);
      return;
    }

    try {
      setOtpModalLoading(true);
      const data = await apiRequest('/api/mentors/set-password', 'POST', {
        contact_number: mentorContactNumber,
        session_token: mentorSessionToken,
        password: mentorPassword,
        confirm_password: mentorConfirmPassword,
      });

      if (data && data.success) {
        setShowMentorPasswordModal(false);
        setMentorPassword('');
        setMentorConfirmPassword('');
        setMentorSessionToken('');
        setMentorOtp('');
        setPassword('');
        alert('Password set successfully! Please login with your new password.');
      } else {
        setOtpError(data?.message || 'Failed to set password.');
      }
    } catch (error) {
      setOtpError(error.message || 'Failed to set password.');
    } finally {
      setOtpModalLoading(false);
    }
  };

  // ── Forgot Password handlers ──
  const openForgotModal = () => {
    setFpStep('contact');
    setFpContact('');
    setFpOtp('');
    setFpSessionToken('');
    setFpMaskedEmail('');
    setFpPassword('');
    setFpConfirmPassword('');
    setFpError('');
    setShowForgotModal(true);
  };

  const handleFpRequestOtp = async (e) => {
    e.preventDefault();
    setFpError('');
    if (!fpContact || fpContact.length < 10) {
      setFpError('Please enter a valid 10-digit contact number.');
      return;
    }
    try {
      setFpLoading(true);
      const requestOtpEndpoint = role === 'Industry Mentor'
        ? '/api/industrial-mentors/request-otp'
        : '/api/mentors/request-otp';
      const res = await apiRequest(requestOtpEndpoint, 'POST', { contact_number: fpContact });
      if (res && res.success) {
        setFpSessionToken(res.data.session_token);
        setFpMaskedEmail(res.data.email);
        setFpExpiresIn(res.data.expires_in_minutes);
        setFpStep('otp');
      } else {
        setFpError(res?.message || 'Failed to send OTP. Please check your contact number.');
      }
    } catch (err) {
      setFpError(err.message || 'Failed to send OTP.');
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpResendOtp = async () => {
    setFpError('');
    setFpOtp('');
    try {
      setFpLoading(true);
      const requestOtpEndpoint = role === 'Industry Mentor'
        ? '/api/industrial-mentors/request-otp'
        : '/api/mentors/request-otp';
      const res = await apiRequest(requestOtpEndpoint, 'POST', { contact_number: fpContact });
      if (res && res.success) {
        setFpSessionToken(res.data.session_token);
        setFpMaskedEmail(res.data.email);
        setFpExpiresIn(res.data.expires_in_minutes);
      } else {
        setFpError(res?.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setFpError(err.message || 'Failed to resend OTP.');
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpVerifyOtp = async (e) => {
    e.preventDefault();
    setFpError('');
    if (!fpOtp || fpOtp.length !== 6) {
      setFpError('Please enter the 6-digit OTP.');
      return;
    }
    try {
      setFpLoading(true);
      const verifyOtpEndpoint = role === 'Industry Mentor'
        ? '/api/industrial-mentors/verify-otp'
        : '/api/mentors/verify-otp';
      const res = await apiRequest(verifyOtpEndpoint, 'POST', {
        session_token: fpSessionToken,
        otp: fpOtp,
      });
      if (res && res.success) {
        setFpStep('password');
        setFpError('');
      } else {
        setFpError(res?.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setFpError(err.message || 'OTP verification failed.');
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpResetPassword = async (e) => {
    e.preventDefault();
    setFpError('');
    if (!fpPassword || !fpConfirmPassword) {
      setFpError('Please enter and confirm your new password.');
      return;
    }
    if (fpPassword !== fpConfirmPassword) {
      setFpError('Passwords do not match.');
      return;
    }
    const pwCheck = validatePasswordStrength(fpPassword);
    if (!pwCheck.valid) {
      setFpError(pwCheck.message);
      return;
    }
    try {
      setFpLoading(true);
      const setPasswordEndpoint = role === 'Industry Mentor'
        ? '/api/industrial-mentors/set-password'
        : '/api/mentors/set-password';
      const res = await apiRequest(setPasswordEndpoint, 'POST', {
        contact_number: fpContact,
        session_token: fpSessionToken,
        password: fpPassword,
        confirm_password: fpConfirmPassword,
      });
      if (res && res.success) {
        setShowForgotModal(false);
        alert('Password reset successfully! Please login with your new password.');
      } else {
        setFpError(res?.message || 'Failed to reset password.');
      }
    } catch (err) {
      setFpError(err.message || 'Failed to reset password.');
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <div className="font-[Poppins] min-h-screen bg-white">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 w-full z-10 bg-white shadow-sm border-b border-gray-100">
        <Navbar />
      </div>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-screen pt-24 px-4">
        {/* Glass morphism login container with sidebar color theme */}
        <div className="relative w-full max-w-md">
          {/* Primary glass background with sidebar gradient colors */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] backdrop-blur-2xl rounded-2xl border-2 border-white/20 shadow-2xl"></div>
          
          {/* Secondary glass layer for extra depth */}
          <div className="absolute inset-1 bg-gradient-to-b from-white/10 to-white/5 rounded-2xl"></div>
          
          {/* Content container */}
          <div className="relative z-10 p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-2 space-x-4">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                  Login
                </h1>
              </div>
            </div>
            
            {/* Error message */}
            {errorMsg && (
              <div className="bg-red-500/20 border border-red-500/50 text-white rounded-lg p-3 mb-4 text-sm">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Input */}
              <div className="relative">
                <input
                  className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                           text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                           focus:border-white/60 transition-all duration-300 shadow-lg"
                  placeholder={
                    role === "Mentor" || role === "Industry Mentor"
                      ? "Email Address"
                      : "Username"
                  }
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                {/* Suggestions Dropdown */}
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  className="w-full px-6 py-4 pr-12 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                           text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                           focus:border-white/60 transition-all duration-300 shadow-lg"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={role !== "Mentor"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 
                           rounded-lg transition-all duration-200 border border-white/20"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={16} className="text-white" />
                  ) : (
                    <Eye size={16} className="text-white" />
                  )}
                </button>
              </div>

              {/* Role Select */}
              <div className="relative">
                <select
                  className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                           text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 
                           transition-all duration-300 shadow-lg appearance-none cursor-pointer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="" className="bg-[#5D3FD3] text-white">Select Role</option>
                  <option value="Admin" className="bg-[#5D3FD3] text-white">Admin</option>
                  <option value="Mentor" className="bg-[#5D3FD3] text-white">Mentor</option>
                  <option value="Industry Mentor" className="bg-[#5D3FD3] text-white">Industry Mentor</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Submit Button */}
              <button
                className="w-full py-4 bg-white hover:bg-white/95 text-[#4C1D95] font-bold rounded-xl 
                         transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                         border border-white/50 disabled:opacity-70 disabled:cursor-not-allowed 
                         disabled:transform-none flex items-center justify-center gap-3"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-[#4C1D95]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>

              {/* Forgot Password – for Mentor and Industry Mentor */}
              {(role === 'Mentor' || role === 'Industry Mentor') && (
                <p className="text-center text-white/70 text-sm">
                  Forgot your password?{' '}
                  <button
                    type="button"
                    onClick={openForgotModal}
                    className="underline text-white hover:text-white/90 font-medium"
                  >
                    Reset it here
                  </button>
                </p>
              )}

            </form>
          </div>
        </div>
      </main>

      {/* Contact Details */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 py-3 px-4 z-20">
        <div className="max-w-md mx-auto text-center">
          <p className="text-xs text-gray-600 mb-1">
            <span className="font-semibold">Development Team:</span> Strawhats
          </p>
          <p className="text-xs text-gray-700">
            <span className="font-semibold">Contact:</span>{" "}
            <a href="mailto:sparktrack.ideabliss@gmail.com" className="text-[#5D3FD3] hover:underline">
              sparktrack.ideabliss@gmail.com
            </a>
            {" | "}
            <a href="tel:9356138585" className="text-[#5D3FD3] hover:underline">
              9356138585
            </a>
          </p>
        </div>
      </div>

      {/* Mentor Password Setup Modal – 2-step OTP flow */}
      {showMentorPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-white/20">

            {/* ── Step 1: OTP entry ── */}
            {otpStep === 'otp' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
                <p className="text-white/80 mb-1 text-sm">
                  Welcome, <span className="font-semibold">{mentorName}</span>!
                </p>
                {otpModalLoading && !otpMaskedEmail ? (
                  <p className="text-white/70 text-sm mb-6">Sending OTP to your registered email…</p>
                ) : (
                  <p className="text-white/70 text-sm mb-6">
                    A 6-digit OTP has been sent to{' '}
                    <span className="font-semibold text-white">{otpMaskedEmail}</span>.
                    {' '}It expires in {otpExpiresIn} minutes.
                  </p>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl
                             text-white placeholder-white/70 text-center text-2xl tracking-[0.5em]
                             focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60
                             transition-all duration-300 shadow-lg"
                    placeholder="── ── ── ── ── ──"
                    value={mentorOtp}
                    onChange={(e) => setMentorOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={otpModalLoading}
                    required
                  />

                  {otpError && (
                    <div className="p-3 bg-red-500/20 border-2 border-red-300/50 rounded-xl">
                      <p className="text-white text-sm">{otpError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowMentorPasswordModal(false); setOtpError(''); }}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold
                               rounded-xl transition-all duration-300 border-2 border-white/30"
                      disabled={otpModalLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold
                               rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl
                               border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={otpModalLoading || mentorOtp.length !== 6}
                    >
                      {otpModalLoading ? 'Verifying…' : 'Verify OTP'}
                    </button>
                  </div>

                  <p className="text-center text-white/60 text-xs pt-1">
                    Didn't receive it?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="underline text-white/80 hover:text-white disabled:opacity-40"
                      disabled={otpModalLoading}
                    >
                      Resend OTP
                    </button>
                  </p>
                </form>
              </>
            )}

            {/* ── Step 2: Set password ── */}
            {otpStep === 'password' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Set Your Password</h2>
                <p className="text-white/80 mb-6 text-sm">
                  OTP verified! Please create a password for your account.
                </p>

                <form onSubmit={handleMentorPasswordSetup} className="space-y-4">
                  <input
                    type="password"
                    className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl
                             text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50
                             focus:border-white/60 transition-all duration-300 shadow-lg"
                    placeholder="New Password (min 8 chars, A-Z, 0-9, symbol)"
                    value={mentorPassword}
                    onChange={(e) => setMentorPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={otpModalLoading}
                  />
                  <input
                    type="password"
                    className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl
                             text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50
                             focus:border-white/60 transition-all duration-300 shadow-lg"
                    placeholder="Confirm Password"
                    value={mentorConfirmPassword}
                    onChange={(e) => setMentorConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={otpModalLoading}
                  />

                  {otpError && (
                    <div className="p-3 bg-red-500/20 border-2 border-red-300/50 rounded-xl">
                      <p className="text-white text-sm">{otpError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowMentorPasswordModal(false); setOtpError(''); }}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold
                               rounded-xl transition-all duration-300 border-2 border-white/30"
                      disabled={otpModalLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold
                               rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl
                               border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={otpModalLoading}
                    >
                      {otpModalLoading ? 'Setting…' : 'Set Password'}
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      )}
      {/* ── Forgot Password Modal ── */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-white/20">

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {['contact', 'otp', 'password'].map((s, i) => (
                <React.Fragment key={s}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                    ${ ['contact','otp','password'].indexOf(fpStep) >= i
                      ? 'bg-white text-[#5D3FD3] border-white'
                      : 'bg-white/10 text-white/50 border-white/30'}`}>
                    {i + 1}
                  </div>
                  {i < 2 && <div className={`flex-1 h-0.5 transition-all ${ ['contact','otp','password'].indexOf(fpStep) > i ? 'bg-white' : 'bg-white/20'}`} />}
                </React.Fragment>
              ))}
            </div>

            {/* ── Step 1: Enter contact number ── */}
            {fpStep === 'contact' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Forgot Password</h2>
                <p className="text-white/70 text-sm mb-6">
                  Enter your registered contact number and we'll send an OTP to your email.
                </p>
                <form onSubmit={handleFpRequestOtp} className="space-y-4">
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl
                             text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50
                             focus:border-white/60 transition-all duration-300 shadow-lg"
                    placeholder="Registered Contact Number"
                    value={fpContact}
                    onChange={(e) => setFpContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    disabled={fpLoading}
                    required
                  />
                  {fpError && (
                    <div className="p-3 bg-red-500/20 border-2 border-red-300/50 rounded-xl">
                      <p className="text-white text-sm">{fpError}</p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold
                               rounded-xl transition-all duration-300 border-2 border-white/30"
                      disabled={fpLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold
                               rounded-xl transition-all duration-300 shadow-lg
                               border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={fpLoading || fpContact.length < 10}
                    >
                      {fpLoading ? 'Sending…' : 'Send OTP'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ── Step 2: Enter OTP ── */}
            {fpStep === 'otp' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Enter OTP</h2>
                <p className="text-white/70 text-sm mb-6">
                  A 6-digit OTP has been sent to{' '}
                  <span className="font-semibold text-white">{fpMaskedEmail}</span>.
                  {' '}It expires in {fpExpiresIn} minutes.
                </p>
                <form onSubmit={handleFpVerifyOtp} className="space-y-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl
                             text-white placeholder-white/70 text-center text-2xl tracking-[0.5em]
                             focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60
                             transition-all duration-300 shadow-lg"
                    placeholder="── ── ── ── ── ──"
                    value={fpOtp}
                    onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={fpLoading}
                    required
                  />
                  {fpError && (
                    <div className="p-3 bg-red-500/20 border-2 border-red-300/50 rounded-xl">
                      <p className="text-white text-sm">{fpError}</p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setFpStep('contact'); setFpError(''); setFpOtp(''); }}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold
                               rounded-xl transition-all duration-300 border-2 border-white/30"
                      disabled={fpLoading}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold
                               rounded-xl transition-all duration-300 shadow-lg
                               border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={fpLoading || fpOtp.length !== 6}
                    >
                      {fpLoading ? 'Verifying…' : 'Verify OTP'}
                    </button>
                  </div>
                  <p className="text-center text-white/60 text-xs pt-1">
                    Didn't receive it?{' '}
                    <button
                      type="button"
                      onClick={handleFpResendOtp}
                      className="underline text-white/80 hover:text-white disabled:opacity-40"
                      disabled={fpLoading}
                    >
                      Resend OTP
                    </button>
                  </p>
                </form>
              </>
            )}

            {/* ── Step 3: New Password ── */}
            {fpStep === 'password' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-white/70 text-sm mb-6">
                  OTP verified! Please enter your new password.
                </p>
                <form onSubmit={handleFpResetPassword} className="space-y-4">
                  <input
                    type="password"
                    className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl
                             text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50
                             focus:border-white/60 transition-all duration-300 shadow-lg"
                    placeholder="New Password (min 8 chars, A-Z, 0-9, symbol)"
                    value={fpPassword}
                    onChange={(e) => setFpPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={fpLoading}
                  />
                  <input
                    type="password"
                    className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl
                             text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50
                             focus:border-white/60 transition-all duration-300 shadow-lg"
                    placeholder="Confirm New Password"
                    value={fpConfirmPassword}
                    onChange={(e) => setFpConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={fpLoading}
                  />
                  {fpError && (
                    <div className="p-3 bg-red-500/20 border-2 border-red-300/50 rounded-xl">
                      <p className="text-white text-sm">{fpError}</p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold
                               rounded-xl transition-all duration-300 border-2 border-white/30"
                      disabled={fpLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold
                               rounded-xl transition-all duration-300 shadow-lg
                               border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={fpLoading}
                    >
                      {fpLoading ? 'Resetting…' : 'Reset Password'}
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
