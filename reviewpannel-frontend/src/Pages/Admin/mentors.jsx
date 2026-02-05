import React, { useEffect, useState } from "react";
import { 
  Search, 
  Users, 
  Phone, 
  Mail, 
  UserCheck, 
  Filter,
  Download,
  RefreshCw,
  Eye,
  UsersRound
} from "lucide-react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import { apiRequest } from "../../api.js";

const MentorsPage = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchMentors();
  }, []);

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
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Mentors Grid/Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMentors.map((mentor, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all"
              >
                {/* Mentor Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {mentor.mentor_name || "Unknown"}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        mentor.groups && mentor.groups.length > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {mentor.groups && mentor.groups.length > 0 ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mentor Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{mentor.contact_number || "No contact"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <UsersRound className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {mentor.groups && mentor.groups.length > 0 
                        ? `${mentor.groups.length} Group${mentor.groups.length > 1 ? 's' : ''}`
                        : "No groups assigned"}
                    </span>
                  </div>
                </div>

                {/* Groups List */}
                {mentor.groups && mentor.groups.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Assigned Groups:</p>
                    <div className="flex flex-wrap gap-2">
                      {mentor.groups.map((group, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md border border-purple-200"
                        >
                          {group}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

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
