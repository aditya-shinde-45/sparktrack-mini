import React from "react";

const StudentTable = () => {
  // Dummy data for 10 groups, each with 4 students
  const groups = Array.from({ length: 10 }, (_, groupIndex) => ({
    groupId: `TY CC ${101 + groupIndex}`,
    guideId: `45637${groupIndex}`,
    guideName: `Prof Guide ${groupIndex + 1}`,
    externalId: `45787${groupIndex}`,
    externalName: `Prof External ${groupIndex + 1}`,
    students: Array.from({ length: 4 }, (_, studentIndex) => ({
      enrollment: `ADT24SOCBD${(groupIndex + 1)
        .toString()
        .padStart(3, "0")}${studentIndex + 1}`,
      name: `Student ${groupIndex + 1}-${studentIndex + 1}`,
      classDiv: `TY - CC ${groupIndex + 1}`,
    })),
  }));

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Group ID",
                "Enrollment No",
                "Name Of Student",
                "Class & Div",
                "Guide ID",
                "Guide Name",
                "External ID",
                "External Name",
              ].map((head, index) => (
                <th
                  key={index}
                  className="p-2 md:p-4 font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {groups.map((group, gIndex) =>
              group.students.map((student, sIndex) => (
                <tr
                  key={`${gIndex}-${sIndex}`}
                  className="hover:bg-gray-50 transition duration-200"
                >
                  {sIndex === 0 && (
                    <td
                      rowSpan={group.students.length}
                      className="p-2 md:p-4 align-middle"
                    >
                      {group.groupId}
                    </td>
                  )}
                  <td className="p-2 md:p-4">{student.enrollment}</td>
                  <td className="p-2 md:p-4">{student.name}</td>
                  <td className="p-2 md:p-4">{student.classDiv}</td>
                  {sIndex === 0 && (
                    <>
                      <td
                        rowSpan={group.students.length}
                        className="p-2 md:p-4 align-middle"
                      >
                        {group.guideId}
                      </td>
                      <td
                        rowSpan={group.students.length}
                        className="p-2 md:p-4 align-middle"
                      >
                        {group.guideName}
                      </td>
                      <td
                        rowSpan={group.students.length}
                        className="p-2 md:p-4 align-middle"
                      >
                        {group.externalId}
                      </td>
                      <td
                        rowSpan={group.students.length}
                        className="p-2 md:p-4 align-middle"
                      >
                        {group.externalName}
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;
