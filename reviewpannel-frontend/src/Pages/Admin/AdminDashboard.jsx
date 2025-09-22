import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import Sidebar from "../../Components/Admin/Sidebar";
import Header from "../../Components/Common/Header";
import StatsCards from "../../Components/Admin/StatsCards";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#7B74EF", "#5D3FD3", "#FFBB28", "#FF8042", "#A28BFE"];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({});
  const [charts, setCharts] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const res = await apiRequest("/api/admin/dashboard", "GET", null, localStorage.getItem("token"));
      if (res.success) {
        setCounts(res.counts);
        setCharts(res.charts);
        setError("");
      } else {
        setError(res.message || "Failed to load dashboard");
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  const name = localStorage.getItem("name");
  const id = localStorage.getItem("id");

  if (loading) return <div className="flex items-center justify-center h-screen text-lg font-semibold text-[#5D3FD3]">Loading dashboard...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header name={name} id={id} />
      <div className="flex pt-24 lg:pt-28 px-2 lg:px-8">
        <Sidebar />
        <main className="flex-1 lg:ml-72 px-2 sm:px-6 py-4">
          <h2 className="text-2xl font-bold text-[#5D3FD3] mb-6">Admin Dashboard</h2>
          {/* Use StatsCards instead of StatCard grid */}
          <StatsCards statsData={counts} loading={loading} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Attendance Pie */}
            <Section title="Attendance">
              <div className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-center">
                <PieChart width={300} height={220}>
                  <Pie
                    data={charts.attendance}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {charts.attendance.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>
            </Section>
          </div>

          {/* Approval Charts */}
          <Section title="Approvals">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Object.entries(charts.approvals).map(([key, data]) => (
                <div key={key} className="bg-white rounded-xl shadow-lg p-4">
                  <h4 className="text-base font-semibold text-[#5D3FD3] mb-2 capitalize">{key}</h4>
                  <PieChart width={220} height={180}>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label
                    >
                      {data.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>
              ))}
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-[#5D3FD3] mb-3">{title}</h3>
    {children}
  </div>
);

export default AdminDashboard;