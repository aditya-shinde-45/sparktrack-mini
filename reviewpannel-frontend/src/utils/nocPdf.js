import { jsPDF } from "jspdf";
import mitLogo from "../assets/mitlogo2.png";

const PAGE = {
  x: 10,
  y: 8,
  width: 190,
  height: 281,
};

const DOC_NAMES = [
  "Project Tracker Sheet (fully updated)",
  "Project Synopsis",
  "Final Project report / Success story (for internship)",
  "Copyright Details",
  "Patent Details",
  "Research Publication Details",
  "Project Presentation PPT",
  "Achievements",
  "Internship joining report & Completion Report (If any)",
];

let mitLogoDataUrlPromise = null;

const getMitLogoDataUrl = () => {
  if (mitLogoDataUrlPromise) {
    return mitLogoDataUrlPromise;
  }

  mitLogoDataUrlPromise = new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext("2d");

        if (!context) {
          resolve(null);
          return;
        }

        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = mitLogo;
  });

  return mitLogoDataUrlPromise;
};

const asText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
};

const formatDate = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return asText(value);
  return parsed.toLocaleDateString("en-GB");
};

const normalizeMember = (member = {}) => ({
  enrollmentNo: asText(member?.enrollmentNo || member?.enrollment_no || member?.enrollement_no),
  name: asText(member?.name || member?.name_of_student || member?.student_name),
  contact: asText(member?.contact || member?.phone),
  email: asText(member?.email || member?.email_id || member?.student_email_id),
});

const drawCell = (doc, x, y, w, h, text = "", options = {}) => {
  doc.rect(x, y, w, h);

  if (!text) return;

  const padding = options.padding ?? 1.8;
  const align = options.align || "left";
  const fontStyle = options.fontStyle || "normal";
  const textSize = options.textSize || 9;

  doc.setFont("times", fontStyle);
  doc.setFontSize(textSize);

  const maxWidth = Math.max(w - padding * 2, 2);
  const lines = doc.splitTextToSize(text, maxWidth);

  if (align === "center") {
    const centerX = x + w / 2;
    const textY = y + h / 2 + 1.3;
    doc.text(lines[0] || "", centerX, textY, { align: "center" });
    return;
  }

  const topY = y + padding + 2.2;
  doc.text(lines, x + padding, topY);
};

export const generateNocPdfBlob = async ({
  nocData,
  groupId,
  projectTitle,
  members,
}) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const payload = nocData && typeof nocData === "object" ? nocData : {};
  const logoDataUrl = await getMitLogoDataUrl();
  const documents = Array.isArray(payload.documents) ? payload.documents : [];
  const normalizedMembers = (Array.isArray(members) ? members : [])
    .map((member) => normalizeMember(member))
    .filter((member) =>
      Boolean(member.enrollmentNo || member.name || member.contact || member.email)
    )
    .slice(0, 5);

  while (normalizedMembers.length < 5) {
    normalizedMembers.push({ enrollmentNo: "", name: "", contact: "", email: "" });
  }

  let y = PAGE.y;
  const x = PAGE.x;
  const width = PAGE.width;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(PAGE.x, PAGE.y, PAGE.width, PAGE.height);

  const logoW = 64;
  const headerH = 24;
  doc.rect(x, y, logoW, headerH);

  if (logoDataUrl) {
    try {
      const imageProperties = doc.getImageProperties(logoDataUrl);
      const maxWidth = logoW - 2;
      const maxHeight = headerH - 2;
      const ratio = Math.min(maxWidth / imageProperties.width, maxHeight / imageProperties.height);
      const drawWidth = imageProperties.width * ratio;
      const drawHeight = imageProperties.height * ratio;
      const drawX = x + (logoW - drawWidth) / 2;
      const drawY = y + (headerH - drawHeight) / 2;

      doc.addImage(logoDataUrl, "PNG", drawX, drawY, drawWidth, drawHeight, undefined, "FAST");
    } catch (error) {
      drawCell(doc, x, y, logoW, headerH, "MIT-ADT UNIVERSITY\nPUNE, INDIA", {
        align: "center",
        fontStyle: "bold",
        textSize: 11,
      });
    }
  } else {
    drawCell(doc, x, y, logoW, headerH, "MIT-ADT UNIVERSITY\nPUNE, INDIA", {
      align: "center",
      fontStyle: "bold",
      textSize: 11,
    });
  }

  const titleX = x + logoW;
  const titleW = width - logoW;
  doc.setFillColor(107, 51, 164);
  doc.rect(titleX, y, titleW, headerH, "F");
  doc.rect(titleX, y, titleW, headerH);

  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(9.8);
  doc.text("MIT School of Computing", titleX + titleW / 2, y + 6.2, { align: "center" });
  doc.text("Department of CSE / IT", titleX + titleW / 2, y + 11.5, { align: "center" });
  doc.setFontSize(13.8);
  doc.text("NO Objection Certificate", titleX + titleW / 2, y + 18.4, { align: "center" });
  doc.setTextColor(0, 0, 0);

  y += headerH + 6;

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.text("Date:", x + width - 38, y);
  doc.text(formatDate(payload.certificateDate), x + width - 25, y);

  y += 5;

  const introText =
    "This is to certify that following students have completed final year project under my guidance. " +
    "They have completed project as per the inputs given by subject expert or industry expert. " +
    "Submission of following documents is complemented as a mandatory requirement of project completion.";
  const introLines = doc.splitTextToSize(introText, width - 8);
  doc.text(introLines, x + 3, y);
  y += introLines.length * 3.9 + 2;

  const labelW = 36;
  const valueW = width - labelW;
  drawCell(doc, x, y, labelW, 8, "Project ID:", { fontStyle: "bold", textSize: 8.8 });
  drawCell(doc, x + labelW, y, valueW, 8, asText(groupId), { textSize: 8.8 });
  y += 8;

  drawCell(doc, x, y, labelW, 8, "Project Title:", { fontStyle: "bold", textSize: 8.8 });
  drawCell(doc, x + labelW, y, valueW, 8, asText(projectTitle), { textSize: 8.8 });
  y += 8;

  drawCell(doc, x, y, width, 8, "Group Members:", { fontStyle: "bold", textSize: 8.8 });
  y += 8;

  const memberCols = [38, 57, 46, 49];
  const memberHeaders = ["Roll Number", "Name of Students", "Contact", "Email"];
  let colX = x;
  memberHeaders.forEach((header, index) => {
    drawCell(doc, colX, y, memberCols[index], 8, header, { fontStyle: "bold", textSize: 8.2 });
    colX += memberCols[index];
  });
  y += 8;

  normalizedMembers.forEach((member) => {
    const values = [member.enrollmentNo, member.name, member.contact, member.email];
    let rowX = x;
    values.forEach((value, index) => {
      drawCell(doc, rowX, y, memberCols[index], 8.2, value, { textSize: 8.1 });
      rowX += memberCols[index];
    });
    y += 8.2;
  });

  drawCell(doc, x, y, width, 8, "List of Documents Submitted:", { fontStyle: "bold", textSize: 8.8 });
  y += 8;

  const docCols = [18, 113, 59];
  const docHeaders = ["Sr. No.", "Name of Document", "Status of Submission"];
  let docX = x;
  docHeaders.forEach((header, index) => {
    drawCell(doc, docX, y, docCols[index], 8, header, { fontStyle: "bold", textSize: 8.2 });
    docX += docCols[index];
  });
  y += 8;

  DOC_NAMES.forEach((name, index) => {
    const matchingDoc = documents.find((docItem) =>
      asText(docItem?.name || "").toLowerCase() === name.toLowerCase()
    ) || documents[index] || {};

    const statusValue =
      asText(matchingDoc?.status) || (asText(matchingDoc?.proofUrl) ? "Submitted" : "");

    const textLines = doc.splitTextToSize(name, docCols[1] - 4);
    const rowHeight = Math.max(8.2, textLines.length * 3.5 + 1.7);

    drawCell(doc, x, y, docCols[0], rowHeight, String(index + 1), {
      align: "center",
      textSize: 8.1,
    });
    drawCell(doc, x + docCols[0], y, docCols[1], rowHeight, name, { textSize: 8.1 });
    drawCell(doc, x + docCols[0] + docCols[1], y, docCols[2], rowHeight, statusValue, {
      textSize: 8.1,
    });
    y += rowHeight;
  });

  drawCell(doc, x, y, width, 8, "Conclusive Remark by guide.", {
    fontStyle: "bold",
    textSize: 8.8,
  });
  y += 8;

  const remarkText = asText(payload.concludingRemark);
  drawCell(doc, x, y, width, 24, remarkText, { textSize: 8.5, padding: 2.2 });
  y += 24;

  drawCell(doc, x, y, width, 33.5, "", { textSize: 8.2 });

  doc.setFont("times", "bold");
  doc.setFontSize(9.2);
  doc.text(
    asText(payload.guideSignatureName) || "Name and Signature of Guide",
    x + width - 2,
    y + 29.8,
    { align: "right" }
  );

  return doc.output("blob");
};