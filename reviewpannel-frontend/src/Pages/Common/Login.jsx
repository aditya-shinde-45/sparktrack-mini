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

  // External login removed

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
              window.location.href = "/admin-dashboard";
            } else {
              localStorage.setItem("isMainAdmin", "false");
              console.log("Redirecting to sub-admin dashboard");
              window.location.href = "/sub-admin-dashboard";
            }
            return;
          } else if (roleLoginResponse && !roleLoginResponse.success) {
            // Role exists but wrong password - show error immediately
            console.log("Role login failed:", roleLoginResponse.message);
            setErrorMsg(roleLoginResponse.message || "Invalid credentials");
            return;
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
      } else {
        setErrorMsg("Selected role is not supported for login.");
        return;
      }

      const data = await apiRequest(endpoint, "POST", payload);
      
      // Check for success flag to determine if request was successful
      if (!data || data.success === false) {
        setErrorMsg(data?.message || "Login failed. Invalid credentials.");
        return;
      }

      // If we reach here, login was successful
      // Clear any existing tokens/data first
      localStorage.removeItem('token');
      localStorage.removeItem('student_token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('id');
      localStorage.removeItem('groups');
      
      // Store new token and data - handling both response structures
      const token = data.token || (data.data && data.data.token);
      
      if (!token) {
        setErrorMsg("Login successful but no token received");
        return;
      }
      
      // Clear old session data first
      sessionStorage.clear();
      
      // Set token and role in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", role.toLowerCase());

      // Extract additional data from the response - handling both structures
      const user = data.user || (data.data && data.data.user);
      if (user) {
        localStorage.setItem("user_id", user.id);
        localStorage.setItem("username", user.username);
      }

      if (role === "Mentor") {
        // Store mentor data from response
        const mentorData = data.data || data;
        
        // Check if this is first-time login (password needs to be set)
        if (mentorData.requirePasswordChange) {
          // Show password setup modal for first-time users
          setMentorContactNumber(username);
          setMentorName(mentorData.mentor_name || username);
          setShowMentorPasswordModal(true);
          setLoading(false);
          return;
        }
        
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
        window.location.href = "/mentor/dashboard";
        return;
      }

      if (role === "Admin") {
        // Admin login already handled above before the apiRequest
        // This code should only run if regular admin login succeeded
        console.log("Regular admin login response:", data);
        
        if (!data || data.success === false) {
          setErrorMsg(data?.message || "Login failed. Invalid credentials.");
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
        window.location.href = "/admin-dashboard";
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle mentor password setup
  const handleMentorPasswordSetup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!mentorPassword || !mentorConfirmPassword) {
      setErrorMsg("Please enter and confirm your password.");
      return;
    }

    if (mentorPassword !== mentorConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (mentorPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest("/api/mentors/set-password", "POST", {
        contact_number: mentorContactNumber,
        password: mentorPassword,
        confirm_password: mentorConfirmPassword
      });

      if (data && data.success) {
        setErrorMsg("");
        setShowMentorPasswordModal(false);
        setMentorPassword("");
        setMentorConfirmPassword("");
        alert("Password set successfully! Please login with your new password.");
        // Clear the username field so mentor can re-enter
        setPassword("");
      } else {
        setErrorMsg(data?.message || "Failed to set password.");
      }
    } catch (error) {
      console.error("Password setup error:", error);
      setErrorMsg(error.message || "Failed to set password.");
    } finally {
      setLoading(false);
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
                    role === "Mentor"
                      ? "Phone Number (10 digits)"
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

            </form>
          </div>
        </div>
      </main>

      {/* Mentor Password Setup Modal */}
      {showMentorPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-[#7B74EF] to-[#5D3FD3] rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-white/20">
            <h2 className="text-2xl font-bold text-white mb-2">Set Your Password</h2>
            <p className="text-white/80 mb-6 text-sm">
              Welcome, <span className="font-semibold">{mentorName}</span>! Please set a password for your account.
            </p>

            <form onSubmit={handleMentorPasswordSetup} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  className="w-full px-6 py-4 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-xl 
                           text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 
                           focus:border-white/60 transition-all duration-300 shadow-lg"
                  placeholder="New Password (min 6 characters)"
                  value={mentorPassword}
                  onChange={(e) => setMentorPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="relative">
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
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/20 border-2 border-red-300/50 rounded-xl">
                  <p className="text-white text-sm">{errorMsg}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMentorPasswordModal(false);
                    setMentorPassword("");
                    setMentorConfirmPassword("");
                    setErrorMsg("");
                  }}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold 
                           rounded-xl transition-all duration-300 border-2 border-white/30"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-white hover:bg-white/95 text-[#4C1D95] font-semibold 
                           rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl 
                           border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Setting...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
