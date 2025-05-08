import { createSlice } from '@reduxjs/toolkit';

// Get storage key with consistent ID from localStorage
const getStorageKey = (key) => {
  // Check if PAGE_INSTANCE_ID exists and is from localStorage (not newly generated)
  // Use simple key names without appending instance ID to ensure finding the same key when refreshing the page
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

// Safe method to set values in localStorage
const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(getStorageKey(key), value);
  } catch (error) {
    // Error silently handled
  }
};

// Safe method to remove values from localStorage
const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(getStorageKey(key));
  } catch (error) {
    // Error silently handled
  }
};

const initialState = {
  token: safeGetItem('token') || null,
  userType: safeGetItem('userType') || null,
  userName: safeGetItem('userName') || 'Admin',
  isAuthenticated: !!safeGetItem('token'),
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.userType = action.payload.userType;
      state.userName = action.payload.userName || 'Admin';
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      
      // Save to localStorage
      safeSetItem('token', action.payload.token);
      safeSetItem('userType', action.payload.userType);
      safeSetItem('userName', action.payload.userName || 'Admin');
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.userType = null;
      state.userName = null;
      state.isAuthenticated = false;
      
      // Clear authentication information from localStorage
      safeRemoveItem('token');
      safeRemoveItem('userType');
      safeRemoveItem('userName');
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

export default authSlice.reducer; 