import React from "react";
import { Eye, Trash2 } from "lucide-react";

const MarksTable = ({
  students,
  loading,
  error,
  reviewType = "review1",
  formFields = [],
  totalMarks = 0,
  onDeleteGroup,
  editableFormMarks = false,
  onFormMarkChange,
  onSaveFormRow,
  savingRowKey = null,
}) => {
  const isReview2 = reviewType === "review2";
  const isZeroReview = reviewType === "zeroreview";
  const isForm = reviewType === "form";
  const showDelete = typeof onDeleteGroup === "function";
  const normalizedFormFields = formFields.map((field) => ({
    ...field,
    type: field.type || (Number(field.max_marks) === 0 ? "boolean" : "number")
  }));

  const handleViewDocument = (fileUrl) => {
    if (fileUrl && fileUrl !== 'pending_upload') {
      window.open(fileUrl, '_blank');
    } else {
      alert('Document not available');
    }
  };

  const renderCellValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';

    if (typeof value === 'object') {
      if (value.url && typeof value.url === 'string') {
        return (
          <a
            href={value.url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {value.name || 'View file'}
          </a>
        );
      }

      try {
        return JSON.stringify(value);
      } catch {
        return '[Object]';
      }
    }

    return String(value);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-purple-600">
            {!isZeroReview && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">
                Group ID
              </th>
            )}
            {isZeroReview && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">
                Group ID
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">
              Enrollment No
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">
              Student Name
            </th>
            {isZeroReview && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">
                Organization
              </th>
            )}
            {isForm ? (
              <>
                {normalizedFormFields.map((field) => (
                  <th
                    key={field.key}
                    className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{renderCellValue(field.label)}</span>
                      {field.type === "boolean" && (
                        <span className="text-[10px] font-medium bg-white/20 px-2 py-0.5 rounded-full">Yes/No</span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">
                  External
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">
                  Feedback
                </th>
                {showDelete && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide">
                    Actions
                  </th>
                )}
                {editableFormMarks && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide">
                    Save
                  </th>
                )}
              </>
            ) : isZeroReview ? (
              <>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">M1</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">M2</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">M3</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">M4</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">M5</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Guide</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">External</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide border-r border-purple-500">Remark</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide">Document</th>
              </>
            ) : isReview2 ? (
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
                {!isZeroReview && (
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                    {renderCellValue(student.group_id)}
                  </td>
                )}
                {isZeroReview && (
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                    {renderCellValue(student.group_id)}
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                  {renderCellValue(student.enrollement_no || student.enrollment_no)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                  {renderCellValue(student.name_of_student || student.student_name)}
                </td>
                {isZeroReview && (
                  <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                    {renderCellValue(student.organization_name)}
                  </td>
                )}
                {isForm ? (
                  <>
                    {normalizedFormFields.map((field) => (
                      <td key={field.key} className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                        {editableFormMarks && field.type === "number" ? (
                          <input
                            type="number"
                            value={student.marks?.[field.key] ?? ""}
                            min={0}
                            max={Number(field.max_marks) || undefined}
                            step="0.01"
                            onChange={(e) => onFormMarkChange?.(student, field, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        ) : editableFormMarks && field.type === "boolean" ? (
                          <input
                            type="checkbox"
                            checked={Boolean(student.marks?.[field.key])}
                            onChange={(e) => onFormMarkChange?.(student, field, e.target.checked)}
                            className="w-4 h-4 accent-purple-600"
                          />
                        ) : editableFormMarks ? (
                          <input
                            type="text"
                            value={student.marks?.[field.key] ?? ""}
                            onChange={(e) => onFormMarkChange?.(student, field, e.target.value)}
                            className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        ) : field.type === "boolean" ? (
                          <input
                            type="checkbox"
                            checked={Boolean(student.marks?.[field.key])}
                            readOnly
                            className="w-4 h-4 accent-purple-600"
                          />
                        ) : (
                          renderCellValue(student.marks?.[field.key])
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-sm text-center font-bold text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.total ?? totalMarks)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.external_name)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {renderCellValue(student.feedback)}
                    </td>
                    {showDelete && (
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteGroup?.(student.group_id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-semibold"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </td>
                    )}
                    {editableFormMarks && (
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSaveFormRow?.(student)}
                          disabled={savingRowKey === `${student.submission_id}:${student.enrollment_no || student.enrollement_no || ""}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {savingRowKey === `${student.submission_id}:${student.enrollment_no || student.enrollement_no || ""}` ? "Saving..." : "Save"}
                        </button>
                      </td>
                    )}
                  </>
                ) : isZeroReview ? (
                  <>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.m1)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.m2)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.m3)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.m4)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.m5)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center font-bold text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.guide)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.external)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center border-r border-gray-200">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        student.remark ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {student.remark ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {student.file_url ? (
                        <button
                          onClick={() => handleViewDocument(student.file_url)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </>
                ) : isReview2 ? (
                  <>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.m1)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.m2)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.m3)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.m4)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.m5)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.m6)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.m7)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center font-bold text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.guide_name)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.ig)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.external1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.external2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.ext1_org)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.ext2_org)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900">
                      {renderCellValue(student.date ? new Date(student.date).toLocaleDateString('en-GB') : '-')}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.A)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.B)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.C)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.D)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.E)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center font-bold text-gray-900 border-r border-gray-200">
                      {renderCellValue(student.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.guide_name)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.externalname)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.crieya)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.patent)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.copyright)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-700 border-r border-gray-200">
                      {renderCellValue(student.aic)}
                    </td>
                    <td className="px-3 py-3 text-sm text-center text-gray-700">
                      {renderCellValue(student.tech_transfer)}
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
