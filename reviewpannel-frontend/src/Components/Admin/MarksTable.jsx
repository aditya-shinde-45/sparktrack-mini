import React from "react";

const MarksTable = ({ students, loading, error, reviewType = "review1" }) => {
  const isReview2 = reviewType === "review2";

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-purple-600">
            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">
              Group ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">
              Enrollment No
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">
              Student Name
            </th>
            {isReview2 ? (
              <>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">M1</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">M2</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">M3</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">M4</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">M5</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">M6</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">M7</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Guide Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Industry Guide</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">External 1</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">External 2</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Org 1</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Org 2</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide">Date</th>
              </>
            ) : (
              <>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">A</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">B</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">C</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">D</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">E</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Guide Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">External</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Crieya</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Patent</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Copyright</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">AIC</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide">Tech Transfer</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="bg-white">
          {!loading &&
            !error &&
            students.map((student, idx) => (
              <tr 
                key={idx} 
                className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                  {student.group_id || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                  {student.enrollement_no || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                  {student.name_of_student || "-"}
                </td>
                {isReview2 ? (
                  <>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {student.m1 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {student.m2 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {student.m3 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {student.m4 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {student.m5 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {student.m6 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {student.m7 ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center font-bold text-gray-900 border-r border-gray-200">
                      {student.total || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {student.guide_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {student.ig || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {student.external1 || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {student.external2 || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {student.ext1_org || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {student.ext2_org || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900">
                      {student.date ? new Date(student.date).toLocaleDateString('en-GB') : "-"}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {student.A ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {student.B ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {student.C ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {student.D ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {student.E ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center font-bold text-gray-900 border-r border-gray-200">
                      {student.total || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {student.guide_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {student.externalname || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-700 border-r border-gray-200">
                      {student.crieya || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-700 border-r border-gray-200">
                      {student.patent || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-700 border-r border-gray-200">
                      {student.copyright || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-700 border-r border-gray-200">
                      {student.aic || "-"}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-700">
                      {student.tech_transfer || "-"}
                    </td>
                  </>
                )}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarksTable;
