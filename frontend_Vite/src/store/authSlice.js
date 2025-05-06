import { createSlice } from '@reduxjs/toolkit';

// 获取带页面ID的存储键名，但使用localStorage中保存的一致ID
const getStorageKey = (key) => {
  // 检查PAGE_INSTANCE_ID是否存在且来自localStorage（而不是刚刚生成的）
  // 使用简单的键名，不再追加实例ID，以确保刷新页面时能找到相同的键
  return key;
};

// 从localStorage获取值的安全方法
const safeGetItem = (key) => {
  try {
    return localStorage.getItem(getStorageKey(key));
  } catch (error) {
    console.error('从localStorage获取数据失败:', error);
    return null;
  }
};

// 向localStorage设置值的安全方法
const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(getStorageKey(key), value);
  } catch (error) {
    console.error('保存数据到localStorage失败:', error);
  }
};

// 从localStorage移除值的安全方法
const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(getStorageKey(key));
  } catch (error) {
    console.error('从localStorage删除数据失败:', error);
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
      
      // 保存到localStorage
      safeSetItem('token', action.payload.token);
      safeSetItem('userType', action.payload.userType);
      safeSetItem('userName', action.payload.userName || 'Admin');
      
      // 调试日志，确认token已保存
      console.log('登录成功: Auth token stored in Redux and localStorage');
      console.log('保存的密钥:', getStorageKey('token'));
      console.log('保存后所有localStorage键:', Object.keys(localStorage));
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
      safeRemoveItem('token');
      safeRemoveItem('userType');
      safeRemoveItem('userName');
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

export default authSlice.reducer; 