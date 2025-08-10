import React from "react";

const EvaluationForm = () => {
  return (
    <main className="flex-1 p-4 sm:p-6 bg-white m-4 lg:ml-72 rounded-lg shadow-lg space-y-6 mt-24">
      {/* Rubrics */}
      <section>
        <h2 className="font-bold text-lg mb-2">Rubrics for Evaluation</h2>
        <ul className="list-disc pl-5 text-sm leading-6 text-gray-700">
          <li>A. Problem Identification – Clarity in defining the design challenge <b>(10 Marks)</b></li>
          <li>B. Empathy Map – Understanding user needs, emotions, and perspectives <b>(10 Marks)</b></li>
          <li>C. Solution Creativity – Originality and innovation of design solution <b>(10 Marks)</b></li>
          <li>D. Solution Feasibility – Practicality and viability of proposed solutions <b>(10 Marks)</b></li>
          <li>E. Communication – Clarity in presenting the design concept <b>(10 Marks)</b></li>
        </ul>
      </section>

      {/* Marks Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-sm text-center min-w-[700px] rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border border-gray-300 px-3 py-4">Enrolment No.</th>
              <th className="border border-gray-300 px-3 py-4">Roll Number</th>
              <th className="border border-gray-300 px-3 py-4">Name of Students</th>
              <th className="border border-gray-300 px-2 py-4">A</th>
              <th className="border border-gray-300 px-2 py-4">B</th>
              <th className="border border-gray-300 px-2 py-4">C</th>
              <th className="border border-gray-300 px-2 py-4">D</th>
              <th className="border border-gray-300 px-2 py-4">E</th>
              <th className="border border-gray-300 px-3 py-4">Total Marks (50)</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr className="hover:bg-gray-50" key={i}>
                {Array.from({ length: 9 }).map((_, j) => (
                  <td key={j} className="border border-gray-300 px-3 py-4"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Faculty Guide */}
      <div>
        <label className="block font-semibold text-sm">Name of Faculty Guide:</label>
        <input type="text" className="w-full border border-gray-300 p-2 mt-1 rounded focus:ring-2 focus:ring-purple-400" />
      </div>

      {/* Feedback */}
      <div>
        <label className="block font-semibold text-sm">
          Feedback by Evaluator <span className="text-gray-500">(Feedback based Learning)</span>
        </label>
        <textarea className="w-full border border-gray-300 p-2 mt-1 rounded h-24 focus:ring-2 focus:ring-purple-400"></textarea>
      </div>

      {/* Signatures */}
      <div>
        <label className="block font-semibold text-sm">Name and Signature of Internal/External Guide</label>
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <input type="text" placeholder="1." className="flex-1 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-purple-400" />
          <input type="text" placeholder="2." className="flex-1 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-purple-400" />
        </div>
      </div>

      {/* Recommendation */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-sm text-center min-w-[600px] rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border border-gray-300 px-3 py-4">Recommend this idea for further grooming in (Tick in box)</th>
              <th className="border border-gray-300 px-3 py-4">CRIEYA</th>
              <th className="border border-gray-300 px-3 py-4">COPYRIGHT</th>
              <th className="border border-gray-300 px-3 py-4">PATENT</th>
              <th className="border border-gray-300 px-3 py-4">AIC</th>
              <th className="border border-gray-300 px-3 py-4">TECH-TRANSFER</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50">
              {Array.from({ length: 6 }).map((_, j) => (
                <td key={j} className="border border-gray-300 px-3 py-4"></td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Submit Button */}
      <div className="text-center pt-4">
        <button className="bg-gradient-to-r from-purple-400 to-blue-400 text-white px-6 py-4 rounded-lg shadow-md hover:opacity-90 transition transform hover:scale-105">
          Submit
        </button>
      </div>
    </main>
  );
};

export default EvaluationForm;
