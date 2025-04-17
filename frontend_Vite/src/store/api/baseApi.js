import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { message } from 'antd';
import { logout } from '../authSlice';

// 获取存储键名，不再添加实例ID后缀
const getStorageKey = (key) => {
  // 使用简单的键名，不追加实例ID，确保刷新页面后仍能找到token
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

// 创建一个基础查询
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NODE_ENV === 'production' 
    ? '/' 
    : 'http://localhost:8080',
  prepareHeaders: (headers, { endpoint }) => {
    // 添加调试日志
    console.log('[baseApi] 准备请求头 - 端点:', endpoint);
    
    // 检查是否是不需要token的接口
    const noTokenEndpoints = ['login', 'sendVerificationCode', 'verifyCode', 'resendVerificationCode'];
    if (noTokenEndpoints.includes(endpoint)) {
      console.log('[baseApi] 无需token的端点:', endpoint);
      return headers;
    }
    
    // 从sessionStorage获取token (使用安全方法)
    const token = safeGetItem('token');
    console.log('[baseApi] 从 sessionStorage 获取的 token:', token ? '存在' : '不存在');
    console.log('[baseApi] 存储键:', getStorageKey('token'));
    console.log('[baseApi] 所有 sessionStorage 键:', Object.keys(sessionStorage));
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
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
  const result = await baseQuery(args, api, extraOptions);
  
  // 检查是否是token过期错误
  if (result.error && result.error.data) {
    const { code, msg } = result.error.data;
    if (code === 3000 && msg === 'Not logged in or login expired') {
      // 清除token
      sessionStorage.removeItem('token');
      // 触发登出action
      api.dispatch(logout());
      // 显示错误消息
      message.error('登录已过期，请重新登录');
      // 重定向到登录页
      window.location.href = '/login';
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