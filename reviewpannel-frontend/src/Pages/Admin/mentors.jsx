import React, { useEffect, useState } from "react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import { apiRequest } from "../../api.js";

const MentorsPage = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await apiRequest("/api/mentors/mentors", "GET", null, token);

        if (res && res.mentors) {
          setMentors(res.mentors);
        } else {
          setError("No mentors found.");
        }
      } catch (err) {
        console.error("Error fetching mentors:", err);
        setError("Error fetching mentors.");
      }
      setLoading(false);
    };

    fetchMentors();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 space-y-6 mt-20">
          <h1 className="text-2xl font-bold mb-4">Mentors</h1>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor Name
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Groups
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-4 text-center text-gray-600"
                      >
                        Loading...
                      </td>
                    </tr>
                  )}
                  {error && !loading && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-4 text-center text-red-600"
                      >
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    mentors.map((mentor, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {mentor.mentor_name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {mentor.contact_number || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {mentor.groups && mentor.groups.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                              {mentor.groups.map((group, i) => (
                                <li key={i}>{group}</li>
                              ))}
                            </ul>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  {!loading && !error && mentors.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-4 text-center text-gray-900"
                      >
                        No mentors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MentorsPage;
