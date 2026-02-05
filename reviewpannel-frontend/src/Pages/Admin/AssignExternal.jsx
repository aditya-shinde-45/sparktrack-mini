import React, { useState } from "react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/Admin/Sidebar";
import AssignedExternalTable from "../../Components/Admin/AssignedExternalTable";

const AssignExternal = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-3 md:p-6 bg-white lg:ml-72 mb-16 lg:mb-0 space-y-6 mt-20">

          <AssignedExternalTable />
        </main>
      </div>
    </div>
  );
};

export default AssignExternal;
