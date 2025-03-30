import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Form, Input, Button, Card, Typography, Modal } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { verifyCode, sendVerificationCode, resendVerificationCode } from '../api/authApi';

const { Title } = Typography;

// 表单验证规则
const schema = yup.object({
  code: yup.string()
    .required('Please enter the verification code')
    .matches(/^\d{6}$/, 'The verification code must be 6 digits')
}).required();

const VerifyCode = () => {
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTimeoutModalVisible, setIsTimeoutModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // 获取从注册页面传递的邮箱和用户名
  const userEmail = location.state?.email;
  const userName = location.state?.userName;
  
  // 如果没有邮箱信息，重定向回注册页面
  useEffect(() => {
    if (!userEmail) {
      navigate('/register');
    }
  }, [userEmail, navigate]);
  
  // 加载reCAPTCHA Enterprise脚本
  useEffect(() => {
    // 检查是否已经加载了脚本
    if (document.querySelector('script[src*="recaptcha/enterprise.js"]')) {
      console.log('reCAPTCHA script already loaded, skipping...');
      return;
    }
    
    console.log('Loading reCAPTCHA script...');
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/enterprise.js?render=6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y';
    script.async = true;
    script.id = 'recaptcha-script';
    document.body.appendChild(script);
    
    return () => {
      // 清理函数
      const existingScript = document.getElementById('recaptcha-script');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  // 45分钟超时检查
  useEffect(() => {
    // 设置45分钟超时 (45 * 60 * 1000 = 2700000 毫秒)
    const timeoutId = setTimeout(() => {
      setIsTimeoutModalVisible(true);
    }, 2700000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);
  
  // 表单控制
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      code: ''
    }
  });

  // 处理倒计时
  useEffect(() => {
    let timerId;
    if (countdown > 0) {
      timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timerId);
  }, [countdown]);

  // 验证码验证请求
  const verifyCodeMutation = useMutation({
    mutationFn: verifyCode,
    onSuccess: (data) => {
      console.log('Verify code response:', data); // 调试日志
      if (data.code === 0) {
        // 注册成功，跳转到登录页
        navigate('/login', { state: { registrationSuccess: true } });
      } else {
        setErrorMessage(data.msg);
        setIsModalVisible(true);
      }
    },
    onError: (error) => {
      console.error('Verify code error:', error); // 调试日志
      let errorMessage = 'Verification failed';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.msg || errorMessage;
      }
      setErrorMessage(errorMessage);
      setIsModalVisible(true);
    }
  });

  // 处理表单提交
  const onSubmit = async (formData) => {
    console.log('Submitting verification code:', formData.code); // 调试日志
    
    if (!window.grecaptcha?.enterprise) {
      console.error('reCAPTCHA not loaded'); // 调试日志
      setErrorMessage('reCAPTCHA is not ready, please wait...');
      setIsModalVisible(true);
      return;
    }
    
    try {
      // 获取reCAPTCHA token
      const recaptchaToken = await window.grecaptcha.enterprise.execute(
        '6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y',
        { action: 'verifyCode' }
      );
      
      verifyCodeMutation.mutate({
        email: userEmail,
        code: formData.code,
        headers: {
          'X-Recaptcha-Token': recaptchaToken,
          'X-Action': 'verifyCode'
        }
      });
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      setErrorMessage('Human verification failed, please refresh the page and try again');
      setIsModalVisible(true);
    }
  };

  // 重新发送验证码
  const handleResendCode = async () => {
    // 防止重复点击
    if (countdown > 0 || isResending) {
      return;
    }
    
    // 立即设置状态，禁用按钮
    setIsResending(true);
    
    try {
      if (!window.grecaptcha?.enterprise) {
        throw new Error('reCAPTCHA is not ready');
      }
      
      console.log('Getting reCAPTCHA token for resend...');
      
      // 获取reCAPTCHA token
      const recaptchaToken = await window.grecaptcha.enterprise.execute(
        '6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y',
        { action: 'resendCode' }
      );
      
      console.log(`Token received, sending direct fetch request to resend code for: ${userEmail}`);
      
      // 使用原生fetch直接发送请求，不再使用React Query
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/auth/resendCode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Recaptcha-Token': recaptchaToken,
          'X-Action': 'resendCode'
        },
        body: JSON.stringify({ email: userEmail }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Resend code response:', data);
      
      // 无论成功与否，都重置倒计时
      setCountdown(60);
      
      // 处理响应
      if (data.code !== 0) {
        setErrorMessage(data.msg || 'Failed to resend verification code');
        setIsModalVisible(true);
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      setErrorMessage(error.message || 'Failed to resend verification code');
      setIsModalVisible(true);
    } finally {
      // 总是确保状态被重置
      setIsResending(false);
    }
  };

  // 处理超时
  const handleTimeout = () => {
    setIsTimeoutModalVisible(false);
    navigate('/register');
  };

  // 添加调试函数以检查 URL 参数
  useEffect(() => {
    // 清理 URL 以移除可能的重复参数
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    
    // 检查是否有重复的参数
    if (searchParams.getAll('clrk').length > 1 || searchParams.getAll('reload').length > 1) {
      console.log('发现重复的 URL 参数，尝试清理...');
      
      // 创建新的参数集合
      const newParams = new URLSearchParams();
      
      // 只保留每个参数的第一个值
      for (const [key, value] of Array.from(searchParams.entries())) {
        if (!newParams.has(key)) {
          newParams.set(key, value);
        }
      }
      
      // 替换当前 URL
      url.search = newParams.toString();
      window.history.replaceState({}, '', url.toString());
      console.log('URL 已清理');
    }
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen" style={styles.container}>
      <Card className="w-full max-w-md shadow-md" style={styles.box}>
        <div className="text-center mb-6">
          <Title level={2} style={styles.title}>Verify Your Email</Title>
          <p>We have sent a verification email containing a 6-digit code to <strong>{userEmail}</strong></p>
        </div>
        
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label="Verification Code"
            validateStatus={errors.code ? 'error' : ''}
            help={errors.code?.message}
          >
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  size="large"
                  style={styles.codeInput}
                />
              )}
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                ...styles.verifyButton,
                width: '80%',
                margin: '0 auto',
              }}
              loading={verifyCodeMutation.isPending}
            >
              Verify
            </Button>
          </Form.Item>
        </Form>
        
        <div style={styles.resendContainer}>
          <span>Didn't receive the code?</span>
          <Button
            type="link"
            onClick={handleResendCode}
            disabled={countdown > 0 || isResending}
            style={{
              ...styles.resendLink,
              color: countdown > 0 || isResending ? '#aaa' : '#1976D2',
            }}
          >
            {isResending ? 'Sending...' : countdown > 0 ? `Resend (${countdown}s)` : 'Resend'}
          </Button>
        </div>
        
        <div style={styles.footerText}>
          <Button type="link" onClick={() => navigate('/register')} style={styles.backLink}>
            Back to Registration
          </Button>
        </div>
      </Card>
      
      {/* 错误提示弹窗 */}
      <Modal
        title="Verification Failed"
        open={isModalVisible}
        onOk={() => {
          setIsModalVisible(false);
          setIsResending(false); // 确保重置重发送状态
        }}
        onCancel={() => {
          setIsModalVisible(false);
          setIsResending(false); // 确保重置重发送状态
        }}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="OK"
      >
        <p>{errorMessage || 'The verification code is incorrect or has expired, please try again.'}</p>
      </Modal>
      
      {/* 超时提示弹窗 */}
      <Modal
        title="Session Timeout"
        open={isTimeoutModalVisible}
        onOk={handleTimeout}
        onCancel={handleTimeout}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="Back to Registration"
      >
        <p>Your verification session has timed out. Please fill in your basic information again.</p>
      </Modal>
    </div>
  );
};

// 样式
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
    fontSize: '30px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '600',
    textAlign: 'center',
    color: '#003366',
    marginBottom: '10px',
  },
  codeInput: {
    fontSize: '18px',
    textAlign: 'center',
    letterSpacing: '4px',
    padding: '10px 8px',
    fontFamily: 'monospace'
  },
  verifyButton: {
    fontSize: '18px',
    fontWeight: 'bold',
    height: '45px',
    backgroundColor: '#1976D2',
    border: 'none',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    marginTop: '10px',
  },
  resendContainer: {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: '14px',
    color: '#555',
  },
  resendLink: {
    fontWeight: 'bold',
    fontSize: '14px',
    marginLeft: '5px',
  },
  footerText: {
    textAlign: 'center',
    marginTop: '30px',
    fontSize: '14px',
    color: '#555',
  },
  backLink: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
};

export default VerifyCode; 