import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { message } from 'antd';
import { logout } from '../authSlice';

// Get storage key without adding instance ID suffix
const getStorageKey = (key) => {
  // Use simple key names without appending instance ID to ensure token can be found after page refresh
  return key;
};

// Safe method to get values from localStorage
const safeGetItem = (key) => {
  try {
    return localStorage.getItem(getStorageKey(key));
  } catch (error) {
    return null;
  }
};

// Safe method to remove items from localStorage
const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(getStorageKey(key));
  } catch (error) {
    // Error silently handled
  }
};

// Function to handle token expiration
const handleTokenExpiration = (api) => {
  // Prevent duplicate handling, use a flag to avoid multiple calls
  if (window.__handlingTokenExpiration) {
    return;
  }
  
  // Set flag to prevent duplicate handling
  window.__handlingTokenExpiration = true;
  
  // Clear local storage
  safeRemoveItem('token');
  safeRemoveItem('userType');
  safeRemoveItem('userName');
  
  // Trigger Redux logout action
  api.dispatch(logout());
  
  // Display message to user
  message.error({
    content: 'Your session has expired. Please login again.',
    duration: 5,
    style: {
      marginTop: '20vh',
      fontSize: '16px',
      fontWeight: 'bold'
    }
  });
  
  // Redirect to login page
  setTimeout(() => {
    window.location.href = '/login';
    // Reset handling flag
    setTimeout(() => {
      window.__handlingTokenExpiration = false;
    }, 1000);
  }, 2000);
};

// Create a base query
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NODE_ENV === 'production' 
    ? '/' 
    : 'http://localhost:8080',
  prepareHeaders: (headers, { endpoint }) => {
    // Check if this is an endpoint that doesn't need a token
    const noTokenEndpoints = ['login', 'sendVerificationCode', 'verifyCode', 'resendVerificationCode', 'completeProfile', 'linkGoogleAccount'];
    if (noTokenEndpoints.includes(endpoint)) {
      return headers;
    }
    
    // Get token from localStorage (using safe method)
    const token = safeGetItem('token');
    
    // If a token exists, attach it using the standard Bearer scheme
    // and keep the legacy "token" header for backward compatibility
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('token', token);
    }
    return headers;
  },
});

// Create a wrapped baseQuery to handle token expiration
const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  
  // Check for errors
  if (result.error) {
    // Extract data from error
    const errorData = result.error.data;
    
    // Check if it's a token expiration error
    if (errorData) {
      const { code, msg, data } = errorData;
      
      // Extended error code detection, compatible with multiple expiration scenarios
      const isTokenExpired = 
        (code === 3000) || 
        (code === 401) || 
        (msg === 'Not logged in or login expired') ||
        (msg && msg.toLowerCase().includes('token expired')) ||
        (msg && msg.toLowerCase().includes('invalid token')) ||
        (data && typeof data === 'string' && data.includes('authentication is required'));
        
      if (isTokenExpired) {
        // Call local handling function directly
        handleTokenExpiration(api);
      }
    }
  }
  
  return result;
};

// Create base API configuration
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // Common tag types
  tagTypes: ['User', 'Auth', 'Coach', 'MemberSubscriptionRequests', 'MemberUnreadCount'],
  // Endpoints will be defined in specific API slices
  endpoints: () => ({}),
}); 