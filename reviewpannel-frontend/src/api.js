// src/utils/api.js
const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_API_BASE_URL
    : import.meta.env.VITE_API_BASE_URL_PROD;

// Import jwtDecode for token validation
import { jwtDecode } from 'jwt-decode';

// Function to check if a token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    if (!decoded.exp) {
      console.warn('Token has no expiration');
      return false;
    }
    
    const isExpired = decoded.exp < currentTime;
    if (isExpired) {
      console.warn('Token expired at:', new Date(decoded.exp * 1000).toLocaleString());
    }
    
    return isExpired;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired on error
  }
};

export const apiRequest = async (endpoint, method = "GET", body = null, token = null, isFormData = false) => {
  // Skip authentication check for login and public endpoints
  const isAuthEndpoint = endpoint.includes('/login') || endpoint.includes('/register') || endpoint.includes('/forgot-password');
  const isDashboardEndpoint = endpoint.includes('/dashboard');
  
  const headers = {};
  
  // Only set Content-Type for JSON, let browser set it for FormData
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Use token from parameter first, then try localStorage
  if (!token) {
    token = localStorage.getItem('token') || localStorage.getItem('student_token');
  }
  
  // Don't check token for auth endpoints
  if (!isAuthEndpoint && token) {
    try {
      // Check if token is expired before using it
      if (isTokenExpired(token)) {
        console.warn('Token is expired, clearing authentication data');
        // Perform a full logout
        localStorage.removeItem('token');
        localStorage.removeItem('student_token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        localStorage.removeItem('id');
        localStorage.removeItem('groups');
        localStorage.removeItem('isAuthenticated');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          console.log('Redirecting to login due to expired token');
          window.location.href = '/login';
          return { success: false, message: 'Authentication expired. Please log in again.' };
        }
        
        // Don't use the expired token
        token = null;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      // Continue with request, server will reject if token is invalid
    }
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log(`API Request: ${method} ${endpoint} with token ${token.substring(0, 15)}...`);
  } else if (!isAuthEndpoint) {
    console.warn(`API Request: ${method} ${endpoint} with NO TOKEN`);
  }
  
  // For dashboard endpoint, add special handling in development
  if (isDashboardEndpoint && import.meta.env.MODE === 'development') {
    console.log('Using special dashboard handling in development mode');
  }

  const options = { method, headers };
  if (body) {
    // If it's FormData, send it directly without JSON.stringify
    options.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);

    let data = null;
    try {
      data = await res.json();
    } catch (parseError) {
      data = {};
    }

  if (!res.ok || data.success === false) {
      // Log the error for debugging
      console.error(`API Error (${res.status}):`, data, 'Endpoint:', endpoint);
      
      // Handle 401 Unauthorized errors
      if (res.status === 401) {
        console.warn(`401 Unauthorized for endpoint: ${endpoint}`);
        
        // Special handling for auth validation endpoints
        if (endpoint.includes('/validate') || endpoint.includes('/auth/me')) {
          console.log("Not redirecting for validation endpoint");
          return {
            success: false,
            status: res.status,
            message: data?.message || "Invalid token",
            error: data?.error || null,
          };
        }
        
        // If we're not on a login-related page, clear tokens
        if (!endpoint.includes('/login') && !endpoint.includes('/forgot-password')) {
          console.log("Clearing tokens due to 401");
          
          // Clear all auth-related data
          localStorage.removeItem('token');
          localStorage.removeItem('student_token');
          localStorage.removeItem('role');
          localStorage.removeItem('name');
          localStorage.removeItem('id');
          localStorage.removeItem('groups');
          
          // Don't redirect if we're already on the login page
          if (!window.location.pathname.includes('/login')) {
            console.log("Redirecting to login page due to 401");
            window.location.href = '/login';
          } else {
            console.log("Already on login page, not redirecting");
          }
        }
      }
      
      // Return error response
      return {
        success: false,
        status: res.status,
        message: data?.message || "API request failed",
        error: data?.error || null,
      };
    }

    if (data?.success) {
      const payload = data?.data;
      const baseResponse = {
        success: true,
        message: data.message || 'Success',
      };

      if (payload === undefined || payload === null) {
        return { ...baseResponse, data: null };
      }

      if (Array.isArray(payload)) {
        return { ...baseResponse, data: payload };
      }

      if (typeof payload === 'object') {
        return { ...payload, ...baseResponse, data: payload };
      }

      return { ...baseResponse, data: payload };
    }

    return data;
  } catch (error) {
    console.error("API Error:", error.message);
    
    // Network errors (like when the backend is not running)
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.warn('Backend server may be offline or unreachable');
      
      // For development: return mock success response
      if (endpoint === '/api/auth/validate' || endpoint === '/api/auth/me') {
        console.log('Returning mock success for auth endpoint during development');
        return {
          success: true,
          message: 'Mock response (backend offline)',
          mockData: true
        };
      }
      
      // For dashboard endpoint: return mock dashboard data
      if (endpoint === '/api/admin/dashboard' && import.meta.env.MODE === 'development') {
        console.log('Returning mock data for dashboard endpoint during development');
        return {
          success: true,
          message: 'Mock dashboard data (backend offline)',
          data: {
            counts: {
              students: 120,
              groups: 24,
              mentors: 15,
              externals: 8
            },
            charts: {
              attendance: [
                { name: "Present", value: 85 },
                { name: "Absent", value: 15 }
              ],
              approvals: {
                projects: [
                  { name: "Approved", value: 18 },
                  { name: "Pending", value: 6 }
                ],
                mentors: [
                  { name: "Active", value: 12 },
                  { name: "Inactive", value: 3 }
                ]
              }
            }
          }
        };
      }
    }
    
    return {
      success: false,
      message: error.message || "Network error",
    };
  }
};

/**
 * Upload file to API endpoint
 * @param {string} endpoint - API endpoint
 * @param {FormData} formData - FormData object containing the file
 * @param {string} token - Optional authentication token
 */
export const uploadFile = async (endpoint, formData, token = null) => {
  // Use token from parameter first, then try localStorage
  if (!token) {
    token = localStorage.getItem('token') || localStorage.getItem('student_token');
  }

  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log(`File Upload: POST ${endpoint} with token ${token.substring(0, 15)}...`);
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    let data = null;
    try {
      data = await res.json();
    } catch (parseError) {
      data = {};
    }

    if (!res.ok || data.success === false) {
      console.error(`Upload Error (${res.status}):`, data, 'Endpoint:', endpoint);
      
      if (res.status === 401) {
        console.warn(`401 Unauthorized for upload endpoint: ${endpoint}`);
        localStorage.removeItem('token');
        localStorage.removeItem('student_token');
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      return {
        success: false,
        status: res.status,
        message: data?.message || "Upload failed",
        error: data?.error || null,
      };
    }

    return {
      success: true,
      message: data.message || 'Upload successful',
      data: data.data || data,
    };
  } catch (error) {
    console.error("Upload Error:", error.message);
    return {
      success: false,
      message: error.message || "Network error during upload",
    };
  }
};
