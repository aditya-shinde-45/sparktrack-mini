import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiRequest } from "../../api";
import Sidebar from "../../Components/Admin/Sidebar";
import Header from "../../Components/Common/Header";
import Loading from "../../Components/Common/loading";
import { Briefcase, RefreshCw, Users, ClipboardList } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      <Header name={name} id={id} />
      <div className="flex pt-24 lg:pt-28 px-2 lg:px-8">
        <Sidebar />
        <main className="flex-1 lg:ml-72 mb-16 lg:mb-0 px-4 sm:px-8 py-6 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Evaluation submissions, mentors, and industry mentor reporting.</p>
            </div>
            <button
              onClick={loadOverview}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Students" value={overview.students} icon={<Users className="w-5 h-5 text-purple-600" />} />
            <StatCard label="Groups" value={overview.groups} icon={<ClipboardList className="w-5 h-5 text-purple-600" />} />
            <StatCard label="Industry Mentors" value={industryStats.total} icon={<Briefcase className="w-5 h-5 text-purple-600" />} />
          </div>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Mentor Report</h2>
              <p className="text-sm text-gray-500">Active and inactive mentor distribution.</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <MiniStat label="Total" value={mentorStats.total} />
                <MiniStat label="Active" value={mentorStats.active} accent="text-green-600" />
                <MiniStat label="Inactive" value={mentorStats.inactive} accent="text-orange-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Industry Mentor Report</h2>
              <p className="text-sm text-gray-500">Assignment coverage for industry mentors.</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <MiniStat label="Total" value={industryStats.total} />
                <MiniStat label="Assigned" value={industryStats.assigned} accent="text-green-600" />
                <MiniStat label="Unassigned" value={industryStats.unassigned} accent="text-orange-600" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Evaluation Form Report</h2>
                <p className="text-sm text-gray-500">Field-wise performance for selected evaluation form.</p>
              </div>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700"
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
              <div className="py-12 text-center text-gray-500">Loading evaluation report...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <MiniStat label="Groups Evaluated" value={evaluationStats.uniqueGroups} />
                  <MiniStat label="Students Evaluated" value={evaluationStats.totalSubmissions} />
                  <MiniStat label="Average Total" value={evaluationStats.averageTotal.toFixed(2)} />
                  <MiniStat label="Total Marks" value={formTotalMarks || 0} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Average Marks by Field</h3>
                    {evaluationStats.barData.length > 0 ? (
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={evaluationStats.barData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="avg" fill="#7B74EF" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No numeric fields available for chart.</p>
                    )}
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Field Summary</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-gray-600">
                        <thead className="text-xs uppercase bg-gray-50">
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
                            <tr key={field.key} className="border-t">
                              <td className="px-3 py-2 font-medium text-gray-700">{field.label}</td>
                              <td className="px-3 py-2 text-center">{field.maxMarks}</td>
                              <td className="px-3 py-2 text-center">{field.isBoolean ? "-" : field.avg.toFixed(2)}</td>
                              <td className="px-3 py-2 text-center">{field.isBoolean ? "-" : field.min.toFixed(2)}</td>
                              <td className="px-3 py-2 text-center">{field.isBoolean ? "-" : field.max.toFixed(2)}</td>
                              <td className="px-3 py-2 text-center">{field.isBoolean ? `${field.yesPercent.toFixed(1)}%` : "-"}</td>
                            </tr>
                          ))}
                          {evaluationStats.fieldStats.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
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

const StatCard = ({ label, value, icon }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{Number(value || 0).toLocaleString()}</p>
    </div>
    <div className="p-3 bg-purple-100 rounded-xl">{icon}</div>
  </div>
);

const MiniStat = ({ label, value, accent }) => (
  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
    <p className="text-xs uppercase text-gray-500 tracking-wide">{label}</p>
    <p className={`text-xl font-semibold ${accent || "text-gray-900"}`}>{Number(value || 0).toLocaleString()}</p>
  </div>
);

export default AdminDashboard;