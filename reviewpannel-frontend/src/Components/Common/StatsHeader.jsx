import React from 'react';

const StatsHeader = ({ hardwareCount, softwareCount }) => {
  return (
    <header className="mb-8">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl shadow-2xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">TOTAL STATEMENTS</h1>
          <p className="opacity-80 mt-2 sm:mt-0">As per available data</p>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="custom-stat-card">
            <div>
              <p className="text-4xl sm:text-5xl font-bold">{hardwareCount}</p>
              <p className="text-base sm:text-lg opacity-90">Hardware</p>
            </div>
            <span className="material-icons text-5xl sm:text-6xl opacity-50">memory</span>
          </div>
          <div className="custom-stat-card">
            <div>
              <p className="text-4xl sm:text-5xl font-bold">{softwareCount}</p>
              <p className="text-base sm:text-lg opacity-90">Software</p>
            </div>
            <span className="material-icons text-5xl sm:text-6xl opacity-50">code</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StatsHeader;