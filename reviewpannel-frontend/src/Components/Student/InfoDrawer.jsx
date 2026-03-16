import React from "react";
import { X } from "lucide-react";

const InfoDrawer = ({ isOpen, onClose, title, message, customContent }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:max-w-md lg:max-w-lg bg-white shadow-2xl z-50 transition-transform duration-300 ease-out transform border-l border-purple-100 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-purple-100 bg-gradient-to-r from-purple-600 to-purple-700">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-purple-200">Student Insights</p>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition rounded-full p-2 hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content area with scrolling */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gradient-to-b from-white to-purple-50/30">
          {customContent ? (
            // Render custom React component if provided
            customContent
          ) : (
            // Otherwise render HTML message
            <div
              className="text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: message }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default InfoDrawer;