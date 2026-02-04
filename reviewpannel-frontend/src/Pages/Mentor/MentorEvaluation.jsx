import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../api";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import MentorSidebar from "../../Components/Mentor/MentorSidebar";

const MentorEvaluation = () => {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState([]);
  const [totalMarks, setTotalMarks] = useState(0);

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [students, setStudents] = useState([]);
  const [problemStatement, setProblemStatement] = useState(null);
  const [externalName, setExternalName] = useState(() => localStorage.getItem("mentor_external_name") || "");
  const [feedback, setFeedback] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [groupBooleans, setGroupBooleans] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const token = localStorage.getItem("mentor_token");
  const mentorName = localStorage.getItem("mentor_name") || localStorage.getItem("name") || "";
  const mentorId = localStorage.getItem("mentor_id") || localStorage.getItem("id") || "";
  const isFormSelected = Boolean(selectedFormId);

  const computedTotal = useMemo(() => {
    return fields.reduce((sum, field) => sum + (Number(field.max_marks) || 0), 0);
  }, [fields]);

  const orderedFields = useMemo(() => {
    const numericFields = fields.filter((field) => field.type !== "boolean");
    const booleanFields = fields.filter((field) => field.type === "boolean");
    return { numericFields, booleanFields };
  }, [fields]);

  const loadForms = async () => {
    const response = await apiRequest("/api/mentors/evaluation-forms", "GET", null, token);
    if (response?.success) {
      setForms(response.data || []);
    }
  };

  const loadGroups = async () => {
    const response = await apiRequest("/api/mentors/groups-by-mentor-code", "GET", null, token);
    const groupIds = response?.data?.groups || response?.groups || [];
    setGroups(groupIds);
  };

  useEffect(() => {
    loadForms();
    loadGroups();
  }, []);

  useEffect(() => {
    localStorage.setItem("mentor_external_name", externalName);
  }, [externalName]);

  const handleSelectForm = async (formId) => {
    setSelectedFormId(formId);
    setStudents([]);
    setProblemStatement(null);
    setStatusMessage("");
    setGroupBooleans({});

    if (!formId) {
      setFormName("");
      setFields([]);
      setTotalMarks(0);
      return;
    }

    const response = await apiRequest(`/api/mentors/evaluation-forms/${formId}`, "GET", null, token);
    if (response?.success) {
      const form = response.data;
      setFormName(form?.name || "");
      setTotalMarks(form?.total_marks || 0);
      const incomingFields = Array.isArray(form?.fields) ? form.fields : [];
      const normalizedFields = incomingFields.map((field) => ({
        ...field,
        type: field.type || (Number(field.max_marks) === 0 ? "boolean" : "number")
      }));
      const sortedFields = [...normalizedFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setFields(sortedFields);
    }
  };

  const handleLoadGroup = async (groupId) => {
    if (!selectedFormId || !groupId) return;

    setIsLoading(true);
    setStatusMessage("");
    setIsReadOnly(false);
    const response = await apiRequest(
      `/api/mentors/evaluation-forms/${selectedFormId}/group/${groupId}`,
      "GET",
      null,
      token
    );

    if (!response?.success) {
      setStudents([]);
      setProblemStatement(null);
      setStatusMessage(response?.message || "Failed to load group details.");
      setIsLoading(false);
      return;
    }

    const freshStudents = (response.data?.students || []).map((student) => {
      const marks = fields.reduce((acc, field) => {
        acc[field.key] = field.type === "boolean" ? false : "";
        return acc;
      }, {});

      return {
        enrollment_no: student.enrollment_no || student.enrollement_no,
        student_name: student.student_name,
        marks,
        total: 0,
        absent: false
      };
    });

    setStudents(freshStudents);
    const initialGroupBooleans = orderedFields.booleanFields.reduce((acc, field) => {
      acc[field.key] = false;
      return acc;
    }, {});
    setGroupBooleans(initialGroupBooleans);
    setProblemStatement(response.data?.problem_statement || null);

    const submissionResponse = await apiRequest(
      `/api/mentors/evaluation-forms/${selectedFormId}/group/${groupId}/submission`,
      "GET",
      null,
      token
    );

    if (submissionResponse?.success && submissionResponse.data) {
      const submission = submissionResponse.data;
      const evaluationRows = Array.isArray(submission.evaluations) ? submission.evaluations : [];
      const mapped = freshStudents.map((student) => {
        const existing = evaluationRows.find(
          (row) => (row.enrollment_no || row.enrollement_no) === student.enrollment_no
        );

        if (!existing) return student;

        const marks = { ...student.marks, ...(existing.marks || {}) };
        const total = existing.total ?? fields.reduce((sum, field) => {
          if (field.type === "boolean") return sum;
          return sum + (Number(marks[field.key]) || 0);
        }, 0);

        return {
          ...student,
          marks,
          total,
          absent: existing.absent || false
        };
      });

      setStudents(mapped);
      const fromSubmission = orderedFields.booleanFields.reduce((acc, field) => {
        const firstRow = evaluationRows[0];
        acc[field.key] = Boolean(firstRow?.marks?.[field.key]);
        return acc;
      }, {});
      setGroupBooleans(fromSubmission);
      setExternalName(submission.external_name || "");
      setFeedback(submission.feedback || "");
      setIsReadOnly(true);
      setStatusMessage("Evaluation already submitted. Editing is disabled.");
    }

    setIsLoading(false);
  };

  const updateMark = (studentIndex, fieldKey, maxMarks, value) => {
    if (isReadOnly) return;
    const numericValue = value === "" ? "" : Math.max(0, Math.min(maxMarks, Number(value)));
    const updated = [...students];
    const student = updated[studentIndex];

    student.marks[fieldKey] = numericValue;
    student.total = student.absent
      ? "AB"
      : fields.reduce((sum, field) => {
          if (field.type === "boolean") return sum;
          return sum + (Number(student.marks[field.key]) || 0);
        }, 0);

    setStudents(updated);
  };

  const toggleBoolean = (fieldKey, isChecked) => {
    if (isReadOnly) return;
    setGroupBooleans((prev) => ({ ...prev, [fieldKey]: isChecked }));
    const updated = [...students];
    updated.forEach((student) => {
      student.marks[fieldKey] = isChecked;
    });
    setStudents(updated);
  };

  const toggleAbsent = (studentIndex, isAbsent) => {
    if (isReadOnly) return;
    const updated = [...students];
    const student = updated[studentIndex];
    student.absent = isAbsent;

    if (isAbsent) {
      Object.keys(student.marks).forEach((key) => {
        student.marks[key] = "";
      });
      student.total = "AB";
    } else {
      student.total = fields.reduce((sum, field) => {
        if (field.type === "boolean") return sum;
        return sum + (Number(student.marks[field.key]) || 0);
      }, 0);
    }

    setStudents(updated);
  };

  const handleSubmit = async () => {
    if (!selectedFormId || !selectedGroupId || students.length === 0 || isReadOnly) return;

    setIsSubmitting(true);
    const payload = {
      group_id: selectedGroupId,
      external_name: externalName,
      feedback,
      evaluations: students.map((student) => ({
        enrollment_no: student.enrollment_no,
        student_name: student.student_name,
        marks: student.marks,
        total: student.total,
        absent: student.absent
      }))
    };

    const response = await apiRequest(
      `/api/mentors/evaluation-forms/${selectedFormId}/submit`,
      "POST",
      payload,
      token
    );

    if (response?.success) {
      setStatusMessage("Evaluation submitted successfully.");
      setIsReadOnly(true);
    } else {
      setStatusMessage(response?.message || "Failed to submit evaluation.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f5ff] via-white to-[#eef2ff]">
      <MentorHeader name={mentorName} id={mentorId} />
      <div className="flex pt-24 lg:pt-28 px-2 lg:px-8">
        <MentorSidebar />
        <main className="flex-1 p-4 sm:p-6 bg-white/95 backdrop-blur m-4 lg:ml-72 rounded-2xl shadow-xl ring-1 ring-purple-100 space-y-6 mt-1 sm:mt-16 lg:mt-24 text-gray-900">
          <div className="flex flex-col gap-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-sm mb-1">Select Evaluation Form</label>
                <select
                  value={selectedFormId}
                  onChange={(e) => handleSelectForm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                >
                  <option value="">Choose a form</option>
                  {forms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-sm mb-1">Select Group</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => {
                    const newGroupId = e.target.value;
                    setSelectedGroupId(newGroupId);
                    handleLoadGroup(newGroupId);
                  }}
                  disabled={!isFormSelected}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Choose a group</option>
                  {groups.map((groupId) => (
                    <option key={groupId} value={groupId}>
                      {groupId}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!isFormSelected && (
              <p className="text-sm text-purple-600">
                Select an evaluation form to enable group selection and editing.
              </p>
            )}
            {statusMessage && (
              <p className="text-sm text-purple-700 font-medium">{statusMessage}</p>
            )}
          </div>

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#5D3FD3] to-[#7B74EF] bg-clip-text text-transparent mb-2">
              {formName || "Evaluation Form"}
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-[#5D3FD3] to-[#7B74EF] rounded-full mx-auto"></div>
          </div>

          {problemStatement && (
            <div className="border border-purple-100 rounded-lg p-4 bg-purple-50">
              <h2 className="font-bold text-lg mb-1 text-purple-700">Problem Statement</h2>
              <p className="text-sm text-gray-700">{problemStatement.title || "Untitled"}</p>
              {problemStatement.description && (
                <p className="text-sm text-gray-600 mt-2">{problemStatement.description}</p>
              )}
            </div>
          )}

          <section className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="font-bold text-lg mb-2">Rubrics for Evaluation</h2>
            <ul className="list-disc pl-5 text-sm leading-6">
              {fields.length === 0 && (
                <li className="text-gray-500">Select a form to view criteria.</li>
              )}
              {[...orderedFields.numericFields, ...orderedFields.booleanFields].map((field) => (
                <li key={field.key}>
                  {field.label}{" "}
                  <b>
                    ({field.type === "boolean" ? "Yes/No" : `${field.max_marks} Marks`})
                  </b>
                </li>
              ))}
            </ul>
          </section>

          {isLoading && (
            <div className="text-center text-gray-500">Loading group details...</div>
          )}

          {students.length > 0 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Marks Table</h3>
                    <p className="text-xs text-gray-500">Enter numeric scores for each rubric.</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                    {orderedFields.numericFields.length} fields
                  </span>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm text-center min-w-[900px]">
                  <thead className="bg-gradient-to-r from-gray-50 to-purple-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-3 text-left">Enrollment No.</th>
                      <th className="border border-gray-200 px-4 py-3 text-left">Name of Students</th>
                      {orderedFields.numericFields.map((field) => (
                        <th key={field.key} className="border border-gray-200 px-3 py-3">
                          <div className="text-xs uppercase tracking-wide text-gray-500">{field.label}</div>
                          <div className="text-[11px] text-gray-400">Max {field.max_marks}</div>
                        </th>
                      ))}
                      <th className="border border-gray-200 px-3 py-3">Total ({totalMarks || computedTotal})</th>
                      <th className="border border-gray-200 px-3 py-3">Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr
                        key={student.enrollment_no}
                        className={`hover:bg-gray-50 ${student.absent ? "text-gray-500 bg-gray-100" : ""}`}
                      >
                        <td className={`border border-gray-200 px-4 py-3 text-left ${student.absent ? "line-through" : ""}`}>
                          {student.enrollment_no}
                        </td>
                        <td className={`border border-gray-200 px-4 py-3 text-left ${student.absent ? "line-through" : ""}`}>
                          {student.student_name}
                        </td>
                        {orderedFields.numericFields.map((field) => (
                          <td key={field.key} className="border border-gray-200 px-3 py-3">
                            <div className="flex flex-col items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={field.max_marks}
                                value={student.marks[field.key]}
                                onChange={(e) => updateMark(index, field.key, field.max_marks, e.target.value)}
                                disabled={student.absent || isReadOnly}
                                className="w-16 border border-gray-300 rounded-lg p-1.5 text-center focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                              />
                              <input
                                type="range"
                                min="0"
                                max={field.max_marks}
                                value={student.marks[field.key] === "" ? 0 : Number(student.marks[field.key])}
                                onChange={(e) => updateMark(index, field.key, field.max_marks, e.target.value)}
                                disabled={student.absent || isReadOnly}
                                className="w-24 accent-purple-600 disabled:cursor-not-allowed"
                              />
                              <span className="text-[10px] text-gray-400">0 - {field.max_marks}</span>
                            </div>
                          </td>
                        ))}
                        <td className="border border-gray-200 px-3 py-3 font-semibold">{student.total}</td>
                        <td className="border border-gray-200 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={student.absent}
                            onChange={(e) => toggleAbsent(index, e.target.checked)}
                            disabled={isReadOnly}
                            className="w-4 h-4 accent-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2 disabled:cursor-not-allowed"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {orderedFields.booleanFields.length > 0 && (
                <div className="bg-white rounded-2xl border border-purple-200 shadow-sm">
                  <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 text-sm font-semibold text-purple-700">
                    Group Checklist (Yes/No)
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-4">
                      {orderedFields.booleanFields.map((field) => (
                        <label
                          key={field.key}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-200 bg-purple-50/40 text-sm text-purple-900 shadow-sm"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(groupBooleans[field.key])}
                            onChange={(e) => toggleBoolean(field.key, e.target.checked)}
                            disabled={isReadOnly}
                            className="w-4 h-4 accent-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2 disabled:cursor-not-allowed"
                          />
                          <span className="font-medium">{field.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-purple-500 mt-3">Checklist applies to the entire group.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block font-semibold text-sm">External Examiner Name:</label>
            <input
              type="text"
              value={externalName}
              onChange={(e) => setExternalName(e.target.value)}
              disabled={isReadOnly || !isFormSelected}
              className="w-full border border-gray-300 p-2 mt-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-sm">
              Feedback by Evaluator <span className="text-gray-500">(Feedback based Learning)</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={isReadOnly || !isFormSelected}
              className="w-full border border-gray-300 p-2 mt-1 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="pt-4 flex flex-col items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || students.length === 0 || isReadOnly || !isFormSelected}
              className="loginbutton text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition transform hover:scale-105 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? "Submitting Evaluation..." : isReadOnly ? "Evaluation Submitted" : "Submit Evaluation"}
            </button>
            <p className="text-sm text-gray-500 text-center mt-2">
              Select a form and group, fill marks, then submit the evaluation.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MentorEvaluation;
