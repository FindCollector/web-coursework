import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null,
  userType: localStorage.getItem('userType') || null,
  isAuthenticated: !!localStorage.getItem('token'),
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
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      
      // 保存到localStorage
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('userType', action.payload.userType);
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.userType = null;
      state.isAuthenticated = false;
      
      // 清除localStorage中的认证信息
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

export default authSlice.reducer; 