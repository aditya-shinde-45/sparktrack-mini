import React, { useEffect, useState } from "react";
import { 
  Search, 
  Users, 
  Phone, 
  Mail, 
  UserCheck,
  RefreshCw,
  UsersRound
} from "lucide-react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import Pagination from "../../Components/Admin/Pagination";
import { apiRequest } from "../../api.js";

const MentorsPage = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  const errorText = (() => {
    if (!error) return "";
    if (typeof error === "string") return error;
    if (typeof error === "object") {
      if (typeof error.message === "string") return error.message;
      try {
        return JSON.stringify(error);
      } catch {
        return "Failed to load mentors.";
      }
    }
    return String(error);
  })();

  useEffect(() => {
    fetchMentors();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

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

  // Filter mentors based on search query and filter type
  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = 
      mentor.mentor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.contact_number?.includes(searchQuery) ||
      mentor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mentor.groups && mentor.groups.some(group => 
        group.toLowerCase().includes(searchQuery.toLowerCase())
      ));

    const matchesFilter = 
      filterType === "all" ||
      (filterType === "with-groups" && mentor.groups && mentor.groups.length > 0) ||
      (filterType === "without-groups" && (!mentor.groups || mentor.groups.length === 0));

    return matchesSearch && matchesFilter;
  });

  const totalGroups = mentors.reduce((sum, mentor) => 
    sum + (mentor.groups ? mentor.groups.length : 0), 0
  );

  const totalRecords = filteredMentors.length;
  const paginatedMentors = filteredMentors.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center lg:ml-72 mb-16 lg:mb-0 mt-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading mentors...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-3 md:p-6 lg:ml-72 mb-16 lg:mb-0 space-y-6 mt-20">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="w-8 h-8 text-purple-600" />
                  Mentor Management
                </h1>
                <p className="text-gray-600 mt-2">
                  View and manage all mentors and their assigned groups
                </p>
              </div>
              <button
                onClick={fetchMentors}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Mentors</p>
                    <p className="text-2xl font-bold text-gray-900">{mentors.length}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Active Mentors</p>
                    <p className="text-2xl font-bold text-green-600">
                      {mentors.filter(m => m.groups && m.groups.length > 0).length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Groups</p>
                    <p className="text-2xl font-bold text-blue-600">{totalGroups}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <UsersRound className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone number, or group ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    filterType === "all"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Mentors
                </button>
                <button
                  onClick={() => setFilterType("with-groups")}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    filterType === "with-groups"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  With Groups
                </button>
                <button
                  onClick={() => setFilterType("without-groups")}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    filterType === "without-groups"
                      ? "bg-orange-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Without Groups
                </button>
              </div>
            </div>

            {/* Results Count */}
            {searchQuery && (
              <div className="mt-3 text-sm text-gray-600">
                Found <span className="font-semibold text-gray-900">{filteredMentors.length}</span> mentor(s) matching "{searchQuery}"
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm">{errorText}</p>
            </div>
          )}

          {/* Mentors Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs uppercase bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <tr>
                    <th className="px-6 py-4">Mentor</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Groups</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedMentors.length > 0 ? (
                    paginatedMentors.map((mentor, idx) => (
                      <tr
                        key={mentor.mentor_code || idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{mentor.mentor_name || "Unknown"}</p>
                              <p className="text-xs text-gray-500">{mentor.mentor_code || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{mentor.contact_number || "-"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{mentor.email || "-"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-gray-400" />
                            <span>{mentor.designation || "-"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            mentor.groups && mentor.groups.length > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}>
                            {mentor.groups && mentor.groups.length > 0 ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {mentor.groups && mentor.groups.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {mentor.groups.map((group, i) => (
                                <span
                                  key={`${mentor.mentor_code || idx}-group-${i}`}
                                  className="inline-flex items-center px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md border border-purple-200"
                                >
                                  {group}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">No groups assigned</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No mentors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalRecords > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(totalRecords / rowsPerPage))}
                setCurrentPage={setCurrentPage}
                totalItems={totalRecords}
                rowsPerPage={rowsPerPage}
              />
            </div>
          )}

          {/* No Results */}
          {filteredMentors.length === 0 && !error && (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "No Mentors Found" : "No Mentors Available"}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? "Try adjusting your search query or filters" 
                  : "There are no mentors registered in the system yet"}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MentorsPage;
