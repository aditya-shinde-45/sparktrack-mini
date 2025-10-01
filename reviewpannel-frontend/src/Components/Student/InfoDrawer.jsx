import React from "react";
import { X } from "lucide-react";

const InfoDrawer = ({ isOpen, onClose, title, message, customContent }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-opacity-30 backdrop-blur-sm z-30"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-lg z-40 transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content area with scrolling */}
        <div className="flex-1 p-6 overflow-y-auto">
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