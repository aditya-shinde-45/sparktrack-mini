import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Import auth debugger in development mode
import './utils/authDebug.js'

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // You could display a user-friendly error message here
  // or log to a service like Sentry
});

// Fallback element in case the app fails to load
const FallbackErrorComponent = () => (
  <div style={{ 
    padding: '2rem', 
    textAlign: 'center',
    fontFamily: 'system-ui, sans-serif',
    maxWidth: '600px',
    margin: '5rem auto'
  }}>
    <h1 style={{ color: '#5D3FD3' }}>Sparktrack</h1>
    <p>There was a problem loading the application.</p>
    <p>Please refresh the page or try again later.</p>
    <button 
      onClick={() => window.location.reload()}
      style={{
        background: '#5D3FD3',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        marginTop: '1rem'
      }}
    >
      Refresh Page
    </button>
  </div>
);

// Render with error boundary
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render application:', error);
  
  // Render fallback UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const fallbackRoot = createRoot(rootElement);
    fallbackRoot.render(<FallbackErrorComponent />);
  }
}
