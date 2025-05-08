import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Typography, Button, message, Space } from 'antd';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import { baseApi } from '../store/api/baseApi';
import { getRedirectPath } from '../utils/routeUtils';
import PageTransition from '../components/PageTransition';

const { Title, Text } = Typography;

// Create Google account linking mutation
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

// Export hook
export const { useLinkGoogleAccountMutation } = linkGoogleAccountApi;

const LinkGoogleAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get email and googleToken from route state
  const { email, googleToken } = location.state || {};
  
  // Use API mutation
  const [linkGoogleAccount] = useLinkGoogleAccountMutation();
  
  // If no necessary data, redirect to login page
  if (!email || !googleToken) {
    navigate('/login', { replace: true });
    return null;
  }
  
  // Handle confirm link
  const handleConfirmLink = async () => {
    try {
      setIsLoading(true);
      
      const response = await linkGoogleAccount({
        email,
        token: googleToken
      }).unwrap();
      
      if (response && response.code === 0) {
        // Get user information
        const userInfo = response.data?.userInfo || {};
        
        // Get token and role from userInfo
        const token = userInfo.token;
        const userType = userInfo.role;
        const userName = userInfo.userName || 'User';
        
        if (!token) {
          message.error('Linking successful but no token received');
          return;
        }

        // Auto login: dispatch login success action
        dispatch(loginSuccess({
          token,
          userType,
          userName
        }));

        message.success('Google account linked successfully!');
        
        // Use utility function to get redirect path
        const redirectPath = getRedirectPath(userType);
        
        // Add a small delay to ensure Redux store has updated
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100);
      } else {
        message.error(response?.msg || 'Failed to link Google account');
      }
    } catch (error) {
      const errorMessage = error?.data?.msg || error?.message || 'An error occurred while linking your Google account';
      message.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel linking
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