import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation } from '../store/api/authApi';
import { Form, Input, Button, Card, Typography, Modal } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useReCaptcha, useModalState, useButtonLoading } from '../hooks';

import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { getRedirectPath, getUserTypeFromData } from '../utils/routeUtils';
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
  
  // 使用自定义 hooks
  const [isModalVisible, showModal, hideModal] = useModalState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  
  // 使用RTK Query的hook
  const [login, loginResult] = useLoginMutation();
  
  // 使用自定义按钮加载状态 hook
  const [isLoading, setLoading, withLoading] = useButtonLoading(false);

  // 使用自定义 reCAPTCHA hook
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
      dispatch(loginFailure(recaptchaError || 'reCAPTCHA 未准备好，请刷新页面重试'));
      showModal();
      return;
    }
    
    try {
      // 手动设置加载状态
      setLoading(true);
      
      // Get reCAPTCHA token
      const recaptchaToken = await executeReCaptcha('login');
      
      // 调用RTK Query的login mutation
      dispatch(loginStart());
      
      const data = await login({
        ...formData,
        headers: {
          'X-Recaptcha-Token': recaptchaToken,
          'X-Action': 'login'
        }
      }).unwrap();
      
      if (data.code === 0) {
        // 获取用户信息，适应新的数据结构
        const userInfo = data.data?.userInfo || {};
        
        // 从userInfo中获取token和角色
        const token = userInfo.token;
        const userType = userInfo.role || 'admin';
        const userName = userInfo.userName || 'Admin';
        
        if (!token) {
          dispatch(loginFailure('登录成功但未获取到凭证，请联系管理员'));
          showModal();
          return;
        }
        
        // 分发登录成功action
        dispatch(loginSuccess({
          token: token,
          userType: userType,
          userName: userName
        }));
        
        // Redirect based on user type
        const redirectPath = getRedirectPath(userType);
        navigate(redirectPath);
      } else {
        // 确保使用后端返回的错误消息
        const errorMessage = data.msg || 'Login failed, please try again later';
        dispatch(loginFailure(errorMessage));
        showModal();
      }
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error.data) {
        errorMessage = error.data.msg || errorMessage;
      } else if (error.response && error.response.data) {
        errorMessage = error.response.data.msg || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      dispatch(loginFailure(errorMessage));
      showModal();
    } finally {
      // 完成后重置加载状态
      setLoading(false);
    }
  };

  return (
    <PageTransition isVisible={isRegisterPage}>
      <div className="flex justify-center items-center min-h-screen" style={styles.container}>
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
        
        {/* Login failure modal */}
        <Modal
          title="Login Failed"
          open={isModalVisible}
          onOk={hideModal}
          onCancel={hideModal}
          cancelButtonProps={{ style: { display: 'none' } }}
          okText="Retry"
        >
          <div>
            <p style={{ fontSize: '16px', marginBottom: '10px' }}>{error || 'Login failed, please check your email and password.'}</p>
            {recaptchaError && (
              <p style={{ fontSize: '14px', color: '#f5222d' }}>
                reCAPTCHA Error: {recaptchaError}
              </p>
            )}
          </div>
        </Modal>
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
`;
document.head.appendChild(styleElement);

export default Login; 