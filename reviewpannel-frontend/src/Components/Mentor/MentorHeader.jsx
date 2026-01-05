import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';

const MentorHeader = ({ name, id }) => {
  return (
    <header className="font-[Poppins] fixed top-0 left-0 w-full bg-gradient-to-r from-[#7B74EF] to-[#5D3FD3] text-white p-3 md:p-4 shadow-lg z-50 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-purple-700 font-bold text-base">
          {name?.charAt(0) || 'M'}
        </div>
        <div>
          <h1 className="text-base md:text-lg font-bold">{name || 'Mentor'}</h1>
          <p className="text-xs text-purple-100">ID: {id || '----'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 hover:bg-white/20 rounded-full transition">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="hidden md:flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition">
          <span className="text-sm">Profile</span>
          <ChevronDown size={14} />
        </button>
      </div>
    </header>
  );
};

export default MentorHeader;
