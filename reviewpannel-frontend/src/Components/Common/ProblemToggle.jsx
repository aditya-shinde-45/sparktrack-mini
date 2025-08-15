import React from 'react';

const ProblemToggle = ({ isSIH, onToggle, onDownload }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <label className="custom-toggle-container relative">
        <input
          type="checkbox"
          checked={!isSIH}
          onChange={onToggle}
          className="sr-only"
        />
        <div className="custom-toggle-slider"></div>
        <div className={`custom-toggle-option ${isSIH ? 'active' : ''}`}>SIH Problems</div>
        <div className={`custom-toggle-option ${!isSIH ? 'active' : ''}`}>Others</div>
      </label>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
        <button
          onClick={onDownload}
          className="custom-btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <span className="material-icons">download</span>
          <span className="text-sm font-medium">Download Problem Statements</span>
        </button>
      </div>
    </div>
  );
};

export default ProblemToggle;