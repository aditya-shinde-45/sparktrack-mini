import React from 'react';

const ProblemPagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
      <p className="text-sm text-gray-600">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
      </p>
      <nav className="pagination">
        <ul className="inline-flex flex-wrap items-center gap-1">
          <li>
            <button
              className="px-3 py-1 border rounded-l bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
          </li>
          {Array.from({ length: totalPages }, (_, i) => {
            if (i === 0 || i === totalPages - 1 || Math.abs(i + 1 - currentPage) <= 1) {
              return (
                <li key={i}>
                  <button
                    onClick={() => onPageChange(i + 1)}
                    className={`px-3 py-1 border ${currentPage === i + 1
                      ? "bg-purple-600 text-white"
                      : "bg-white hover:bg-gray-100 text-gray-600"
                      }`}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            } else if (
              i === 1 && currentPage > 4 ||
              i === totalPages - 2 && currentPage < totalPages - 3
            ) {
              return <li key={`ellipsis-${i}`}><span className="px-3 py-1">...</span></li>;
            }
            return null;
          })}
          <li>
            <button
              className="px-3 py-1 border rounded-r bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default ProblemPagination;