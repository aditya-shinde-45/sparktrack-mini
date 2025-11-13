import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { apiRequest } from '../api';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const token = localStorage.getItem('token') || localStorage.getItem('student_token');
  const userRole = localStorage.getItem('role');

  useEffect(() => {
    // Special dev bypass for easier testing - DO NOT USE IN PRODUCTION
    const devMode = import.meta.env.MODE === 'development' && false; // Set to true to bypass auth in dev
    
    const validateToken = async () => {
      // Log initial check state
      console.log(`ProtectedRoute: Checking auth for path ${window.location.pathname}`);
      console.log(`Token exists: ${!!token}, Role: ${userRole}`);
      console.log(`Allowed roles: ${allowedRoles.join(', ')}`);
      
      if (!token) {
        console.warn("No token found in localStorage");
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Dev bypass for testing
      if (devMode) {
        console.warn('DEV MODE: Bypassing token validation');
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }
      
      try {
        // Client-side token validation
        let isValid = false;
        let decoded = null;
        
        try {
          // Decode token to check expiration and role
          decoded = jwtDecode(token);
          console.log("Token decoded:", decoded);
          const currentTime = Date.now() / 1000;
          
          // Check if token has required fields
          if (!decoded.role) {
            console.warn('Token is missing role information');
            isValid = false;
          } else if (decoded.exp && decoded.exp < currentTime) {
            // Check if token is expired
            console.warn('Token is expired', decoded.exp, currentTime);
            isValid = false;
          } else {
            // Token has role and is not expired
            isValid = true;
            console.log("Token is valid, role:", decoded.role);
            
            // Store role from token if not already in localStorage
            if (!localStorage.getItem('role') && decoded.role) {
              console.log("Storing role in localStorage:", decoded.role);
              localStorage.setItem('role', decoded.role);
            }
          }
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
          isValid = false;
        }
        
        // Set initial authentication state based on client-side validation
        setIsAuthenticated(isValid);
        
        // Then validate with server if possible (skip for reviewerAdmin as it has separate auth)
        if (isValid && decoded && decoded.role !== 'reviewerAdmin') {
          try {
            const result = await apiRequest('/api/auth/validate', 'POST', { token });
            
            if (result && result.success === false) {
              console.warn('Server rejected token during validation');
              setIsAuthenticated(false);
            } else {
              console.log("Token validated by server");
              setIsAuthenticated(true);
            }
          } catch (apiError) {
            // Don't fail UI on API errors, but log them
            console.error('Token validation API error:', apiError);
          }
        } else if (isValid && decoded && decoded.role === 'reviewerAdmin') {
          console.log("ReviewerAdmin token - skipping server validation");
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error in token validation:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5D3FD3]"></div>
      </div>
    );
  }

  // Redirect if no token or token is invalid
  if (!token || !isAuthenticated) {
    // Clear storage on invalid authentication
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('id');
    localStorage.removeItem('groups');
    return <Navigate to="/login" replace />;
  }

  // Check role permissions
  if (allowedRoles.length > 0) {
    // Get user role from storage, normalize to match roles array case
    let normalizedUserRole = userRole;
    
    // Convert role to proper case for comparison (Admin -> admin)
    if (normalizedUserRole) {
      normalizedUserRole = normalizedUserRole.toLowerCase();
    }
    
    // Create normalized array of allowed roles
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    
    console.log(`Role check: User role=${normalizedUserRole}, Allowed roles=${normalizedAllowedRoles.join(', ')}`);
    
    if (!normalizedUserRole || !normalizedAllowedRoles.includes(normalizedUserRole)) {
      console.warn(`Access denied: User role ${userRole} not in allowed roles: ${allowedRoles.join(', ')}`);
      
      // Clear authentication data since role doesn't match allowed roles
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      
      return <Navigate to="/login" replace />;
    } else {
      console.log(`Role authorized: ${normalizedUserRole} is allowed`);
    }
  }

  // If we get here, the user is authenticated and authorized
  return children;
};

export default ProtectedRoute;