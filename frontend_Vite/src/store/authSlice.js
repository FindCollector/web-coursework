import { createSlice } from '@reduxjs/toolkit';

// 获取带页面ID的存储键名，但使用localStorage中保存的一致ID
const getStorageKey = (key) => {
  // 检查PAGE_INSTANCE_ID是否存在且来自localStorage（而不是刚刚生成的）
  // 使用简单的键名，不再追加实例ID，以确保刷新页面时能找到相同的键
  return key;
};

// 从sessionStorage获取值的安全方法
const safeGetItem = (key) => {
  try {
    return sessionStorage.getItem(getStorageKey(key));
  } catch (error) {
    console.error('从sessionStorage获取数据失败:', error);
    return null;
  }
};

// 向sessionStorage设置值的安全方法
const safeSetItem = (key, value) => {
  try {
    sessionStorage.setItem(getStorageKey(key), value);
  } catch (error) {
    console.error('向sessionStorage设置数据失败:', error);
  }
};

// 从sessionStorage移除值的安全方法
const safeRemoveItem = (key) => {
  try {
    sessionStorage.removeItem(getStorageKey(key));
  } catch (error) {
    console.error('从sessionStorage移除数据失败:', error);
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
      
      // 保存到sessionStorage
      safeSetItem('token', action.payload.token);
      safeSetItem('userType', action.payload.userType);
      safeSetItem('userName', action.payload.userName || 'Admin');
      
      // 调试日志，确认token已保存
      console.log('登录成功: Auth token stored in Redux and sessionStorage');
      console.log('保存的密钥:', getStorageKey('token'));
      console.log('保存后所有sessionStorage键:', Object.keys(sessionStorage));
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
      safeRemoveItem('token');
      safeRemoveItem('userType');
      safeRemoveItem('userName');
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

export default authSlice.reducer; 