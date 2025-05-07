import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { message } from 'antd';
import { logout } from '../authSlice';

// 获取存储键名，不再添加实例ID后缀
const getStorageKey = (key) => {
  // 使用简单的键名，不追加实例ID，确保刷新页面后仍能找到token
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

// 安全移除localStorage项的方法
const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(getStorageKey(key));
  } catch (error) {
    console.error('从localStorage删除数据失败:', error);
  }
};

// 处理token过期的函数
const handleTokenExpiration = (api) => {
  // 防止重复处理，使用标记避免多次调用
  if (window.__handlingTokenExpiration) {
    return;
  }
  
  // 设置标记，防止重复处理
  window.__handlingTokenExpiration = true;
  
  console.log('[baseApi] 处理token过期 - 执行登出操作');
  
  // 清除local storage
  safeRemoveItem('token');
  safeRemoveItem('userType');
  safeRemoveItem('userName');
  
  // 触发Redux登出action
  api.dispatch(logout());
  
  // 显示消息给用户
  message.error({
    content: 'Your session has expired. Please login again.',
    duration: 5,
    style: {
      marginTop: '20vh',
      fontSize: '16px',
      fontWeight: 'bold'
    }
  });
  
  // 重定向到登录页面
  setTimeout(() => {
    window.location.href = '/login';
    // 重置处理标记
    setTimeout(() => {
      window.__handlingTokenExpiration = false;
    }, 1000);
  }, 2000);
};

// 创建一个基础查询
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NODE_ENV === 'production' 
    ? '/' 
    : 'http://localhost:8080',
  prepareHeaders: (headers, { endpoint }) => {
    // 添加调试日志
    console.log('[baseApi] 准备请求头 - 端点:', endpoint);
    
    // 检查是否是不需要token的接口
    const noTokenEndpoints = ['login', 'sendVerificationCode', 'verifyCode', 'resendVerificationCode', 'completeProfile', 'linkGoogleAccount'];
    if (noTokenEndpoints.includes(endpoint)) {
      console.log('[baseApi] 无需token的端点:', endpoint);
      return headers;
    }
    
    // 从localStorage获取token (使用安全方法)
    const token = safeGetItem('token');
    console.log('[baseApi] 从 localStorage 获取的 token:', token ? '存在' : '不存在');
    console.log('[baseApi] 存储键:', getStorageKey('token'));
    console.log('[baseApi] 所有 localStorage 键:', Object.keys(localStorage));
    
    if (token) {
      // 只设置token头，去掉Authorization头
      headers.set('token', token);
      console.log('[baseApi] 已添加token到请求头');
      // 打印完整的请求头
      console.log('[baseApi] 完整请求头:', Object.fromEntries(headers.entries()));
    } else {
      console.warn('[baseApi] 未找到token，端点:', endpoint);
    }
    return headers;
  },
});

// 创建一个包装的baseQuery来处理token过期
const baseQueryWithReauth = async (args, api, extraOptions) => {
  console.log('[baseApi] 发送请求:', args);
  const result = await baseQuery(args, api, extraOptions);
  console.log('[baseApi] 请求结果:', result);
  
  // 检查是否有错误
  if (result.error) {
    console.log('[baseApi] 发现错误:', result.error);
    
    // 从错误中提取数据
    const errorData = result.error.data;
    console.log('[baseApi] 错误数据:', errorData);
    
    // 检查是否是token过期错误
    if (errorData) {
      const { code, msg, data } = errorData;
      console.log('[baseApi] 错误代码:', code, '错误消息:', msg);
      
      // 扩展错误码检测，兼容多种过期情况
      const isTokenExpired = 
        (code === 3000) || 
        (code === 401) || 
        (msg === 'Not logged in or login expired') ||
        (msg && msg.toLowerCase().includes('token expired')) ||
        (msg && msg.toLowerCase().includes('invalid token')) ||
        (data && typeof data === 'string' && data.includes('authentication is required'));
        
      if (isTokenExpired) {
        console.log('[baseApi] 检测到token过期，开始处理注销流程');
        // 直接调用本地的处理函数
        handleTokenExpiration(api);
      }
    }
  }
  
  return result;
};

// 创建基础API配置
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // 通用标签类型
  tagTypes: ['User', 'Auth', 'Coach', 'MemberSubscriptionRequests', 'MemberUnreadCount'],
  // 端点将在各个特定的API slice中定义
  endpoints: () => ({}),
}); 