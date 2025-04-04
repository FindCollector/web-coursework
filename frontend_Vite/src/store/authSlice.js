import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: sessionStorage.getItem('token') || null,
  userType: sessionStorage.getItem('userType') || null,
  userName: sessionStorage.getItem('userName') || 'Admin',
  isAuthenticated: !!sessionStorage.getItem('token'),
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
      
      // 保存到sessionStorage
      sessionStorage.setItem('token', action.payload.token);
      sessionStorage.setItem('userType', action.payload.userType);
      sessionStorage.setItem('userName', action.payload.userName || 'Admin');
      
      // 调试日志，确认token已保存
      console.log('Auth token stored in Redux and sessionStorage');
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
      
      // 清除sessionStorage中的认证信息
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userType');
      sessionStorage.removeItem('userName');
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

export default authSlice.reducer; 