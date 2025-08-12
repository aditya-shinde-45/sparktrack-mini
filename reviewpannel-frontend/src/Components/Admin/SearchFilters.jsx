import React, { useState } from "react";

const SearchFilters = () => {
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");

  // Example data for export — you can replace this with your actual filtered marks data
  const exampleData = [
    { name: "Aditya Shinde", year: "2024", class: "A", total: 48 },
    { name: "Sneha Patil", year: "2024", class: "A", total: 47 },
    { name: "Rohan Kulkarni", year: "2023", class: "B", total: 45 },
  ];

  const handleExportCSV = () => {
    if (!year) {
      alert("Please select a year before exporting.");
      return;
    }

    const filteredData = exampleData.filter((row) => row.year === year);

    if (filteredData.length === 0) {
      alert("No data found for selected year.");
      return;
    }

    const csvRows = [];
    const headers = Object.keys(filteredData[0]);
    csvRows.push(headers.join(","));

    filteredData.forEach((row) => {
      csvRows.push(Object.values(row).join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `marks_${year}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="mb-6 flex flex-wrap gap-4">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
        placeholder="Search"
        type="text"
      />
      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
      >
        <option value="">Select Year</option>
        <option value="2025">2025</option>
        <option value="2024">2024</option>
        <option value="2023">2023</option>
      </select>
      <select
        value={className}
        onChange={(e) => setClassName(e.target.value)}
        className="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
      >
        <option value="">Select Class</option>
        <option value="A">A</option>
        <option value="B">B</option>
      </select>
      <button
        onClick={handleExportCSV}
        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
      >
        Export CSV
      </button>
    </div>
  );
};

export default SearchFilters;
