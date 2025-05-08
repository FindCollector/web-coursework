/**
 * Debug Helper Tools
 * Used for debugging API requests and responses
 */

// Get storage key without adding instance ID suffix
const getStorageKey = (key) => {
  // Use simple key names without appending instance ID
  return key;
};

// Monitor network requests
export const setupNetworkMonitoring = () => {
  if (process.env.NODE_ENV !== 'production') {
    // Create an XHR listener to record all XHR requests
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function() {
      this.addEventListener('load', function() {
        const url = this._url;
        
        try {
          const response = JSON.parse(this.responseText);
          // Network monitoring handled silently in production
        } catch (e) {
          // Non-JSON response, silently handled
        }
      });
      
      this._method = arguments[0];
      this._url = arguments[1];
      originalXHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
      // Request sending handled silently
      
      originalXHRSend.apply(this, arguments);
    };
    
    // Monitor Fetch requests
    const originalFetch = window.fetch;
    
    window.fetch = function() {
      const url = arguments[0];
      const options = arguments[1] || {};
      
      // Fetch request monitoring handled silently
      
      return originalFetch.apply(this, arguments)
        .then(response => {
          // Clone response, because response.json() can only be called once
          const clone = response.clone();
          
          clone.json().then(data => {
            // Response monitoring handled silently
          }).catch(() => {
            // Non-JSON response, ignore
          });
          
          return response;
        });
    };
    
    // Network monitoring enabled silently
  }
}

// Print authentication state
export const logAuthState = () => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  const getStorageKey = (key) => {
    // Use simple key names without appending instance ID
    return key;
  };
  
  // Authentication state handled silently
}

// Add debug styles to page
export const addDebugStyles = () => {
  if (process.env.NODE_ENV !== 'production') {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Border debug helper */
      .debug-borders * {
        outline: 1px solid rgba(255, 0, 0, 0.2);
      }
      
      /* API error indicator */
      .api-error-indicator {
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: red;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);
    
    // Debug styles added silently
  }
}

// Expose API test functions
export const exposeApiTestFunctions = () => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  const getStorageKey = (key) => {
    // Use simple key names without appending instance ID
    return key;
  };
  
  // Create global test object
  window.testAuth = {
    // Login test
    login: async (email = 'admin@example.com', password = 'password123') => {
      try {
        // Test login silently
        
        const response = await fetch('http://localhost:8080/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.code === 0 && data.data?.userInfo?.token) {
          localStorage.setItem(getStorageKey('token'), data.data.userInfo.token);
          return { success: true, data };
        } else {
          return { success: false, error: data.msg || 'Login failed', data };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    
    // Check authentication status
    checkAuth: () => {
      const token = localStorage.getItem(getStorageKey('token'));
      return !!token;
    },
    
    // Logout
    logout: () => {
      localStorage.removeItem(getStorageKey('token'));
      return true;
    }
  };
  
  // API test functions exposed silently
}; 