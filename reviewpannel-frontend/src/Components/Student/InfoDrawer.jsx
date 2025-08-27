import React from "react";

const InfoDrawer = ({ isOpen, onClose, title, message }) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-opacity-30 backdrop-blur-sm z-30"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-lg z-40 transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Allow HTML content */}
          <div
            className="text-gray-600 leading-relaxed text-sm"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </div>
      </div>
    </>
  );
};

export default InfoDrawer;