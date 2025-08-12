import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginHeader from "../../Components/Common/LoginHeader";
import "../../Components/External/Sidebar.css";
import { testAPI } from "../../utils/apiTest";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [apiStatus, setApiStatus] = useState("checking");
  const navigate = useNavigate();

  useEffect(() => {
    testAPI()
      .then(() => setApiStatus("connected"))
      .catch(() => setApiStatus("failed"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role) {
      alert("Please select a role to log in.");
      return;
    }

    let apiUrl = "";
    let payload = {};

    if (role === "Admin") {
      apiUrl = "https://sparktrack-mini.onrender.com/api/auth/login";
      payload = { username, password, role }; // ✅ send role here
    } else if (role === "External") {
      apiUrl = "https://sparktrack-mini.onrender.com/api/external-auth/external/login";
      payload = { external_id: username, password };
    } else {
      alert("Selected role is not supported for login.");
      return;
    }

    try {
      // 1️⃣ Login
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", role);

      // 2️⃣ If External, fetch groups
      if (role === "External") {
        const groupRes = await fetch("https://sparktrack-mini.onrender.com/api/external-auth/external/groups", {
          method: "GET",
          headers: { Authorization: `Bearer ${data.token}` },
        });

        const groupData = await groupRes.json();
        if (groupRes.ok) {
          localStorage.setItem("groups", JSON.stringify(groupData.groups));
        } else {
          console.error("Failed to fetch groups", groupData);
        }

        navigate("/external-home");
      }

      if (role === "Admin") {
        navigate("/admin-dashboard");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  return (
    <div className="font-[Poppins] bg-white min-h-screen">
      <div className="fixed top-0 left-0 w-full z-10 bg-white shadow">
        <LoginHeader />
      </div>

      <main className="flex items-center justify-center min-h-screen bg-white pt-24">
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-center mb-8 space-x-4">
            <span className="material-icons text-gray-900" style={{ fontSize: 30 }}>
              rate_review
            </span>
            <h1 style={{ fontSize: "32px" }} className="font-bold text-gray-900">
              Review Panel
            </h1>
          </div>
          
          {/* API Status Indicator */}
          <div className="mb-4 text-center">
            <span className={`text-sm px-3 py-1 rounded-full ${
              apiStatus === 'connected' ? 'bg-green-100 text-green-800' :
              apiStatus === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              API: {apiStatus === 'connected' ? '✅ Connected' : 
                   apiStatus === 'failed' ? '❌ Failed' : '⏳ Checking...'}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200 text-gray-900 placeholder-gray-400"
                placeholder={role === "External" ? "External ID" : "Email"}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="mb-6">
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200 text-gray-900 placeholder-gray-400"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-8 relative">
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200 text-gray-900"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">Select Role</option>
                <option value="Admin">Admin</option>
                <option value="External">External</option>
                <option value="Mentor" disabled>Mentor (Not available)</option>
              </select>
            </div>

            <button
              className="w-full bg-gradient-to-r from-[#975BFF] to-[#7B74EF] text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              type="submit"
            >
              Login
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
