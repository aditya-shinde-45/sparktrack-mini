import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Common/Navbar";
import { apiRequest } from "../../api.js"; // Import helper
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false); // ✅ New state
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

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

  try {
    setLoading(true); // ✅ Start loading
    const data = await apiRequest(endpoint, "POST", payload);

    // ✅ Check if token exists
    if (!data || !data.token) {
      alert("Login failed. Invalid credentials .");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", role);

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
  } finally {
    setLoading(false); // ✅ Stop loading
  }
};


  return (
    <div className="font-[Poppins] bg-white min-h-screen">
      <div className="fixed top-0 left-0 w-full z-10 bg-white shadow">
        <Navbar />
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
                placeholder={role === "External" ? "External ID" : "Username"}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
<div className="mb-6 relative">
  <input
    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
    placeholder="Password"
    type={showPassword ? "text" : "password"} // ✅ toggle type
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />

  {/* Toggle Eye Icon */}
  <span
    className="absolute inset-y-0 right-3 flex items-center text-gray-500 cursor-pointer hover:text-blue-600"
    onClick={() => setShowPassword(!showPassword)}
  >
    {/* 👇 FIX: show open eye when visible, closed eye when hidden */}
    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
  </span>
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
              className="w-full loginbutton text-white font-bold py-3 px-4 rounded-lg focus:outline-none flex items-center justify-center gap-2"
              type="submit"
              disabled={loading} // ✅ Disable while loading
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
