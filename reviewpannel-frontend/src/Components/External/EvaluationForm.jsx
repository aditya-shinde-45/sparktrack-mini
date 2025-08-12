import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "https://sparktrack-mini.onrender.com/";

const EvaluationForm = ({ groupId }) => {
  const [students, setStudents] = useState([]);
  const [facultyGuide, setFacultyGuide] = useState("");
  const [feedback, setFeedback] = useState("");
  const [signatures, setSignatures] = useState(["", ""]);
  const [recommendation, setRecommendation] = useState({
    CRIEYA: false,
    COPYRIGHT: false,
    PATENT: false,
    AIC: false,
    TECH_TRANSFER: false,
  });

  useEffect(() => {
    if (!groupId) return;

    axios
      .get(`${API_BASE_URL}/api/evaluation/pbl/${groupId}`)
      .then((res) => {
        const data = res.data || [];
        const formatted = data.map((student) => ({
          enrolment_no: student.enrollement_no,
          student_name: student.name_of_student,
          guide_name: student.guide_name,
          A: "",
          B: "",
          C: "",
          D: "",
          E: "",
          total: 0,
        }));

        setStudents(formatted);

        // Autofill faculty guide if available
        if (formatted.length > 0) {
          setFacultyGuide(formatted[0].guide_name || "");
        }
      })
      .catch((err) => console.error("Error fetching student data:", err));
  }, [groupId]);

  const handleMarkChange = (index, field, value) => {
    const updated = [...students];
    updated[index][field] = value;
    updated[index].total = ["A", "B", "C", "D", "E"]
      .map((k) => Number(updated[index][k] || 0))
      .reduce((a, b) => a + b, 0);
    setStudents(updated);
  };

  const handleSubmit = async () => {
    try {
      for (const student of students) {
        await axios.post(`${API_BASE_URL}/api/save-evaluation`, {
          group_id: groupId,
          enrolment_no: student.enrolment_no,
          student_name: student.student_name,
          A: Number(student.A) || 0,
          B: Number(student.B) || 0,
          C: Number(student.C) || 0,
          D: Number(student.D) || 0,
          E: Number(student.E) || 0,
          faculty_guide: facultyGuide,
          feedback,
          // Add signatures and recommendation if backend supports
        });
      }
      alert("Evaluation submitted successfully!");
    } catch (err) {
      console.error("Error submitting evaluation:", err);
      alert("Error submitting evaluation");
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 bg-white m-4 lg:ml-72 rounded-lg shadow-lg space-y-6 mt-24 text-gray-900">
      {/* Rubrics */}
      <section>
        <h2 className="font-bold text-lg mb-2 text-gray-900">Rubrics for Evaluation</h2>
        <ul className="list-disc pl-5 text-sm leading-6 text-gray-800">
          <li>
            A. Problem Identification – Clarity in defining the design challenge <b>(10 Marks)</b>
          </li>
          <li>
            B. Empathy Map – Understanding user needs, emotions, and perspectives <b>(10 Marks)</b>
          </li>
          <li>
            C. Solution Creativity – Originality and innovation of design solution <b>(10 Marks)</b>
          </li>
          <li>
            D. Solution Feasibility – Practicality and viability of proposed solutions <b>(10 Marks)</b>
          </li>
          <li>
            E. Communication – Clarity in presenting the design concept <b>(10 Marks)</b>
          </li>
        </ul>
      </section>

      {/* Marks Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-sm text-center min-w-[700px] rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-900">
            <tr>
              <th className="border border-gray-300 px-3 py-4">Enrolment No.</th>
              <th className="border border-gray-300 px-3 py-4">Name of Students</th>
              {["A", "B", "C", "D", "E"].map((k) => (
                <th key={k} className="border border-gray-300 px-2 py-4">
                  {k}
                </th>
              ))}
              <th className="border border-gray-300 px-3 py-4">Total Marks (50)</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, i) => (
              <tr className="hover:bg-gray-50" key={i}>
                <td className="border border-gray-300 px-3 py-4">{student.enrolment_no}</td>
                <td className="border border-gray-300 px-3 py-4">{student.student_name}</td>
                {["A", "B", "C", "D", "E"].map((key) => (
                  <td key={key} className="border border-gray-300 px-3 py-4">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={student[key] || ""}
                      onChange={(e) => handleMarkChange(i, key, e.target.value)}
                      className="w-14 border border-gray-300 rounded p-1 text-center text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-4 font-semibold">{student.total || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Faculty Guide */}
      <div>
        <label className="block font-semibold text-sm text-gray-900">Name of Faculty Guide:</label>
        <input
          type="text"
          value={facultyGuide}
          onChange={(e) => setFacultyGuide(e.target.value)}
          className="w-full border border-gray-300 p-2 mt-1 rounded text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Feedback */}
      <div>
        <label className="block font-semibold text-sm text-gray-900">
          Feedback by Evaluator{" "}
          <span className="text-gray-500">(Feedback based Learning)</span>
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full border border-gray-300 p-2 mt-1 rounded h-24 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Submit Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-purple-400 to-blue-400 text-white px-6 py-4 rounded-lg shadow-md hover:opacity-90 transition transform hover:scale-105"
        >
          Submit
        </button>
      </div>
    </main>
  );
};

export default EvaluationForm;
