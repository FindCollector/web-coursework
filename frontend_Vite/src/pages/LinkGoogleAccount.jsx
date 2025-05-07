import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Typography, Button, message, Space } from 'antd';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import { baseApi } from '../store/api/baseApi';
import { getRedirectPath } from '../utils/routeUtils';
import PageTransition from '../components/PageTransition';

const { Title, Text } = Typography;

// 创建链接 Google 账号的 mutation
const linkGoogleAccountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    linkGoogleAccount: builder.mutation({
      query: (data) => ({
        url: '/auth/google-login/link',
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
  })
});

// 导出 hook
export const { useLinkGoogleAccountMutation } = linkGoogleAccountApi;

const LinkGoogleAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  
  // 从路由状态中获取 email 和 googleToken
  const { email, googleToken } = location.state || {};
  
  // 使用 API mutation
  const [linkGoogleAccount] = useLinkGoogleAccountMutation();
  
  // 如果没有必要的数据，重定向到登录页
  if (!email || !googleToken) {
    navigate('/login', { replace: true });
    return null;
  }
  
  // 处理确认链接
  const handleConfirmLink = async () => {
    try {
      setIsLoading(true);
      
      const response = await linkGoogleAccount({
        email,
        token: googleToken
      }).unwrap();
      
      if (response && response.code === 0) {
        // 获取用户信息
        const userInfo = response.data?.userInfo || {};
        
        // 从userInfo中获取token和角色
        const token = userInfo.token;
        const userType = userInfo.role;
        const userName = userInfo.userName || 'User';
        
        if (!token) {
          message.error('Linking successful but no token received');
          return;
        }

        // 自动登录：分发登录成功action
        dispatch(loginSuccess({
          token,
          userType,
          userName
        }));

        message.success('Google account linked successfully!');
        
        // 使用工具函数获取重定向路径
        const redirectPath = getRedirectPath(userType);
        console.log('Google account linked, redirecting to:', redirectPath);
        
        // 添加一个小延迟，确保 Redux store 已经更新
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100);
      } else {
        message.error(response?.msg || 'Failed to link Google account');
      }
    } catch (error) {
      console.error('Error linking Google account:', error);
      const errorMessage = error?.data?.msg || error?.message || 'An error occurred while linking your Google account';
      message.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 取消链接
  const handleCancel = () => {
    navigate('/login', { replace: true });
  };
  
  return (
    <PageTransition>
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md shadow-md">
          <div className="text-center mb-6">
            <Title level={2}>Link Google Account</Title>
            <Text>
              The email <strong>{email}</strong> is already registered in our system. 
              Would you like to link your Google account to this existing account?
            </Text>
          </div>
          
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Button
              type="primary"
              onClick={handleConfirmLink}
              loading={isLoading}
              className="w-full"
            >
              Yes, Link My Google Account
            </Button>
            
            <Button 
              onClick={handleCancel}
              className="w-full"
            >
              No, I'll Use Regular Login
            </Button>
          </Space>
        </Card>
      </div>
    </PageTransition>
  );
};

export default LinkGoogleAccount; 