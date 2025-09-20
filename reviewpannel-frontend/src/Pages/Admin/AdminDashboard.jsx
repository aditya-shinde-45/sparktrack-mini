import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import FilterSection from "../../Components/Admin/FilterSection";
import StatsCards from "../../Components/Admin/StatsCards";
import StudentTable from "../../Components/Admin/StudentTable";
import Pagination from "../../Components/Admin/Pagination";
import AddGroupModal from "../../Components/Admin/AddGroupModal";
import { apiRequest } from "../../api.js";
import { Download, Filter, RefreshCw, Search } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [filterData, setFilterData] = useState({ year: "TY", class: "" });
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const rowsPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "Admin") {
      localStorage.clear();
      navigate("/");
      return;
    }

    const validateToken = async () => {
      try {
        await apiRequest(
          "/api/auth/admin/dashboard",
          "GET",
          null,
          token
        );
      } catch (error) {
        console.error("Token validation failed:", error);
        localStorage.clear();
        navigate("/");
      }
    };

    validateToken();
  }, [navigate]);

  const fetchStats = async (filters) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const classFilter = filters.year || 'TY';
      
      const data = await apiRequest(
        `/api/admin/pbl?class=${classFilter}`,
        "GET",
        null,
        token
      );
      
      let pblData = Array.isArray(data) ? data : [];
      
      // Filter by class if specified
      if (filters.class) {
        pblData = pblData.filter(item => 
          item.class && item.class === filters.class
        );
      }
      
      const uniqueGroups = new Set(pblData.map(item => item.group_id)).size;
      const uniqueGuides = new Set(pblData.filter(item => item.guide_name).map(item => item.guide_name)).size;
      const uniqueExaminers = new Set(pblData.filter(item => item.external_name).map(item => item.external_name)).size;
      
      setStatsData({
        students: pblData.length,
        groups: uniqueGroups,
        guides: uniqueGuides,
        examiners: uniqueExaminers,
        withoutGroups: pblData.filter(item => !item.group_id).length,
        withoutGuides: pblData.filter(item => !item.guide_name).length
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
    setLoading(false);
  };

  const fetchStudents = async (filters) => {
    try {
      const token = localStorage.getItem("token");
      const classFilter = filters.year || 'TY';
      
      const data = await apiRequest(
        `/api/admin/pbl?class=${classFilter}`,
        "GET",
        null,
        token
      );
      
      let pblData = Array.isArray(data) ? data : [];
      
      if (filters.class) {
        pblData = pblData.filter(item => 
          item.class && item.class === filters.class
        );
      }
      
      setStudents(pblData);
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudents([]);
    }
  };

  const handleFilterChange = (filters) => {
    setFilterData(filters);
    fetchStats(filters);
    fetchStudents(filters);
    setCurrentPage(1);
  };

  const handleAddGroupSuccess = () => {
    fetchStats(filterData);
    fetchStudents(filterData);
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats(filterData);
    await fetchStudents(filterData);
    setRefreshing(false);
  };
  
  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      const token = localStorage.getItem("token");
      
      // This should be a proper API endpoint that returns Excel file
      const response = await fetch(`/api/admin/export?year=${filterData.year}&class=${filterData.class || ''}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Create a download link for the Excel file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Students_${filterData.year}_${filterData.class || 'All'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error exporting data:", err);
      alert("Failed to export data. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    const initialFilters = { year: "TY", class: "" };
    fetchStats(initialFilters);
    fetchStudents(initialFilters);
  }, []);

  const filteredStudents = students.filter((s) =>
    searchQuery
      ? s.group_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.enrollement_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name_of_student?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

  // Quick summary statistics
  const quickStats = [
    { label: "Without Groups", value: statsData?.withoutGroups || 0 },
    { label: "Without Guides", value: statsData?.withoutGuides || 0 }
  ];

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
        <Sidebar />
        <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="flex gap-2 mt-2 sm:mt-0">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button 
                onClick={exportToExcel}
                disabled={exportLoading}
                className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
              >
                <Download className="h-4 w-4" />
                <span>{exportLoading ? 'Exporting...' : 'Export'}</span>
              </button>
            </div>
          </div>

          {/* Filter Section with Quick Stats */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-2 md:mb-0">Filters & Summary</h2>
              
              {/* Quick Stats Section */}
              <div className="flex flex-wrap gap-4">
                {quickStats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 rounded-lg">
                    <span className="font-medium">{stat.label}:</span>
                    <span className="font-bold">{loading ? '...' : stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <FilterSection onFilterChange={handleFilterChange} />
          </div>
          
          <StatsCards statsData={statsData} loading={loading} />
          
          {/* Search Bar and Add Group Button */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by ID, name or group..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
            >
              <span>Add Group</span>
            </button>
          </div>
          
          <StudentTable 
            students={currentStudents}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setCurrentPage={setCurrentPage}
            onAddGroup={() => setShowAddModal(true)}
          />
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            totalItems={filteredStudents.length}
            rowsPerPage={rowsPerPage}
          />
          
          <AddGroupModal 
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={handleAddGroupSuccess}
          />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
