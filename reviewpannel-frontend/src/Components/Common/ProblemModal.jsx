import React from 'react';

const ProblemModal = ({ problem, onClose }) => {
  if (!problem) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[80%] max-w-4xl h-auto relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-2">{problem.title}</h2>
        <p className="mb-4 text-sm text-gray-700">{problem.description}</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-gray-700">Category:</h3>
            <p className="text-gray-600">{problem.category}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Department:</h3>
            <p className="text-gray-600">{problem.department}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Technology:</h3>
            <p className="text-gray-600">{problem.technology_bucket}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Statement ID:</h3>
            <p className="text-gray-600">{problem.statement_id}</p>
          </div>
        </div>
        <div className="text-right">
          <button
            onClick={onClose}
            className="custom-btn-primary px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProblemModal;