import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import Sidebar from "../../Components/Admin/Sidebar";
import Header from "../../Components/Common/Header";
import StatsCards from "../../Components/Admin/StatsCards";
import {
  PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";
import { TrendingUp, CheckCircle, GraduationCap, Users, Target, Activity } from "lucide-react";

const COLORS = ["#7B74EF", "#5D3FD3", "#FFBB28", "#FF8042", "#A28BFE", "#82CA9D", "#FFC658", "#8884D8"];

const defaultCharts = {
  attendance: [],
  approvals: {},
  distribution: { byClass: [] },
  groupAssignment: [],
  guideAssignment: []
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({});
  const [charts, setCharts] = useState(defaultCharts);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);

      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      
      console.log("Current user role:", role);
      console.log("Current user token exists:", !!token);
      
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }
      
      if (role !== 'admin') {
        setError(`Access denied. Admin role required. Current role: ${role || 'none'}`);
        setLoading(false);
        return;
      }

      console.log("Making dashboard request with token:", token ? token.substring(0, 20) + "..." : "NO TOKEN");
      const res = await apiRequest("/api/dashboard/data", "GET", null, token);
      console.log("Dashboard response:", res);

      if (res?.success) {
        const dashboardData = res?.data || {};

        setCounts(dashboardData?.counts || {});
        setCharts({
          attendance: dashboardData?.charts?.attendance || [],
          approvals: dashboardData?.charts?.approvals || {},
          distribution: dashboardData?.charts?.distribution || { byClass: [] },
          groupAssignment: dashboardData?.charts?.groupAssignment || [],
          guideAssignment: dashboardData?.charts?.guideAssignment || []
        });
        setError("");
      } else {
        console.error("Dashboard API error:", res);
        if (res?.status === 403) {
          setError("Access denied. Please ensure you have admin privileges and try logging in again.");
        } else {
          setError(res?.message || "Failed to load dashboard");
        }
      }

      setLoading(false);
    };

    fetchDashboard();
  }, []);

  const name = localStorage.getItem("name");
  const id = localStorage.getItem("id");

  const LoadingContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Header name={name} id={id} />
      <div className="flex pt-24 lg:pt-28 px-2 lg:px-8">
        <Sidebar />
        <main className="flex-1 lg:ml-72 px-4 sm:px-8 py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="animate-spin rounded-full h-24 w-24 border-4 border-[#5D3FD3]/20 border-t-[#5D3FD3] mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-[#5D3FD3] animate-pulse" />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#5D3FD3] to-[#7B74EF] bg-clip-text text-transparent mb-3">
                Loading Dashboard Analytics
              </h2>
              <p className="text-lg font-medium text-gray-600 mb-6">Fetching comprehensive system data...</p>
              <div className="flex justify-center items-center space-x-1">
                <div className="w-2 h-2 bg-[#5D3FD3] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#7B74EF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#5D3FD3] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingContent />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-100 rounded-full">
              <TrendingUp className="w-8 h-8 text-red-500 transform rotate-180" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Dashboard Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Header name={name} id={id} />
      <div className="flex pt-24 lg:pt-28 px-2 lg:px-8">
        <Sidebar />
        <main className="flex-1 lg:ml-72 px-4 sm:px-8 py-6">
          {/* Dashboard Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-4 bg-gradient-to-br from-[#5D3FD3]/15 to-[#7B74EF]/15 rounded-2xl border border-[#5D3FD3]/20 shadow-xl">
                    <TrendingUp className="w-10 h-10 text-[#5D3FD3]" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-[#5D3FD3] to-[#7B74EF] bg-clip-text text-transparent">
                      Administrative Dashboard
                    </h1>
                    <p className="text-gray-600 text-xl font-medium mt-2">Comprehensive System Analytics & Management Overview</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center px-4 py-2 bg-green-50 rounded-full border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-green-700 font-medium">System Status: Active</span>
                  </div>
                  <div className="flex items-center px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                    <Activity className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-blue-700 font-medium">Last Updated: {new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="bg-gradient-to-br from-[#5D3FD3] to-[#7B74EF] p-6 rounded-2xl text-white shadow-2xl border border-white/20">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{new Date().getDate()}</div>
                    <div className="text-sm opacity-90 font-medium">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                    <div className="w-8 h-0.5 bg-white/40 mx-auto mt-2 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-10">
            <StatsCards statsData={counts} loading={loading} />
          </div>

          {/* Main Analytics Grid */}
          <div className="space-y-12">
            {/* Attendance Analytics Section */}
            <Section 
              title="Student Attendance Analytics" 
              subtitle="Real-time monitoring of student participation and engagement metrics"
              icon={<Activity className="w-8 h-8 text-[#5D3FD3]" />}
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 p-8 hover:shadow-3xl transition-all duration-500">
                <div className="flex items-center justify-center">
                  <PieChart width={380} height={320}>
                    <Pie
                      data={charts.attendance}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={40}
                      paddingAngle={5}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {charts.attendance.map((entry, idx) => (
                        <Cell key={`attendance-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, 'Students']}
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    />
                  </PieChart>
                </div>
              </div>
            </Section>

            {/* Project Approval Management */}
            <Section 
              title="Project Approval Management System" 
              subtitle="Comprehensive tracking of project approvals across multiple evaluation criteria"
              icon={<CheckCircle className="w-8 h-8 text-[#5D3FD3]" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {Object.entries(charts.approvals).map(([key, data]) => (
                  <div 
                    key={key} 
                    className="bg-gradient-to-br from-white/95 to-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/40 p-7 hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:from-white/100 hover:to-white/90 group"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-[#5D3FD3]/10 to-[#7B74EF]/10 rounded-lg group-hover:from-[#5D3FD3]/20 group-hover:to-[#7B74EF]/20 transition-all duration-300">
                          <CheckCircle className="w-5 h-5 text-[#5D3FD3]" />
                        </div>
                        <h4 className="text-xl font-bold text-[#5D3FD3]">
                          {key === 'criya' ? 'CRIYA Approval' : 
                           key === 'techTransfer' ? 'Technology Transfer' : 
                           key === 'copyright' ? 'Copyright Registration' :
                           key === 'patent' ? 'Patent Application' :
                           key === 'aic' ? 'AIC Incubation' :
                           key.charAt(0).toUpperCase() + key.slice(1)}
                        </h4>
                      </div>
                      <div className="w-3 h-3 bg-gradient-to-r from-[#5D3FD3] to-[#7B74EF] rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex justify-center">
                      <PieChart width={280} height={220}>
                        <Pie
                          data={data}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={30}
                          paddingAngle={3}
                          label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                        >
                          {data.map((entry, idx) => (
                            <Cell key={`${key}-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [value, 'Projects']}
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Academic Distribution Analytics */}
            {charts.distribution?.byClass?.length > 0 && (
              <Section 
                title="Academic Distribution Analytics" 
                subtitle="Detailed breakdown of student enrollment across academic programs and specializations"
                icon={<GraduationCap className="w-8 h-8 text-[#5D3FD3]" />}
              >
                <div className="bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/40 p-8 hover:shadow-3xl transition-all duration-500">
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-gradient-to-r from-[#5D3FD3] to-[#7B74EF] rounded-full"></div>
                        <span className="text-lg font-semibold text-gray-700">Total Classes: {charts.distribution.byClass.length}</span>
                      </div>
                      <div className="text-sm text-gray-500 font-medium">
                        Total Students: {charts.distribution.byClass.reduce((sum, item) => sum + item.value, 0)}
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={charts.distribution.byClass}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                        fontWeight={500}
                        stroke="#666"
                      />
                      <YAxis 
                        fontSize={12}
                        fontWeight={500}
                        stroke="#666"
                      />
                      <Tooltip 
                        formatter={(value) => [value, 'Students']}
                        labelFormatter={(label) => `Class: ${label}`}
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.98)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                          fontSize: '14px'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="url(#colorGradient)"
                        radius={[8, 8, 0, 0]}
                        stroke="#5D3FD3"
                        strokeWidth={1}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7B74EF" />
                          <stop offset="100%" stopColor="#5D3FD3" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Section>
            )}

            {/* Resource Allocation Dashboard */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
              {charts.groupAssignment?.length > 0 && (
                <Section 
                  title="Group Formation Analytics" 
                  subtitle="Strategic allocation and organization of student groups"
                  icon={<Users className="w-8 h-8 text-[#5D3FD3]" />}
                >
                  <div className="bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/40 p-7 hover:shadow-3xl transition-all duration-500">
                    <div className="flex items-center justify-center">
                      <PieChart width={340} height={280}>
                        <Pie
                          data={charts.groupAssignment}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={45}
                          paddingAngle={4}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {charts.groupAssignment.map((entry, idx) => (
                            <Cell key={`group-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [value, 'Students']}
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            paddingTop: '15px',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        />
                      </PieChart>
                    </div>
                  </div>
                </Section>
              )}

              {charts.guideAssignment?.length > 0 && (
                <Section 
                  title="Mentorship Allocation System" 
                  subtitle="Strategic assignment of academic mentors to project groups"
                  icon={<Target className="w-8 h-8 text-[#5D3FD3]" />}
                >
                  <div className="bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/40 p-7 hover:shadow-3xl transition-all duration-500">
                    <div className="flex items-center justify-center">
                      <PieChart width={340} height={280}>
                        <Pie
                          data={charts.guideAssignment}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={45}
                          paddingAngle={4}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {charts.guideAssignment.map((entry, idx) => (
                            <Cell key={`guide-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [value, 'Groups']}
                          contentStyle={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            paddingTop: '15px',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        />
                      </PieChart>
                    </div>
                  </div>
                </Section>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const Section = ({ title, subtitle, icon, children }) => (
  <div className="mb-12">
    <div className="mb-8">
      <div className="flex items-center space-x-4 mb-4">
        {icon && (
          <div className="p-3 bg-gradient-to-br from-[#5D3FD3]/10 to-[#7B74EF]/10 rounded-xl border border-[#5D3FD3]/20 shadow-lg">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-[#5D3FD3] to-[#7B74EF] bg-clip-text text-transparent">
            {title}
          </h3>
          {subtitle && (
            <p className="text-gray-600 text-lg font-medium leading-relaxed mt-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-24 h-1 bg-gradient-to-r from-[#5D3FD3] to-[#7B74EF] rounded-full"></div>
        <div className="w-2 h-2 bg-[#7B74EF] rounded-full animate-pulse"></div>
        <div className="w-12 h-0.5 bg-gradient-to-r from-[#7B74EF]/50 to-transparent rounded-full"></div>
      </div>
    </div>
    {children}
  </div>
);

export default AdminDashboard;