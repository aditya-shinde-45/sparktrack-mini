import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../api";
import Sidebar from "../../Components/Admin/Sidebar";
import Header from "../../Components/Common/Header";
import mitLogo from "../../assets/mitlogo2.png";

const emptyField = () => ({
  key: "",
  label: "",
  max_marks: 0,
  type: "number",
  options: [],
  optionsInput: "",
  scope: "common",
  allowed_types: "all",
  max_size_mb: 10
});
const YEAR_OPTIONS = ["SY", "TY", "LY"];
const ACCESS_ROLE_OPTIONS = [
  { value: "mentor", label: "Mentor" },
  { value: "industry_mentor", label: "Industry Mentor" }
];
const FILE_TYPE_OPTIONS = [
  { value: "all", label: "All file types" },
  { value: "image", label: "Images only" },
  { value: "pdf", label: "PDF only" },
  { value: "docx", label: "DOC/DOCX" },
  { value: "ppt", label: "PPT/PPTX" }
];

const slugifyKey = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const normalizeAllowedYears = (years = []) => {
  if (!Array.isArray(years)) return [];
  const normalized = years
    .map((value) => String(value || "").trim().toUpperCase())
    .filter((value) => YEAR_OPTIONS.includes(value));
  return Array.from(new Set(normalized));
};

const normalizeFieldType = (field) => {
  const rawType = String(field?.type || "").trim().toLowerCase();
  if (["number", "boolean", "text", "select", "file"].includes(rawType)) return rawType;
  const hasOptions = Array.isArray(field?.options) && field.options.length > 0;
  if (hasOptions) return "select";
  const maxMarks = Number(field?.max_marks) || 0;
  if (maxMarks > 0) return "number";
  const label = String(field?.label || "").toLowerCase();
  if (label.includes("link") || label.includes("url")) return "text";
  return "boolean";
};

const normalizeRoleList = (roles = [], fallback = []) => {
  if (!Array.isArray(roles)) return [...fallback];
  const allowed = ACCESS_ROLE_OPTIONS.map((option) => option.value);
  const normalized = roles
    .map((role) => String(role || "").trim().toLowerCase())
    .filter((role) => allowed.includes(role));
  return Array.from(new Set(normalized));
};

const EvaluationFormBuilder = () => {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [sheetTitle, setSheetTitle] = useState("");
  const [totalMarks, setTotalMarks] = useState(50);
  const [fields, setFields] = useState([emptyField()]);
  const [allowedYears, setAllowedYears] = useState([]);
  const [viewRoles, setViewRoles] = useState(["mentor", "industry_mentor"]);
  const [editAfterSubmitRoles, setEditAfterSubmitRoles] = useState([]);
  const [submitRoles, setSubmitRoles] = useState(["mentor", "industry_mentor"]);
  const [isCreating, setIsCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);


  const computedTotal = useMemo(() => {
    return fields.reduce((sum, field) => {
      if (field.type !== "number") return sum;
      return sum + (Number(field.max_marks) || 0);
    }, 0);
  }, [fields]);

  const fieldGroups = useMemo(() => {
    return {
      numeric: fields.filter((field) => field.type === "number"),
      boolean: fields.filter((field) => field.type === "boolean"),
      text: fields.filter((field) => field.type === "text"),
      select: fields.filter((field) => field.type === "select"),
      file: fields.filter((field) => field.type === "file")
    };
  }, [fields]);

  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");
  const id = localStorage.getItem("id");

  const loadForms = async () => {
    const response = await apiRequest("/api/admin/evaluation-forms", "GET", null, token);
    if (response?.success) {
      setForms(response.data || []);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleSelectForm = async (formId) => {
    setSelectedFormId(formId);

    if (!formId) {
      setFormName("");
      setSheetTitle("");
      setTotalMarks(50);
      setFields([emptyField()]);
      setAllowedYears([]);
      setViewRoles(["mentor", "industry_mentor"]);
      setEditAfterSubmitRoles([]);
      setSubmitRoles(["mentor", "industry_mentor"]);
      return;
    }

    const response = await apiRequest(`/api/admin/evaluation-forms/${formId}`, "GET", null, token);
    if (response?.success) {
      const form = response.data;
      setFormName(form?.name || "");
      setSheetTitle(form?.sheet_title || "");
      setTotalMarks(form?.total_marks || 0);
      const incomingFields = Array.isArray(form?.fields) && form.fields.length ? form.fields : [emptyField()];
      const normalizedFields = incomingFields.map((field) => ({
        ...emptyField(),
        ...field,
        type: normalizeFieldType(field),
        options: Array.isArray(field.options) ? field.options : [],
        optionsInput: Array.isArray(field.options) ? field.options.join(", ") : "",
        scope: field.scope === "individual" ? "individual" : "common",
        allowed_types: field.allowed_types || "all",
        max_size_mb: Number(field.max_size_mb) || 10
      }));
      const sortedFields = [...normalizedFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setFields(sortedFields);
      const normalizedYears = normalizeAllowedYears(form?.allowed_years || []);
      setAllowedYears(normalizedYears);
      setViewRoles(normalizeRoleList(form?.view_roles, ["mentor", "industry_mentor"]));
      setEditAfterSubmitRoles(normalizeRoleList(form?.edit_after_submit_roles, []));
      setSubmitRoles(normalizeRoleList(form?.submit_roles, ["mentor", "industry_mentor"]));
    }
  };

  const toggleRole = (roleValue, targetSetter) => {
    targetSetter((prev) => {
      if (prev.includes(roleValue)) {
        return prev.filter((value) => value !== roleValue);
      }
      return [...prev, roleValue];
    });
  };

  const updateField = (index, updates) => {
    const updated = [...fields];
    const next = { ...updated[index], ...updates };
    if (updates.type === "number") {
      next.max_marks = Number(next.max_marks) || 0;
    }
    if (updates.type === "boolean" || updates.type === "text" || updates.type === "select" || updates.type === "file") {
      next.max_marks = 0;
    }
    if (updates.type && !["select", "file"].includes(updates.type)) {
      next.options = [];
      next.optionsInput = "";
      next.scope = "common";
    }
    if (updates.type === "file") {
      next.options = [];
      next.optionsInput = "";
      next.allowed_types = next.allowed_types || "all";
      next.max_size_mb = Number(next.max_size_mb) || 10;
    }
    updated[index] = next;
    setFields(updated);
  };

  const updateOptionsInput = (index, rawValue) => {
    const parsed = rawValue
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    updateField(index, { optionsInput: rawValue, options: parsed });
  };

  const addNumericField = () => setFields((prev) => [...prev, emptyField()]);
  const addBooleanField = () => setFields((prev) => [...prev, { ...emptyField(), type: "boolean", max_marks: 0 }]);
  const addTextField = () => setFields((prev) => [...prev, { ...emptyField(), type: "text", max_marks: 0 }]);
  const addSelectField = () => setFields((prev) => [...prev, { ...emptyField(), type: "select", max_marks: 0, options: [] }]);
  const addFileField = () => setFields((prev) => [...prev, { ...emptyField(), type: "file", max_marks: 0 }]);

  const toggleYearSelection = (year) => {
    setAllowedYears((prev) => {
      if (prev.includes(year)) {
        return prev.filter((value) => value !== year);
      }
      return [...prev, year];
    });
  };

  const removeField = (index) => {
    if (fields.length === 1) return;
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateForm = async () => {
    if (!formName.trim()) {
      setStatusMessage("Form name is required.");
      return;
    }

    const sanitizedFields = fields.map((field, index) => {
      const label = field.label?.trim() || `Field ${index + 1}`;
      const key = field.key?.trim() || slugifyKey(label) || `field_${index + 1}`;
      const type = ["number", "boolean", "text", "select", "file"].includes(field.type) ? field.type : "number";
      const options = type === "select"
        ? (Array.isArray(field.options) ? field.options : [])
            .map((value) => String(value || "").trim())
            .filter(Boolean)
        : [];
      const scope = ["select", "file"].includes(type)
        ? (field.scope === "individual" ? "individual" : "common")
        : undefined;
      const allowed_types = type === "file"
        ? String(field.allowed_types || "all").trim().toLowerCase()
        : undefined;
      const max_size_mb = type === "file"
        ? Number(field.max_size_mb) || 10
        : undefined;
      return {
        key,
        label,
        type,
        max_marks: type === "number" ? Number(field.max_marks) || 0 : 0,
        order: index,
        options,
        scope,
        allowed_types,
        max_size_mb
      };
    });

    const sanitizedYears = normalizeAllowedYears(allowedYears);
    const sanitizedViewRoles = normalizeRoleList(viewRoles, ["mentor", "industry_mentor"]);
    const sanitizedEditAfterSubmitRoles = normalizeRoleList(editAfterSubmitRoles, []);
    const sanitizedSubmitRoles = normalizeRoleList(submitRoles, ["mentor", "industry_mentor"]);

    if (sanitizedViewRoles.length === 0) {
      setStatusMessage("Please select at least one role under who can view this form.");
      return;
    }

    if (sanitizedSubmitRoles.length === 0) {
      setStatusMessage("Please select at least one role under who can submit this form.");
      return;
    }

    setIsCreating(true);
    setStatusMessage("");

    const isUpdating = Boolean(selectedFormId);
    const endpoint = isUpdating
      ? `/api/admin/evaluation-forms/${selectedFormId}`
      : "/api/admin/evaluation-forms";
    const method = isUpdating ? "PUT" : "POST";

    const response = await apiRequest(
      endpoint,
      method,
      {
        name: formName.trim(),
        sheet_title: sheetTitle.trim() || null,
        total_marks: Number(totalMarks) || computedTotal,
        fields: sanitizedFields,
        allowed_years: sanitizedYears,
        view_roles: sanitizedViewRoles,
        edit_after_submit_roles: sanitizedEditAfterSubmitRoles,
        submit_roles: sanitizedSubmitRoles
      },
      token
    );

    if (response?.success) {
      setStatusMessage(isUpdating ? "Evaluation form updated successfully." : "Evaluation form created successfully.");
      setSelectedFormId(response.data?.id || selectedFormId || "");
      await loadForms();
    } else {
      setStatusMessage(response?.message || "Failed to save evaluation form.");
    }

    setIsCreating(false);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50">
      <Header name={name} id={id} />
      <div className="flex pt-24 lg:pt-28 px-2 lg:px-8">
        <Sidebar />
        <main className="flex-1 lg:ml-72 mb-16 lg:mb-0 px-4 sm:px-8 py-6">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl ring-1 ring-slate-200 p-6 mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Admin Evaluation Form Builder</h1>
                <p className="text-sm text-slate-500 mt-1">Create, edit, and manage evaluation forms.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                  Forms: {forms.length}
                </span>
                <button
                  onClick={() => setShowPreview(true)}
                  className="text-xs font-semibold text-slate-700 border border-slate-200 px-3 py-1 rounded-full hover:bg-slate-50"
                >
                  Preview Form
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1 space-y-4">
                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Select Existing Form</label>
                    <select
                      value={selectedFormId}
                      onChange={(e) => handleSelectForm(e.target.value)}
                      className="mt-2 w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="">Create New Form</option>
                      {forms.map((form) => (
                        <option key={form.id} value={form.id}>
                          {form.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Form Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="mt-2 w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Sheet Title</label>
                    <input
                      type="text"
                      value={sheetTitle}
                      onChange={(e) => setSheetTitle(e.target.value)}
                      className="mt-2 w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="Custom evaluation sheet title"
                    />
                    <p className="text-xs text-slate-500 mt-2">Shown on the evaluation sheet header.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Total Marks</label>
                    <input
                      type="number"
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(e.target.value)}
                      className="mt-2 w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <p className="text-xs text-slate-500 mt-2">Sum of criteria: {computedTotal}</p>
                    {computedTotal !== Number(totalMarks) && (
                      <p className="text-xs text-amber-600 mt-1">Total marks do not match the sum of criteria.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Allowed Years</label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {YEAR_OPTIONS.map((year) => (
                        <label
                          key={year}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer ${
                            allowedYears.includes(year)
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={allowedYears.includes(year)}
                            onChange={() => toggleYearSelection(year)}
                            className="accent-indigo-600"
                          />
                          {year}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Leave empty to allow all years.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Who Can View This Form</label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ACCESS_ROLE_OPTIONS.map((roleOption) => (
                        <label
                          key={`view-${roleOption.value}`}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer ${
                            viewRoles.includes(roleOption.value)
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={viewRoles.includes(roleOption.value)}
                            onChange={() => toggleRole(roleOption.value, setViewRoles)}
                            className="accent-indigo-600"
                          />
                          {roleOption.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Who Can Submit This Form</label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ACCESS_ROLE_OPTIONS.map((roleOption) => (
                        <label
                          key={`submit-${roleOption.value}`}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer ${
                            submitRoles.includes(roleOption.value)
                              ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={submitRoles.includes(roleOption.value)}
                            onChange={() => toggleRole(roleOption.value, setSubmitRoles)}
                            className="accent-cyan-600"
                          />
                          {roleOption.label}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Only selected roles can submit this evaluation form.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Who Can Edit After Submit</label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ACCESS_ROLE_OPTIONS.map((roleOption) => (
                        <label
                          key={`edit-after-submit-${roleOption.value}`}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer ${
                            editAfterSubmitRoles.includes(roleOption.value)
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={editAfterSubmitRoles.includes(roleOption.value)}
                            onChange={() => toggleRole(roleOption.value, setEditAfterSubmitRoles)}
                            className="accent-emerald-600"
                          />
                          {roleOption.label}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Unchecked means submission becomes read-only for that role.</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm">
                    <div className="px-4 py-3 border-b border-emerald-200 flex items-center justify-between bg-emerald-50/70">
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-800">File Upload Fields</h3>
                        <p className="text-xs text-emerald-600">Upload files once (common) or per student.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-full">
                          {fieldGroups.file.length} fields
                        </span>
                        <button
                          onClick={addFileField}
                          className="text-xs font-semibold text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-50"
                        >
                          + File
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-emerald-100">
                      {fieldGroups.file.length === 0 && (
                        <div className="px-4 py-4 text-sm text-slate-500">No file fields added yet.</div>
                      )}
                      {fieldGroups.file.map((field) => {
                        const index = fields.indexOf(field);
                        return (
                          <div key={`file-${index}`} className="p-4 bg-white">
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Label</label>
                                <input
                                  type="text"
                                  placeholder="Field label"
                                  value={field.label}
                                  onChange={(e) => updateField(index, { label: e.target.value })}
                                  className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Scope</label>
                                <select
                                  value={field.scope || "common"}
                                  onChange={(e) => updateField(index, { scope: e.target.value })}
                                  className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                  <option value="common">Common (above table)</option>
                                  <option value="individual">Individual (per student)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Size Limit (MB)</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={field.max_size_mb || 10}
                                  onChange={(e) => updateField(index, { max_size_mb: e.target.value })}
                                  className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Allowed File Type</label>
                                <select
                                  value={field.allowed_types || "all"}
                                  onChange={(e) => updateField(index, { allowed_types: e.target.value })}
                                  className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                  {FILE_TYPE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-end mt-3">
                              <button
                                onClick={() => removeField(index)}
                                className="text-xs text-rose-600 hover:text-rose-700"
                              >
                                Remove Field
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-2 space-y-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Criteria Fields</h2>
                    <p className="text-sm text-slate-500">Manage scoring, checklist, and supporting fields separately.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={addNumericField}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
                    >
                      Add Marks Field
                    </button>
                    <button
                      onClick={addBooleanField}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
                    >
                      Add Boolean Field
                    </button>
                    <button
                      onClick={addTextField}
                      className="px-3 py-2 bg-slate-700 text-white rounded-lg shadow hover:bg-slate-800 transition"
                    >
                      Add Text Field
                    </button>
                    <button
                      onClick={addSelectField}
                      className="px-3 py-2 bg-amber-600 text-white rounded-lg shadow hover:bg-amber-700 transition"
                    >
                      Add Dropdown Field
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">Scoring Fields</h3>
                        <p className="text-xs text-slate-500">Numeric criteria that contribute to total marks.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                          {fieldGroups.numeric.length} fields
                        </span>
                        <button
                          onClick={addNumericField}
                          className="text-xs font-semibold text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded-full hover:bg-indigo-50"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {fieldGroups.numeric.length === 0 && (
                        <div className="px-4 py-4 text-sm text-slate-500">No numeric fields added yet.</div>
                      )}
                      {fieldGroups.numeric.map((field) => {
                        const index = fields.indexOf(field);
                        return (
                          <div key={`numeric-${index}`} className="p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500">Label</label>
                          <input
                            type="text"
                            placeholder="Field label"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500">Key</label>
                          <input
                            type="text"
                            placeholder="Field key (optional)"
                            value={field.key}
                            onChange={(e) => updateField(index, { key: e.target.value })}
                            className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500">Max Marks</label>
                          <input
                            type="number"
                            placeholder="Max marks"
                            value={field.max_marks}
                            onChange={(e) => updateField(index, { max_marks: e.target.value })}
                            className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => removeField(index)}
                          className="text-xs text-rose-600 hover:text-rose-700"
                        >
                          Remove Field
                        </button>
                      </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-purple-200 shadow-sm">
                    <div className="px-4 py-3 border-b border-purple-200 flex items-center justify-between bg-purple-50/60">
                      <div>
                        <h3 className="text-sm font-semibold text-purple-800">Boolean Checklist</h3>
                        <p className="text-xs text-purple-500">Yes/No tick boxes (non-scoring).</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-purple-600 bg-white px-2.5 py-1 rounded-full">
                          {fieldGroups.boolean.length} fields
                        </span>
                        <button
                          onClick={addBooleanField}
                          className="text-xs font-semibold text-purple-600 border border-purple-200 px-2.5 py-1 rounded-full hover:bg-purple-50"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-purple-100">
                      {fieldGroups.boolean.length === 0 && (
                        <div className="px-4 py-4 text-sm text-slate-500">No boolean fields added yet.</div>
                      )}
                      {fieldGroups.boolean.map((field) => {
                        const index = fields.indexOf(field);
                        return (
                          <div key={`boolean-${index}`} className="p-4 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Label</label>
                                <input
                                  type="text"
                                  placeholder="Field label"
                                  value={field.label}
                                  onChange={(e) => updateField(index, { label: e.target.value })}
                                  className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Key</label>
                                <input
                                  type="text"
                                  placeholder="Field key (optional)"
                                  value={field.key}
                                  onChange={(e) => updateField(index, { key: e.target.value })}
                                  className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Type</label>
                                <div className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-500 text-xs">
                                  Boolean checklist
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end mt-3">
                              <button
                                onClick={() => removeField(index)}
                                className="text-xs text-rose-600 hover:text-rose-700"
                              >
                                Remove Field
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-amber-200 shadow-sm">
                    <div className="px-4 py-3 border-b border-amber-200 flex items-center justify-between bg-amber-50/70">
                      <div>
                        <h3 className="text-sm font-semibold text-amber-800">Text Fields</h3>
                        <p className="text-xs text-amber-600">Supporting text inputs (non-scoring).</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-700 bg-white px-2.5 py-1 rounded-full">
                          {fieldGroups.text.length} fields
                        </span>
                        <button
                          onClick={addTextField}
                          className="text-xs font-semibold text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full hover:bg-amber-50"
                        >
                          + Text
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-amber-100">
                      {fieldGroups.text.length === 0 && (
                        <div className="px-4 py-4 text-sm text-slate-500">No text fields added yet.</div>
                      )}
                      {fieldGroups.text.map((field) => {
                        const index = fields.indexOf(field);
                        return (
                          <div key={`extra-${index}`} className="p-4 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Label</label>
                                <input
                                  type="text"
                                  placeholder="Field label"
                                  value={field.label}
                                  onChange={(e) => updateField(index, { label: e.target.value })}
                                  className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Key</label>
                                <input
                                  type="text"
                                  placeholder="Field key (optional)"
                                  value={field.key}
                                  onChange={(e) => updateField(index, { key: e.target.value })}
                                  className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Type</label>
                                <div className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-500 text-xs">
                                  Text input
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end mt-3">
                              <button
                                onClick={() => removeField(index)}
                                className="text-xs text-rose-600 hover:text-rose-700"
                              >
                                Remove Field
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-amber-200 shadow-sm">
                    <div className="px-4 py-3 border-b border-amber-200 flex items-center justify-between bg-amber-50/70">
                      <div>
                        <h3 className="text-sm font-semibold text-amber-800">Dropdown Fields</h3>
                        <p className="text-xs text-amber-600">Dropdown lists with common or individual scope.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-amber-700 bg-white px-2.5 py-1 rounded-full">
                          {fieldGroups.select.length} fields
                        </span>
                        <button
                          onClick={addSelectField}
                          className="text-xs font-semibold text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full hover:bg-amber-50"
                        >
                          + Dropdown
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-amber-100">
                      {fieldGroups.select.length === 0 && (
                        <div className="px-4 py-4 text-sm text-slate-500">No dropdown fields added yet.</div>
                      )}
                      {fieldGroups.select.map((field) => {
                        const index = fields.indexOf(field);
                        return (
                          <div key={`select-${index}`} className="p-4 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Label</label>
                                <input
                                  type="text"
                                  placeholder="Field label"
                                  value={field.label}
                                  onChange={(e) => updateField(index, { label: e.target.value })}
                                  className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Key</label>
                                <input
                                  type="text"
                                  placeholder="Field key (optional)"
                                  value={field.key}
                                  onChange={(e) => updateField(index, { key: e.target.value })}
                                  className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Scope</label>
                                <select
                                  value={field.scope || "common"}
                                  onChange={(e) => updateField(index, { scope: e.target.value })}
                                  className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                  <option value="common">Common (above table)</option>
                                  <option value="individual">Individual (per student)</option>
                                </select>
                              </div>
                            </div>
                            <div className="mt-3">
                              <label className="block text-xs font-semibold text-slate-500">Dropdown Options</label>
                              <input
                                type="text"
                                placeholder="Option1, Option2, Option3"
                                value={field.optionsInput || ""}
                                onChange={(e) => updateOptionsInput(index, e.target.value)}
                                className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                            </div>
                            <div className="flex justify-end mt-3">
                              <button
                                onClick={() => removeField(index)}
                                className="text-xs text-rose-600 hover:text-rose-700"
                              >
                                Remove Field
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <button
                    onClick={handleCreateForm}
                    disabled={isCreating}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-6 rounded-xl shadow hover:opacity-90 transition disabled:opacity-60"
                  >
                    {isCreating ? "Saving..." : selectedFormId ? "Update Evaluation Form" : "Save Evaluation Form"}
                  </button>
                  {statusMessage && (
                    <p className="text-sm text-slate-700">{statusMessage}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Evaluation Form Preview</h2>
                <p className="text-xs text-slate-500">Preview matches the mentor evaluation layout.</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto text-slate-800">
              <section className="bg-white rounded-2xl border border-gray-300 shadow-sm">
                <div className="border-b border-gray-300">
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_160px] gap-4 items-center p-4">
                    <div className="flex items-center justify-center">
                      <img src={mitLogo} alt="MIT-ADT" className="w-16 h-16 object-contain" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-gray-500">MIT School of Computing</p>
                      <h1 className="text-lg sm:text-xl font-bold text-purple-700">
                        {sheetTitle || "Evaluation Sheet"}
                      </h1>
                    </div>
                    <div className="text-sm text-gray-700">
                      <label className="block font-semibold">Date:</label>
                      <input
                        type="date"
                        value={new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toISOString().split('T')[0]}
                        readOnly
                        className="w-full border border-gray-300 rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-b border-gray-300 text-sm">
                  <div className="p-2 border-r border-gray-300">
                    <span className="font-semibold">Class:</span>
                    <span className="ml-2 text-gray-600">Preview</span>
                  </div>
                  <div className="p-2 border-r border-gray-300">
                    <span className="font-semibold">Project ID:</span>
                    <span className="ml-2 text-gray-600">PRJ-000</span>
                  </div>
                  <div className="p-2">
                    <span className="font-semibold">Project Review:</span>
                    <span className="ml-2 text-gray-600">{formName || "Evaluation"}</span>
                  </div>
                </div>

                <div className="border-b border-gray-300 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="block font-semibold text-sm mb-2">Project Title:</label>
                      <p className="text-base text-gray-800 font-medium">Preview Project Title</p>
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-300 p-3 text-sm">
                  <div className="font-semibold mb-2">Rubrics for Evaluation:</div>
                  <div className="space-y-1">
                    {fieldGroups.numeric.length === 0 && (
                      <p className="text-gray-500">No scoring fields added yet.</p>
                    )}
                    {fieldGroups.numeric.map((field, index) => (
                      <div key={field.key || index} className="flex gap-2">
                        <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>
                        <span className="flex-1">{field.label || `Field ${index + 1}`}</span>
                        <span className="font-semibold">({field.max_marks || 0} Marks)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {(fieldGroups.text.length > 0 || fieldGroups.select.filter((field) => field.scope !== "individual").length > 0 || fieldGroups.file.filter((field) => field.scope !== "individual").length > 0) && (
                  <div className="border-b border-gray-300 p-4 text-sm">
                    <div className="space-y-4">
                      {[...fieldGroups.text, ...fieldGroups.select.filter((field) => field.scope !== "individual"), ...fieldGroups.file.filter((field) => field.scope !== "individual")].map((field) => (
                        <div key={field.key}>
                          <label className="block font-semibold">{field.label || "Field"}</label>
                          {field.type === "select" ? (
                            <select
                              defaultValue=""
                              onChange={() => {}}
                              className="w-full border border-gray-300 p-2 mt-1 rounded-md bg-white text-slate-700"
                            >
                              <option value="">Select</option>
                              {(field.options || []).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : field.type === "file" ? (
                            <input
                              type="file"
                              disabled
                              className="w-full border border-gray-300 p-2 mt-1 rounded-md bg-gray-100 text-slate-700"
                            />
                          ) : (
                            <input
                              type="text"
                              disabled
                              className="w-full border border-gray-300 p-2 mt-1 rounded-md bg-gray-100 text-slate-700"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm text-center min-w-[900px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left">Enrolment No.</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Name of Students</th>
                        {fieldGroups.numeric.map((field, index) => (
                          <th key={field.key || index} className="border border-gray-300 px-3 py-2">
                            <div className="text-xs font-semibold">{String.fromCharCode(65 + index)}</div>
                            <div className="text-[10px] text-gray-500">{field.max_marks || 0}</div>
                          </th>
                        ))}
                        <th className="border border-gray-300 px-3 py-2">Total Marks ({totalMarks || computedTotal})</th>
                        {fieldGroups.select.filter((field) => field.scope === "individual").map((field) => (
                          <th key={field.key} className="border border-gray-300 px-3 py-2">
                            <div className="text-xs font-semibold">{field.label || "Field"}</div>
                            <div className="text-[10px] text-gray-500">Dropdown</div>
                          </th>
                        ))}
                        {fieldGroups.file.filter((field) => field.scope === "individual").map((field) => (
                          <th key={field.key} className="border border-gray-300 px-3 py-2">
                            <div className="text-xs font-semibold">{field.label || "Field"}</div>
                            <div className="text-[10px] text-gray-500">File</div>
                          </th>
                        ))}
                        <th className="border border-gray-300 px-3 py-2">Absent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["Preview Student 1", "Preview Student 2"].map((name, idx) => (
                        <tr key={name} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 text-left">PR-00{idx + 1}</td>
                          <td className="border border-gray-300 px-3 py-2 text-left">{name}</td>
                          {fieldGroups.numeric.map((field) => (
                            <td key={field.key} className="border border-gray-300 px-2 py-2">
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="number"
                                  disabled
                                  className="w-12 border border-gray-300 rounded-md p-1 text-center text-xs bg-gray-100"
                                />
                                <input
                                  type="range"
                                  disabled
                                  className="w-16 h-1 accent-purple-600"
                                />
                              </div>
                            </td>
                          ))}
                          <td className="border border-gray-300 px-3 py-2 font-semibold">--</td>
                          {fieldGroups.select.filter((field) => field.scope === "individual").map((field) => (
                            <td key={field.key} className="border border-gray-300 px-2 py-2">
                              <select defaultValue="" className="w-28 border border-gray-300 rounded-md p-1 text-xs bg-white">
                                <option value="">Select</option>
                                {(field.options || []).map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>
                          ))}
                          {fieldGroups.file.filter((field) => field.scope === "individual").map((field) => (
                            <td key={field.key} className="border border-gray-300 px-2 py-2">
                              <input
                                type="file"
                                disabled
                                className="w-28 border border-gray-300 rounded-md p-1 text-xs bg-gray-100"
                              />
                            </td>
                          ))}
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <input type="checkbox" disabled className="w-4 h-4 accent-purple-600" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-gray-300 text-sm">
                  <div>
                    <label className="block font-semibold">External Examiner Name:</label>
                    <input
                      type="text"
                      disabled
                      className="w-full border border-gray-300 p-2 mt-1 rounded-md bg-gray-100"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-300 p-4 text-sm">
                  <label className="block font-semibold">
                    Feedback by Evaluator <span className="text-gray-500">(Feedback based Learning)</span>
                  </label>
                  <textarea
                    disabled
                    className="w-full border border-gray-300 p-2 mt-1 rounded-md h-24 bg-gray-100"
                  />
                </div>

                {fieldGroups.boolean.length > 0 && (
                  <div className="border-t border-gray-300 p-4 text-sm">
                    <div className="flex flex-wrap gap-3">
                      {fieldGroups.boolean.map((field) => (
                        <label key={field.key} className="flex items-center gap-2 border border-gray-300 px-3 py-2">
                          <input type="checkbox" disabled className="w-4 h-4 accent-purple-600" />
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {field.label || "Checklist"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationFormBuilder;
