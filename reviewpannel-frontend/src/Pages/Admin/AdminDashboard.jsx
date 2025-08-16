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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [filterData, setFilterData] = useState({ year: "", class: "" });
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
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
          "/api/auth/admin/dashboard", // relative path — handled by apiRequest
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
      const uniqueGuides = new Set(pblData.map(item => item.guide_name)).size;
      const uniqueExaminers = new Set(pblData.map(item => item.external_name)).size;
      
      setStatsData({
        students: pblData.length,
        groups: uniqueGroups,
        guides: uniqueGuides,
        examiners: uniqueExaminers
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

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
        <Sidebar />
        <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 space-y-6">
          <FilterSection onFilterChange={handleFilterChange} />
          <StatsCards statsData={statsData} loading={loading} />
          
          {/* Search Bar */}
          
          
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
