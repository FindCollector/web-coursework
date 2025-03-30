import axios from 'axios';

// 从环境变量或配置中获取API基础URL，默认使用localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

console.log('Using API base URL:', API_BASE_URL); // 调试日志

const client = axios.create({
  baseURL: API_BASE_URL, // 动态获取后端服务器地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // 确保跨域请求发送凭证
  withCredentials: true
});

// 用于跟踪进行中的请求
const pendingRequests = new Map();

// 生成请求的唯一键
const generateRequestKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.data || {})}`;
};

// 请求拦截器
client.interceptors.request.use(
  (config) => {
    // 从localStorage获取token并添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 为请求添加唯一标识，确保不重复发送相同请求
    const requestKey = generateRequestKey(config);
    
    // 如果是相同的请求且正在进行中，则取消当前请求
    if (config.url.includes('/resendCode')) {
      if (pendingRequests.has(requestKey)) {
        console.log('Duplicate request detected:', requestKey);
        // 返回一个取消令牌
        const source = axios.CancelToken.source();
        config.cancelToken = source.token;
        setTimeout(() => {
          source.cancel('Duplicate request canceled');
        }, 0);
      } else {
        // 将请求标记为进行中
        pendingRequests.set(requestKey, true);
        
        // 3秒后自动清除
        setTimeout(() => {
          pendingRequests.delete(requestKey);
        }, 3000);
      }
    }
    
    // 记录请求详情用于调试
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, {
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
client.interceptors.response.use(
  (response) => {
    // 请求成功完成，从pendingRequests中删除
    const requestKey = generateRequestKey(response.config);
    pendingRequests.delete(requestKey);
    
    // 记录响应详情用于调试
    console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.config) {
      // 请求失败，也要从pendingRequests中删除
      const requestKey = generateRequestKey(error.config);
      pendingRequests.delete(requestKey);
    }
    
    // 统一处理错误
    if (error.response) {
      console.error(`API Error ${error.response.status}: ${error.config.url}`, error.response.data);
      
      // 处理401未授权错误，清除token并重定向到登录页
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

export default client; 