import React from "react";

const MarksTable = () => {
  const rows = [
    {
      groupId: "TYAIA101",
      enroll: "ADT24SOCBD001",
      name: "Aditya Krishnat Shinde",
      marks: [10, 9, 10, 9, 10],
      total: 48,
      guide: "Prof Suresh Kapre",
      external: "Dr Vivek Swami"
    },
    {
      groupId: "TYAIA101",
      enroll: "ADT24SOCBD002",
      name: "Sneha Patil",
      marks: [9, 9, 10, 10, 9],
      total: 47,
      guide: "Prof Suresh Kapre",
      external: "Dr Vivek Swami"
    },
    {
      groupId: "TYAIA102",
      enroll: "ADT24SOCBD003",
      name: "Rohan Kulkarni",
      marks: [8, 9, 9, 10, 9],
      total: 45,
      guide: "Prof Meera Joshi",
      external: "Dr Sunil Pawar"
    },
    {
      groupId: "TYAIA102",
      enroll: "ADT24SOCBD004",
      name: "Priya Deshmukh",
      marks: [10, 10, 10, 10, 10],
      total: 50,
      guide: "Prof Meera Joshi",
      external: "Dr Sunil Pawar"
    },
    {
      groupId: "TYAIA103",
      enroll: "ADT24SOCBD005",
      name: "Amit Jadhav",
      marks: [9, 8, 9, 9, 10],
      total: 45,
      guide: "Prof Neha Kulkarni",
      external: "Dr Ashok Patil"
    },
    {
      groupId: "TYAIA103",
      enroll: "ADT24SOCBD006",
      name: "Kavita Chavan",
      marks: [10, 9, 10, 8, 9],
      total: 46,
      guide: "Prof Neha Kulkarni",
      external: "Dr Ashok Patil"
    },
    {
      groupId: "TYAIA104",
      enroll: "ADT24SOCBD007",
      name: "Siddharth More",
      marks: [8, 9, 8, 10, 9],
      total: 44,
      guide: "Prof Anil Shinde",
      external: "Dr Rekha Patil"
    },
    {
      groupId: "TYAIA104",
      enroll: "ADT24SOCBD008",
      name: "Manisha Pawar",
      marks: [9, 9, 9, 9, 9],
      total: 45,
      guide: "Prof Anil Shinde",
      external: "Dr Rekha Patil"
    },
    {
      groupId: "TYAIA105",
      enroll: "ADT24SOCBD009",
      name: "Rahul Desai",
      marks: [10, 10, 9, 10, 9],
      total: 48,
      guide: "Prof Kavita Patil",
      external: "Dr Nilesh Jadhav"
    },
    {
      groupId: "TYAIA105",
      enroll: "ADT24SOCBD010",
      name: "Pooja Shinde",
      marks: [9, 8, 10, 9, 10],
      total: 46,
      guide: "Prof Kavita Patil",
      external: "Dr Nilesh Jadhav"
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Group Id</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment No</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name Of Student</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">A</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">B</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">C</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">E</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Guide Name</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">External</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.groupId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.enroll}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.name}</td>
                {row.marks.map((mark, i) => (
                  <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mark}</td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.total}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.guide}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.external}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarksTable;
