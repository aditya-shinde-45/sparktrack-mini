import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api.js";

const PBLEvaluationForm = ({ groupId, role }) => {
  const [students, setStudents] = useState([]);
  const [facultyGuide, setFacultyGuide] = useState("");
  const [externalName, setExternalName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeReview, setActiveReview] = useState(null); // 1 for PBL Review 1, 2 for PBL Review 2
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Check which PBL review is active based on deadline settings
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // Use the dedicated endpoint to get the active PBL review
    apiRequest("/api/external/active-pbl-review", "GET", null, token)
      .then((res) => {
        if (res && res.activeReview) {
          setActiveReview(res.activeReview);
        } else {
          setActiveReview(null); // No review is active
        }
      })
      .catch(err => {
        console.error("Error checking active PBL review:", err);
        setActiveReview(null);
      });
  }, []);

  useEffect(() => {
    setIsSubmitted(false);
  }, [groupId]);

  useEffect(() => {
    if (!groupId || !activeReview) return;
    
    const token = localStorage.getItem("token");
    const external = localStorage.getItem("name"); // for external only
    
    // Use different endpoint based on which review is active
    const reviewEndpoint = activeReview === 1 ? 'pbl1' : 'pbl2';

    const fetchUrl = role === "Mentor" 
      ? `/api/mentor/students/${groupId}` 
      : `/api/evaluation/${reviewEndpoint}/${groupId}`;

    apiRequest(fetchUrl, "GET", null, token)
      .then((data) => {
        const formatted = (data || []).map((student) => ({
          enrollement_no: student.enrollement_no,
          student_name: student.name_of_student,
          guide_name: student.guide_name || "",
          external_name: student.externalname || "",
          A: student.A ?? "",
          B: student.B ?? "",
          C: student.C ?? "",
          D: student.D ?? "",
          E: student.E ?? "",
          total:
            student.total ??
            ["A", "B", "C", "D", "E"]
              .map((k) => Number(student[k]) || 0)
              .reduce((a, b) => a + b, 0),
          feedback: student.feedback ?? "",
        }));

        setStudents(formatted);

        const anyMarksFilled = formatted.some((student) =>
          ["A", "B", "C", "D", "E"].some(
            (k) => student[k] !== "" && student[k] !== null
          )
        );
        setIsReadOnly(role !== "Mentor" && anyMarksFilled);

        if (formatted.length > 0) {
          const first = formatted[0];
          setFacultyGuide(first?.guide_name || "");
          setFeedback(first?.feedback || "");

          if (role === "External") setExternalName(external || "");
          else setExternalName(first?.external_name || "");
        }
      })
      .catch((err) => console.error("Error fetching student data:", err));
  }, [groupId, role, activeReview]);

  const handleMarkChange = (index, field, value) => {
    if (isReadOnly && role !== "Mentor") return;
    const val = value === "" ? "" : Math.max(0, Math.min(10, Number(value)));
    const updated = [...students];
    updated[index][field] = val;
    updated[index].total = ["A", "B", "C", "D", "E"]
      .map((k) => Number(updated[index][k]) || 0)
      .reduce((a, b) => a + b, 0);
    setStudents(updated);
  };

  const handleSubmit = async () => {
    if (isReadOnly && role !== "Mentor") return;
    if (!activeReview) {
      alert("No active PBL review session is currently enabled.");
      return;
    }

    setIsSubmitting(true); // start loading
    setIsSubmitted(false); // reset success state

    const token = localStorage.getItem("token");
    
    // Use different endpoint based on which review is active
    const reviewEndpoint = activeReview === 1 ? 'pbl1' : 'pbl2';

    const payload = {
      group_id: groupId,
      faculty_guide: facultyGuide,
      external_name: externalName,
      feedback,
      review_type: activeReview, // Indicate which review this is
      evaluations: students.map((student) => ({
        enrollement_no: student.enrollement_no,
        student_name: student.student_name,
        A: Number(student.A) || 0,
        B: Number(student.B) || 0,
        C: Number(student.C) || 0,
        D: Number(student.D) || 0,
        E: Number(student.E) || 0,
        total: Number(student.total) || 0,
      })),
    };

    const submitUrl = role === "Mentor"
      ? `/api/mentor/evaluation/${reviewEndpoint}`
      : `/api/evaluation/${reviewEndpoint}`;

    try {
      const response = await apiRequest(submitUrl, "POST", payload, token);

      if (!response.success) {
        alert(response.message || "Evaluation failed.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true); // show success
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      alert(error.message || "Error submitting evaluation");
    } finally {
      setIsSubmitting(false); // stop loading
    }
  };

  // Render different rubrics based on which review is active
  const renderRubrics = () => {
    if (activeReview === 1) {
      // PBL Review 1 Rubrics
      return (
        <section>
          <h2 className="font-bold text-lg mb-2">PBL Review 1 - Rubrics for Evaluation</h2>
          <ul className="list-disc pl-5 text-sm leading-6">
            <li>A. Problem Identification – Clarity in defining the design challenge <b>(10 Marks)</b></li>
            <li>B. Empathy Map – Understanding user needs, emotions, and perspectives <b>(10 Marks)</b></li>
            <li>C. Solution Creativity – Originality and innovation of design solution <b>(10 Marks)</b></li>
            <li>D. Solution Feasibility – Practicality and viability of proposed solutions <b>(10 Marks)</b></li>
            <li>E. Communication – Clarity in presenting the design concept <b>(10 Marks)</b></li>
          </ul>
        </section>
      );
    } else if (activeReview === 2) {
      // PBL Review 2 Rubrics
      return (
        <section>
          <h2 className="font-bold text-lg mb-2">PBL Review 2 - Rubrics for Evaluation</h2>
          <ul className="list-disc pl-5 text-sm leading-6">
            <li>A. Implementation Quality – Completeness and quality of implementation <b>(10 Marks)</b></li>
            <li>B. Technical Complexity – Difficulty and sophistication of the solution <b>(10 Marks)</b></li>
            <li>C. Project Innovation – Unique and novel aspects of the solution <b>(10 Marks)</b></li>
            <li>D. Documentation – Quality and thoroughness of project documentation <b>(10 Marks)</b></li>
            <li>E. Final Presentation – Effectiveness of the final project presentation <b>(10 Marks)</b></li>
          </ul>
        </section>
      );
    } else {
      // No active review
      return (
        <section>
          <h2 className="font-bold text-lg mb-2 text-red-500">No Active PBL Review Session</h2>
          <p className="text-sm text-gray-700">
            There is currently no active PBL review session enabled. Please contact the admin to enable either PBL Review 1 or PBL Review 2.
          </p>
        </section>
      );
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 bg-white m-4 lg:ml-72 rounded-lg shadow-lg space-y-6 mt-1 sm:mt-16 lg:mt-24 text-gray-900">
      <h1 className="text-2xl font-bold text-purple-800">
        {activeReview === 1 ? "PBL Review 1 Evaluation Form" : 
         activeReview === 2 ? "PBL Review 2 Evaluation Form" : 
         "PBL Evaluation Form"}
      </h1>
      
      {/* Display appropriate rubrics based on active review */}
      {renderRubrics()}

      {activeReview && (
        <>
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
                          disabled={isReadOnly && role !== "Mentor"}
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
              disabled={isReadOnly && role !== "Mentor"}
              className="w-full border border-gray-300 p-2 mt-1 rounded h-24 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Submit Button / Success State */}
          <div className="pt-4 flex justify-center">
            {isSubmitted ? (
              <p className="text-green-600 font-semibold">
                PBL Review {activeReview} Evaluation has been submitted successfully!
              </p>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !activeReview}
                className="loginbutton text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition transform hover:scale-105 flex items-center justify-center gap-2 mx-auto"
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
                    Submitting...
                  </>
                ) : role === "Mentor" ? (
                  "Update"
                ) : (
                  "Submit"
                )}
              </button>
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default PBLEvaluationForm;