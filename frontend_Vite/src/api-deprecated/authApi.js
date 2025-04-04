/**
 * 兼容层 - 过渡使用
 * 
 * 此文件已弃用，请直接从 src/store/api/authApi 导入相关 hooks
 * 例如: import { useLoginMutation } from '../store/api/authApi';
 */

import { 
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useRegisterMutation,
  useSendVerificationCodeMutation,
  useVerifyCodeMutation,
  useResendVerificationCodeMutation
} from '../store/api/authApi';

// 登录API
export const login = async (data) => {
  console.warn('使用已弃用的 login() 函数，请迁移到 useLoginMutation hook');
  throw new Error('此函数已弃用，请使用 useLoginMutation hook');
};

// 退出登录API
export const logout = async () => {
  console.warn('使用已弃用的 logout() 函数，请迁移到 useLogoutMutation hook');
  throw new Error('此函数已弃用，请使用 useLogoutMutation hook');
};

// 获取当前用户信息API
export const getCurrentUser = async () => {
  console.warn('使用已弃用的 getCurrentUser() 函数，请迁移到 useGetCurrentUserQuery hook');
  throw new Error('此函数已弃用，请使用 useGetCurrentUserQuery hook');
};

// 发送验证码API
export const sendVerificationCode = async (data) => {
  console.warn('使用已弃用的 sendVerificationCode() 函数，请迁移到 useSendVerificationCodeMutation hook');
  throw new Error('此函数已弃用，请使用 useSendVerificationCodeMutation hook');
};

// 验证验证码API
export const verifyCode = async (data) => {
  console.warn('使用已弃用的 verifyCode() 函数，请迁移到 useVerifyCodeMutation hook');
  throw new Error('此函数已弃用，请使用 useVerifyCodeMutation hook');
};

// 防止重复请求的变量
let pendingResendRequest = false;
let lastResendRequestTime = 0;
let resendRequestCache = null;

// 重新发送验证码API
export const resendVerificationCode = async (data) => {
  console.warn('使用已弃用的 resendVerificationCode() 函数，请迁移到 useResendVerificationCodeMutation hook');
  throw new Error('此函数已弃用，请使用 useResendVerificationCodeMutation hook');
}; 