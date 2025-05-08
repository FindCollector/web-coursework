import { message } from 'antd';

/**
 * Get redirect path based on user type
 * @param {string} userType - User type parsed from login response message
 * @returns {string} Redirect path
 */
export const getRedirectPath = (userType) => {
  switch (userType) {
    case 'admin':
      return '/admin/dashboard';
    case 'member':
      return '/member/dashboard';
    case 'coach':
      return '/coach/dashboard';
    default:
      return '/';
  }
};

/**
 * Check if user is authenticated based on localStorage token
 * @returns {boolean} User authentication status
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Alias for isAuthenticated to resolve import error in Login.jsx
export const isUserAuthenticated = isAuthenticated;

/**
 * Get user type from localStorage
 * @returns {string|null} User type or null if not found
 */
export const getUserType = () => {
  return localStorage.getItem('userType');
};

/**
 * Check if the current route is accessible for the user's role
 * @param {string} path - Current route path
 * @returns {boolean} Whether the route is accessible
 */
export const isRouteAccessible = (path) => {
  const userType = getUserType();
  
  // Public routes accessible to anyone
  if (path === '/login' || path === '/register' || path === '/verify-code' || path === '/' || path.startsWith('/reset-password')) {
    return true;
  }
  
  // Check authentication
  if (!isAuthenticated()) {
    return false;
  }
  
  // Role-based route check
  if (path.startsWith('/member') && userType === 'member') {
    return true;
  }
  
  if (path.startsWith('/coach') && userType === 'coach') {
    return true;
  }
  
  if (path.startsWith('/admin') && userType === 'admin') {
    return true;
  }
  
  // Access denied for this role
  return false;
};

/**
 * Handle unauthorized access by redirecting and showing a message
 * @param {string} path - Attempted path
 */
export const handleUnauthorizedAccess = (path) => {
  message.error('You do not have permission to access this page');
  
  // Redirect based on user type or to login if not authenticated
  const userType = getUserType();
  
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return;
  }
  
  // Redirect to appropriate dashboard based on role
  if (userType === 'member') {
    window.location.href = '/member/dashboard';
  } else if (userType === 'coach') {
    window.location.href = '/coach/dashboard';
  } else if (userType === 'admin') {
    window.location.href = '/admin/dashboard';
  } else {
    window.location.href = '/login';
  }
};

/**
 * Extract user type from login response data
 * @param {object} data - Login response data
 * @returns {string} User type
 */
export const getUserTypeFromData = (data) => {
  // 适应新的数据结构，从userInfo中获取role
  if (data && data.userInfo && data.userInfo.role) {
    return data.userInfo.role;
  }
  
  // 兼容旧版数据结构
  return data?.role || 'member';
}; 