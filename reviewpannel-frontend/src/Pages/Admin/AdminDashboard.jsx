import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiRequest } from "../../api";
import Sidebar from "../../Components/Admin/Sidebar";
import Header from "../../Components/Common/Header";
import Loading from "../../Components/Common/loading";
import { RefreshCw, Users, ClipboardList, Building2, Sparkles, FileBarChart2 } from "lucide-react";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState({ students: 0, groups: 0 });
  const [mentors, setMentors] = useState([]);
  const [industryMentors, setIndustryMentors] = useState([]);
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [formFields, setFormFields] = useState([]);
  const [formTotalMarks, setFormTotalMarks] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [evaluationLoading, setEvaluationLoading] = useState(false);

  const errorText = React.useMemo(() => {
    if (!error) return "";
    if (typeof error === "string") return error;
    if (typeof error === "object") {
      if (typeof error.message === "string") return error.message;
      try {
        return JSON.stringify(error);
      } catch {
        return "Failed to load dashboard data.";
      }
    }
    return String(error);
  }, [error]);

  const name = localStorage.getItem("name");
  const id = localStorage.getItem("id");

  const loadOverview = async () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      setError("No authentication token found. Please log in again.");
      return;
    }

    if (role !== "admin") {
      setError(`Access denied. Admin role required. Current role: ${role || "none"}`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [dashboardRes, mentorsRes, industryRes, formsRes] = await Promise.all([
        apiRequest("/api/dashboard/stat-cards", "GET", null, token),
        apiRequest("/api/mentors/mentors", "GET", null, token),
        apiRequest("/api/role-access/industrial_mentors", "GET", null, token),
        apiRequest("/api/admin/evaluation-forms", "GET", null, token)
      ]);

      const statData = dashboardRes?.data?.data || {};
      setOverview({
        students: statData.studentCount || 0,
        groups: statData.groupCount || 0
      });
      setMentors(mentorsRes?.mentors || []);
      setIndustryMentors(industryRes?.data?.records || []);
      const incomingForms = formsRes?.data || [];
      setForms(incomingForms);

      if (!selectedFormId && incomingForms.length > 0) {
        setSelectedFormId(incomingForms[0].id);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluationForm = async (formId) => {
    if (!formId) {
      setFormFields([]);
      setSubmissions([]);
      setFormTotalMarks(0);
      return;
    }

    try {
      setEvaluationLoading(true);
      const token = localStorage.getItem("token");
      const [formRes, submissionsRes] = await Promise.all([
        apiRequest(`/api/admin/evaluation-forms/${formId}`, "GET", null, token),
        apiRequest(`/api/admin/evaluation-forms/${formId}/submissions?page=1&limit=10000`, "GET", null, token)
      ]);

      const form = formRes?.data || {};
      const fields = Array.isArray(form?.fields) ? form.fields : [];
      const sortedFields = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setFormFields(sortedFields);
      setFormTotalMarks(form?.total_marks || 0);

      const submissionData = submissionsRes?.data?.data || submissionsRes?.data || [];
      setSubmissions(Array.isArray(submissionData) ? submissionData : []);
    } catch (err) {
      console.error("Evaluation report error:", err);
      setFormFields([]);
      setSubmissions([]);
    } finally {
      setEvaluationLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    loadEvaluationForm(selectedFormId);
  }, [selectedFormId]);

  const mentorStats = useMemo(() => {
    const total = mentors.length;
    const active = mentors.filter((mentor) => mentor.groups && mentor.groups.length > 0).length;
    return {
      total,
      active,
      inactive: Math.max(total - active, 0)
    };
  }, [mentors]);

  const industryStats = useMemo(() => {
    const total = industryMentors.length;
    const assigned = industryMentors.filter((mentor) => mentor.mentor_name).length;
    return {
      total,
      assigned,
      unassigned: Math.max(total - assigned, 0)
    };
  }, [industryMentors]);

  const evaluationStats = useMemo(() => {
    const totalSubmissions = submissions.length;
    const uniqueGroups = new Set(submissions.map((row) => row.group_id)).size;
    const totals = submissions
      .map((row) => Number(row.total))
      .filter((value) => !Number.isNaN(value));
    const averageTotal = totals.length ? totals.reduce((sum, val) => sum + val, 0) / totals.length : 0;

    const numericFields = formFields.filter((field) => Number(field.max_marks) > 0);
    const booleanFields = formFields.filter((field) => Number(field.max_marks) === 0);

    const fieldStats = formFields.map((field) => {
      const values = submissions
        .map((row) => Number(row.marks?.[field.key]))
        .filter((value) => !Number.isNaN(value));
      const yesCount = submissions.filter((row) => Boolean(row.marks?.[field.key])).length;

      return {
        key: field.key,
        label: field.label || field.key,
        maxMarks: Number(field.max_marks) || 0,
        avg: values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
        min: values.length ? Math.min(...values) : 0,
        max: values.length ? Math.max(...values) : 0,
        yesPercent: totalSubmissions ? (yesCount / totalSubmissions) * 100 : 0,
        isBoolean: Number(field.max_marks) === 0
      };
    });

    const barData = numericFields.map((field) => {
      const stat = fieldStats.find((row) => row.key === field.key);
      return {
        name: field.label || field.key,
        avg: Number(stat?.avg || 0).toFixed(2)
      };
    });

    return {
      totalSubmissions,
      uniqueGroups,
      averageTotal,
      fieldStats,
      barData,
      numericFields,
      booleanFields
    };
  }, [formFields, submissions]);

  const dashboardCards = [
    { label: "Students", value: overview.students, tone: "linear-gradient(135deg, #3b82f6, #06b6d4)", icon: <Users className="w-5 h-5 text-white" /> },
    { label: "Groups", value: overview.groups, tone: "linear-gradient(135deg, #4f46e5, #2563eb)", icon: <ClipboardList className="w-5 h-5 text-white" /> },
    { label: "Mentors", value: mentorStats.total, tone: "linear-gradient(135deg, #10b981, #0d9488)", icon: <Users className="w-5 h-5 text-white" /> },
    { label: "Industry Mentors", value: industryStats.total, tone: "linear-gradient(135deg, #f59e0b, #ea580c)", icon: <Building2 className="w-5 h-5 text-white" /> },
  ];

  if (loading) {
    return <Loading message="Loading Dashboard" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header name={name} id={id} />
        <div className="flex pt-24 lg:pt-28 px-2 lg:px-8">
          <Sidebar />
          <main className="flex-1 lg:ml-72 mb-16 lg:mb-0 px-4 sm:px-8 py-6">
            <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
              <p className="text-red-700 font-semibold">{errorText}</p>
              <button
                onClick={loadOverview}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100" style={{ fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif' }}>
      <Header name={name} id={id} />
      <div className="flex pt-24 lg:pt-28 px-2 lg:px-8">
        <Sidebar />
        <main className="flex-1 lg:ml-72 mb-16 lg:mb-0 px-3 sm:px-6 xl:px-8 py-5 sm:py-7 space-y-6 sm:space-y-7 min-w-0">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.10),transparent_45%)]" />
            <div className="relative px-4 sm:px-6 lg:px-8 py-6 sm:py-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-semibold tracking-wide mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  ADMIN CONTROL CENTER
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1">Evaluation submissions, mentors, and industry mentor reporting in one place.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">Forms: {forms.length}</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">Submissions: {evaluationStats.totalSubmissions}</span>
                <button
                  onClick={loadOverview}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {dashboardCards.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} tone={card.tone} />
            ))}
          </div>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Mentor Report</h2>
              <p className="text-sm text-slate-500">Active and inactive mentor distribution.</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <MiniStat label="Total" value={mentorStats.total} />
                <MiniStat label="Active" value={mentorStats.active} accent="text-green-600" />
                <MiniStat label="Inactive" value={mentorStats.inactive} accent="text-orange-600" />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Industry Mentor Report</h2>
              <p className="text-sm text-slate-500">Assignment coverage for industry mentors.</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <MiniStat label="Total" value={industryStats.total} />
                <MiniStat label="Assigned" value={industryStats.assigned} accent="text-green-600" />
                <MiniStat label="Unassigned" value={industryStats.unassigned} accent="text-orange-600" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1 mb-2">
                  <FileBarChart2 className="w-3.5 h-3.5" />
                  ANALYTICS VIEW
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Evaluation Form Report</h2>
                <p className="text-sm text-slate-500">Field-wise performance for selected evaluation form.</p>
              </div>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-700 bg-white min-w-[240px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Evaluation Form</option>
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
            </div>

            {evaluationLoading ? (
              <div className="py-12 text-center text-slate-500">Loading evaluation report...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <MiniStat label="Groups Evaluated" value={evaluationStats.uniqueGroups} />
                  <MiniStat label="Students Evaluated" value={evaluationStats.totalSubmissions} />
                  <MiniStat label="Average Total" value={evaluationStats.averageTotal.toFixed(2)} />
                  <MiniStat label="Total Marks" value={formTotalMarks || 0} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50/60">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Average Marks by Field</h3>
                    {evaluationStats.barData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={evaluationStats.barData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="avg" fill="#0f766e" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No numeric fields available for chart.</p>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Field Summary</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-slate-600">
                        <thead className="text-xs uppercase bg-slate-100">
                          <tr>
                            <th className="px-3 py-2 text-left">Field</th>
                            <th className="px-3 py-2">Max</th>
                            <th className="px-3 py-2">Avg</th>
                            <th className="px-3 py-2">Min</th>
                            <th className="px-3 py-2">Max</th>
                            <th className="px-3 py-2">Yes %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {evaluationStats.fieldStats.map((field) => (
                            <tr key={field.key} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-2 font-medium text-slate-700">{field.label}</td>
                              <td className="px-3 py-2 text-center">{field.maxMarks}</td>
                              <td className="px-3 py-2 text-center">{field.isBoolean ? "-" : field.avg.toFixed(2)}</td>
                              <td className="px-3 py-2 text-center">{field.isBoolean ? "-" : field.min.toFixed(2)}</td>
                              <td className="px-3 py-2 text-center">{field.isBoolean ? "-" : field.max.toFixed(2)}</td>
                              <td className="px-3 py-2 text-center">{field.isBoolean ? `${field.yesPercent.toFixed(1)}%` : "-"}</td>
                            </tr>
                          ))}
                          {evaluationStats.fieldStats.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                                Select a form to view field report.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, tone }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">{Number(value || 0).toLocaleString()}</p>
    </div>
    <div className="p-3 rounded-xl shadow-sm" style={{ background: tone || "linear-gradient(135deg, #334155, #0f172a)" }}>
      {icon}
    </div>
  </div>
);

const MiniStat = ({ label, value, accent }) => (
  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
    <p className="text-[11px] uppercase text-slate-500 tracking-wider font-semibold">{label}</p>
    <p className={`text-xl sm:text-2xl font-bold ${accent || "text-slate-900"}`}>{Number(value || 0).toLocaleString()}</p>
  </div>
);

export default AdminDashboard;