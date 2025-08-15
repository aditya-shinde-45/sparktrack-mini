import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginHeader from "../../Components/Common/LoginHeader";
import { apiRequest } from "../../api.js"; // Import helper
import "../../Components/External/Sidebar.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role) {
      alert("Please select a role to log in.");
      return;
    }

    let endpoint = "";
    let payload = {};

    if (role === "Admin") {
      endpoint = "/api/auth/login";
      payload = { username, password, role };
    } else if (role === "External") {
      endpoint = "/api/external-auth/external/login";
      payload = { external_id: username, password };
    } else if (role === "Mentor") {
      endpoint = "/api/mentor/login";
      payload = { username, password };
    } else {
      alert("Selected role is not supported for login.");
      return;
    }
//chuitya bhai
    try {
      const data = await apiRequest(endpoint, "POST", payload);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", role);

      // For Mentor
      if (role === "Mentor") {
        localStorage.setItem("name", data.mentor_name);
        const groupData = await apiRequest(
          "/api/mentor/groups",
          "GET",
          null,
          data.token
        );
        localStorage.setItem("groups", JSON.stringify(groupData.group_ids));
        navigate("/external-home");
      }

      // For External
      if (role === "External") {
        localStorage.setItem("name", data.user.name);
        const groupData = await apiRequest(
          "/api/external-auth/external/groups",
          "GET",
          null,
          data.token
        );
        localStorage.setItem("groups", JSON.stringify(groupData.groups));
        navigate("/external-home");
      }

      if (role === "Admin") {
        navigate("/admin-dashboard");
      }
    } catch (error) {
      alert(error.message);
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

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                placeholder={role === "External" ? "External ID" : "Email"}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-8 relative">
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">Select Role</option>
                <option value="Admin">Admin</option>
                <option value="External">External</option>
                <option value="Mentor">Mentor</option>
              </select>
            </div>
            <button
              className="w-full bg-gradient-to-r from-[#975BFF] to-[#7B74EF] text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
