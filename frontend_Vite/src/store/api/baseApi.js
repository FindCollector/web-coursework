import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// 创建基础API配置
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NODE_ENV === 'production' 
      ? '/' 
      : 'http://localhost:8080',
    prepareHeaders: (headers) => {
      // 从localStorage获取token
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
        headers.set('token', token);
      }
      return headers;
    },
  }),
  // 通用标签类型
  tagTypes: ['User', 'Auth'],
  // 端点将在各个特定的API slice中定义
  endpoints: () => ({}),
}); 