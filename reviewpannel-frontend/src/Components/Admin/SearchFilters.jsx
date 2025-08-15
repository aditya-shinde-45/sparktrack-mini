import React from "react";
import { CSVLink } from "react-csv";

const SearchFilters = ({ filterClass, setFilterClass, searchQuery, setSearchQuery, setCurrentPage, students }) => {

  const headers = [
    "group_id", "enrollement_no", "name_of_student", "class", "email_id", "contact",
    "guide_name", "guide_contact", "A", "B", "C", "D", "E", "total", "feedback"
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-4">
      <input
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setCurrentPage(1);
        }}
        className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
        placeholder="Search by Group ID or Enrollment No"
        type="text"
      />
      <select
        value={filterClass}
        onChange={(e) => setFilterClass(e.target.value)}
        className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
      >
        <option value="TY">Third Year (TY)</option>
        <option value="SY">Second Year (SY)</option>
        <option value="LY">Final Year (LY)</option>
      </select>
      <CSVLink
        data={students}
        headers={headers.map((h) => ({
          label: h.replaceAll("_", " ").toUpperCase(),
          key: h,
        }))}
        filename={`${filterClass}_Marks.csv`}
        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
      >
        Export CSV
      </CSVLink>
    </div>
  );
};

export default SearchFilters;
