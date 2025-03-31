import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null,
  userType: localStorage.getItem('userType') || null,
  userName: localStorage.getItem('userName') || 'Admin',
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
      state.userName = action.payload.userName || 'Admin';
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      
      // 保存到localStorage
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('userType', action.payload.userType);
      localStorage.setItem('userName', action.payload.userName || 'Admin');
      
      // 调试日志，确认token已保存
      console.log('Auth token stored in Redux and localStorage');
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
      
      // 清除localStorage中的认证信息
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('userName');
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

export default authSlice.reducer; 