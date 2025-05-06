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
    // 改用实际存在的API端点，而不是专门的validate-token端点
    const response = await fetch('http://localhost:8080/auth/user', {
      method: 'GET',
      headers: {
        // 只传递token字段，去掉Authorization头
        'token': token
      }
    });
    
    const data = await response.json();
    console.log('Token validation response:', data);
    
    // Check if token is valid based on response code
    if (response.ok && data.code !== 3000) {
      return true;
    }
    
    // Check explicitly for token expiration error
    if (data.code === 3000 || 
        data.msg === 'Not logged in or login expired' || 
        (data.data && data.data.includes('authentication is required'))) {
      console.log('Token validation failed - expired token detected');
      handleTokenExpiration();
      return false;
    }
    
    return true; // For other status codes, don't auto-logout
  } catch (error) {
    console.error('Token validation error:', error);
    // Don't auto-logout on network errors, as it might be temporary
    return true; 
  }
};

/**
 * Handle token expiration by logging out and redirecting
 */
export const handleTokenExpiration = () => {
  // 防止重复处理，使用标记避免多次调用
  if (window.__handlingTokenExpiration) {
    return;
  }
  
  // 设置标记，防止重复处理
  window.__handlingTokenExpiration = true;
  
  console.log('Handling token expiration - logging out user');
  
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
      console.log('Performing periodic token validation');
      await validateToken();
    }
  }, TOKEN_VALIDATION_INTERVAL);
  
  console.log('Token validation service started, interval:', TOKEN_VALIDATION_INTERVAL, 'ms');
  return tokenValidationTimer;
};

/**
 * Stop periodic token validation
 */
export const stopTokenValidation = () => {
  if (tokenValidationTimer) {
    clearInterval(tokenValidationTimer);
    tokenValidationTimer = null;
    console.log('Token validation service stopped');
  }
}; 