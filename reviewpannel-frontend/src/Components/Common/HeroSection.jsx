import React from 'react';
import homebanner from '../../assets/homebanner.png';

const HeroSection = () => {
  return (
    <header className="hero-section relative bg-gradient-to-br from-purple-600 via-indigo-700 to-purple-800 text-white rounded-br-[80px] py-20 lg:py-32 px-6 overflow-hidden" style={{fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'}}>
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between relative z-10">
        <div className="lg:w-1/2 text-center lg:text-left space-y-6 animate-fade-in-up">
          <div className="inline-block">
            <p className="text-sm md:text-base font-bold uppercase tracking-widest mb-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              MIT ADT UNIVERSITY
            </p>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight">
            PBL Management
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-white mt-2">
              System
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-purple-100 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Streamline your Project-Based Learning journey with our comprehensive management platform. 
            Track progress, collaborate seamlessly, and achieve excellence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8">
            <button className="bg-white text-purple-700 font-semibold px-8 py-3 rounded-full hover:bg-purple-50 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
              Get Started
            </button>
            <button className="bg-transparent border-2 border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-white/10 backdrop-blur-sm transition-all duration-300">
              Learn More
            </button>
          </div>
          
          <div className="flex items-center justify-center lg:justify-start gap-8 mt-12 text-sm opacity-90">
            <div className="text-center lg:text-left">
              <p className="text-2xl font-bold">500+</p>
              <p className="text-purple-200">Active Projects</p>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div className="text-center lg:text-left">
              <p className="text-2xl font-bold">1000+</p>
              <p className="text-purple-200">Students</p>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div className="text-center lg:text-left">
              <p className="text-2xl font-bold">50+</p>
              <p className="text-purple-200">Mentors</p>
            </div>
          </div>
        </div>
        
        <div className="lg:w-1/2 mt-12 lg:mt-0 flex justify-center animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full filter blur-3xl opacity-30 animate-pulse"></div>
            <img 
              className="relative w-72 md:w-80 lg:w-96 h-auto transform hover:scale-105 transition-transform duration-500 drop-shadow-2xl" 
              src={homebanner} 
              alt="PBL Management" 
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </header>
  );
};

export default HeroSection;