import React from 'react';
import { Zap, Sparkles } from 'lucide-react';

const Loading = ({ message = "Loading...", fullScreen = true }) => {
  const containerClass = fullScreen 
    ? "fixed inset-0 bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center z-50"
    : "flex items-center justify-center py-12";

  return (
    <div className={containerClass}>
      {/* Background blur overlay */}
      <div className="absolute inset-0 backdrop-blur-md bg-white/30"></div>
      
      <div className="flex flex-col items-center gap-6 relative z-10">
        {/* Animated Thunder */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Glowing background pulse */}
          <div className="absolute inset-8 bg-gradient-to-br from-purple-500/20 via-purple-600/20 to-indigo-600/20 rounded-full blur-3xl animate-[glow_2s_ease-in-out_infinite]"></div>
          
          {/* Center Thunder Icon */}
          <div className="relative z-10">
            <div className="relative">
              {/* Thunder glow effect */}
              <div className="absolute inset-0 blur-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 opacity-50 animate-pulse"></div>
              {/* Main thunder icon */}
              <Zap 
                className="relative w-20 h-20 text-purple-600 drop-shadow-[0_0_20px_rgba(139,92,246,0.9)]" 
                strokeWidth={1.5} 
                fill="currentColor"
              />
            </div>
          </div>
        </div>

        {/* SparkTrack Text with gradient */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 bg-clip-text text-transparent animate-pulse">
            SparkTrack
          </h2>
          
          {/* Loading message with dots animation */}
          <div className="flex items-center justify-center gap-1">
            <p className="text-gray-700 font-medium">{message}</p>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

// Alternative minimal spinner
export const LoadingSpinner = ({ size = "md", color = "purple" }) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  const colorClasses = {
    purple: "border-purple-600 border-t-transparent",
    blue: "border-blue-600 border-t-transparent",
    green: "border-green-600 border-t-transparent"
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`}></div>
  );
};

// Inline loading for buttons
export const ButtonLoading = () => (
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    <span>Loading...</span>
  </div>
);

export default Loading;
