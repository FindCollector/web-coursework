import { message } from 'antd';
import { logout } from '../store/authSlice';
import { store } from '../store';

// Get storage key without page instance ID
const getStorageKey = (key) => {
  return key;
};

// Token validation interval in milliseconds (default: check every 1 minute)
const TOKEN_VALIDATION_INTERVAL = 60 * 1000;

let tokenValidationTimer = null;

/**
 * Send a request to validate the current token
 * @returns {Promise<boolean>} Whether the token is valid
 */
export const validateToken = async () => {
  try {
    const token = localStorage.getItem(getStorageKey('token'));
    
    // If no token exists, return false immediately
    if (!token) {
      return false;
    }
    
    // Send a request to any protected endpoint (using user info as a simple check)
    // Using an actual API endpoint instead of a dedicated validate-token endpoint
    const response = await fetch('http://localhost:8080/auth/user', {
      method: 'GET',
      headers: {
        // Use the standard Bearer scheme and keep the legacy "token" header for backward compatibility
        'Authorization': `Bearer ${token}`,
        'token': token
      }
    });
    
    const data = await response.json();
    
    // Check if token is valid based on response code
    if (response.ok && data.code !== 3000) {
      return true;
    }
    
    // Check explicitly for token expiration error
    if (data.code === 3000 || 
        data.msg === 'Not logged in or login expired' || 
        (data.data && data.data.includes('authentication is required'))) {
      handleTokenExpiration();
      return false;
    }
    
    return true; // For other status codes, don't auto-logout
  } catch (error) {
    // Don't auto-logout on network errors, as it might be temporary
    return true; 
  }
};

/**
 * Handle token expiration by logging out and redirecting
 */
export const handleTokenExpiration = () => {
  // Prevent duplicate handling, use a flag to avoid multiple calls
  if (window.__handlingTokenExpiration) {
    return;
  }
  
  // Set flag to prevent duplicate handling
  window.__handlingTokenExpiration = true;
  
  // Clear local storage
  localStorage.removeItem(getStorageKey('token'));
  localStorage.removeItem(getStorageKey('userType'));
  localStorage.removeItem(getStorageKey('userName'));
  
  // Dispatch logout action to update Redux state
  store.dispatch(logout());
  
  // Show message to user with longer duration and higher prominence
  message.error({
    content: 'Your session has expired. Please login again.',
    duration: 5,
    style: {
      marginTop: '20vh',
      fontSize: '16px',
      fontWeight: 'bold'
    }
  });
  
  // Redirect to login page with delay to ensure message is seen
  setTimeout(() => {
    window.location.href = '/login';
    // Reset handling flag after redirect completes
    setTimeout(() => {
      window.__handlingTokenExpiration = false;
    }, 1000);
  }, 2000);
};

/**
 * Start periodic token validation
 */
export const startTokenValidation = () => {
  // Clear any existing timer
  if (tokenValidationTimer) {
    clearInterval(tokenValidationTimer);
  }
  
  // Set up periodic validation
  tokenValidationTimer = setInterval(async () => {
    // Only run validation if token exists
    const token = localStorage.getItem(getStorageKey('token'));
    if (token) {
      await validateToken();
    }
  }, TOKEN_VALIDATION_INTERVAL);
  
  return tokenValidationTimer;
};

/**
 * Stop periodic token validation
 */
export const stopTokenValidation = () => {
  if (tokenValidationTimer) {
    clearInterval(tokenValidationTimer);
    tokenValidationTimer = null;
  }
}; 