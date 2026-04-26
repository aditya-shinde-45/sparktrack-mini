import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import { apiRequest } from "../../api";

const STATUS_META = {
  draft: {
    label: "Draft",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Clock3,
  },
  pending_mentor_approval: {
    label: "Pending Approval",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    icon: AlertTriangle,
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

const asText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return asText(value) || "-";
  return parsed.toLocaleString();
};

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return asText(value) || "-";
  return parsed.toLocaleDateString("en-GB");
};

const normalizeSubmissionState = (record) => {
  const payload = isPlainObject(record?.payload) ? record.payload : {};
  const review = isPlainObject(payload?.mentorReview) ? payload.mentorReview : {};
  const status = asText(review?.status) || (record?.submitted ? "pending_mentor_approval" : "draft");
  return STATUS_META[status] ? status : "draft";
};

const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.draft;

const AdminNocDetails = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const name = localStorage.getItem("name");
  const id = localStorage.getItem("id");

  const errorText = useMemo(() => {
    if (!error) return "";
    if (typeof error === "string") return error;
    if (typeof error === "object") {
      if (typeof error.message === "string") return error.message;
      try {
        return JSON.stringify(error);
      } catch {
        return "Failed to load NOC details.";
      }
    }
    return String(error);
  }, [error]);

  const fetchNocRecords = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("admin_token");
      const res = await apiRequest("/api/role-access/noc_forms", "GET", null, token);
      const incomingRecords = res?.data?.records || res?.records || [];
      setRecords(Array.isArray(incomingRecords) ? incomingRecords : []);
    } catch (err) {
      console.error("Error loading admin NOC details:", err);
      setRecords([]);
      setError(err?.message || "Unable to load NOC details right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNocRecords();
  }, []);

  const normalizedRecords = useMemo(() => {
    return (Array.isArray(records) ? records : []).map((record) => {
      const payload = isPlainObject(record?.payload) ? record.payload : {};
      const documents = Array.isArray(payload?.documents) ? payload.documents : [];
      const uploadedCount = documents.filter((doc) => asText(doc?.proofUrl)).length;

      return {
        ...record,
        payload,
        submissionState: normalizeSubmissionState(record),
        documentsCount: Number(record?.documentsCount) || documents.length,
        uploadedDocumentsCount: Number(record?.uploadedDocumentsCount) || uploadedCount,
      };
    });
  }, [records]);

  const availableYears = useMemo(() => {
    const years = new Set(
      normalizedRecords
        .map((record) => asText(record.group_year || record.group_id?.slice(0, 2)).toUpperCase())
        .filter(Boolean)
    );
    return [...years].sort();
  }, [normalizedRecords]);

  const filteredRecords = useMemo(() => {
    return normalizedRecords.filter((record) => {
      const query = searchQuery.trim().toLowerCase();
      const groupId = asText(record.group_id).toLowerCase();
      const teamName = asText(record.team_name).toLowerCase();
      const mentorCode = asText(record.mentor_code).toLowerCase();

      const matchesSearch =
        !query ||
        groupId.includes(query) ||
        teamName.includes(query) ||
        mentorCode.includes(query);

      const matchesStatus = statusFilter === "all" || record.submissionState === statusFilter;

      const currentYear = asText(record.group_year || record.group_id?.slice(0, 2)).toUpperCase();
      const matchesYear = yearFilter === "all" || currentYear === yearFilter;

      return matchesSearch && matchesStatus && matchesYear;
    });
  }, [normalizedRecords, searchQuery, statusFilter, yearFilter]);

  const stats = useMemo(() => {
    const total = normalizedRecords.length;
    const submitted = normalizedRecords.filter((record) => Boolean(record.submitted)).length;
    const pending = normalizedRecords.filter((record) => record.submissionState === "pending_mentor_approval").length;
    const approved = normalizedRecords.filter((record) => record.submissionState === "approved").length;
    const rejected = normalizedRecords.filter((record) => record.submissionState === "rejected").length;

    return {
      total,
      submitted,
      pending,
      approved,
      rejected,
    };
  }, [normalizedRecords]);

  const selectedPayload = isPlainObject(selectedRecord?.payload) ? selectedRecord.payload : {};
  const selectedDocuments = Array.isArray(selectedPayload?.documents) ? selectedPayload.documents : [];
  const selectedReview = isPlainObject(selectedPayload?.mentorReview) ? selectedPayload.mentorReview : {};
  const selectedStatus = selectedRecord ? normalizeSubmissionState(selectedRecord) : "draft";
  const selectedStatusMeta = getStatusMeta(selectedStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header name={name} id={id} />
      <div className="flex pt-24 lg:pt-28 px-2 lg:px-8">
        <Sidebar />
        <main className="flex-1 lg:ml-72 mb-16 lg:mb-0 px-3 sm:px-6 xl:px-8 py-5 sm:py-7 space-y-6 min-w-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">NOC Details</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Review submitted NOC forms, status, and document proof links for all groups.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchNocRecords}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
              <MiniStat label="Total" value={stats.total} />
              <MiniStat label="Submitted" value={stats.submitted} accent="text-blue-700" />
              <MiniStat label="Pending" value={stats.pending} accent="text-amber-700" />
              <MiniStat label="Approved" value={stats.approved} accent="text-emerald-700" />
              <MiniStat label="Rejected" value={stats.rejected} accent="text-red-700" />
            </div>
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by group id, team name, or mentor code"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="lg:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending_mentor_approval">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="lg:col-span-3">
                <select
                  value={yearFilter}
                  onChange={(event) => setYearFilter(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Years</option>
                  {availableYears.map((yearTag) => (
                    <option key={yearTag} value={yearTag}>
                      {yearTag}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errorText && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
                {errorText}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-slate-700 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Group</th>
                      <th className="px-4 py-3 text-left">Team</th>
                      <th className="px-4 py-3 text-left">Year</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Documents</th>
                      <th className="px-4 py-3 text-left">Updated</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                          Loading NOC forms...
                        </td>
                      </tr>
                    )}

                    {!loading && filteredRecords.map((record) => {
                      const statusMeta = getStatusMeta(record.submissionState);
                      const StatusIcon = statusMeta.icon;

                      return (
                        <tr key={record.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-semibold text-slate-900">{record.group_id || "-"}</td>
                          <td className="px-4 py-3 text-slate-700">{record.team_name || "-"}</td>
                          <td className="px-4 py-3 text-slate-700">{record.group_year || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {record.uploadedDocumentsCount}/{record.documentsCount}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{formatDateTime(record.updated_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(record)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!loading && filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                          No NOC forms matched your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/55"
            onClick={() => setSelectedRecord(null)}
            aria-hidden="true"
          />

          <section className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">NOC Form Detail</p>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedRecord.group_id || "-"}</h2>
                <p className="text-sm text-slate-600">{selectedRecord.team_name || "No team name"}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${selectedStatusMeta.badgeClass}`}>
                  {selectedStatusMeta.label}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                  aria-label="Close details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            <div className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <InfoTile label="Group Year" value={selectedRecord.group_year || "-"} />
                <InfoTile label="Mentor Code" value={selectedRecord.mentor_code || "-"} />
                <InfoTile label="Submitted At" value={formatDateTime(selectedRecord.submitted_at)} />
                <InfoTile label="Updated At" value={formatDateTime(selectedRecord.updated_at)} />
              </div>

              <section className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Certificate Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500 font-medium">Certificate Date</p>
                    <p className="text-slate-900 font-semibold">{formatDate(selectedPayload.certificateDate)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Guide Signature Name</p>
                    <p className="text-slate-900 font-semibold">{asText(selectedPayload.guideSignatureName) || "-"}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-slate-500 font-medium text-sm">Concluding Remark</p>
                  <p className="text-slate-900 text-sm mt-1">{asText(selectedPayload.concludingRemark) || "-"}</p>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 p-4 bg-white">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Mentor Review</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500 font-medium">Review Status</p>
                    <p className="text-slate-900 font-semibold">{selectedStatusMeta.label}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Reviewed At</p>
                    <p className="text-slate-900 font-semibold">{formatDateTime(selectedReview.reviewedAt)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Reviewed By</p>
                    <p className="text-slate-900 font-semibold">{asText(selectedReview.reviewedBy) || "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Feedback</p>
                    <p className="text-slate-900 font-semibold">{asText(selectedReview.feedback) || "-"}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-800">Submitted Documents</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white text-slate-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Document</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDocuments.map((documentRow, index) => (
                        <tr key={`${documentRow.id || index}-${documentRow.name || "doc"}`} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-900">{documentRow.name || "-"}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {asText(documentRow.status) || (asText(documentRow.proofUrl) ? "Submitted" : "-")}
                          </td>
                          <td className="px-4 py-3">
                            {asText(documentRow.proofUrl) ? (
                              <a
                                href={documentRow.proofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-purple-700 hover:underline font-semibold"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Open Proof
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {selectedDocuments.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                            No document rows found in payload.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 p-4 bg-slate-50/70">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700 inline-flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    View Raw Payload JSON
                  </summary>
                  <pre className="mt-3 rounded-lg bg-slate-900 text-slate-100 text-xs p-3 overflow-auto">
                    {JSON.stringify(selectedPayload, null, 2)}
                  </pre>
                </details>
              </section>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const MiniStat = ({ label, value, accent }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
    <p className={`text-xl font-bold mt-0.5 ${accent || "text-slate-900"}`}>{Number(value || 0).toLocaleString()}</p>
  </div>
);

const InfoTile = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
    <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
    <p className="text-sm font-semibold text-slate-900 mt-1">{value || "-"}</p>
  </div>
);

export default AdminNocDetails;
