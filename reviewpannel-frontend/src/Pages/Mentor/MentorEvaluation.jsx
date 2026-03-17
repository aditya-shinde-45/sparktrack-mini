import React, { useEffect, useMemo, useState } from "react";
import { apiRequest, uploadFile } from "../../api";
import MentorHeader from "../../Components/Mentor/MentorHeader";
import MentorSidebar from "../../Components/Mentor/MentorSidebar";
import IndustryMentorSidebar from "../../Components/Mentor/IndustryMentorSidebar";
import ProblemStatementModal from "../../Components/Mentor/ProblemStatementModal";
import mitLogo from "../../assets/mitlogo2.png";

const YEAR_OPTIONS = ["SY", "TY", "LY"];

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

const FILE_ACCEPT_MAP = {
  image: "image/*",
  pdf: "application/pdf",
  docx: ".doc,.docx",
  ppt: ".ppt,.pptx",
  all: ""
};

const MentorEvaluation = () => {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [sheetTitle, setSheetTitle] = useState("");
  const [fields, setFields] = useState([]);
  const [totalMarks, setTotalMarks] = useState(0);
  const [allowedYears, setAllowedYears] = useState([]);

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [students, setStudents] = useState([]);
  const [problemStatement, setProblemStatement] = useState(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [externalName, setExternalName] = useState(() => localStorage.getItem("mentor_external_name") || "");
  const [feedback, setFeedback] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [groupBooleans, setGroupBooleans] = useState({});
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [formCanEditAfterSubmit, setFormCanEditAfterSubmit] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const currentRole = String(localStorage.getItem("role") || "mentor").toLowerCase();
  const isIndustryMentor = currentRole === "industry_mentor";
  const token = localStorage.getItem(isIndustryMentor ? "industry_mentor_token" : "mentor_token");
  const mentorName = localStorage.getItem("mentor_name") || localStorage.getItem("name") || "";
  const mentorId = isIndustryMentor
    ? (localStorage.getItem("industry_mentor_code") || localStorage.getItem("mentor_code") || "")
    : (localStorage.getItem("mentor_id") || localStorage.getItem("id") || "");
  const isFormSelected = Boolean(selectedFormId);

  const computedTotal = useMemo(() => {
    return fields.reduce((sum, field) => {
      if (field.type !== "number") return sum;
      return sum + (Number(field.max_marks) || 0);
    }, 0);
  }, [fields]);

  const orderedFields = useMemo(() => {
    const numericFields = fields.filter((field) => field.type === "number");
    const booleanFields = fields.filter((field) => field.type === "boolean");
    const textFields = fields.filter((field) => field.type === "text");
    const selectFields = fields.filter((field) => field.type === "select");
    const fileFields = fields.filter((field) => field.type === "file");
    const commonSelectFields = selectFields.filter((field) => field.scope !== "individual");
    const individualSelectFields = selectFields.filter((field) => field.scope === "individual");
    const commonFileFields = fileFields.filter((field) => field.scope !== "individual");
    const individualFileFields = fileFields.filter((field) => field.scope === "individual");
    return {
      numericFields,
      booleanFields,
      textFields,
      selectFields,
      commonSelectFields,
      individualSelectFields,
      fileFields,
      commonFileFields,
      individualFileFields
    };
  }, [fields]);

  const filteredGroups = useMemo(() => {
    if (allowedYears.length === 0) return groups;
    return groups.filter((groupId) =>
      allowedYears.some((year) => String(groupId || "").toUpperCase().startsWith(year))
    );
  }, [groups, allowedYears]);

  const loadForms = async () => {
    const response = await apiRequest("/api/mentors/evaluation-forms", "GET", null, token);
    if (response?.success) {
      setForms(response.data || []);
    }
  };

  const loadGroups = async () => {
    const groupsEndpoint = isIndustryMentor
      ? "/api/industrial-mentors/groups"
      : "/api/mentors/groups-by-mentor-code";

    const response = await apiRequest(groupsEndpoint, "GET", null, token);
    const groupIds = response?.data?.groups || response?.groups || [];
    setGroups(groupIds);
  };

  useEffect(() => {
    loadForms();
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId && !filteredGroups.includes(selectedGroupId)) {
      setSelectedGroupId("");
      setStudents([]);
      setProblemStatement(null);
    }
  }, [filteredGroups, selectedGroupId]);

  useEffect(() => {
    localStorage.setItem("mentor_external_name", externalName);
  }, [externalName]);

  const handleSelectForm = async (formId) => {
    setSelectedFormId(formId);
    setStudents([]);
    setProblemStatement(null);
    setStatusMessage("");
    setGroupBooleans({});
    setHasExistingSubmission(false);
    setIsApproved(false);
    setIsReadOnly(false);

    if (!formId) {
      setFormName("");
      setSheetTitle("");
      setFields([]);
      setTotalMarks(0);
      setAllowedYears([]);
      setFormCanEditAfterSubmit(false);
      return;
    }

    const response = await apiRequest(`/api/mentors/evaluation-forms/${formId}`, "GET", null, token);
    if (response?.success) {
      const form = response.data;
      setFormName(form?.name || "");
      setSheetTitle(form?.sheet_title || "");
      setTotalMarks(form?.total_marks || 0);
      const incomingFields = Array.isArray(form?.fields) ? form.fields : [];
      const normalizedFields = incomingFields.map((field) => ({
        ...field,
        type: normalizeFieldType(field),
        options: Array.isArray(field.options) ? field.options : [],
        scope: field.scope === "individual" ? "individual" : "common",
        allowed_types: field.allowed_types || "all",
        max_size_mb: Number(field.max_size_mb) || 10
      }));
      const sortedFields = [...normalizedFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setFields(sortedFields);
      setAllowedYears(normalizeAllowedYears(form?.allowed_years || []));

      const editRoles = Array.isArray(form?.edit_after_submit_roles)
        ? form.edit_after_submit_roles.map((value) => String(value || "").trim().toLowerCase())
        : [];
      setFormCanEditAfterSubmit(editRoles.includes(currentRole));
    }
  };

  const handleLoadGroup = async (groupId) => {
    if (!selectedFormId || !groupId) return;

    setIsLoading(true);
    setStatusMessage("");
    setIsReadOnly(false);
    setHasExistingSubmission(false);
    setIsApproved(false);
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
        if (field.type === "boolean") {
          acc[field.key] = false;
        } else {
          acc[field.key] = "";
        }
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
    setProjectTitle(response.data?.problem_statement?.title || "");

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
          if (field.type !== "number") return sum;
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
      const submissionApproved = Boolean(submission.is_approved);
      const editableAfterSubmit = !submissionApproved && formCanEditAfterSubmit;

      setHasExistingSubmission(true);
      setIsApproved(submissionApproved);
      setIsReadOnly(!editableAfterSubmit);

      if (submissionApproved) {
        setStatusMessage("Evaluation is approved. Editing is disabled.");
      } else if (editableAfterSubmit) {
        setStatusMessage("Existing submission loaded. You can update marks until approval.");
      } else {
        setStatusMessage("Evaluation already submitted. Editing is disabled.");
      }
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
          if (field.type !== "number") return sum;
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
        if (field.type !== "number") return sum;
        return sum + (Number(student.marks[field.key]) || 0);
      }, 0);
    }

    setStudents(updated);
  };

  const handleProblemStatementSuccess = (savedData) => {
    setProjectTitle(savedData.title);
    setProblemStatement(savedData);
  };

  const getFileMeta = (value) => {
    if (!value) return null;
    if (typeof value === "string") {
      return {
        url: value,
        name: value.split("/").pop(),
        type: ""
      };
    }
    if (typeof value === "object") return value;
    return null;
  };

  const uploadEvaluationFile = async (file, field, studentIndex = null) => {
    if (!file || !selectedFormId || !selectedGroupId) return;

    const maxSizeMb = Number(field.max_size_mb) || 0;
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      setStatusMessage(`File exceeds the ${maxSizeMb}MB limit.`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("group_id", selectedGroupId);
    formData.append("field_key", field.key);
    formData.append("scope", field.scope === "individual" ? "individual" : "common");
    if (studentIndex !== null) {
      formData.append("enrollment_no", students[studentIndex]?.enrollment_no || "");
    }

    setStatusMessage("Uploading file...");
    const response = await uploadFile(
      `/api/mentors/evaluation-forms/${selectedFormId}/upload`,
      formData,
      token
    );

    if (!response?.success) {
      setStatusMessage(response?.message || "Failed to upload file.");
      return;
    }

    const fileData = {
      url: response.data?.file_url,
      name: response.data?.file_name,
      type: response.data?.file_type
    };

    const updated = [...students];
    if (field.scope === "individual" && studentIndex !== null) {
      updated[studentIndex].marks[field.key] = fileData;
    } else {
      updated.forEach((student) => {
        student.marks[field.key] = fileData;
      });
    }

    setStudents(updated);
    setStatusMessage("File uploaded successfully.");
  };

  const handleSubmit = async () => {
    if (!selectedFormId || !selectedGroupId || students.length === 0 || isReadOnly || isApproved) return;

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
      setHasExistingSubmission(true);
      if (formCanEditAfterSubmit) {
        setIsReadOnly(false);
        setStatusMessage("Evaluation saved successfully. You can keep editing until approval.");
      } else {
        setIsReadOnly(true);
        setStatusMessage("Evaluation submitted successfully.");
      }
    } else {
      setStatusMessage(response?.message || "Failed to submit evaluation.");
    }

    setIsSubmitting(false);
  };

  const handleApprove = async () => {
    if (!isIndustryMentor || !selectedFormId || !selectedGroupId || !hasExistingSubmission || isApproved) return;

    setIsSubmitting(true);
    const response = await apiRequest(
      `/api/mentors/evaluation-forms/${selectedFormId}/group/${selectedGroupId}/approve`,
      "POST",
      {},
      token
    );

    if (response?.success) {
      setIsApproved(true);
      setIsReadOnly(true);
      setStatusMessage("Evaluation approved successfully. Marks are now locked.");
    } else {
      setStatusMessage(response?.message || "Failed to approve evaluation.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="font-[Poppins] min-h-screen bg-gradient-to-br from-[#f7f5ff] via-white to-[#eef2ff] flex flex-col">
      <MentorHeader name={mentorName} id={mentorId} />
      <div className="flex flex-1 flex-col lg:flex-row mt-[72px]">
        {isIndustryMentor ? <IndustryMentorSidebar /> : <MentorSidebar />}
        <main className="flex-1 p-2 sm:p-3 bg-white/95 backdrop-blur m-4 lg:ml-72 rounded-2xl shadow-xl ring-1 ring-purple-100 space-y-2 mb-16 lg:mb-4 text-gray-900">
          <div className="flex flex-col gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block font-semibold text-sm mb-1">Select Evaluation Form <span className="text-red-600">*</span></label>
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
                  <label className="block font-semibold text-sm mb-1">Select Group <span className="text-red-600">*</span></label>
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
                  {filteredGroups.map((groupId) => (
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
            {isFormSelected && allowedYears.length > 0 && (
              <p className="text-xs text-purple-600">
                Showing groups for: {allowedYears.join(", ")}
              </p>
            )}
            {statusMessage && (
              <p className="text-sm text-purple-700 font-medium">{statusMessage}</p>
            )}
          </div>

          <section className="bg-white rounded-2xl border border-gray-300 shadow-sm">
            <div className="border-b border-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_160px] gap-4 items-center p-4">
                <div className="flex items-center justify-center">
                  <img src={mitLogo} alt="MIT-ADT" className="w-20 h-20 object-contain" />
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
                <span className="ml-2 text-gray-600">{selectedGroupId ? selectedGroupId.slice(0, -2) : "—"}</span>
              </div>
              <div className="p-2 border-r border-gray-300">
                <span className="font-semibold">Project ID:</span>
                <span className="ml-2 text-gray-600">{selectedGroupId || "—"}</span>
              </div>
              <div className="p-2">
                <span className="font-semibold">Project Review:</span>
                <span className="ml-2 text-gray-600">{formName || "—"}</span>
              </div>
            </div>

            <div className="border-b border-gray-300 p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block font-semibold text-sm mb-2">Project Title:</label>
                  <p className="text-base text-gray-800 font-medium">{projectTitle || "—"}</p>
                </div>
                <ProblemStatementModal
                  selectedGroupId={selectedGroupId}
                  problemStatement={problemStatement}
                  onSuccess={handleProblemStatementSuccess}
                  isReadOnly={isReadOnly}
                />
              </div>
            </div>

            <div className="border-b border-gray-300 p-3 text-sm">
              <div className="font-semibold mb-2">Rubrics for Evaluation:</div>
              <div className="space-y-1">
                {fields.length === 0 && (
                  <p className="text-gray-500">Select a form to view criteria.</p>
                )}
                {orderedFields.numericFields.map((field, index) => (
                  <div key={field.key} className="flex gap-2">
                    <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>
                    <span className="flex-1">{field.label}</span>
                    <span className="font-semibold">({field.max_marks} Marks)</span>
                  </div>
                ))}
              </div>
            </div>

            {(orderedFields.textFields.length > 0 || orderedFields.commonSelectFields.length > 0 || orderedFields.commonFileFields.length > 0) && (
              <div className="border-b border-gray-300 p-4 text-sm">
                <div className="space-y-4">
                  {[...orderedFields.textFields, ...orderedFields.commonSelectFields, ...orderedFields.commonFileFields].map((field) => (
                    <div key={field.key}>
                      <label className="block font-semibold">{field.label}</label>
                      {field.type === "select" ? (
                        <select
                          value={students[0]?.marks?.[field.key] || ""}
                          onChange={(e) => {
                            if (isReadOnly) return;
                            const updated = [...students];
                            updated.forEach((student) => {
                              student.marks[field.key] = e.target.value;
                            });
                            setStudents(updated);
                          }}
                          disabled={!isFormSelected || isReadOnly}
                          className="w-full border border-gray-300 p-2 mt-1 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select</option>
                          {(field.options || []).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "file" ? (
                        <div className="mt-1 flex flex-col gap-2">
                          {getFileMeta(students[0]?.marks?.[field.key])?.url ? (
                            <a
                              href={getFileMeta(students[0]?.marks?.[field.key])?.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-purple-600 hover:underline"
                            >
                              {getFileMeta(students[0]?.marks?.[field.key])?.name || "View file"}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-500">No file uploaded.</span>
                          )}
                          <input
                            type="file"
                            onChange={(e) => uploadEvaluationFile(e.target.files?.[0], field)}
                            disabled={!isFormSelected || isReadOnly}
                            accept={FILE_ACCEPT_MAP[field.allowed_types] || ""}
                            className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={students[0]?.marks?.[field.key] || ""}
                          onChange={(e) => {
                            if (isReadOnly) return;
                            const updated = [...students];
                            updated.forEach((student) => {
                              student.marks[field.key] = e.target.value;
                            });
                            setStudents(updated);
                          }}
                          disabled={!isFormSelected || isReadOnly}
                          className="w-full border border-gray-300 p-2 mt-1 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="text-center text-gray-500 py-4">Loading group details...</div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm text-center min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left">Enrolment No.</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Name of Students</th>
                    {orderedFields.numericFields.map((field, index) => (
                      <th key={field.key} className="border border-gray-300 px-3 py-2">
                        <div className="text-xs font-semibold">{String.fromCharCode(65 + index)}</div>
                        <div className="text-[10px] text-gray-500">{field.max_marks}</div>
                      </th>
                    ))}
                    <th className="border border-gray-300 px-3 py-2">Total Marks ({totalMarks || computedTotal})</th>
                    {orderedFields.individualSelectFields.map((field) => (
                      <th key={field.key} className="border border-gray-300 px-3 py-2">
                        <div className="text-xs font-semibold">{field.label}</div>
                        <div className="text-[10px] text-gray-500">Dropdown</div>
                      </th>
                    ))}
                    {orderedFields.individualFileFields.map((field) => (
                      <th key={field.key} className="border border-gray-300 px-3 py-2">
                        <div className="text-xs font-semibold">{field.label}</div>
                        <div className="text-[10px] text-gray-500">File</div>
                      </th>
                    ))}
                    <th className="border border-gray-300 px-3 py-2">Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 && (
                    <tr>
                      <td
                        colSpan={4 + orderedFields.numericFields.length + orderedFields.individualSelectFields.length + orderedFields.individualFileFields.length}
                        className="border border-gray-300 px-3 py-4 text-gray-500"
                      >
                        Select a form and group to load students.
                      </td>
                    </tr>
                  )}
                  {students.map((student, index) => (
                    <tr
                      key={student.enrollment_no}
                      className={`hover:bg-gray-50 ${student.absent ? "text-gray-500 bg-gray-100" : ""}`}
                    >
                      <td className={`border border-gray-300 px-3 py-2 text-left ${student.absent ? "line-through" : ""}`}>
                        {student.enrollment_no}
                      </td>
                      <td className={`border border-gray-300 px-3 py-2 text-left ${student.absent ? "line-through" : ""}`}>
                        {student.student_name}
                      </td>
                      {orderedFields.numericFields.map((field) => (
                        <td key={field.key} className="border border-gray-300 px-2 py-2">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max={field.max_marks}
                              value={student.marks[field.key]}
                              onChange={(e) => updateMark(index, field.key, field.max_marks, e.target.value)}
                              disabled={student.absent || isReadOnly}
                              className="w-12 border border-gray-300 rounded-md p-1 text-center text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                            />
                            <input
                              type="range"
                              min="0"
                              max={field.max_marks}
                              value={student.marks[field.key] === "" ? 0 : Number(student.marks[field.key])}
                              onChange={(e) => updateMark(index, field.key, field.max_marks, e.target.value)}
                              disabled={student.absent || isReadOnly}
                              className="w-16 h-1 accent-purple-600 disabled:cursor-not-allowed"
                            />
                          </div>
                        </td>
                      ))}
                      <td className="border border-gray-300 px-3 py-2 font-semibold">{student.total}</td>
                      {orderedFields.individualSelectFields.map((field) => (
                        <td key={field.key} className="border border-gray-300 px-2 py-2">
                          <select
                            value={student.marks[field.key] || ""}
                            onChange={(e) => {
                              if (isReadOnly) return;
                              const updated = [...students];
                              updated[index].marks[field.key] = e.target.value;
                              setStudents(updated);
                            }}
                            disabled={student.absent || isReadOnly}
                            className="w-28 border border-gray-300 rounded-md p-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                          >
                            <option value="">Select</option>
                            {(field.options || []).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                      ))}
                      {orderedFields.individualFileFields.map((field) => (
                        <td key={field.key} className="border border-gray-300 px-2 py-2">
                          <div className="flex flex-col gap-1">
                            {getFileMeta(student.marks[field.key])?.url ? (
                              <a
                                href={getFileMeta(student.marks[field.key])?.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-purple-600 hover:underline"
                              >
                                {getFileMeta(student.marks[field.key])?.name || "View file"}
                              </a>
                            ) : (
                              <span className="text-[11px] text-gray-500">No file</span>
                            )}
                            <input
                              type="file"
                              onChange={(e) => uploadEvaluationFile(e.target.files?.[0], field, index)}
                              disabled={student.absent || isReadOnly}
                              accept={FILE_ACCEPT_MAP[field.allowed_types] || ""}
                              className="w-28 border border-gray-300 rounded-md p-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                            />
                          </div>
                        </td>
                      ))}
                      <td className="border border-gray-300 px-3 py-2 text-center">
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

            <div className="p-4 border-t border-gray-300 text-sm">
              <div>
                <label className="block font-semibold">External Examiner Name:</label>
                <input
                  type="text"
                  value={externalName}
                  onChange={(e) => setExternalName(e.target.value)}
                  disabled={isReadOnly || !isFormSelected}
                  className="w-full border border-gray-300 p-2 mt-1 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="border-t border-gray-300 p-4 text-sm">
              <label className="block font-semibold">
                Feedback by Evaluator <span className="text-gray-500">(Feedback based Learning)</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isReadOnly || !isFormSelected}
                className="w-full border border-gray-300 p-2 mt-1 rounded-md h-24 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {orderedFields.booleanFields.length > 0 && (
              <div className="border-t border-gray-300 p-4 text-sm">
                <div className="flex flex-wrap gap-3">
                  {orderedFields.booleanFields.map((field) => (
                    <label key={field.key} className="flex items-center gap-2 border border-gray-300 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={Boolean(groupBooleans[field.key])}
                        onChange={(e) => toggleBoolean(field.key, e.target.checked)}
                        disabled={isReadOnly}
                        className="w-4 h-4 accent-purple-600"
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="pt-4 flex flex-col items-center gap-3">
            {isIndustryMentor && hasExistingSubmission && !isApproved && (
              <button
                onClick={handleApprove}
                disabled={isSubmitting || students.length === 0 || !isFormSelected}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-emerald-700 transition w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Approving..." : "Approve Evaluation"}
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || students.length === 0 || isReadOnly || !isFormSelected || isApproved}
              className="loginbutton text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition transform hover:scale-105 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? "Submitting Evaluation..." : isApproved ? "Evaluation Approved" : hasExistingSubmission ? "Update Evaluation" : "Submit Evaluation"}
            </button>
            <p className="text-sm text-gray-500 text-center mt-2">
              {isIndustryMentor
                ? "Submit and update marks as needed, then use Approve to lock them."
                : "Select a form and group, fill marks, then submit the evaluation."}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MentorEvaluation;
