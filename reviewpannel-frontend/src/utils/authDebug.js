import { jwtDecode } from 'jwt-decode';

/**
 * Debug utility to help diagnose authentication issues
 * Run this from browser console: authDebug.checkAuthState()
 */
export const authDebug = {
  /**
   * Get detailed information about the current authentication state
   */
  checkAuthState() {
    console.group('%c Authentication Debug', 'color: blue; font-weight: bold');
    
    // Check localStorage for token and role
    const token = localStorage.getItem('token') || localStorage.getItem('student_token');
    const role = localStorage.getItem('role');
    
    console.log('Current path:', window.location.pathname);
    console.log('Token exists:', !!token);
    console.log('Role:', role);
    
    if (token) {
      try {
        // Decode token to see content
        const decoded = jwtDecode(token);
        
        // Calculate if token is expired
        const currentTime = Date.now() / 1000;
        const isExpired = decoded.exp && decoded.exp < currentTime;
        
        console.log('Token decoded:', decoded);
        console.log('Token issued at:', new Date(decoded.iat * 1000).toLocaleString());
        console.log('Token expires at:', new Date(decoded.exp * 1000).toLocaleString());
        console.log('Is token expired?', isExpired);
        console.log('Role in token:', decoded.role);
        
        // Check if role in localStorage matches role in token
        if (role && decoded.role && role.toLowerCase() !== decoded.role.toLowerCase()) {
          console.warn('%c Role mismatch: localStorage has "' + role + '" but token has "' + decoded.role + '"', 'color: red');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    } else {
      console.warn('%c No authentication token found', 'color: orange');
    }
    
    // List all localStorage items
    console.log('All localStorage items:');
    Object.keys(localStorage).forEach(key => {
      console.log(`- ${key}: ${key === 'token' ? '***REDACTED***' : localStorage.getItem(key)}`);
    });
    
    console.groupEnd();
    
    return {
      token: !!token,
      role: role,
      path: window.location.pathname,
    };
  },
  
  /**
   * Force clear all authentication data
   */
  clearAllAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('student_token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('id');
    localStorage.removeItem('groups');
    localStorage.removeItem('isAuthenticated');
    
    console.log('%c Auth data cleared', 'color: orange');
    return true;
  }
};

// Make it available globally in dev mode
if (import.meta.env.MODE === 'development') {
  window.authDebug = authDebug;
}

export default authDebug;