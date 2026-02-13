import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api.js";

const IndustryMentorList = () => {
  const [mentors, setMentors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await apiRequest("/api/role-access/industrial_mentors", "GET", null, token);
      const records = response?.data?.records || [];
      setMentors(records);
    } catch (error) {
      console.error("Error fetching industry mentors:", error);
      alert("Failed to load industry mentors. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const filteredMentors = mentors.filter((mentor) => {
    const search = searchTerm.toLowerCase();
    return (
      String(mentor.industrial_mentor_code || "").toLowerCase().includes(search)
      || String(mentor.name || "").toLowerCase().includes(search)
      || String(mentor.email || "").toLowerCase().includes(search)
      || String(mentor.contact || "").toLowerCase().includes(search)
      || String(mentor.company_name || "").toLowerCase().includes(search)
      || String(mentor.designation || "").toLowerCase().includes(search)
      || String(mentor.mentor_name || "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Industry Mentor Directory</h2>
          <p className="text-gray-600">Read-only list of all industry mentors.</p>
        </div>
        <div className="relative w-full md:max-w-sm">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            type="text"
            placeholder="Search mentors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Mentor Code</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Designation</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Assigned Mentor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading industry mentors...</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {filteredMentors.map((mentor) => (
                  <tr key={mentor.id || mentor.industrial_mentor_code} className="bg-white border-b">
                    <td className="px-6 py-4">{mentor.industrial_mentor_code || "-"}</td>
                    <td className="px-6 py-4">{mentor.name || "-"}</td>
                    <td className="px-6 py-4">{mentor.company_name || "-"}</td>
                    <td className="px-6 py-4">{mentor.designation || "-"}</td>
                    <td className="px-6 py-4">{mentor.email || "-"}</td>
                    <td className="px-6 py-4">{mentor.contact || "-"}</td>
                    <td className="px-6 py-4">{mentor.mentor_name || "-"}</td>
                  </tr>
                ))}
                {filteredMentors.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                      No industry mentors found
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IndustryMentorList;
