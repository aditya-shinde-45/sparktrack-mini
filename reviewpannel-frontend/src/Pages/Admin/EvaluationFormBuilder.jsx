import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../api";
import Sidebar from "../../Components/Admin/Sidebar";
import Header from "../../Components/Common/Header";

const emptyField = () => ({ key: "", label: "", max_marks: 0, type: "number" });

const slugifyKey = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const EvaluationFormBuilder = () => {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [totalMarks, setTotalMarks] = useState(50);
  const [fields, setFields] = useState([emptyField()]);
  const [isCreating, setIsCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");


  const computedTotal = useMemo(() => {
    return fields.reduce((sum, field) => {
      if (field.type === "boolean") return sum;
      return sum + (Number(field.max_marks) || 0);
    }, 0);
  }, [fields]);

  const fieldGroups = useMemo(() => {
    return {
      numeric: fields.filter((field) => field.type !== "boolean"),
      boolean: fields.filter((field) => field.type === "boolean")
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
      setTotalMarks(50);
      setFields([emptyField()]);
      return;
    }

    const response = await apiRequest(`/api/admin/evaluation-forms/${formId}`, "GET", null, token);
    if (response?.success) {
      const form = response.data;
      setFormName(form?.name || "");
      setTotalMarks(form?.total_marks || 0);
      const incomingFields = Array.isArray(form?.fields) && form.fields.length ? form.fields : [emptyField()];
      const normalizedFields = incomingFields.map((field) => ({
        ...emptyField(),
        ...field,
        type: field.type || (Number(field.max_marks) === 0 ? "boolean" : "number")
      }));
      const sortedFields = [...normalizedFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setFields(sortedFields);
    }
  };

  const updateField = (index, updates) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const addNumericField = () => setFields((prev) => [...prev, emptyField()]);
  const addBooleanField = () => setFields((prev) => [...prev, { ...emptyField(), type: "boolean", max_marks: 0 }]);

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
      const type = field.type === "boolean" ? "boolean" : "number";
      return {
        key,
        label,
        type,
        max_marks: type === "boolean" ? 0 : Number(field.max_marks) || 0,
        order: index
      };
    });

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
        total_marks: Number(totalMarks) || computedTotal,
        fields: sanitizedFields
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
                </div>
              </div>

              <div className="xl:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Criteria Fields</h2>
                    <p className="text-sm text-slate-500">Add or edit the scoring fields for this form.</p>
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
                  </div>
                </div>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
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
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                          <input
                            type="text"
                            value="Numeric"
                            disabled
                            className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-100 text-slate-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500">Max Marks</label>
                          <input
                            type="number"
                            placeholder="Max marks"
                            value={field.max_marks}
                            onChange={(e) => updateField(index, { max_marks: e.target.value })}
                            disabled={field.type === "boolean"}
                            className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                          {field.type === "boolean" && (
                            <p className="text-[11px] text-slate-400 mt-1">Boolean fields are scored as true/false.</p>
                          )}
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
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                                <input
                                  type="text"
                                  value="Boolean"
                                  disabled
                                  className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-100 text-slate-600"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500">Max Marks</label>
                                <div className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-500 text-xs">
                                  Not applicable for boolean fields
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
    </div>
  );
};

export default EvaluationFormBuilder;
