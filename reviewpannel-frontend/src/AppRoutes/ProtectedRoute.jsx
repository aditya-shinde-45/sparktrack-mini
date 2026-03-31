import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { apiRequest } from '../api';

const ADMIN_SCOPE = {
  ANY: 'any',
  MAIN: 'main',
  SUB: 'sub'
};

const getLoginRedirectPath = (allowedRoles = []) => {
  const normalizedAllowedRoles = allowedRoles.map(role => String(role).toLowerCase());
  if (normalizedAllowedRoles.length > 0 && normalizedAllowedRoles.every(role => role === 'student')) {
    return '/studentlogin';
  }
  return '/pblmanagementfacultydashboardlogin';
};

const ProtectedRoute = ({ children, allowedRoles = [], adminScope = ADMIN_SCOPE.ANY }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [decodedToken, setDecodedToken] = useState(null);
  const token = localStorage.getItem('token') || localStorage.getItem('student_token');
  const userRole = localStorage.getItem('role');

  useEffect(() => {
    // Special dev bypass for easier testing - DO NOT USE IN PRODUCTION
    const devMode = import.meta.env.MODE === 'development' && false; // Set to true to bypass auth in dev
    const isDev = import.meta.env.MODE === 'development';
    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    const validateToken = async () => {
      if (!token) {
        console.warn("No token found in localStorage");
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      // Dev bypass for testing
      if (devMode) {
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
            
            // Store role from token if not already in localStorage
            if (!localStorage.getItem('role') && decoded.role) {
              localStorage.setItem('role', decoded.role);
            }

            if (String(decoded.role || '').toLowerCase() === 'admin') {
              const isMainAdminFromToken = !Boolean(decoded.isRoleBased);
              localStorage.setItem('isMainAdmin', isMainAdminFromToken ? 'true' : 'false');
            }
          }
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
          isValid = false;
        }
        
        // Set initial authentication state based on client-side validation
        setIsAuthenticated(isValid);
        setDecodedToken(isValid ? decoded : null);
        
        // Then validate with server if possible (skip for reviewerAdmin as it has separate auth)
        if (isValid && decoded && decoded.role !== 'reviewerAdmin') {
          try {
            const result = await apiRequest('/api/auth/validate', 'POST', { token });
            
            if (!result || result.success === false) {
              // Fail closed for protected routes if validation endpoint rejects the token.
              // Allow dev localhost to proceed to avoid blocking local testing on transient API issues.
              if (isDev && isLocalHost) {
                console.warn('Validation failed in dev localhost; proceeding with client-side token.');
                setIsAuthenticated(true);
              } else {
                console.warn('Server rejected token during validation');
                setIsAuthenticated(false);
                setDecodedToken(null);
              }
            } else {
              // Token passed both client-side and server-side validation.
              setIsAuthenticated(true);
            }
          } catch (apiError) {
            // Fail closed on validation errors for protected routes.
            // Allow dev localhost to proceed to avoid blocking local testing on transient API issues.
            console.error('Token validation API error:', apiError);
            if (isDev && isLocalHost) {
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
              setDecodedToken(null);
            }
          }
        } else if (isValid && decoded && decoded.role === 'reviewerAdmin') {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error in token validation:', error);
        setIsAuthenticated(false);
        setDecodedToken(null);
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
    const loginRedirectPath = getLoginRedirectPath(allowedRoles);
    // Clear storage on invalid authentication
    localStorage.removeItem('token');
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('isMainAdmin');
    localStorage.removeItem('name');
    localStorage.removeItem('id');
    localStorage.removeItem('groups');
    return <Navigate to={loginRedirectPath} replace />;
  }

  // Check role permissions
  if (allowedRoles.length > 0) {
    // Get user role from storage, normalize to match roles array case
    let normalizedUserRole = decodedToken?.role || userRole;
    
    // Convert role to proper case for comparison (Admin -> admin)
    if (normalizedUserRole) {
      normalizedUserRole = normalizedUserRole.toLowerCase();
    }
    
    // Create normalized array of allowed roles
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    
    if (!normalizedUserRole || !normalizedAllowedRoles.includes(normalizedUserRole)) {
      console.warn(`Access denied: User role ${userRole} not in allowed roles: ${allowedRoles.join(', ')}`);
      
      // Clear authentication data since role doesn't match allowed roles
      localStorage.removeItem('token');
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_refresh_token');
      localStorage.removeItem('role');
      localStorage.removeItem('isMainAdmin');
      
      return <Navigate to={getLoginRedirectPath(allowedRoles)} replace />;
    }
  }

  const normalizedRoleFromToken = String(decodedToken?.role || userRole || '').toLowerCase();
  const isAdmin = normalizedRoleFromToken === 'admin';
  const isMainAdmin = isAdmin && !Boolean(decodedToken?.isRoleBased);
  const isSubAdmin = isAdmin && Boolean(decodedToken?.isRoleBased);

  if (adminScope === ADMIN_SCOPE.MAIN && !isMainAdmin) {
    return <Navigate to={isSubAdmin ? '/sub-admin-dashboard' : getLoginRedirectPath(allowedRoles)} replace />;
  }

  if (adminScope === ADMIN_SCOPE.SUB && !isSubAdmin) {
    return <Navigate to={isMainAdmin ? '/admin-dashboard' : getLoginRedirectPath(allowedRoles)} replace />;
  }

  // If we get here, the user is authenticated and authorized
  return children;
};

export default ProtectedRoute;