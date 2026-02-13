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
  ShieldCheck,
  Pencil,
  Save,
  AlertTriangle,
  Trash2,
  Info
} from "lucide-react";

const MentorSettings = () => {
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    designation: "",
    email: "",
    contact: ""
  });
  const [existingRecord, setExistingRecord] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("mentor_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const tokenData = JSON.parse(atob(token.split(".")[1]));
    setMentor({
      name: tokenData.mentor_name,
      id: tokenData.mentor_id
    });

    const loadIndustrialMentor = async () => {
      try {
        setLoading(true);
        const res = await apiRequest("/api/mentors/industrial-mentor", "GET", null, token);
        const record = res?.data?.industrialMentor || res?.industrialMentor || null;
        setExistingRecord(record);
        if (record) {
          setFormData({
            name: record.name || "",
            company_name: record.company_name || "",
            designation: record.designation || "",
            email: record.email || "",
            contact: record.contact || ""
          });
        }
      } catch (error) {
        console.error("Failed to load industrial mentor:", error);
      } finally {
        setLoading(false);
      }
    };

    loadIndustrialMentor();
  }, []);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("mentor_token");

    if (!formData.name.trim()) {
      setStatus({ type: "error", message: "Name is required." });
      return;
    }

    try {
      setStatus({ type: "", message: "" });
      const payload = {
        name: formData.name,
        company_name: formData.company_name || null,
        designation: formData.designation || null,
        email: formData.email || null,
        contact: formData.contact || null
      };

      const response = existingRecord
        ? await apiRequest("/api/mentors/industrial-mentor", "PUT", payload, token)
        : await apiRequest("/api/mentors/industrial-mentor", "POST", payload, token);

      if (response?.success === false) {
        setStatus({ type: "error", message: response?.message || "Failed to save." });
        return;
      }

      const updated = response?.data?.industrialMentor || response?.industrialMentor || null;
      setExistingRecord(updated);
      setIsEditing(false);
      setStatus({ type: "success", message: existingRecord ? "Updated successfully." : "Created successfully." });
    } catch (error) {
      console.error("Save failed:", error);
      setStatus({ type: "error", message: error?.message || "Failed to save." });
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("mentor_token");
    if (!existingRecord) return;

    const confirmed = window.confirm("Delete the industrial mentor record? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setStatus({ type: "", message: "" });
      const response = await apiRequest("/api/mentors/industrial-mentor", "DELETE", null, token);
      if (response?.success === false) {
        setStatus({ type: "error", message: response?.message || "Failed to delete." });
        return;
      }
      setExistingRecord(null);
      setIsEditing(false);
      setFormData({ name: "", company_name: "", designation: "", email: "", contact: "" });
      setStatus({ type: "success", message: "Industrial mentor deleted successfully." });
    } catch (error) {
      console.error("Delete failed:", error);
      setStatus({ type: "error", message: error?.message || "Failed to delete." });
    }
  };

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <MentorHeader name={mentor?.name || "Mentor"} id={mentor?.id || "----"} />
      <div className="flex flex-1 flex-col lg:flex-row mt-[80px]">
        <MentorSidebar />
        <main className="flex-1 p-4 md:p-8 bg-gray-50 lg:ml-72 mb-16 lg:mb-0">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-2">Settings</h1>
              <p className="text-gray-600">Manage your industrial mentor details.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-xl border border-purple-100">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Profile</p>
                    <h2 className="text-lg font-semibold text-gray-900">Industrial Mentor</h2>
                  </div>
                </div>
                {existingRecord && !isEditing && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 text-purple-700 bg-white hover:bg-purple-50 transition"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
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

              {loading ? (
                <div className="p-6 text-sm text-gray-500">Loading...</div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {existingRecord && isEditing && (
                    <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      <Info className="w-4 h-4" />
                      Updating email will regenerate the password and send new credentials to the updated email.
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Full Name *</label>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                        <UserPlus className="w-4 h-4 text-purple-500" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={handleChange("name")}
                          disabled={existingRecord && !isEditing}
                          className="w-full outline-none text-sm text-gray-900"
                          placeholder="Enter name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700">Company Name</label>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                        <Building2 className="w-4 h-4 text-purple-500" />
                        <input
                          type="text"
                          value={formData.company_name}
                          onChange={handleChange("company_name")}
                          disabled={existingRecord && !isEditing}
                          className="w-full outline-none text-sm text-gray-900"
                          placeholder="Company"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700">Designation</label>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                        <Briefcase className="w-4 h-4 text-purple-500" />
                        <input
                          type="text"
                          value={formData.designation}
                          onChange={handleChange("designation")}
                          disabled={existingRecord && !isEditing}
                          className="w-full outline-none text-sm text-gray-900"
                          placeholder="Designation"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700">Email</label>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                        <Mail className="w-4 h-4 text-purple-500" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={handleChange("email")}
                          disabled={existingRecord && !isEditing}
                          className="w-full outline-none text-sm text-gray-900"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700">Contact</label>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white">
                        <Phone className="w-4 h-4 text-purple-500" />
                        <input
                          type="text"
                          value={formData.contact}
                          onChange={handleChange("contact")}
                          disabled={existingRecord && !isEditing}
                          className="w-full outline-none text-sm text-gray-900"
                          placeholder="Contact number"
                        />
                      </div>
                    </div>
                  </div>

                  {!existingRecord || isEditing ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
                      >
                        <Save className="w-4 h-4" />
                        {existingRecord ? "Save Changes" : "Create Industrial Mentor"}
                      </button>
                      {existingRecord && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              name: existingRecord.name || "",
                              company_name: existingRecord.company_name || "",
                              designation: existingRecord.designation || "",
                              email: existingRecord.email || "",
                              contact: existingRecord.contact || ""
                            });
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ) : null}
                </form>
              )}
            </div>

            {existingRecord && !loading && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400">Details</p>
                    <h3 className="text-lg font-semibold text-gray-900">Industrial Mentor Summary</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-gray-500">Code</p>
                    <p className="text-gray-900 font-semibold">{existingRecord.industrial_mentor_code || "-"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-gray-500">Created</p>
                    <p className="text-gray-900 font-semibold">
                      {existingRecord.created_at ? new Date(existingRecord.created_at).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-gray-500">Linked Faculty Code</p>
                    <p className="text-gray-900 font-semibold">{existingRecord.mentor_code || "-"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MentorSettings;
