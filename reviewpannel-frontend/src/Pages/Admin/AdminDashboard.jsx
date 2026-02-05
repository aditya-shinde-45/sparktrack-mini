import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import Sidebar from "../../Components/Admin/Sidebar";
import Header from "../../Components/Common/Header";
import StatsCards from "../../Components/Admin/StatsCards";
import Loading from "../../Components/Common/loading";
import {
  PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";
import { TrendingUp, CheckCircle, GraduationCap, Users, Target, Activity, RefreshCw } from "lucide-react";

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
  const [reviewType, setReviewType] = useState("review1");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      
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

      try {
        const res = await apiRequest(`/api/dashboard/data?review=${reviewType}`, "GET", null, token);

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
          
          // Handle different error scenarios
          if (res?.status === 403 || res?.message?.includes('Access denied')) {
            setError("Access denied. Please ensure you have admin privileges.");
          } else if (res?.status === 500 || res?.message?.includes('server error')) {
            setError("Server error occurred. The system is currently having issues processing dashboard data. Please try again later or contact support.");
          } else if (res?.message?.includes('fetch failed')) {
            setError("Network error: Unable to connect to the server. Please check your connection and try again.");
          } else {
            setError(res?.message || "Failed to load dashboard. Please try refreshing the page.");
          }
          
          // Set default/empty data on error
          setCounts({});
          setCharts(defaultCharts);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        
        // Handle network or unexpected errors
        if (err.message?.includes('fetch') || err.message?.includes('network')) {
          setError("Network error: Unable to connect to the server. Please check your internet connection.");
        } else if (err.message?.includes('timeout')) {
          setError("Request timeout: The server is taking too long to respond. Please try again.");
        } else {
          setError("An unexpected error occurred while loading the dashboard. Please try again or contact support.");
        }
        
        // Set default/empty data on error
        setCounts({});
        setCharts(defaultCharts);
      }

      setLoading(false);
    };

    fetchDashboard();
  }, [reviewType]);

  const name = localStorage.getItem("name");
  const id = localStorage.getItem("id");

  if (loading) {
    return <Loading message="Loading Dashboard Analytics" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <Header name={name} id={id} />
        <div className="flex pt-24 lg:pt-28 px-2 lg:px-8">
          <Sidebar />
          <main className="flex-1 lg:ml-72 mb-16 lg:mb-0 px-4 sm:px-8 py-6">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto border border-red-200">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-red-100 rounded-full">
                    <TrendingUp className="w-12 h-12 text-red-500 transform rotate-180" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-red-600 mb-4 text-center">Dashboard Error</h2>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-gray-700 text-center leading-relaxed">{error}</p>
                </div>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg font-semibold flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload Dashboard
                  </button>
                  <button 
                    onClick={() => {
                      setError("");
                      setLoading(true);
                      window.location.reload();
                    }} 
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold border border-gray-300"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    If this issue persists, please contact your system administrator or check the server logs for more details.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-50 to-blue-50">
      <Header name={name} id={id} />
      <div className="flex pt-24 lg:pt-28 px-2 lg:px-8">
        <Sidebar />
        <main className="flex-1 lg:ml-72 mb-16 lg:mb-0 px-4 sm:px-8 py-6">
          {/* Dashboard Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-4 bg-gradient-to-br from-[#5D3FD3] to-[#7B74EF] rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-[#5D3FD3] via-[#7B74EF] to-[#5D3FD3] bg-clip-text text-transparent animate-gradient">
                      Administrative Dashboard
                    </h1>
                    <p className="text-gray-700 text-xl font-semibold mt-2">Comprehensive System Analytics & Management Overview</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm flex-wrap">
                  <div className="flex items-center px-5 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-300 shadow-md hover:shadow-lg transition-all">
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-2 animate-pulse shadow-sm"></div>
                    <span className="text-green-700 font-semibold">System Status: Active</span>
                  </div>
                  <div className="flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-300 shadow-md hover:shadow-lg transition-all">
                    <Activity className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-blue-700 font-semibold">Last Updated: {new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="bg-gradient-to-br from-[#5D3FD3] via-[#6B5DD3] to-[#7B74EF] p-7 rounded-2xl text-white shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-300 hover:scale-105">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-1">{new Date().getDate()}</div>
                    <div className="text-sm opacity-95 font-semibold">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                    <div className="w-10 h-1 bg-white/50 mx-auto mt-3 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <StatsCards statsData={counts} loading={loading} />
          </div>

          {/* Review Type Selection */}
          <div className="mb-10">
            <div className="bg-gradient-to-r from-white via-purple-50/30 to-white rounded-2xl shadow-xl border border-purple-200/50 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#5D3FD3] to-[#7B74EF] rounded-full"></div>
                    Select Review Type
                  </h3>
                  <p className="text-sm text-gray-600 font-medium">Choose which PBL review data to display</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setReviewType("review1")}
                    className={`px-7 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                      reviewType === "review1"
                        ? "bg-gradient-to-r from-[#5D3FD3] to-[#7B74EF] text-white shadow-lg hover:shadow-xl"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300 hover:border-purple-300"
                    }`}
                  >
                    PBL Review 1
                  </button>
                  <button
                    onClick={() => setReviewType("review2")}
                    className={`px-7 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                      reviewType === "review2"
                        ? "bg-gradient-to-r from-[#5D3FD3] to-[#7B74EF] text-white shadow-lg hover:shadow-xl"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300 hover:border-purple-300"
                    }`}
                  >
                    PBL Review 2
                  </button>
                </div>
              </div>
            </div>
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

            {/* Project Approval Management - Only for Review 1 */}
            {reviewType === "review1" && Object.keys(charts.approvals).length > 0 && (
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
          <div className="p-4 bg-gradient-to-br from-[#5D3FD3] to-[#7B74EF] rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110">
            {React.cloneElement(icon, { className: `${icon.props.className || ''} text-white`.trim() })}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-3xl font-extrabold bg-gradient-to-r from-[#5D3FD3] via-[#6B5DD3] to-[#7B74EF] bg-clip-text text-transparent">
            {title}
          </h3>
          {subtitle && (
            <p className="text-gray-700 text-lg font-semibold leading-relaxed mt-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-32 h-1.5 bg-gradient-to-r from-[#5D3FD3] via-[#6B5DD3] to-[#7B74EF] rounded-full shadow-md"></div>
        <div className="w-2.5 h-2.5 bg-gradient-to-r from-[#7B74EF] to-[#5D3FD3] rounded-full animate-pulse shadow-lg"></div>
        <div className="w-16 h-1 bg-gradient-to-r from-[#7B74EF]/60 to-transparent rounded-full"></div>
      </div>
    </div>
    {children}
  </div>
);

export default AdminDashboard;