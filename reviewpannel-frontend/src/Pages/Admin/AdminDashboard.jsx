import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import FilterSection from "../../Components/Admin/FilterSection";
import StatsCards from "../../Components/Admin/StatsCards";
import StudentTable from "../../Components/Admin/StudentTable";
import Pagination from "../../Components/Admin/Pagination";
import { apiRequest } from "../../api.js";

const AdminDashboard = () => {
  const navigate = useNavigate();

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

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
        <Sidebar />
        <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 space-y-6">
          <FilterSection />
          <StatsCards />
          <StudentTable />
          <Pagination />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
