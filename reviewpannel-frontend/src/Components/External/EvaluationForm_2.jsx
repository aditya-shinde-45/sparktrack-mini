import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api.js";

const EvaluationForm_2 = ({ groupId, role }) => {
  const [students, setStudents] = useState([]);
  const [facultyGuide, setFacultyGuide] = useState("");
  const [industryGuide, setIndustryGuide] = useState("");
  const [externalName, setExternalName] = useState("");
  const [external2Name, setExternal2Name] = useState("");
  const [organization1Name, setOrganization1Name] = useState("");
  const [organization2Name, setOrganization2Name] = useState("");
  const [external1Contact, setExternal1Contact] = useState("");
  const [external2Contact, setExternal2Contact] = useState("");
  const [external1Email, setExternal1Email] = useState("");
  const [external2Email, setExternal2Email] = useState("");
  const [googleMeetLink, setGoogleMeetLink] = useState("");
  const [meetScreenshot, setMeetScreenshot] = useState(null);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [copyrightStatus, setCopyrightStatus] = useState("NA"); // For SY groups: NA, In progress, Submitted, Granted
  const [patentStatus, setPatentStatus] = useState("NA"); // For TY/LY groups: NA, In progress, Submitted, Granted
  const [researchPaperStatus, setResearchPaperStatus] = useState("NA"); // For TY/LY groups: NA, Prepared, Submitted, Accepted, Published

  // ✅ new states for button behavior
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Check if group is Second Year (SY) or Third/Last Year (TY/LY)
  const isSecondYear = groupId?.startsWith("SY");
  const isThirdOrLastYear = groupId?.startsWith("TY") || groupId?.startsWith("LY");

  useEffect(() => {
    setIsSubmitted(false);
    setCopyrightStatus("NA"); // Reset to "NA" when group changes
    setPatentStatus("NA"); // Reset to "NA" when group changes
    setResearchPaperStatus("NA"); // Reset to "NA" when group changes
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const token = localStorage.getItem("token");

    const fetchUrl =
      role === "Mentor"
        ? `/api/mentor/students/${groupId}`
        : `/api/evaluation/review2/group/${groupId}`;

    apiRequest(fetchUrl, "GET", null, token)
      .then((response) => {
        // Handle nested response structure
        let evaluationsData = [];
        if (response?.data?.evaluations) {
          evaluationsData = response.data.evaluations;
        } else if (response?.evaluations) {
          evaluationsData = response.evaluations;
        } else if (Array.isArray(response)) {
          evaluationsData = response;
        } else {
          evaluationsData = [];
        }
        
        const isSY = groupId?.startsWith("SY");
        const fieldsToCalculate = isSY ? ["A", "B", "C", "D", "F", "G"] : ["A", "B", "C", "D", "E", "F", "G"];

        const formatted = evaluationsData.map((student) => {
          // Check if student is absent - either from absent field or if total is "AB"
          const isAbsent = student.absent || student.total === "AB";
          
          return {
            enrollement_no: student.enrollement_no,
            student_name: student.name_of_student,
            guide_name: student.guide_name || "",
            external_name: student.externalname || "",
            contact: student.contact || "",
            A: student.A ?? "",
            B: student.B ?? "",
            C: student.C ?? "",
            D: student.D ?? "",
            E: student.E ?? "",
            F: student.F ?? "",
            G: student.G ?? "",
            absent: isAbsent,
            total:
              isAbsent ? "AB" :
              student.total ??
              fieldsToCalculate
                .map((k) => Number(student[k]) || 0)
                .reduce((a, b) => a + b, 0),
            feedback: student.feedback ?? "",
          };
        });

        setStudents(formatted);

        const anyMarksFilled = formatted.some((student) =>
          ["A", "B", "C", "D", "E", "F", "G"].some(
            (k) => student[k] !== "" && student[k] !== null
          )
        );
        setIsReadOnly(role !== "Mentor" && anyMarksFilled);
        
        if (formatted.length > 0) {
          // Use the raw evaluationsData instead of formatted to get DB fields
          const firstRaw = evaluationsData[0];
          const first = formatted[0];
          
          console.log("Loading evaluation data from DB:", firstRaw);
          
          // Get localStorage values as fallback
          const storedExternal1 = localStorage.getItem("external1_name") || "";
          const storedExternal2 = localStorage.getItem("external2_name") || "";
          const storedOrganization1 = localStorage.getItem("organization1_name") || "";
          const storedOrganization2 = localStorage.getItem("organization2_name") || "";
          const storedExt1Contact = localStorage.getItem("external1_contact") || "";
          const storedExt2Contact = localStorage.getItem("external2_contact") || "";
          const storedExt1Email = localStorage.getItem("external1_email") || "";
          const storedExt2Email = localStorage.getItem("external2_email") || "";
          const storedGmLink = localStorage.getItem("google_meet_link") || "";
          const storedScreenshotUrl = localStorage.getItem("meet_screenshot_url") || "";
          
          // Set basic fields
          setFacultyGuide(firstRaw?.guide_name || "");
          setFeedback(firstRaw?.feedback || "");
          
          // Prioritize database values over localStorage for industry guide
          const industryGuideValue = firstRaw?.ig || firstRaw?.industry_guide || "";
          console.log("Setting industry guide to:", industryGuideValue);
          setIndustryGuide(industryGuideValue);
          
          // Prioritize database values over localStorage for copyright/patent/research paper
          const copyrightValue = firstRaw?.copyright || "NA";
          const patentValue = firstRaw?.patent || "NA";
          const researchPaperValue = firstRaw?.research_paper || "NA";
          console.log("Setting copyright to:", copyrightValue);
          console.log("Setting patent to:", patentValue);
          console.log("Setting research_paper to:", researchPaperValue);
          setCopyrightStatus(copyrightValue);
          setPatentStatus(patentValue);
          setResearchPaperStatus(researchPaperValue);
          
          // Prioritize database values over localStorage for external evaluator details
          setExternalName(firstRaw?.external1 || firstRaw?.external1_name || storedExternal1);
          setExternal2Name(firstRaw?.external2 || firstRaw?.external2_name || storedExternal2);
          setOrganization1Name(firstRaw?.ext1_org || firstRaw?.organization1_name || storedOrganization1);
          setOrganization2Name(firstRaw?.ext2_org || firstRaw?.organization2_name || storedOrganization2);
          setExternal1Contact(firstRaw?.ext1_contact || storedExt1Contact);
          setExternal2Contact(firstRaw?.ext2_contact || storedExt2Contact);
          setExternal1Email(firstRaw?.ext1_email || storedExt1Email);
          setExternal2Email(firstRaw?.ext2_email || storedExt2Email);
          setGoogleMeetLink(firstRaw?.gm_link || storedGmLink);
          setScreenshotUrl(firstRaw?.screenshot || storedScreenshotUrl);
        }
      })
      .catch((err) => {
        console.error("Error loading evaluation data:", err);
        // If API fails, fall back to localStorage
        const storedExternal1 = localStorage.getItem("external1_name") || "";
        const storedExternal2 = localStorage.getItem("external2_name") || "";
        const storedOrganization1 = localStorage.getItem("organization1_name") || "";
        const storedOrganization2 = localStorage.getItem("organization2_name") || "";
        const storedExt1Contact = localStorage.getItem("external1_contact") || "";
        const storedExt2Contact = localStorage.getItem("external2_contact") || "";
        const storedExt1Email = localStorage.getItem("external1_email") || "";
        const storedExt2Email = localStorage.getItem("external2_email") || "";
        const storedGmLink = localStorage.getItem("google_meet_link") || "";
        const storedScreenshotUrl = localStorage.getItem("meet_screenshot_url") || "";
        
        setExternalName(storedExternal1);
        setExternal2Name(storedExternal2);
        setOrganization1Name(storedOrganization1);
        setOrganization2Name(storedOrganization2);
        setExternal1Contact(storedExt1Contact);
        setExternal2Contact(storedExt2Contact);
        setExternal1Email(storedExt1Email);
        setExternal2Email(storedExt2Email);
        setGoogleMeetLink(storedGmLink);
        setScreenshotUrl(storedScreenshotUrl);
      });
  }, [groupId, role]);

  // Check if evaluation should be blocked based on copyright/patent/research paper status
  const isEvaluationBlocked = () => {
    if (isSecondYear) {
      return copyrightStatus === "NA";
    }
    if (isThirdOrLastYear) {
      return patentStatus === "NA" || researchPaperStatus === "NA";
    }
    return false;
  };

  const handleMarkChange = (index, field, value, maxMarks = 10) => {
    if (isReadOnly && role !== "Mentor") return;
    if (isEvaluationBlocked()) return; // Block if copyright/patent/research is NA
    const val = value === "" ? "" : Math.max(0, Math.min(maxMarks, Number(value)));
    const updated = [...students];
    updated[index][field] = val;
    const fieldsToCalculate = isSecondYear ? ["A", "B", "C", "D", "F", "G"] : ["A", "B", "C", "D", "E", "F", "G"];
    updated[index].total = updated[index].absent ? "AB" : fieldsToCalculate
      .map((k) => Number(updated[index][k]) || 0)
      .reduce((a, b) => a + b, 0);
    setStudents(updated);
  };

  const handleAbsentChange = (index, isAbsent) => {
    if (isReadOnly && role !== "Mentor") return;
    if (isEvaluationBlocked()) return; // Block if copyright/patent/research is NA
    const updated = [...students];
    updated[index].absent = isAbsent;
    
    if (isAbsent) {
      // Clear all marks when marked absent
      updated[index].A = "";
      updated[index].B = "";
      updated[index].C = "";
      updated[index].D = "";
      updated[index].E = "";
      updated[index].F = "";
      updated[index].G = "";
      updated[index].total = "AB";
    } else {
      // Recalculate total when unmarked absent
      const fieldsToCalculate = isSecondYear ? ["A", "B", "C", "D", "F", "G"] : ["A", "B", "C", "D", "E", "F", "G"];
      updated[index].total = fieldsToCalculate
        .map((k) => Number(updated[index][k]) || 0)
        .reduce((a, b) => a + b, 0);
    }
    
    setStudents(updated);
  };

  const handleSubmit = async () => {
    if (isReadOnly && role !== "Mentor") return;
    if (isEvaluationBlocked()) return; // Block submission if copyright/patent/research is NA

    setIsSubmitting(true); // start loading
    setIsSubmitted(false); // reset success state

    const token = localStorage.getItem("token");

    const payload = {
      group_id: groupId,
      faculty_guide: facultyGuide,
      industry_guide: industryGuide,
      external1_name: externalName,
      external2_name: external2Name,
      organization1_name: organization1Name,
      organization2_name: organization2Name,
      ext1_contact: external1Contact,
      ext2_contact: external2Contact,
      ext1_email: external1Email,
      ext2_email: external2Email,
      google_meet_link: googleMeetLink,
      screenshot: screenshotUrl || null,
      copyright: isSecondYear ? copyrightStatus : null,
      patent: isThirdOrLastYear ? patentStatus : null,
      research_paper: isThirdOrLastYear ? researchPaperStatus : null,
      feedback,
      evaluations: students.map((student) => ({
        enrollement_no: student.enrollement_no,
        student_name: student.student_name,
        A: student.absent ? "AB" : (Number(student.A) || 0),
        B: student.absent ? "AB" : (Number(student.B) || 0),
        C: student.absent ? "AB" : (Number(student.C) || 0),
        D: student.absent ? "AB" : (Number(student.D) || 0),
        E: student.absent ? "AB" : (Number(student.E) || 0),
        F: student.absent ? "AB" : (Number(student.F) || 0),
        G: student.absent ? "AB" : (Number(student.G) || 0),
        total: student.absent ? "AB" : (Number(student.total) || 0),
        absent: student.absent || false,
      })),
    };

    const submitUrl =
      role === "Mentor"
        ? "/api/mentor/evaluation/review2"
        : "/api/evaluation/review2/save-evaluation";

    try {
      const response = await apiRequest(submitUrl, "POST", payload, token);

      if (!response.success) {
        alert(response.message || "Evaluation failed.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
    } catch (error) {
      alert(error.message || "Error submitting evaluation");
    } finally {
      setIsSubmitting(false); // stop loading
    }
  };

  // Get today's date in a readable format
  const getTodayDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <main className="flex-1 p-4 sm:p-6 bg-white m-4 lg:ml-72 rounded-lg shadow-lg space-y-4 mt-1 sm:mt-16 lg:mt-24 text-gray-900">
      {/* Header Section */}
      <div className="border-2 border-black">
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="border-r-2 border-black p-2">
            <span className="font-semibold">Project ID:</span>
            <span className="ml-2">{groupId || ""}</span>
          </div>
          <div className="p-2">
            <span className="font-semibold">Review No.: 02</span>
          </div>
        </div>
        <div className="border-b-2 border-black p-2">
          <span className="font-semibold">Project Title:</span>
        </div>
        
        {/* Copyright Section - Only for Second Year (SY) Groups */}
        {isSecondYear && (
          <div className="border-b-2 border-black p-2 bg-gray-50">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <span className="font-semibold pt-1">Copyright:</span>
              <div className="flex flex-wrap gap-3">
                {["NA", "In progress", "Submitted", "Granted"].map((option) => (
                  <label key={option} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="copyright"
                      checked={copyrightStatus === option}
                      onChange={() => setCopyrightStatus(option)}
                      disabled={isReadOnly && role !== "Mentor"}
                      className="w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                    <span className={`font-medium text-sm ${
                      copyrightStatus === option ? 'text-purple-700' : 'text-gray-600'
                    }`}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Patent Section - Only for Third Year (TY) and Last Year (LY) Groups */}
        {isThirdOrLastYear && (
          <div className="border-b-2 border-black p-2 bg-gray-50">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <span className="font-semibold pt-1">Patent:</span>
              <div className="flex flex-wrap gap-3">
                {["NA", "In progress", "Submitted", "Granted"].map((option) => (
                  <label key={option} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="patent"
                      checked={patentStatus === option}
                      onChange={() => setPatentStatus(option)}
                      disabled={isReadOnly && role !== "Mentor"}
                      className="w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                    <span className={`font-medium text-sm ${
                      patentStatus === option ? 'text-purple-700' : 'text-gray-600'
                    }`}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Research Paper Section - Only for Third Year (TY) and Last Year (LY) Groups */}
        {isThirdOrLastYear && (
          <div className="border-b-2 border-black p-2 bg-gray-50">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <span className="font-semibold pt-1">Research Paper:</span>
              <div className="flex flex-wrap gap-3">
                {["NA", "Prepared", "Submitted", "Accepted", "Published"].map((option) => (
                  <label key={option} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="researchPaper"
                      checked={researchPaperStatus === option}
                      onChange={() => setResearchPaperStatus(option)}
                      disabled={isReadOnly && role !== "Mentor"}
                      className="w-4 h-4 accent-purple-600 cursor-pointer"
                    />
                    <span className={`font-medium text-sm ${
                      researchPaperStatus === option ? 'text-purple-700' : 'text-gray-600'
                    }`}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="border-b-2 border-black p-2">
          <span className="font-semibold">Name of Faculty Guide:</span>
          <span className="ml-2">{facultyGuide}</span>
        </div>
        <div className="p-2">
          <span className="font-semibold">Date:</span>
          <span className="ml-2">{getTodayDate()}</span>
        </div>
      </div>

      {/* Student Information Table */}
      <div className="border-2 border-black">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="border-r-2 border-black p-2 text-left font-semibold">Enrollment No.</th>
              <th className="border-r-2 border-black p-2 text-left font-semibold">Name of Member</th>
              <th className="border-r-2 border-black p-2 text-left font-semibold">Contact No.</th>
              <th className="p-2 text-left font-semibold">Absent</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, i) => (
              <tr key={i} className={`border-b border-black ${student.absent ? 'bg-gray-100' : ''}`}>
                <td className={`border-r-2 border-black p-2 ${student.absent ? 'line-through text-gray-500' : ''}`}>
                  {student.enrollement_no}
                </td>
                <td className={`border-r-2 border-black p-2 ${student.absent ? 'line-through text-gray-500' : ''}`}>
                  {student.student_name}
                </td>
                <td className="border-r-2 border-black p-2">{student.contact || "-"}</td>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={student.absent}
                    onChange={(e) => handleAbsentChange(i, e.target.checked)}
                    disabled={(isReadOnly && role !== "Mentor") || isEvaluationBlocked()}
                    className="w-4 h-4 accent-purple-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Marks Table */}
      <div className="border-2 border-black">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="border-r-2 border-black p-2 font-semibold">Metric</th>
              <th className="border-r-2 border-black p-2 font-semibold">Max Marks</th>
              {students.map((student, i) => (
                <th key={i} className={`border-r-2 border-black p-2 font-semibold ${i === students.length - 1 ? 'border-r-0' : ''}`}>
                  Enrollment {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { key: "A", label: "1. Problem Definition & Understanding", marks: 5 },
              { key: "B", label: "2. Project Planning & Resource Tracking", marks: 5 },
              { key: "C", label: isSecondYear ? "3. Technology Stack & Feasibility" : "3. Technology Stack & Feasibility", marks: isSecondYear ? 15 : 5 },
              { key: "D", label: "4. Core Programming Implementation", marks: 10 },
              ...(!isSecondYear ? [{ key: "E", label: "5. Specialization/Skill Application", marks: 15 }] : []),
              { key: "F", label: isSecondYear ? "5. Coding Skills/ Demonstration" : "6. Coding Skills/ Demonstration", marks: isSecondYear ? 10 : 5 },
              { key: "G", label: isSecondYear ? "6. Presentation & Communication" : "7. Presentation & Communication", marks: 5 },
            ].map(({ key, label, marks }) => (
              <tr key={key} className="border-b-2 border-black">
                <td className="border-r-2 border-black p-2 text-left">{label}</td>
                <td className="border-r-2 border-black p-2 text-center font-semibold">{marks}</td>
                {students.map((student, i) => (
                  <td key={i} className={`border-r-2 border-black p-2 text-center ${i === students.length - 1 ? 'border-r-0' : ''}`}>
                    <input
                      type="number"
                      min="0"
                      max={marks}
                      value={student[key]}
                      onChange={(e) => handleMarkChange(i, key, e.target.value, marks)}
                      disabled={
                        student.absent || 
                        (isReadOnly && role !== "Mentor") ||
                        isEvaluationBlocked()
                      }
                      className="w-16 border border-gray-400 rounded p-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-200"
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-b-2 border-black bg-gray-50">
              <td className="border-r-2 border-black p-2 text-left font-semibold">Total</td>
              <td className="border-r-2 border-black p-2 text-center font-semibold">50</td>
              {students.map((student, i) => (
                <td key={i} className={`border-r-2 border-black p-2 text-center font-bold ${i === students.length - 1 ? 'border-r-0' : ''}`}>
                  {student.total || 0}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Description of Metrics */}
      <div className="border-2 border-black p-3">
        <div className="font-semibold mb-2">Description of Metrics</div>
        <ol className="text-xs space-y-1 list-decimal pl-5">
          <li>Clarity in problem understanding the scope, relevance, and application.</li>
          <li>Project planning, task allocation, use of <b>Project Tracker sheet</b></li>
          <li>Appropriate chosen languages, frameworks, libraries, tools &amp; feasibility of project implementation.</li>
          <li>Core and advanced programming concepts, integration of key programming fundamentals [Loops/Arrays]</li>
          <li>Application of Specialization/specific knowledge in the project implementation.</li>
          <li>Use coding or web/application of implemented modules to detect understanding and logic building</li>
          <li>Innovative usage of technology stack, novelty factor and creative technical solutions</li>
        </ol>
      </div>

      {/* Name of Industry Guide */}
      <div className="border-2 border-black p-3">
        <div className="font-semibold mb-2">Name of Industry Guide (if any):</div>
        <input
          type="text"
          value={industryGuide}
          onChange={(e) => setIndustryGuide(e.target.value)}
          disabled={isReadOnly && role !== "Mentor"}
          className="w-full border-b border-gray-400 p-2 focus:outline-none bg-transparent focus:border-purple-500 disabled:bg-gray-100"
          placeholder="Enter industry guide name"
        />
      </div>

      {/* Conclusive Remark */}
      <div className="border-2 border-black p-3">
        <div className="font-semibold mb-2">Conclusive Remark by Guide/ Expert:</div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          disabled={isReadOnly && role !== "Mentor"}
          className="w-full border border-gray-400 p-2 rounded h-20 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Reviewers Table */}
      <div className="border-2 border-black">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="border-r-2 border-black p-3 font-semibold w-16">Sr. No.</th>
              <th className="border-r-2 border-black p-3 font-semibold">Name of Reviewers</th>
              <th className="border-r-2 border-black p-3 font-semibold">Organization</th>
              <th className="border-r-2 border-black p-3 font-semibold">Contact</th>
              <th className="p-3 font-semibold">Email</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b-2 border-black">
              <td className="border-r-2 border-black p-3 text-center">1</td>
              <td className="border-r-2 border-black p-3">{externalName || ""}</td>
              <td className="border-r-2 border-black p-3">{organization1Name || ""}</td>
              <td className="border-r-2 border-black p-3">{external1Contact || "-"}</td>
              <td className="p-3">{external1Email || "-"}</td>
            </tr>
            <tr>
              <td className="border-r-2 border-black p-3 text-center">2</td>
              <td className="border-r-2 border-black p-3">{external2Name || ""}</td>
              <td className="border-r-2 border-black p-3">{organization2Name || ""}</td>
              <td className="border-r-2 border-black p-3">{external2Contact || "-"}</td>
              <td className="p-3">{external2Email || "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Submit Button / Success State */}
      <div className="pt-4 flex flex-col items-center gap-3">
        {isEvaluationBlocked() && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 max-w-2xl">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-yellow-800 mb-1">Evaluation Blocked</p>
                <p className="text-sm text-yellow-700">
                  {isSecondYear 
                    ? "Please select a Copyright status other than 'NA' to enable evaluation."
                    : "Please select Patent and Research Paper status other than 'NA' to enable evaluation."}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isSubmitted ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-green-600 font-semibold text-lg">
                PBL Review 2 Evaluation has been submitted successfully!
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isEvaluationBlocked()}
            className="loginbutton text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition transform hover:scale-105 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                Submitting PBL Review 2...
              </>
            ) : role === "Mentor" ? (
              "Update PBL Review 2"
            ) : (
              "Submit PBL Review 2"
            )}
          </button>
        )}
      </div>
    </main>
  );
};

export default EvaluationForm_2;
