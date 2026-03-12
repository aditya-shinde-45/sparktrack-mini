import React, { useEffect, useState } from "react";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import MentorSidebar from "../../Components/Mentor/MentorSidebar";
import { apiRequest } from "../../api";
import {
  Building2,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  UserCog,
  Pencil,
  Save,
  AlertTriangle,
  Trash2,
  Info,
  Plus,
  X,
  Link,
  Search
} from "lucide-react";

const emptyForm = { name: "", company_name: "", designation: "", email: "", contact: "" };

const MentorSettings = () => {
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null); // null = closed, {} = new, {...} = edit
  const [modalMode, setModalMode] = useState("create"); // "create" | "link"
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  // Link existing state
  const [linkQuery, setLinkQuery] = useState("");
  const [linkSearching, setLinkSearching] = useState(false);
  const [linkPreview, setLinkPreview] = useState(null);
  const [linkSearchError, setLinkSearchError] = useState("");
  const [linkDropdownResults, setLinkDropdownResults] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("mentor_token");
    if (!token) {
      window.location.href = "/pblmanagementfacultydashboardlogin";
      return;
    }
    const tokenData = JSON.parse(atob(token.split(".")[1]));
    setMentor({ name: tokenData.mentor_name, id: tokenData.mentor_id });
    loadAll(token);
  }, []);

  const loadAll = async (token) => {
    try {
      setLoading(true);
      const res = await apiRequest("/api/mentors/industrial-mentor", "GET", null, token);
      const list = res?.data?.industrialMentors || res?.industrialMentors || [];
      setRecords(list);
    } catch (err) {
      console.error("Failed to load industrial mentors:", err);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingRecord({});
    setModalMode("create");
    setFormData(emptyForm);
    setStatus({ type: "", message: "" });
    setLinkQuery("");
    setLinkPreview(null);
    setLinkSearchError("");
    setLinkDropdownResults([]);
  };

  const openLink = () => {
    setEditingRecord({});
    setModalMode("link");
    setFormData(emptyForm);
    setStatus({ type: "", message: "" });
    setLinkQuery("");
    setLinkPreview(null);
    setLinkSearchError("");
    setLinkDropdownResults([]);
  };

  const openEdit = (record) => {
    setEditingRecord(record);
    setModalMode("create");
    setFormData({
      name: record.name || "",
      company_name: record.company_name || "",
      designation: record.designation || "",
      email: record.email || "",
      contact: record.contact || ""
    });
    setStatus({ type: "", message: "" });
    setLinkQuery("");
    setLinkPreview(null);
    setLinkSearchError("");
    setLinkDropdownResults([]);
  };

  const closeForm = () => {
    setEditingRecord(null);
    setStatus({ type: "", message: "" });
    setLinkQuery("");
    setLinkPreview(null);
    setLinkSearchError("");
    setLinkDropdownResults([]);
  };

  const handleChange = (field) => (e) => setFormData((p) => ({ ...p, [field]: e.target.value }));

  // Debounced auto-search as user types
  useEffect(() => {
    if (!linkQuery.trim() || linkPreview) return;
    const timer = setTimeout(() => {
      handleSearchLink(linkQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [linkQuery]);

  const handleSearchLink = async (q) => {
    const query = (q ?? linkQuery).trim();
    if (!query) return;
    const token = localStorage.getItem("mentor_token");
    try {
      setLinkSearching(true);
      setLinkSearchError("");
      setLinkDropdownResults([]);
      const res = await apiRequest(
        `/api/mentors/industrial-mentor/search?query=${encodeURIComponent(query)}`,
        "GET",
        null,
        token
      );
      const single = res?.data?.industrialMentor || res?.industrialMentor || null;
      const list = res?.data?.results || res?.results || [];
      if (single) {
        setLinkPreview(single);
        setLinkDropdownResults([]);
      } else if (list.length > 0) {
        setLinkDropdownResults(list);
        setLinkPreview(null);
      } else {
        setLinkSearchError("No mentor found with that code, contact, or name.");
      }
    } catch (err) {
      setLinkSearchError(err?.message || "Mentor not found.");
    } finally {
      setLinkSearching(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!linkPreview) return;
    const token = localStorage.getItem("mentor_token");
    try {
      setSaving(true);
      setStatus({ type: "", message: "" });
      const response = await apiRequest(
        "/api/mentors/industrial-mentor/link",
        "POST",
        { industrial_mentor_code: linkPreview.industrial_mentor_code },
        token
      );
      if (response?.success === false) {
        setStatus({ type: "error", message: response?.message || "Failed to link." });
        return;
      }
      await loadAll(token);
      setEditingRecord(null);
      setLinkPreview(null);
      setLinkQuery("");
      setLinkDropdownResults([]);
      setStatus({ type: "success", message: `${linkPreview.name} linked to your class.` });
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Failed to link." });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("mentor_token");
    if (!formData.name.trim()) {
      setStatus({ type: "error", message: "Name is required." });
      return;
    }
    const isNew = !editingRecord?.industrial_mentor_code;
    try {
      setSaving(true);
      setStatus({ type: "", message: "" });
      const payload = {
        name: formData.name,
        company_name: formData.company_name || null,
        designation: formData.designation || null,
        email: formData.email || null,
        contact: formData.contact || null
      };
      const response = isNew
        ? await apiRequest("/api/mentors/industrial-mentor", "POST", payload, token)
        : await apiRequest(
            `/api/mentors/industrial-mentor/${editingRecord.industrial_mentor_code}`,
            "PUT",
            payload,
            token
          );
      if (response?.success === false) {
        // If backend says this email already belongs to another mentor,
        // auto-switch to Link Existing tab and pre-fill with their code.
        if (response?.existingMentor) {
          const em = response.existingMentor;
          setModalMode("link");
          setLinkQuery(em.industrial_mentor_code || em.contact || "");
          setLinkPreview(em);
          setLinkSearchError("");
          setLinkDropdownResults([]);
          setStatus({
            type: "error",
            message: `"${em.name}" already exists. Confirm below to link them to your class.`
          });
        } else {
          setStatus({ type: "error", message: response?.message || "Failed to save." });
        }
        return;
      }
      await loadAll(token);
      setEditingRecord(null);
      setStatus({ type: "success", message: isNew ? "Industry mentor created." : "Updated successfully." });
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const confirmed = window.confirm(`Delete "${record.name}"? This cannot be undone.`);
    if (!confirmed) return;
    const token = localStorage.getItem("mentor_token");
    try {
      setStatus({ type: "", message: "" });
      await apiRequest(
        `/api/mentors/industrial-mentor/${record.industrial_mentor_code}`,
        "DELETE",
        null,
        token
      );
      await loadAll(token);
      setStatus({ type: "success", message: "Industry mentor deleted." });
    } catch (err) {
      setStatus({ type: "error", message: err?.message || "Failed to delete." });
    }
  };

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <MentorHeader name={mentor?.name || "Mentor"} id={mentor?.id || "----"} />
      <div className="flex flex-1 flex-col lg:flex-row mt-[80px]">
        <MentorSidebar />
        <main className="flex-1 p-4 md:p-8 bg-gray-50 lg:ml-72 mb-16 lg:mb-0">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-2">Industry Mentors</h1>
                <p className="text-gray-600">Manage industry mentors for your class.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={openNew}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Industry Mentor
                </button>
                <button
                  onClick={openLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-purple-300 text-purple-700 bg-white font-semibold hover:bg-purple-50 transition shadow-sm"
                >
                  <Link className="w-4 h-4" />
                  Link Existing
                </button>
              </div>
            </div>

            {status.message && (
              <div className={`mb-6 rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
                status.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                <AlertTriangle className="w-4 h-4" />
                {status.message}
              </div>
            )}

            {/* List of existing mentors */}
            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-sm text-gray-500">Loading...</div>
            ) : records.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No industry mentors yet. Click "Add Industry Mentor" to create one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {records.map((rec) => (
                  <div key={rec.industrial_mentor_code} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <UserCog className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{rec.name || "-"}</p>
                          <p className="text-xs text-purple-600 font-medium">{rec.industrial_mentor_code}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEdit(rec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 text-purple-700 bg-white hover:bg-purple-50 text-xs font-semibold transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 text-xs font-semibold transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs uppercase font-semibold">Company</p>
                        <p className="text-gray-800">{rec.company_name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase font-semibold">Designation</p>
                        <p className="text-gray-800">{rec.designation || "-"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase font-semibold">Email</p>
                        <p className="text-gray-800 break-all">{rec.email || "-"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase font-semibold">Contact</p>
                        <p className="text-gray-800">{rec.contact || "-"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Slide-in form modal */}
      {editingRecord !== null && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl border border-purple-100">
                  {modalMode === "link" ? <Link className="w-5 h-5 text-purple-600" /> : <UserCog className="w-5 h-5 text-purple-600" />}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400">
                    {editingRecord?.industrial_mentor_code ? "Edit" : modalMode === "link" ? "Link Existing" : "New"}
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900">Industry Mentor</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Tab switcher only for new (not edit) */}
                {!editingRecord?.industrial_mentor_code && (
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
                    <button
                      onClick={() => { setModalMode("create"); setLinkPreview(null); setLinkQuery(""); setLinkSearchError(""); setLinkDropdownResults([]); }}
                      className={`px-3 py-1.5 transition ${
                        modalMode === "create" ? "bg-purple-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Create New
                    </button>
                    <button
                      onClick={() => { setModalMode("link"); setStatus({ type: "", message: "" }); }}
                      className={`px-3 py-1.5 transition ${
                        modalMode === "link" ? "bg-purple-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Link Existing
                    </button>
                  </div>
                )}
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {status.message && (
              <div className={`mx-6 mt-4 rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
                status.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                <AlertTriangle className="w-4 h-4" />
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {editingRecord?.industrial_mentor_code && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <Info className="w-4 h-4" />
                  Updating email will regenerate password and send new credentials.
                </div>
              )}
              {modalMode === "link" ? (
                /* ── LINK EXISTING FLOW ── */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
                    <Info className="w-4 h-4" />
                    Search by code (e.g. IM001), contact number, or mentor name to find and link them to your class.
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Code, Contact Number, or Name</label>
                    <div className="mt-1.5 flex gap-2">
                      <div className="flex-1 relative">
                        <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                          <Search className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <input
                            type="text"
                            value={linkQuery}
                            onChange={(e) => { setLinkQuery(e.target.value); setLinkPreview(null); setLinkSearchError(""); setLinkDropdownResults([]); }}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchLink())}
                            className="w-full outline-none text-sm text-gray-900"
                            placeholder="IM001, contact number, or name"
                            autoComplete="off"
                          />
                          {linkSearching && <span className="text-xs text-purple-400 flex-shrink-0">searching...</span>}
                        </div>
                        {/* Dropdown results */}
                        {linkDropdownResults.length > 0 && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                            {linkDropdownResults.map((item) => (
                              <button
                                key={item.industrial_mentor_code}
                                type="button"
                                onClick={() => { setLinkPreview(item); setLinkDropdownResults([]); }}
                                className="w-full text-left px-4 py-2.5 hover:bg-purple-50 transition border-b border-gray-100 last:border-0"
                              >
                                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-400">{item.industrial_mentor_code}{item.company_name ? ` · ${item.company_name}` : ""}{item.contact ? ` · ${item.contact}` : ""}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSearchLink()}
                        disabled={linkSearching || !linkQuery.trim()}
                        className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        {linkSearching ? "..." : "Find"}
                      </button>
                    </div>
                    {linkSearchError && (
                      <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />{linkSearchError}
                      </p>
                    )}
                  </div>

                  {linkPreview && (
                    <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4 space-y-2">
                      <p className="text-xs font-bold uppercase text-purple-500 tracking-wider">Found — confirm to link</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><p className="text-gray-400 text-xs">Name</p><p className="font-semibold text-gray-900">{linkPreview.name}</p></div>
                        <div><p className="text-gray-400 text-xs">Code</p><p className="font-semibold text-purple-700">{linkPreview.industrial_mentor_code}</p></div>
                        <div><p className="text-gray-400 text-xs">Company</p><p className="text-gray-800">{linkPreview.company_name || "-"}</p></div>
                        <div><p className="text-gray-400 text-xs">Contact</p><p className="text-gray-800">{linkPreview.contact || "-"}</p></div>
                        <div className="col-span-2"><p className="text-gray-400 text-xs">Email</p><p className="text-gray-800">{linkPreview.email || "-"}</p></div>
                      </div>
                      <p className="text-xs text-purple-600 mt-2">They will keep their existing login credentials and get access to your class groups.</p>
                    </div>
                  )}

                  {linkPreview && (
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleConfirmLink}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-60"
                      >
                        <Link className="w-4 h-4" />
                        {saving ? "Linking..." : "Confirm Link"}
                      </button>
                      <button type="button" onClick={closeForm} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ── CREATE / EDIT FLOW ── */
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Full Name *</label>
                  <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                    <UserPlus className="w-4 h-4 text-purple-500" />
                    <input type="text" value={formData.name} onChange={handleChange("name")} className="w-full outline-none text-sm text-gray-900" placeholder="Name" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Company</label>
                  <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                    <Building2 className="w-4 h-4 text-purple-500" />
                    <input type="text" value={formData.company_name} onChange={handleChange("company_name")} className="w-full outline-none text-sm text-gray-900" placeholder="Company" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Designation</label>
                  <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                    <Briefcase className="w-4 h-4 text-purple-500" />
                    <input type="text" value={formData.designation} onChange={handleChange("designation")} className="w-full outline-none text-sm text-gray-900" placeholder="Designation" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                    <Mail className="w-4 h-4 text-purple-500" />
                    <input type="email" value={formData.email} onChange={handleChange("email")} className="w-full outline-none text-sm text-gray-900" placeholder="email@example.com" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Contact</label>
                  <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                    <Phone className="w-4 h-4 text-purple-500" />
                    <input type="text" value={formData.contact} onChange={handleChange("contact")} className="w-full outline-none text-sm text-gray-900" placeholder="Contact number" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : editingRecord?.industrial_mentor_code ? "Save Changes" : "Create"}
                </button>
                <button type="button" onClick={closeForm} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
              </>
            )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorSettings;
