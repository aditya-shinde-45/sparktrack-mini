import React from "react";

const Sidebar = () => {
  return (
    <aside className="lg:fixed lg:top-[88px] lg:left-6 lg:w-60 bg-gradient-to-r from-[#975BFF] to-[#7B74EF] p-4 rounded-lg shadow-lg flex flex-col lg:h-[calc(100%-6rem)] overflow-hidden mb-4 lg:mb-0">
      <div className="flex lg:flex-col gap-2 lg:space-y-2 pr-1 overflow-y-auto">
        {["Dashboard", "Assigned External", "View Export Marks"].map((item, index) => (
          <button
            key={index}
            className="w-full text-left bg-white/10 text-white py-2 px-3 md:py-3 md:px-4 rounded-lg font-medium text-xs md:text-base hover:bg-white/20 transition"
          >
            {item}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
