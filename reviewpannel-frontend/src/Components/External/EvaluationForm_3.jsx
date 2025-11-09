import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api.js";

const EvaluationForm_3 = ({ groupId, role, onSubmitSuccess }) => {
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
  const [feedback, setFeedback] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Academic status fields
  const [copyrightStatus, setCopyrightStatus] = useState("NA");
  const [patentStatus, setPatentStatus] = useState("NA");
  const [researchPaperStatus, setResearchPaperStatus] = useState("NA");

  // Button states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setIsSubmitted(false);
    setCopyrightStatus("NA");
    setPatentStatus("NA");
    setResearchPaperStatus("NA");
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const token = localStorage.getItem("token");

    const fetchUrl =
      role === "Mentor"
        ? `/api/mentor/students/${groupId}`
        : `/api/pbl3/evaluation/${groupId}`;

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

        const formatted = evaluationsData.map((student) => {
          const isAbsent = student.absent || student.total === "AB";
          
          return {
            enrollement_no: student.enrollement_no,
            student_name: student.name_of_student || student.student_name,
            guide_name: student.guide_name || "",
            external_name: student.externalname || "",
            contact: student.contact || "",
            m1: student.m1 ?? "",
            m2: student.m2 ?? "",
            m3: student.m3 ?? "",
            m4: student.m4 ?? "",
            m5: student.m5 ?? "",
            m6: student.m6 ?? "",
            absent: isAbsent,
            total:
              isAbsent ? "AB" :
              student.total ??
              ["m1", "m2", "m3", "m4", "m5", "m6"]
                .map((k) => Number(student[k]) || 0)
                .reduce((a, b) => a + b, 0),
            feedback: student.feedback ?? "",
          };
        });

        setStudents(formatted);

        const anyMarksFilled = formatted.some((student) =>
          ["m1", "m2", "m3", "m4", "m5", "m6"].some(
            (k) => student[k] !== "" && student[k] !== null
          )
        );
        setIsReadOnly(role !== "Mentor" && anyMarksFilled);
        
        if (formatted.length > 0) {
          const firstRaw = evaluationsData[0];
          
          setFacultyGuide(firstRaw?.guide_name || "");
          setFeedback(firstRaw?.feedback || "");
          setIndustryGuide(firstRaw?.industry_guide || "");
          
          const copyrightValue = firstRaw?.copyright || "NA";
          const patentValue = firstRaw?.patent || "NA";
          const researchPaperValue = firstRaw?.research_paper || "NA";
          setCopyrightStatus(copyrightValue);
          setPatentStatus(patentValue);
          setResearchPaperStatus(researchPaperValue);
        }
        
        // Load external evaluator details from localStorage
        const storedExternal1 = localStorage.getItem("external1_name") || "";
        const storedExternal2 = localStorage.getItem("external2_name") || "";
        const storedOrganization1 = localStorage.getItem("organization1_name") || "";
        const storedOrganization2 = localStorage.getItem("organization2_name") || "";
        const storedExt1Contact = localStorage.getItem("external1_contact") || "";
        const storedExt2Contact = localStorage.getItem("external2_contact") || "";
        const storedExt1Email = localStorage.getItem("external1_email") || "";
        const storedExt2Email = localStorage.getItem("external2_email") || "";
        
        setExternalName(storedExternal1);
        setExternal2Name(storedExternal2);
        setOrganization1Name(storedOrganization1);
        setOrganization2Name(storedOrganization2);
        setExternal1Contact(storedExt1Contact);
        setExternal2Contact(storedExt2Contact);
        setExternal1Email(storedExt1Email);
        setExternal2Email(storedExt2Email);
      })
      .catch((err) => {
        console.error("Error loading evaluation data:", err);
        
        // On error, also load from localStorage
        const storedExternal1 = localStorage.getItem("external1_name") || "";
        const storedExternal2 = localStorage.getItem("external2_name") || "";
        const storedOrganization1 = localStorage.getItem("organization1_name") || "";
        const storedOrganization2 = localStorage.getItem("organization2_name") || "";
        const storedExt1Contact = localStorage.getItem("external1_contact") || "";
        const storedExt2Contact = localStorage.getItem("external2_contact") || "";
        const storedExt1Email = localStorage.getItem("external1_email") || "";
        const storedExt2Email = localStorage.getItem("external2_email") || "";
        
        setExternalName(storedExternal1);
        setExternal2Name(storedExternal2);
        setOrganization1Name(storedOrganization1);
        setOrganization2Name(storedOrganization2);
        setExternal1Contact(storedExt1Contact);
        setExternal2Contact(storedExt2Contact);
        setExternal1Email(storedExt1Email);
        setExternal2Email(storedExt2Email);
      });
  }, [groupId, role]);

  const handleMarkChange = (index, field, value, maxMarks = 10) => {
    if (isReadOnly && role !== "Mentor") return;
    const val = value === "" ? "" : Math.max(0, Math.min(maxMarks, Number(value)));
    const updated = [...students];
    updated[index][field] = val;
    updated[index].total = updated[index].absent ? "AB" : ["m1", "m2", "m3", "m4", "m5", "m6"]
      .map((k) => Number(updated[index][k]) || 0)
      .reduce((a, b) => a + b, 0);
    setStudents(updated);
  };

  const handleAbsentChange = (index, isAbsent) => {
    if (isReadOnly && role !== "Mentor") return;
    const updated = [...students];
    updated[index].absent = isAbsent;
    
    if (isAbsent) {
      updated[index].m1 = "";
      updated[index].m2 = "";
      updated[index].m3 = "";
      updated[index].m4 = "";
      updated[index].m5 = "";
      updated[index].m6 = "";
      updated[index].total = "AB";
    } else {
      updated[index].total = ["m1", "m2", "m3", "m4", "m5", "m6"]
        .map((k) => Number(updated[index][k]) || 0)
        .reduce((a, b) => a + b, 0);
    }
    
    setStudents(updated);
  };

  const handleSubmit = async () => {
    if (isReadOnly && role !== "Mentor") return;

    setIsSubmitting(true);
    setIsSubmitted(false);

    const token = localStorage.getItem("token");

    // Get external evaluator data from localStorage when submitting
    const ext1Name = localStorage.getItem("external1_name") || "";
    const ext2Name = localStorage.getItem("external2_name") || "";
    const org1Name = localStorage.getItem("organization1_name") || "";
    const org2Name = localStorage.getItem("organization2_name") || "";
    const ext1Contact = localStorage.getItem("external1_contact") || "";
    const ext2Contact = localStorage.getItem("external2_contact") || "";
    const ext1Email = localStorage.getItem("external1_email") || "";
    const ext2Email = localStorage.getItem("external2_email") || "";

    const payload = {
      group_id: groupId,
      faculty_guide: facultyGuide,
      industry_guide: industryGuide,
      external1_name: ext1Name,
      external2_name: ext2Name,
      organization1_name: org1Name,
      organization2_name: org2Name,
      ext1_contact: ext1Contact,
      ext2_contact: ext2Contact,
      ext1_email: ext1Email,
      ext2_email: ext2Email,
      copyright: copyrightStatus,
      patent: patentStatus,
      research_paper: researchPaperStatus,
      feedback,
      evaluations: students.map((student) => ({
        enrollement_no: student.enrollement_no,
        student_name: student.student_name,
        m1: student.absent ? "AB" : (Number(student.m1) || 0),
        m2: student.absent ? "AB" : (Number(student.m2) || 0),
        m3: student.absent ? "AB" : (Number(student.m3) || 0),
        m4: student.absent ? "AB" : (Number(student.m4) || 0),
        m5: student.absent ? "AB" : (Number(student.m5) || 0),
        m6: student.absent ? "AB" : (Number(student.m6) || 0),
        total: student.absent ? "AB" : (Number(student.total) || 0),
        absent: student.absent || false,
      })),
    };

    const submitUrl = "/api/pbl3/evaluation/save";

    try {
      const response = await apiRequest(submitUrl, "POST", payload, token);

      if (!response.success) {
        alert(response.message || "Evaluation failed.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
      
      if (typeof onSubmitSuccess === 'function') {
        onSubmitSuccess(groupId);
      }
    } catch (error) {
      alert(error.message || "Error submitting evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <span className="font-semibold">Review No.: 03</span>
          </div>
        </div>
        <div className="border-b-2 border-black p-2">
          <span className="font-semibold">Project Title:</span>
        </div>
        
        {/* Copyright Section */}
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
        
        {/* Patent Section */}
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
        
        {/* Research Paper Section */}
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
                    disabled={isReadOnly && role !== "Mentor"}
                    className="w-4 h-4 accent-purple-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Marks Table - PBL Review 3 Criteria */}
      <div className="border-2 border-black">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="border-r-2 border-black p-2 font-semibold">Criterion</th>
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
              { key: "m1", label: "1. Problem Definition & Domain Understanding", marks: 5 },
              { key: "m2", label: "2. Technical Expertise", marks: 15 },
              { key: "m3", label: "3. Project Report", marks: 10 },
              { key: "m4", label: "4. Copyright, Patent, or Paper Publication", marks: 10 },
              { key: "m5", label: "5. Project Event Participation", marks: 5 },
              { key: "m6", label: "6. Presentation & Communication", marks: 5 },
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
                      disabled={student.absent || (isReadOnly && role !== "Mentor")}
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

      {/* Description of Criteria */}
      <div className="border-2 border-black p-3">
        <div className="font-semibold mb-2">Description of Evaluation Criteria</div>
        <ol className="text-xs space-y-1 list-decimal pl-5">
          <li><b>Problem Definition & Domain Understanding:</b> Checks clarity of the project's problem and understanding of the domain.</li>
          <li><b>Technical Expertise:</b> Evaluates coding, architecture, tools, implementation quality, and innovation.</li>
          <li><b>Project Report:</b> Assesses documentation quality — structure, clarity, and completeness.</li>
          <li><b>Copyright, Patent, or Paper Publication:</b> Rewards research output or innovation recognized externally.</li>
          <li><b>Project Event Participation:</b> Rewards participation in competitions, hackathons, or exhibitions.</li>
          <li><b>Presentation & Communication:</b> Evaluates delivery, teamwork presentation, and confidence.</li>
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
        {isSubmitted ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-green-600 font-semibold text-lg">
                PBL Review 3 Evaluation has been submitted successfully!
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
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
                Submitting PBL Review 3...
              </>
            ) : role === "Mentor" ? (
              "Update PBL Review 3"
            ) : (
              "Submit PBL Review 3"
            )}
          </button>
        )}
      </div>
    </main>
  );
};

export default EvaluationForm_3;
