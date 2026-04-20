import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PAGE_MARGIN = 12;

const asText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).replace(/\s+/g, " ").trim();
  return normalized.length ? normalized : fallback;
};

const asCompactText = (value, fallback = "", maxLength = 90) => {
  const normalized = asText(value, fallback);
  if (normalized === fallback) return normalized;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(maxLength - 3, 1))}...`;
};

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return asText(value);
  return parsed.toLocaleDateString("en-GB");
};

const hasAnyFilled = (item, keys) =>
  keys.some((key) => {
    const value = item?.[key];
    return value !== null && value !== undefined && String(value).trim() !== "";
  });

const toNonEmptyRows = (rows, predicate, fallbackFactory) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const filtered = safeRows.filter((row) => predicate(row || {}));
  if (filtered.length) return filtered;
  return [fallbackFactory()];
};

const normalizeMemberEnrollment = (member) =>
  asText(member?.enrollmentNo || member?.enrollment_no || member?.enrollement_no, "");

const normalizeReviewSummary = (evaluationMarks = []) => {
  const summary = {
    review1: "",
    review2: "",
    review3: "",
    finalEvaluation: "",
    totalObtained: 0,
    totalMaximum: 0,
    hasAny: false,
  };

  const scoreLabel = (entry) => {
    const evaluation = entry?.evaluation;
    if (!evaluation) return "";
    if (evaluation.absent) return "AB";
    return asText(evaluation.total, "");
  };

  const asNumeric = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  (evaluationMarks || []).forEach((entry) => {
    const formName = String(entry?.form_name || "").toLowerCase();
    const compactName = formName.replace(/\s+/g, " ").trim();

    const obtained = asNumeric(entry?.evaluation?.total);
    const maximum = asNumeric(entry?.total_marks);

    if (obtained !== null) {
      summary.totalObtained += obtained;
      summary.hasAny = true;
    }

    if (maximum !== null) {
      summary.totalMaximum += maximum;
    }

    if (/review\s*[-_]?\s*1\b/.test(compactName)) {
      summary.review1 = scoreLabel(entry);
    }

    if (/review\s*[-_]?\s*2\b/.test(compactName)) {
      summary.review2 = scoreLabel(entry);
    }

    if (/review\s*[-_]?\s*3\b/.test(compactName)) {
      summary.review3 = scoreLabel(entry);
    }

    if (compactName.includes("final")) {
      summary.finalEvaluation = scoreLabel(entry);
    }
  });

  return {
    ...summary,
    total: summary.totalMaximum > 0
      ? `${summary.totalObtained}/${summary.totalMaximum}`
      : summary.hasAny
        ? `${summary.totalObtained}`
        : "",
  };
};

const addSectionHeading = (doc, text, y) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(text, PAGE_MARGIN, y);
  return y + 2;
};

const addKeyValueTable = (doc, rows, startY) => {
  autoTable(doc, {
    startY,
    theme: "grid",
    head: [["Field", "Value"]],
    body: rows,
    styles: {
      fontSize: 8.5,
      cellPadding: 1.8,
      valign: "top",
      lineColor: [150, 150, 150],
      lineWidth: 0.1,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [242, 242, 242],
      textColor: [20, 20, 20],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 58, fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
  });

  return (doc.lastAutoTable?.finalY || startY) + 4;
};

const addDataTable = (doc, columns, rows, startY, options = {}) => {
  autoTable(doc, {
    startY,
    theme: "grid",
    head: [columns],
    body: rows,
    styles: {
      fontSize: options.fontSize || 8,
      cellPadding: 1.6,
      valign: "top",
      lineColor: [150, 150, 150],
      lineWidth: 0.1,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [242, 242, 242],
      textColor: [20, 20, 20],
      fontStyle: "bold",
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    columnStyles: options.columnStyles || {},
  });

  return (doc.lastAutoTable?.finalY || startY) + 4;
};

const addParagraphBlock = (doc, label, content, startY) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - PAGE_MARGIN * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(label, PAGE_MARGIN, startY);

  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(asText(content), maxWidth);
  doc.text(lines, PAGE_MARGIN, startY + 4.5);

  return startY + 4.5 + lines.length * 4 + 2;
};

export const generateUnifiedTrackerPdfBlob = ({
  trackerData,
  student,
  groupId,
  groupYear,
  teamName,
  mentorName,
  industryMentor,
  problemStatement,
  evaluationMarks,
  members,
  submissionState,
}) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 4;
  const maxTableWidth = pageWidth - margin * 2;
  const tableTextSize = 4.7;

  const tracker = trackerData || {};
  const projectInfo = tracker.projectInfo || {};
  const techStack = tracker.techStack || {};
  const userStories = tracker.userStories || {};

  const normalizedMarks = normalizeReviewSummary(evaluationMarks || []);
  const membersList = (Array.isArray(members) ? members : []).slice(0, 4);
  const meetingCount = (tracker.meetings || []).filter((meeting) =>
    hasAnyFilled(meeting || {}, ["meetingDate", "attendees", "agenda", "decisions", "nextSteps"])
  ).length;

  let y = margin;

  const renderTable = (config) => {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: maxTableWidth,
      theme: "grid",
      styles: {
        fontSize: tableTextSize,
        cellPadding: 0.35,
        lineWidth: 0.08,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
        overflow: "linebreak",
        valign: "middle",
      },
      ...config,
    });

    y = (doc.lastAutoTable?.finalY || y) + 0.45;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("PROJECT TRACKER SHEET", pageWidth / 2, y + 2.3, { align: "center" });
  y += 3;

  renderTable({
    head: [["Project ID", "Class", "Percentage of Project Completion", "Copyright Status", "Technology Transfer"]],
    body: [[
      asText(groupId),
      asText(student?.class || student?.class_division || student?.className),
      asText(projectInfo.completionStatus),
      asText(projectInfo.copyrightStatus),
      asText(projectInfo.technologyTransfer),
    ]],
    headStyles: { fillColor: [242, 235, 126], fontStyle: "bold", halign: "center" },
    bodyStyles: { halign: "center" },
  });

  renderTable({
    head: [[
      "Project Domain",
      "Specialization",
      "Map Sustainable Development Goal",
      "Paper Publication Status",
      "GitHub Link",
      "Meeting Count",
    ]],
    body: [[
      asText(problemStatement?.domain),
      asText(student?.specialization || problemStatement?.technology_bucket),
      asText(projectInfo.sustainableDevelopmentGoal),
      asText(projectInfo.paperPublicationStatus),
      asCompactText(projectInfo.githubLink, "", 50),
      asText(meetingCount),
    ]],
    headStyles: { fillColor: [230, 230, 230], fontStyle: "bold", halign: "center" },
    bodyStyles: { halign: "center" },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 4) {
        hookData.cell.styles.textColor = [0, 83, 173];
      }
    },
  });

  renderTable({
    body: [["Problem Statement", asCompactText(problemStatement?.title || problemStatement?.description, "", 140)]],
    columnStyles: {
      0: { cellWidth: 46, fontStyle: "bold", fillColor: [238, 238, 238] },
      1: { cellWidth: "auto" },
    },
  });

  const memberRows = membersList.length
    ? membersList.map((member) => [
        asText(normalizeMemberEnrollment(member)),
        asText(member?.name || member?.name_of_student || member?.student_name),
        asText(member?.className || member?.class || member?.class_division),
        asText(member?.contact || member?.phone),
        asText(member?.email || member?.email_id || member?.student_email_id),
        asText(normalizedMarks.review1),
        asText(normalizedMarks.review2),
        asText(normalizedMarks.review3),
        asText(normalizedMarks.finalEvaluation),
        asText(normalizedMarks.total),
      ])
    : [["", "", "", "", "", "", "", "", "", ""]];

  renderTable({
    head: [[
      "Enrollment Number",
      "Name of Students",
      "Class",
      "Contact Number",
      "Email ID",
      "Review-1 Marks",
      "Review-2 Marks",
      "Review-3 Marks",
      "Final eval (50)",
      "Total Marks (100)",
    ]],
    body: memberRows,
    headStyles: { fillColor: [227, 227, 227], fontStyle: "bold", halign: "center" },
    bodyStyles: { halign: "center" },
    didParseCell: (hookData) => {
      if (hookData.section === "head" && hookData.column.index >= 5) {
        hookData.cell.styles.fillColor = [0, 138, 74];
        hookData.cell.styles.textColor = [255, 255, 255];
      }
    },
  });

  const techLines = [
    ["Front-end (Client-side)", asText(techStack.frontend, "")],
    ["Back-end (Server-side)", asText(techStack.backend, "")],
    ["Database Layer", asText(techStack.database, "")],
    ["Development Tools", asText(techStack.tools, "")],
    ["Deployment and Infrastructure", asText(techStack.devOps, "")],
  ];

  renderTable({
    head: [["Review", "Review Date", "Comments by Jury Mentor", "Review Link", "Technology Stack", "Value"]],
    body: techLines.map((line, index) => [
      index < 3 ? `Review-${index + 1}` : "",
      "",
      "",
      "",
      line[0],
      asCompactText(line[1], "", 58),
    ]),
    headStyles: { fillColor: [108, 72, 140], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: { cellWidth: 16, halign: "center" },
      2: { cellWidth: 32 },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 36, fontStyle: "bold" },
      5: { cellWidth: "auto" },
    },
  });

  const stories = Array.isArray(userStories.stories) ? userStories.stories : [];
  const tasks = Array.isArray(userStories.tasks) ? userStories.tasks : [];
  const acceptanceCriteria = Array.isArray(userStories.acceptanceCriteria)
    ? userStories.acceptanceCriteria
    : [];

  const storyRows = [["Epic", asText(userStories.epic, "")]];
  for (let i = 0; i < 5; i += 1) {
    storyRows.push([`Story ${i + 1}`, asText(stories[i], "")]);
  }
  for (let i = 0; i < 5; i += 1) {
    storyRows.push([`Task ${i + 1}`, asCompactText(tasks[i], "", 110)]);
  }
  for (let i = 0; i < 5; i += 1) {
    storyRows.push([`${i + 1}`, asCompactText(acceptanceCriteria[i], "", 120)]);
  }

  renderTable({
    body: storyRows,
    columnStyles: {
      0: { cellWidth: 18, halign: "center", fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
    didParseCell: (hookData) => {
      if (hookData.section !== "body") return;
      const rowIndex = hookData.row.index;
      if (rowIndex === 0) {
        hookData.cell.styles.fillColor = [178, 93, 135];
        hookData.cell.styles.textColor = [255, 255, 255];
      } else if (rowIndex >= 1 && rowIndex <= 5) {
        hookData.cell.styles.fillColor = [237, 216, 236];
      } else if (rowIndex >= 6 && rowIndex <= 10) {
        hookData.cell.styles.fillColor = [193, 219, 173];
      } else {
        hookData.cell.styles.fillColor = [247, 229, 156];
      }
    },
  });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(184, 0, 0);
  doc.setFontSize(5.1);
  doc.text(
    "This is actual Development planning and tracking. Don't add documentation, survey, topic finalization, etc. activities.",
    pageWidth / 2,
    y + 2,
    { align: "center" }
  );
  doc.setTextColor(0, 0, 0);
  y += 3;

  const sprintList = Array.isArray(tracker.sprintPlanning) ? tracker.sprintPlanning : [];
  const isDefaultSprintTemplate = (sprint = {}) => {
    const sprintName = asText(sprint?.sprintName, "");
    const sprintStatus = asText(sprint?.status, "").toLowerCase();
    const hasPlanningData = hasAnyFilled(sprint, ["objective", "startDate", "endDate"]);

    return /^sprint\s+\d+$/i.test(sprintName) && sprintStatus === "upcoming" && !hasPlanningData;
  };

  const sprintRows = toNonEmptyRows(
    sprintList,
    (item) =>
      !isDefaultSprintTemplate(item) &&
      hasAnyFilled(item, ["sprintName", "objective", "status", "startDate", "endDate"]),
    () => ({})
  )
    .slice(0, 8)
    .map((sprint) => {
      const hideTemplateValues = isDefaultSprintTemplate(sprint);
      return [
        hideTemplateValues ? "" : asText(sprint?.sprintName, ""),
        asCompactText(sprint?.objective, "", 40),
        "",
        hideTemplateValues ? "" : asText(sprint?.status, ""),
        "",
        formatDate(sprint?.startDate),
        formatDate(sprint?.endDate),
        formatDate(sprint?.startDate),
        formatDate(sprint?.endDate),
        asText(projectInfo?.completionStatus, ""),
      ];
    });

  renderTable({
    head: [[
      "Sprint No.",
      "Task Name",
      "Sub Tasks",
      "Task Status",
      "Assigned To",
      "Assigned Date",
      "Deadline",
      "Start Date",
      "Completion Date",
      "Completion Status",
    ]],
    body: sprintRows,
    headStyles: { fillColor: [208, 208, 208], fontStyle: "bold", halign: "center" },
    bodyStyles: { halign: "center" },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 24 },
      2: { cellWidth: 36, halign: "left" },
      3: { cellWidth: 16 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18 },
      6: { cellWidth: 18 },
      7: { cellWidth: 18 },
      8: { cellWidth: 18 },
      9: { cellWidth: "auto" },
    },
  });

  const publicationRows = toNonEmptyRows(
    tracker.publicationDetails,
    (item) => hasAnyFilled(item, ["paperTitle", "journalName", "year", "authors", "url", "doi", "volume", "pageNo", "publisher"]),
    () => ({})
  )
    .slice(0, 2)
    .map((item, index) => [
      index + 1,
      asText(item.paperTitle),
      asCompactText(item.journalName, "", 38),
      asText(item.year),
      asCompactText(item.authors, "", 28),
      asCompactText(item.url, "", 28),
      asText(item.doi),
      asText(item.volume),
      asText(item.pageNo),
      asText(item.publisher),
    ]);

  renderTable({
    head: [["Publication Details", "Paper Title", "Name of Journal", "Year", "Authors", "URL", "DOI", "Volume", "Page no", "Publisher"]],
    body: publicationRows,
    headStyles: { fillColor: [224, 224, 224], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 18, halign: "center" } },
  });

  const patentRows = toNonEmptyRows(
    tracker.patentDetails,
    (item) => hasAnyFilled(item, ["title", "inventors", "applicationNo", "patentNumber", "filingCountry", "subjectCategory", "filingDate", "publicationDate", "publicationStatus"]),
    () => ({})
  )
    .slice(0, 1)
    .map((item, index) => [
      index + 1,
      asText(item.title),
      asCompactText(item.inventors, "", 28),
      asText(item.applicationNo),
      asText(item.patentNumber),
      asText(item.filingCountry),
      asText(item.subjectCategory),
      formatDate(item.filingDate),
      formatDate(item.publicationDate),
      asText(item.publicationStatus),
    ]);

  renderTable({
    head: [["Patent Details", "Title", "Inventors", "Application No.", "Patent Number", "Filing Country", "Subject Category", "Filing Date", "Publication Date", "Publication Status"]],
    body: patentRows,
    headStyles: { fillColor: [224, 224, 224], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 18, halign: "center" } },
  });

  const copyrightRows = toNonEmptyRows(
    tracker.copyrightDetails,
    (item) => hasAnyFilled(item, ["titleOfWork", "nameOfApplicants", "registrationNo", "dairyNumber", "date", "status"]),
    () => ({})
  )
    .slice(0, 1)
    .map((item, index) => [
      index + 1,
      asText(item.titleOfWork),
      asCompactText(item.nameOfApplicants, "", 34),
      asText(item.registrationNo),
      asText(item.dairyNumber),
      formatDate(item.date),
      asText(item.status),
    ]);

  renderTable({
    head: [["Copyright Details", "Title of work", "Name of Applicants", "Registration No.", "Dairy Number", "Date", "Status"]],
    body: copyrightRows,
    headStyles: { fillColor: [224, 224, 224], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 18, halign: "center" } },
  });

  const eventRows = toNonEmptyRows(
    tracker.eventParticipationDetails,
    (item) => hasAnyFilled(item, ["nameOfEvent", "typeOfEvent", "date", "typeOfParticipation", "detailsOfPrizeWon"]),
    () => ({})
  )
    .slice(0, 1)
    .map((item, index) => [
      index + 1,
      asText(item.nameOfEvent),
      asText(item.typeOfEvent),
      formatDate(item.date),
      asCompactText(item.typeOfParticipation, "", 24),
      asCompactText(item.detailsOfPrizeWon, "", 46),
    ]);

  renderTable({
    head: [["Event and Participations Details", "Name of Event", "Type of Event", "Date", "Type of Participation", "Details of Prize won"]],
    body: eventRows,
    headStyles: { fillColor: [224, 224, 224], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 30, halign: "center" } },
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.3);
  doc.setTextColor(176, 0, 0);
  doc.text("Add weekly meetings Details (Minimum 12 meetings)", margin, y + 2);
  doc.setTextColor(0, 0, 0);
  y += 2.8;

  const meetingsRows = toNonEmptyRows(
    tracker.meetings,
    (item) => hasAnyFilled(item, ["meetingDate", "attendees", "agenda", "decisions", "nextSteps"]),
    () => ({})
  )
    .slice(0, 8)
    .map((meeting) => {
      const hasMeetingDate = Boolean(asText(meeting?.meetingDate, ""));
      return [
        formatDate(meeting.meetingDate),
        asCompactText(meeting.attendees, "", 34),
        asCompactText(meeting.agenda, "", 38),
        asCompactText(meeting.decisions, "", 34),
        "",
        asCompactText(meeting.nextSteps, "", 34),
        hasMeetingDate ? "✓" : "",
      ];
    });

  renderTable({
    head: [[
      "Date",
      "Attendees with commas",
      "Agenda points with commas",
      "Action Items",
      "Assigned to",
      "Next Steps",
      "Status (tick if completed)",
    ]],
    body: meetingsRows,
    headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 6 && hookData.cell.raw === "✓") {
        hookData.cell.styles.textColor = [0, 138, 74];
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.halign = "center";
      }
    },
  });

  return doc.output("blob");
};

const sanitizeFileName = (fileName = "tracker-sheet.pdf") =>
  String(fileName || "tracker-sheet.pdf").replace(/[^a-zA-Z0-9_.-]/g, "_");

export const downloadPdfBlob = ({ blob, fileName = "tracker-sheet.pdf" }) => {
  if (!blob) {
    throw new Error("PDF blob is missing.");
  }

  const safeFileName = sanitizeFileName(fileName);
  const pdfUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = pdfUrl;
  link.download = safeFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(pdfUrl);
  }, 1200);

  return "download";
};

export const openPdfPreviewWindow = ({
  blob,
  fileName = "tracker-sheet.pdf",
  previewWindow = null,
}) => {
  let targetWindow = previewWindow && !previewWindow.closed ? previewWindow : null;

  const safeFileName = sanitizeFileName(fileName);

  if (!targetWindow) {
    targetWindow = window.open("", "trackerPdfPreview", "popup=yes,width=1200,height=800");
  }

  if (!targetWindow) {
    throw new Error("Popup blocked. Please allow popups to preview the PDF.");
  }

  const pdfUrl = URL.createObjectURL(blob);

  targetWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tracker Sheet PDF Preview</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f5; height: 100vh; display: flex; flex-direction: column; }
    .viewer { flex: 1; min-height: 0; }
    iframe { width: 100%; height: 100%; border: 0; background: #fff; }
    .footer { border-top: 1px solid #d1d5db; background: #ffffff; padding: 12px; display: flex; justify-content: center; align-items: center; }
    .download-btn { border: 0; border-radius: 6px; background: #7c3aed; color: #fff; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .download-btn:hover { background: #6d28d9; }
  </style>
</head>
<body>
  <div class="viewer">
    <iframe src="${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1"></iframe>
  </div>
  <div class="footer">
    <button id="download-btn" class="download-btn" type="button">Download PDF</button>
  </div>
  <script>
    const pdfUrl = ${JSON.stringify(pdfUrl)};
    const fileName = ${JSON.stringify(safeFileName)};

    document.getElementById('download-btn').addEventListener('click', function () {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    window.addEventListener('beforeunload', function () {
      try {
        URL.revokeObjectURL(pdfUrl);
      } catch (error) {
        console.error('Failed to release PDF URL', error);
      }
    });
  </script>
</body>
</html>`);

  targetWindow.document.close();
  if (typeof targetWindow.focus === "function") {
    targetWindow.focus();
  }
  return "preview";
};
