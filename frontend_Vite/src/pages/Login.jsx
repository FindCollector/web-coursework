import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Form, Input, Button, Card, Typography, Modal } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { login } from '../api/authApi';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { getRedirectPath, getUserTypeFromMessage } from '../utils/routeUtils';

const { Title } = Typography;

// Form validation schema
const schema = yup.object({
  email: yup.string().email('Please enter a valid email address').required('Email address is required'),
  password: yup.string().required('Password is required'),
}).required();

const Login = () => {
  console.log("Login component rendering");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  
  // Load reCAPTCHA Enterprise script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/enterprise.js?render=6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      // Cleanup function
      document.body.removeChild(script);
    };
  }, []);
  
  // Form control
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  // Login request
  const loginMutation = useMutation({
    mutationFn: login,
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: (data) => {
      if (data.code === 0) {
        const userType = getUserTypeFromMessage(data.msg);
        dispatch(loginSuccess({
          token: data.data.token,
          userType: userType
        }));
        
        // Redirect based on user type
        const redirectPath = getRedirectPath(userType);
        navigate(redirectPath);
      } else {
        // 确保使用后端返回的错误消息
        const errorMessage = data.msg || 'Login failed, please try again later';
        dispatch(loginFailure(errorMessage));
        setIsModalVisible(true);
      }
    },
    onError: (error) => {
      let errorMessage = 'Login failed';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.msg || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      dispatch(loginFailure(errorMessage));
      setIsModalVisible(true);
    }
  });

  // Handle form submission
  const onSubmit = async (formData) => {
    if (!window.grecaptcha?.enterprise) {
      dispatch(loginFailure('reCAPTCHA is not ready, please wait...'));
      return;
    }
    
    try {
      // Get reCAPTCHA token
      const recaptchaToken = await window.grecaptcha.enterprise.execute(
        '6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y',
        { action: 'login' }
      );
      
      loginMutation.mutate({
        ...formData,
        headers: {
          'X-Recaptcha-Token': recaptchaToken,
          'X-Action': 'login'
        }
      });
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      dispatch(loginFailure('Human verification failed, please refresh the page and try again'));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen" style={styles.container}>
      {console.log("Rendering login form")}
      <Card className="w-full max-w-md shadow-md" style={{...styles.box, border: '1px solid red'}}>
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
              loading={loading}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
        
        <div style={styles.footerText}>
          <span>Don't have an account? </span>
          <Button type="link" onClick={() => navigate('/register')} style={styles.signUpLink}>
            Sign Up
          </Button>
        </div>
      </Card>
      
      {/* Login failure modal */}
      <Modal
        title="Login Failed"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="Retry"
      >
        <p style={{ fontSize: '16px' }}>{error || 'Wrong email or password, please try again.'}</p>
      </Modal>
    </div>
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