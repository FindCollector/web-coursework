import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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

// 创建基础API配置
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
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
  }),
  // 通用标签类型
  tagTypes: ['User', 'Auth', 'Coach'],
  // 端点将在各个特定的API slice中定义
  endpoints: () => ({}),
}); 