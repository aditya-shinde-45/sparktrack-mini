import React, { useState, useEffect } from "react";
import { apiRequest } from "../../api"; // centralized API

const StudentLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // 'login', 'firstTime', 'forgot'
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Reset state when mode changes
  useEffect(() => {
    setMessage("");
    setOtpSent(false);
    setOtp("");
    setNewPassword("");
    setPassword("");
    setEmail("");
  }, [mode]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    const data = await apiRequest("/api/student/login", "POST", { email, password });
    if (data.success === false) {
      setMessage(data.message || "Login failed.");
    } else {
      setMessage(data.message || "Login successful.");
      // TODO: Save token, redirect, etc.
    }
  };

  // Send OTP for first time user
  const handleSendFirstTimeOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    const data = await apiRequest("/api/student/first-time/send-otp", "POST", { email });
    if (data.success === false) {
      setMessage(data.message || "Failed to send OTP.");
    } else {
      setMessage(data.message || "OTP sent to your email.");
      setOtpSent(true);
    }
  };

  // Set password for first time user
  const handleSetNewUserPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    const data = await apiRequest("/api/student/set-password", "POST", { email, otp, newPassword });
    if (data.success === false) {
      setMessage(data.message || "Failed to set password.");
    } else {
      setMessage(data.message || "Registration successful. You can now login.");
      setOtpSent(false);
      setMode("login");
    }
  };

  // Send OTP for forgot password
  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    const data = await apiRequest("/api/student/forgot-password/send-otp", "POST", { email });
    if (data.success === false) {
      setMessage(data.message || "Failed to send OTP.");
    } else {
      setMessage(data.message || "OTP sent to your email.");
      setOtpSent(true);
    }
  };

  // Reset password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    const data = await apiRequest("/api/student/forgot-password/reset", "POST", { email, otp, newPassword });
    if (data.success === false) {
      setMessage(data.message || "Failed to reset password.");
    } else {
      setMessage(data.message || "Password reset successful. You can now login.");
      setOtpSent(false);
      setMode("login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-6">
          Student Login
        </h2>
        <div className="flex justify-center mb-6 gap-2">
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              mode === "login"
                ? "bg-purple-600 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-purple-50"
            }`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              mode === "firstTime"
                ? "bg-purple-600 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-purple-50"
            }`}
            onClick={() => setMode("firstTime")}
          >
            First Time User
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              mode === "forgot"
                ? "bg-purple-600 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-purple-50"
            }`}
            onClick={() => setMode("forgot")}
          >
            Forgot Password
          </button>
        </div>

        {/* Login */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-700 mb-1">Email ID</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white text-gray-900 placeholder-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="Enter your email"
              />
            </div>
            <div className="relative">
              <label className="block text-gray-700 mb-1">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white text-gray-900 placeholder-gray-400 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
              />
              <span
                className="absolute right-3 top-9 cursor-pointer text-gray-500 hover:text-purple-700"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.175-6.125M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .53-.138 1.03-.38 1.46M6.1 6.1A9.96 9.96 0 002 12c0 5.523 4.477 10 10 10a9.96 9.96 0 006.125-2.175" />
                  </svg>
                )}
              </span>
            </div>
            <button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition"
              type="submit"
            >
              Login
            </button>
          </form>
        )}

        {/* First Time User */}
        {mode === "firstTime" && (
          <>
            {!otpSent ? (
              <form onSubmit={handleSendFirstTimeOtp} className="space-y-5">
                <div>
                  <label className="block text-gray-700 mb-1">Email ID</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white text-gray-900 placeholder-gray-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="Enter your email"
                  />
                </div>
                <button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition"
                  type="submit"
                >
                  Send OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleSetNewUserPassword} className="space-y-5 mt-6">
                <div>
                  <label className="block text-gray-700 mb-1">Enter OTP</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white text-gray-900 placeholder-gray-400"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="Enter OTP"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Set New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white text-gray-900 placeholder-gray-400"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Set new password"
                  />
                </div>
                <button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition"
                  type="submit"
                >
                  Set Password
                </button>
              </form>
            )}
          </>
        )}

        {/* Forgot Password */}
        {mode === "forgot" && (
          <>
            {!otpSent ? (
              <form onSubmit={handleSendForgotOtp} className="space-y-5">
                <div>
                  <label className="block text-gray-700 mb-1">Email ID</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white text-gray-900 placeholder-gray-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="Enter your email"
                  />
                </div>
                <button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition"
                  type="submit"
                >
                  Send OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5 mt-6">
                <div>
                  <label className="block text-gray-700 mb-1">Enter OTP</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white text-gray-900 placeholder-gray-400"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="Enter OTP"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Set New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white text-gray-900 placeholder-gray-400"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Set new password"
                  />
                </div>
                <button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition"
                  type="submit"
                >
                  Reset Password
                </button>
              </form>
            )}
          </>
        )}

        {message && (
          <div className="mt-6 text-center text-purple-700 font-semibold">
            {message}
          </div>
        )}
        <div className="mt-8 text-center text-gray-400 text-xs">
          &copy; {new Date().getFullYear()} SparkTrack Student Portal
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
