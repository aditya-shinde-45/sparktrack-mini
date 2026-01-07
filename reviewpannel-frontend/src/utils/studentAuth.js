// Student authentication utility functions
import { apiRequest } from '../api';

/**
 * Logout student and clear all authentication data
 * Calls backend to invalidate refresh token
 */
export const logoutStudent = async () => {
  try {
    const token = localStorage.getItem('student_token');
    
    // Call logout endpoint to invalidate refresh token on backend
    if (token) {
      await apiRequest('/api/student-auth/logout', 'POST', null, token);
    }
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Clear all local storage regardless of API call result
    localStorage.removeItem('token');
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_refresh_token');
    localStorage.removeItem('enrollmentNumber');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('id');
    localStorage.removeItem('groups');
    
    // Redirect to login page
    window.location.href = '/studentlogin';
  }
};

/**
 * Check if student is authenticated
 * @returns {boolean}
 */
export const isStudentAuthenticated = () => {
  const token = localStorage.getItem('student_token');
  const refreshToken = localStorage.getItem('student_refresh_token');
  return !!(token || refreshToken);
};

/**
 * Get student enrollment number from local storage
 * @returns {string|null}
 */
export const getEnrollmentNumber = () => {
  return localStorage.getItem('enrollmentNumber');
};

/**
 * Get student access token
 * @returns {string|null}
 */
export const getStudentToken = () => {
  return localStorage.getItem('student_token');
};

/**
 * Get student refresh token
 * @returns {string|null}
 */
export const getStudentRefreshToken = () => {
  return localStorage.getItem('student_refresh_token');
};
