import React from 'react';
import homebanner from '../../assets/homebanner.png';

const HeroSection = () => {
  return (
    <header className="hero-section bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-br-[80px] py-20 lg:py-24 px-6" style={{fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'}}>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between">
        <div className="lg:w-1/2 text-center lg:text-left">
          <p className="text-lg font-semibold uppercase tracking-wider mb-2">MIT ADT UNIVERSITY</p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">PBL Management System</h1>
        </div>
        <div className="lg:w-1/2 mt-12 lg:mt-0 flex justify-center">
          <img className="w-64 h-auto" src={homebanner} alt="PBL Management" />
        </div>
      </div>
    </header>
  );
};

export default HeroSection;