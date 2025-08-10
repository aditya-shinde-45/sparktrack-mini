import React from "react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import SearchFilters from "../../Components/Admin/SearchFilters";
import MarksTable from "../../Components/Admin/MarksTable";
import Pagination from "../../Components/Admin/Pagination";

const ViewMarks = () => {
  return (
    <div className="font-sans bg-gray-50">
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[60px]">
          <Sidebar />
          <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 space-y-6 mt-16">
            <SearchFilters />
            <MarksTable />
            <Pagination />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ViewMarks;
