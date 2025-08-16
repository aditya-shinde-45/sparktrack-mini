import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api.js";

const EvaluationForm = ({ groupId, role }) => {
  const [students, setStudents] = useState([]);
  const [facultyGuide, setFacultyGuide] = useState("");
  const [externalName, setExternalName] = useState(""); // ✅ new state
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!groupId) return;
    const token = localStorage.getItem("token");

    let fetchUrl =
      role === "Mentor"
        ? `/api/mentor/students/${groupId}`
        : `/api/evaluation/pbl/${groupId}`; // external fetch API

    apiRequest(fetchUrl, "GET", null, token)
      .then((data) => {
        const formatted = (data || []).map((student) => ({
          enrollement_no: student.enrollement_no,
          student_name: student.name_of_student,
          guide_name: student.guide_name || "",
          external_name: student.external_name || "", // ✅ map external name
          A: role === "External" ? "" : student.A ?? "",
          B: role === "External" ? "" : student.B ?? "",
          C: role === "External" ? "" : student.C ?? "",
          D: role === "External" ? "" : student.D ?? "",
          E: role === "External" ? "" : student.E ?? "",
          total:
            role === "External"
              ? 0
              : student.total ??
                ["A", "B", "C", "D", "E"]
                  .map((k) => Number(student[k]) || 0)
                  .reduce((a, b) => a + b, 0),
          feedback: role === "External" ? "" : student.feedback ?? "",
        }));

        setStudents(formatted);

        if (formatted.length > 0) {
          setFacultyGuide(formatted[0].guide_name || "");
          setExternalName(formatted[0].external_name || ""); // ✅ set external name
          setFeedback(role === "External" ? "" : formatted[0].feedback || "");
        }
      })
      .catch((err) => console.error("Error fetching student data:", err));
  }, [groupId, role]);

  const handleMarkChange = (index, field, value) => {
    let val = value === "" ? "" : Math.max(0, Math.min(10, Number(value)));
    const updated = [...students];
    updated[index][field] = val;
    updated[index].total = ["A", "B", "C", "D", "E"]
      .map((k) => Number(updated[index][k]) || 0)
      .reduce((a, b) => a + b, 0);
    setStudents(updated);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        group_id: groupId,
        faculty_guide: facultyGuide,
        external_name: externalName, // ✅ include in payload
        feedback,
        evaluations: students.map((student) => ({
          enrolment_no: student.enrollement_no,
          student_name: student.student_name,
          A: Number(student.A) || 0,
          B: Number(student.B) || 0,
          C: Number(student.C) || 0,
          D: Number(student.D) || 0,
          E: Number(student.E) || 0,
          total: Number(student.total) || 0,
        })),
      };

      let submitUrl =
        role === "Mentor"
          ? "/api/mentor/evaluation" // mentor update API
          : "/api/evaluation/save-evaluation"; // external save API

      await apiRequest(submitUrl, "POST", payload, token);
      alert("Evaluation submitted successfully!");
    } catch (err) {
      console.error("Error submitting evaluation:", err);
      alert("Error submitting evaluation");
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 bg-white m-4 lg:ml-72 rounded-lg shadow-lg space-y-6 mt-1 sm:mt-16 lg:mt-24 text-gray-900">

      {/* Rubrics */}
      <section>
        <h2 className="font-bold text-lg mb-2">Rubrics for Evaluation</h2>
        <ul className="list-disc pl-5 text-sm leading-6">
          <li>A. Problem Identification – Clarity in defining the design challenge <b>(10 Marks)</b></li>
          <li>B. Empathy Map – Understanding user needs, emotions, and perspectives <b>(10 Marks)</b></li>
          <li>C. Solution Creativity – Originality and innovation of design solution <b>(10 Marks)</b></li>
          <li>D. Solution Feasibility – Practicality and viability of proposed solutions <b>(10 Marks)</b></li>
          <li>E. Communication – Clarity in presenting the design concept <b>(10 Marks)</b></li>
        </ul>
      </section>

      {/* Marks Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-sm text-center min-w-[700px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-4">Enrollment No.</th>
              <th className="border border-gray-300 px-3 py-4">Name of Students</th>
              {["A", "B", "C", "D", "E"].map((k) => (
                <th key={k} className="border border-gray-300 px-2 py-4">{k}</th>
              ))}
              <th className="border border-gray-300 px-3 py-4">Total Marks (50)</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, i) => (
              <tr className="hover:bg-gray-50" key={i}>
                <td className="border border-gray-300 px-3 py-4">{student.enrollement_no}</td>
                <td className="border border-gray-300 px-3 py-4">{student.student_name}</td>
                {["A", "B", "C", "D", "E"].map((key) => (
                  <td key={key} className="border border-gray-300 px-3 py-4">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={student[key]}
                      onChange={(e) => handleMarkChange(i, key, e.target.value)}
                      className="w-14 border border-gray-300 rounded p-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-4 font-semibold">{student.total || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* External Name */}
      <div>
        <label className="block font-semibold text-sm">Name of External:</label>
        <input
          type="text"
          value={externalName}
          readOnly
          className="w-full border border-gray-300 p-2 mt-1 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-100"
        />
      </div>

      {/* Faculty Guide */}
      <div>
        <label className="block font-semibold text-sm">Name of Faculty Guide:</label>
        <input
          type="text"
          value={facultyGuide}
          readOnly
          className="w-full border border-gray-300 p-2 mt-1 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-100"
        />
      </div>

      {/* Feedback */}
      <div>
        <label className="block font-semibold text-sm">
          Feedback by Evaluator <span className="text-gray-500">(Feedback based Learning)</span>
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full border border-gray-300 p-2 mt-1 rounded h-24 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Submit Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleSubmit}
          className="loginbutton text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition transform hover:scale-105"
        >
          {role === "Mentor" ? "Update" : "Submit"}
        </button>
      </div>
    </main>
  );
};

export default EvaluationForm;
