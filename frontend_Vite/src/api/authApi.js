import client from './client';

// 登录API
export const login = async (data) => {
  const { headers, ...requestData } = data;
  const response = await client.post('/auth/login', requestData, { headers });
  return response.data;
};

// 退出登录API
export const logout = async () => {
  // 获取token
  const token = localStorage.getItem('token');
  
  // 设置请求头
  const config = {};
  if (token) {
    config.headers = { token };
  }
  
  // 发送退出登录请求
  const response = await client.post('/auth/logout', {}, config);
  return response.data;
};

// 获取当前用户信息API
export const getCurrentUser = async () => {
  const response = await client.get('/auth/user');
  return response.data;
};

// 发送验证码API
export const sendVerificationCode = async (data) => {
  const { headers, ...requestData } = data;
  const response = await client.post('/auth/sendCode', requestData, { headers });
  return response.data;
};

// 验证验证码API
export const verifyCode = async (data) => {
  const { headers, ...requestData } = data;
  const response = await client.post('/auth/verifyCode', requestData, { headers });
  return response.data;
};

// 防止重复请求的变量
let pendingResendRequest = false;
let lastResendRequestTime = 0;
let resendRequestCache = null;

// 重新发送验证码API
export const resendVerificationCode = async (data) => {
  const currentTime = Date.now();
  
  // 1. 判断是否有正在处理的请求
  if (pendingResendRequest) {
    console.log('Resend request already in progress, skipping duplicate request');
    return {
      code: 0,
      msg: 'Request already in progress',
      data: null
    };
  }
  
  // 2. 判断是否在短时间内（3秒）重复发送请求
  if (currentTime - lastResendRequestTime < 3000) {
    console.log('Request throttled: too many requests in short period');
    
    // 如果有缓存的响应，直接返回
    if (resendRequestCache) {
      console.log('Returning cached response');
      return resendRequestCache;
    }
    
    return {
      code: 0,
      msg: 'Please wait before sending another request',
      data: null
    };
  }
  
  try {
    // 设置锁和时间戳
    pendingResendRequest = true;
    lastResendRequestTime = currentTime;
    
    // 清除请求缓存
    resendRequestCache = null;
    
    console.log('Calling resendCode API with data:', data);
    const { headers, ...requestData } = data;
    const response = await client.post('/auth/resendCode', requestData, { headers });
    console.log('resendCode API response:', response.data);
    
    // 缓存响应，以便在短时间内可以复用
    resendRequestCache = response.data;
    
    // 释放锁
    pendingResendRequest = false;
    return response.data;
  } catch (error) {
    console.error('resendCode API error:', error);
    pendingResendRequest = false;
    throw error;
  } finally {
    // 确保即使出错也会释放锁
    setTimeout(() => {
      pendingResendRequest = false;
    }, 3000);
  }
}; 