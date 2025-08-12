import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import FilterSection from "../../Components/Admin/FilterSection";
import StatsCards from "../../Components/Admin/StatsCards";
import StudentTable from "../../Components/Admin/StudentTable";
import Pagination from "../../Components/Admin/Pagination";

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // If no token, redirect to login
    if (!token) {
      navigate("/login");
      return;
    }

    // Validate token with backend
    fetch("http://localhost:5000/api/auth/admin/dashboard", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

  return (
    <div className="font-sans bg-gray-50 flex flex-col min-h-screen">
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
