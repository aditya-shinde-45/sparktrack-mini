
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import './index.css';
import './App.css'

import AppRoutes from './AppRoutes/approutes'; 

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-mono break-all">{error.message || 'Unknown error'}</p>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-[#5D3FD3] text-white py-2 px-4 rounded-md hover:bg-[#4C1D95] transition-colors"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full mt-2 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors"
        >
          Go to homepage
        </button>
      </div>
    </div>
  );
};

// Import auth debugger in development mode
import { authDebug } from './utils/authDebug.js';

function App() {
  React.useEffect(() => {
    // Run auth check on app initialization
    if (import.meta.env.MODE === 'development') {
      console.log('App initialization - Auth check:');
      authDebug.checkAuthState();
    }
  }, []);
  
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Router>
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
}

export default App;