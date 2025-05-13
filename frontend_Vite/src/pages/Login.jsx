import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation } from '../store/api/authApi';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useReCaptcha, useButtonLoading } from '../hooks';
import { GoogleLogin } from '@react-oauth/google';

import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { getRedirectPath, getUserTypeFromData, isUserAuthenticated } from '../utils/routeUtils';
import PageTransition from '../components/PageTransition';

const { Title } = Typography;

// Form validation schema
const schema = yup.object({
  email: yup.string().email('Please enter a valid email address').required('Email address is required'),
  password: yup.string().required('Password is required'),
}).required();

const Login = () => {
  const location = useLocation();
  const isRegisterPage = location.pathname === '/register';
  
  // 使用ref追踪消息是否已显示
  const messageDisplayed = useRef(false);
  
  // 使用ref追踪已显示过的消息ID
  const displayedMessageIds = useRef(new Set());
  
  // Use custom hooks
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  
  // State management
  const [expiredError, setExpiredError] = useState(false);
  
  // 配置message组件，防止重复消息
  useEffect(() => {
    // 配置message组件，限制同一时间只能显示一个消息
    message.config({
      maxCount: 1,
    });
  }, []);
  
  // Check if there's a profile completion message
  useEffect(() => {
    // 检查state中是否有消息和messageId
    if (location.state?.message && 
        typeof location.state.message === 'string' &&
        location.state?.messageId) {
      
      // 检查这个messageId是否已经显示过
      if (!displayedMessageIds.current.has(location.state.messageId)) {
        // 添加到已显示集合中
        displayedMessageIds.current.add(location.state.messageId);
        
        // 显示消息
        message.success(location.state.message);
        
        // 清除state中的消息
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        
        // 防止集合无限增长，设置一个上限
        if (displayedMessageIds.current.size > 10) {
          displayedMessageIds.current = new Set([...displayedMessageIds.current].slice(-5));
        }
      }
    }
  }, [location.state]);
  
  // Use RTK Query hook
  const [login, loginResult] = useLoginMutation();
  
  // Use custom button loading state hook
  const [isLoading, setLoading, withLoading] = useButtonLoading(false);

  // Use custom reCAPTCHA hook
  const { executeReCaptcha, isScriptLoaded, isInitialized, error: recaptchaError } = useReCaptcha('6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y');
  
  // Form control
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  // Handle form submission
  const onSubmit = async (formData) => {
    if (!isScriptLoaded || !isInitialized) {
      dispatch(loginFailure(recaptchaError || 'reCAPTCHA not ready, please refresh the page and try again'));
      // Show reCAPTCHA error
      message.error(recaptchaError || 'reCAPTCHA not ready, please refresh the page and try again');
      return;
    }
    
    try {
      // Manually set loading state
      setLoading(true);
      
      // Get reCAPTCHA token
      const recaptchaToken = await executeReCaptcha('login');
      
      // Call RTK Query's login mutation
      dispatch(loginStart());
      
      const data = await login({
        ...formData,
        headers: {
          'X-Recaptcha-Token': recaptchaToken,
          'X-Action': 'login'
        }
      }).unwrap();
      
      if (data.code === 0) {
        // Get user info, adapting to new data structure
        const userInfo = data.data?.userInfo || {};
        
        // Get token and role from userInfo
        const token = userInfo.token;
        const userType = userInfo.role;
        const userName = userInfo.userName || 'Admin';
        
        if (!token) {
          const errorMsg = 'Login successful but no token received, please contact administrator';
          dispatch(loginFailure(errorMsg));
          message.error(errorMsg);
          return;
        }
        
        // Dispatch login success action
        dispatch(loginSuccess({
          token,
          userType,
          userName
        }));
        
        // Show login success message
        message.success('Login Successful');
        
        // Use utility function to get redirect path
        const redirectPath = getRedirectPath(userType);
        
        // Navigate directly
        navigate(redirectPath, { replace: true });
      } else if (data.code === 3004) {
        // 仅对谷歌登录用户显示需要完成个人信息的提示
        // 注册用户不应该到这里，因为他们在注册过程中已经填写了个人信息
        const isGoogleLogin = data.data?.isGoogleLogin === true;
        if (isGoogleLogin) {
          message.info('Please complete your profile to continue');
          navigate('/complete-profile', { 
            state: { email: data.data.email },
            replace: true 
          });
        } else {
          // 普通用户登录出现此错误，应该是后端配置问题
          message.error('Your account information is incomplete. Please contact support.');
        }
        return;
      } else {
        // Ensure we use the error message from backend
        const errorMessage = data.msg || 'Login failed, please try again later';
        
        dispatch(loginFailure(errorMessage));
        
        // Show error message
        message.error(errorMessage);
      }
    } catch (error) {
      let errorMessage = 'Login failed';
      
      // Check different possible error object structures
      if (error.data) {
        errorMessage = error.data.msg || errorMessage;
      } else if (error.response && error.response.data) {
        errorMessage = error.response.data.msg || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Only update Redux state
      dispatch(loginFailure(errorMessage));
      
      // Show error message
      message.error(errorMessage);
    } finally {
      // Reset loading state when done
      setLoading(false);
    }
  };

  // Check if redirected to login page due to session expiration
  useEffect(() => {
    // First check if we need to show expiration alert
    const shouldShowExpiredAlert = 
      (location.state && location.state.expired) || 
      sessionStorage.getItem('tokenExpirationHandled') === 'true';
    
    if (shouldShowExpiredAlert) {
      // Show expiration alert
      setExpiredError(true);
      
      // Clear state and marker to avoid showing again
      if (location.state && location.state.expired) {
        navigate(location.pathname, { replace: true, state: {} });
      }
      sessionStorage.removeItem('tokenExpirationHandled');
      
      // Automatically close the alert after 5 seconds
      const timer = setTimeout(() => {
        setExpiredError(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  // Add Google login handler
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      // Manually set loading state
      setLoading(true);
      
      // Call RTK Query's login mutation
      dispatch(loginStart());
      
      // Send Google login verification info
      const data = await login({
        googleToken: credentialResponse.credential,
        headers: {
          'X-Action': 'google-login'
        }
      }).unwrap();
      
      if (data.code === 0) {
        // Get user info, adapting to new data structure
        const userInfo = data.data?.userInfo || {};
        
        // Get token and role from userInfo
        const token = userInfo.token;
        const userType = userInfo.role;
        const userName = userInfo.userName || 'Admin';
        
        if (!token) {
          const errorMsg = 'Login successful but no token received, please contact administrator';
          dispatch(loginFailure(errorMsg));
          message.error(errorMsg);
          return;
        }
        
        // Dispatch login success action
        dispatch(loginSuccess({
          token,
          userType,
          userName
        }));
        
        // Show login success message
        message.success('Google Login Successful');
        
        // Use utility function to get redirect path
        const redirectPath = getRedirectPath(userType);
        
        // Navigate directly
        navigate(redirectPath, { replace: true });
      } else if (data.code === 3004) {
        // Google登录需要完成个人资料，这是正常流程
        message.info('Please complete your profile to continue');
        navigate('/complete-profile', { 
          state: { 
            email: data.data.email,
            isGoogleLogin: true 
          },
          replace: true 
        });
        return;
      } else if (data.code === 3006) {
        // Google email exists but not via Google account login
        message.info('This email is already registered. Please confirm if you want to link your Google account.');
        navigate('/link-google-account', { 
          state: { 
            email: data.data.email,
            googleToken: credentialResponse.credential 
          },
          replace: true 
        });
        return;
      } else {
        // Ensure we use the error message from backend
        const errorMessage = data.msg || 'Google login failed, please try again later';
        
        dispatch(loginFailure(errorMessage));
        
        // Show error message
        message.error(errorMessage);
      }
    } catch (error) {
      let errorMessage = 'Google login failed';
      
      // Check different possible error object structures
      if (error?.data) {
        errorMessage = error.data.msg || errorMessage;
      } else if (error?.response && error.response.data) {
        errorMessage = error.response.data.msg || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Only update Redux state
      dispatch(loginFailure(errorMessage));
      
      // Show error message
      message.error(errorMessage);
    } finally {
      // Reset loading state when done
      setLoading(false);
    }
  };

  const handleGoogleLoginError = () => {
    message.error('Google login failed. Please try again.');
  };

  return (
    <PageTransition isVisible={isRegisterPage}>
      <div className="flex justify-center items-center min-h-screen" style={styles.container}>
        {expiredError && (
          <div style={styles.errorToast}>
            <ExclamationCircleFilled style={{ color: '#ff4d4f', marginRight: '8px' }} />
            Your session has expired. Please login again.
          </div>
        )}
        
        <Card className="w-full max-w-md shadow-md" style={styles.box}>
          <div className="text-center mb-6">
            <Title level={2} style={styles.title}>Sign In</Title>
          </div>
          
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="Email"
              validateStatus={errors.email ? 'error' : ''}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter your email address" />}
              />
            </Form.Item>
            
            <Form.Item
              label="Password"
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => <Input.Password {...field} placeholder="Enter your password" />}
              />
            </Form.Item>
            
            <div style={{ textAlign: 'right', marginTop: '-15px', marginBottom: '15px' }}>
              <Button 
                type="link" 
                onClick={() => navigate('/forgot-password')} 
                style={{ fontSize: '14px', padding: '0' }}
                disabled={isLoading || loginResult.isLoading}
              >
                Forgot Password?
              </Button>
            </div>
            
            <Form.Item style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  ...styles.signInButton,
                  width: '80%',
                  margin: '0 auto',
                }}
                loading={isLoading || loginResult.isLoading}
                disabled={isLoading || loginResult.isLoading || !isScriptLoaded || !isInitialized}
              >
                {!isScriptLoaded || !isInitialized ? 'reCAPTCHA Loading...' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              useOneTap={false}
              locale="en"
              theme="outline"
              type="standard"
              size="large"
              text="signin_with"
              shape="rectangular"
            />
          </div>
          
          <div style={styles.footerText}>
            <span>Don't have an account? </span>
            <Button 
              type="link" 
              onClick={() => navigate('/register')} 
              style={styles.signUpLink}
              disabled={isLoading || loginResult.isLoading}
            >
              Sign Up
            </Button>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(to right, #1a3a6e, #3f78d1, #67a8ff)',
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  box: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '40px 50px',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25), 0 15px 35px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(10px)',
    width: '100%',
    maxWidth: '450px',
    textAlign: 'left',
    transition: 'all 0.3s ease',
    margin: '20px',
    zIndex: 10,
  },
  title: {
    fontSize: '50px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '600',
    textAlign: 'center',
    color: '#003366',
    marginBottom: '20px',
  },
  signInButton: {
    fontSize: '18px',
    fontWeight: 'bold',
    height: '45px',
    backgroundColor: '#1976D2',
    border: 'none',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    ':hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
    }
  },
  footerText: {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: '14px',
    color: '#555',
  },
  signUpLink: {
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'transform 0.3s ease',
    ':hover': {
      transform: 'scale(1.1)',
    }
  },
  errorToast: {
    position: 'absolute',
    top: '30px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.16)',
    zIndex: 1000,
    fontSize: '14px',
    fontWeight: 'normal',
    animation: 'fadeInDown 0.3s ease'
  },
};

// Add global CSS for button hover effects (since inline styles can't capture :hover)
const styleElement = document.createElement('style');
styleElement.innerHTML = `
  body, html {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    overflow-x: hidden;
  }
  
  .ant-btn-primary:hover {
    transform: scale(1.05) !important;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2) !important;
  }
  
  .ant-btn-link:hover {
    transform: scale(1.1) !important;
  }
  
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleElement);

export default Login; 