import React from "react";

const Pagination = () => {
  return (
    <div className="px-6 py-4 flex justify-end items-center">
      <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
        <a className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-purple-600 text-sm font-medium text-white hover:bg-purple-700" href="#">Prev</a>
        <a className="bg-purple-600 border-gray-300 text-white relative inline-flex items-center px-4 py-2 border text-sm font-medium" href="#">1</a>
        <a className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium" href="#">2</a>
        <a className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium" href="#">3</a>
        <a className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50" href="#">Next</a>
      </nav>
    </div>
  );
};

export default Pagination;
