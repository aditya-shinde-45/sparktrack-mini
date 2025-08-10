import React from "react";

const Pagination = () => {
  return (
    <div className="flex justify-center items-center p-4 border-t border-gray-200">
      <nav className="flex space-x-2">
        <button className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#975BFF] to-[#7B74EF] text-white text-xs md:text-sm hover:opacity-90">Prev</button>
        {[1, 2, 3].map((num) => (
          <button key={num} className="px-3 py-1 rounded-lg bg-white border border-gray-300 text-xs md:text-sm">{num}</button>
        ))}
        <button className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#975BFF] to-[#7B74EF] text-white text-xs md:text-sm hover:opacity-90">Next</button>
      </nav>
    </div>
  );
};

export default Pagination;
