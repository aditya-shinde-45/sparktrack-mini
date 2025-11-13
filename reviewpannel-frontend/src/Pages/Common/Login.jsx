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
  const [isExternalEnabled, setIsExternalEnabled] = useState(false);
  const [savedExternals, setSavedExternals] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load saved external credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem("saved_external_logins");
    if (saved) {
      try {
        const parsedSaved = JSON.parse(saved);
        setSavedExternals(parsedSaved || []);
      } catch (e) {
        console.error("Error parsing saved logins:", e);
      }
    }
  }, []);

  // Check if external login should be enabled based on deadline controls
  useEffect(() => {
    const checkDeadlineControls = async () => {
      try {
        const response = await apiRequest("/api/deadlines", "GET");
        
        if (response && response.data) {
          const pblReview1 = response.data.find(d => d.key === 'pbl_review_1');
          const pblReview2 = response.data.find(d => d.key === 'pbl_review_2');
          
          const isEnabled = (pblReview1 && pblReview1.enabled) || (pblReview2 && pblReview2.enabled);
          setIsExternalEnabled(isEnabled);
        } else {
          setIsExternalEnabled(false);
        }
      } catch (error) {
        setIsExternalEnabled(false);
      }
    };

    checkDeadlineControls();
  }, []);

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

    if (role === "Admin") {
      endpoint = "/api/auth/login";
      payload = { username, password, role: apiRole };
    } else if (role === "External") {
      endpoint = "/api/external-auth/login";
      payload = { external_id: username, password };
    } else if (role === "Mentor") {
      endpoint = "/api/mentors/login";
      payload = { username, password };
    } else {
      setErrorMsg("Selected role is not supported for login.");
      return;
    }

    try {
      setLoading(true);
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
        
        // Redirect to register externals page for PBL3
        navigate("/register-externals");
      }

      if (role === "External") {
        // Get external data from response
        const externalId = data.user?.external_id || username;
        const externalName = data.user?.name || externalId;
        
        // Store BOTH the name (for display) and external_id (for identification)
        localStorage.setItem("name", externalName);
        localStorage.setItem("external_id", externalId);
        
        // Save this external login for future hints (max 5 entries)
        const newEntry = { 
          email: username, 
          name: externalName, 
          lastLogin: new Date().toISOString() 
        };
        const existingSaved = JSON.parse(localStorage.getItem("saved_external_logins") || "[]");
        const filtered = existingSaved.filter(e => e.email !== username);
        const updated = [newEntry, ...filtered].slice(0, 5);
        localStorage.setItem("saved_external_logins", JSON.stringify(updated));
        
        // Check if this is MITADT external login using external_id
        const isMITADT = externalId.toUpperCase() === "MITADT";
        
        if (isMITADT) {
          // For MITADT, redirect to mentor selection page
          window.location.href = "/mentor-selection";
          return; // Important: exit early to prevent further execution
        }
        
        // For other externals, proceed with normal group assignment
        const groupData = await apiRequest(
          "/api/external-auth/groups",
          "GET",
          null,
          data.token
        );
        localStorage.setItem("groups", JSON.stringify(groupData.groups || []));
        navigate("/external-home");
      }

      if (role === "Admin") {
        // Store admin-specific data
        const user = data.user || (data.data && data.data.user);
        if (user) {
          localStorage.setItem("name", user.username);
          localStorage.setItem("id", user.id);
        } else {
          localStorage.setItem("name", username);
        }
        
        // Set an auth flag to track successful authentication
        localStorage.setItem("isAuthenticated", "true");
        
        // Create a clean state by forcing a page reload to admin dashboard
        // This ensures all React components re-render with the new auth state
        console.log("Redirecting to admin dashboard...");
        window.location.href = "/admin-dashboard";
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg(error.message || "An unexpected error occurred");
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
                    role === "External" 
                      ? "Email (e.g., john@example.com)" 
                      : role === "Mentor"
                      ? "Phone Number (10 digits)"
                      : "Username"
                  }
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => role === "External" && savedExternals.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  required
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                {/* Suggestions Dropdown */}
                {role === "External" && showSuggestions && savedExternals.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-purple-200 overflow-hidden">
                    <div className="px-4 py-2 bg-purple-50 border-b border-purple-200">
                      <p className="text-xs font-semibold text-purple-700">💡 Recently used accounts</p>
                    </div>
                    {savedExternals.map((saved, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setUsername(saved.email);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{saved.name}</p>
                            <p className="text-xs text-gray-500">{saved.email}</p>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(saved.lastLogin).toLocaleDateString()}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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
                  required
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
                  {isExternalEnabled && (
                    <option value="External" className="bg-[#5D3FD3] text-white">External</option>
                  )}
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

              {/* Login Hints */}
              {role && (
                <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <p className="text-xs font-semibold text-white mb-2">💡 Login Hints:</p>
                  {role === "External" && (
                    <div className="text-xs text-white/90 space-y-1">
                      <p>• Use your email address</p>
                      <p>• OTP: <span className="font-mono font-bold text-yellow-300">123456</span></p>
                    </div>
                  )}
                  {role === "Mentor" && (
                    <div className="text-xs text-white/90 space-y-1">
                      <p>• Use your 10-digit phone number</p>
                      <p>• Password: <span className="font-mono font-bold text-yellow-300">MITADT1230</span></p>
                    </div>
                  )}
                  {role === "Admin" && (
                    <div className="text-xs text-white/90">
                      <p>• Contact administrator for credentials</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reviewer Admin Link */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/reviewer-admin/login')}
                  className="text-white/90 hover:text-white text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Reviewer Admin Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
