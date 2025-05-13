import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Modal, message, Divider } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import confetti from 'canvas-confetti';
import { useReCaptcha, useModalState, useButtonLoading, useCountdown } from '../hooks';
import { CheckCircleOutlined } from '@ant-design/icons';
import PageTransition from '../components/PageTransition';

import { 
  useVerifyCodeMutation, 
  useResendVerificationCodeMutation,
  useRetrievePasswordMutation,
  useResendPasswordResetCodeMutation,
  useResetPasswordMutation
} from '../store/api/authApi';

const { Title } = Typography;

// 创建两个不同的表单验证规则
const codeSchema = yup.object({
  code: yup.string()
    .required('Please enter the verification code')
    .matches(/^\d{6}$/, 'The verification code must be 6 digits')
}).required();

// 密码重置流程的表单验证规则
const resetPasswordSchema = yup.object({
  code: yup.string()
    .required('Please enter the verification code')
    .matches(/^\d{6}$/, 'The verification code must be 6 digits'),
  password: yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  confirmPassword: yup.string()
    .required('Please confirm password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
}).required();

const VerifyCode = () => {
  // Use custom hooks
  const { executeReCaptcha, isScriptLoaded } = useReCaptcha('6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y');
  const [isErrorModalVisible, showErrorModal, hideErrorModal] = useModalState(false);
  const [isTimeoutModalVisible, showTimeoutModal, hideTimeoutModal] = useModalState(false);
  const [isSuccessModalVisible, showSuccessModal, hideSuccessModal] = useModalState(false);
  
  // Add a flag indicating the page has been fully initialized
  const [isPageInitialized, setIsPageInitialized] = useState(false);
  
  const [isVerifying, setVerifying, withVerifying] = useButtonLoading(false);
  const [isResending, setResending, withResending] = useButtonLoading(false);
  const { seconds: countdown, start: startCountdown, isActive: isCountdownActive } = useCountdown(60, false);
  
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use RTK Query hooks
  const [verifyCode, verifyCodeResult] = useVerifyCodeMutation();
  const [resendCode, resendCodeResult] = useResendVerificationCodeMutation();
  const [retrievePassword, retrievePasswordResult] = useRetrievePasswordMutation();
  const [resendPasswordResetCode, resendPasswordResetCodeResult] = useResendPasswordResetCodeMutation();
  const [resetPassword, resetPasswordResult] = useResetPasswordMutation();
  
  // Get email and username passed from registration page
  const userEmail = location.state?.email;
  const userName = location.state?.userName;
  const userRole = location.state?.role;
  const isPasswordReset = location.state?.isPasswordReset || false;
  
  // Add a state to track if verification is successful
  const [isVerified, setIsVerified] = useState(false);
  
  // Add error handling state
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  // Add a state to track if the page is ready to render
  const [isReady, setIsReady] = useState(false);
  
  // Add ref to track if success modal has been displayed
  const successModalDisplayed = useRef(false);
  
  // Add a flag to indicate if manual verification has been attempted
  const [hasManuallyVerified, setHasManuallyVerified] = useState(false);
  
  // Add a ref to track if the modal should be forcibly displayed
  const forceShowSuccess = useRef(false);
  
  // Page initialization complete
  useEffect(() => {
    // Set page initialization flag - add a longer delay
    const timer = setTimeout(() => {
      setIsPageInitialized(true);
    }, 2000); // Extended to 2 seconds to give page sufficient loading time
    
    return () => clearTimeout(timer);
  }, []);
  
  // Page visibility change monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 只有在用户已经手动点击过"重发"按钮，且倒计时大于0但不活跃时，才重启倒计时
        if (!isCountdownActive && countdown > 0) {
          startCountdown(countdown);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCountdownActive, countdown, startCountdown]);
  
  // If there's no email information, redirect back to registration or forgot password page
  useEffect(() => {
    // Add a small delay to ensure state has fully loaded
    const timer = setTimeout(() => {
      if (!userEmail) {
        if (isPasswordReset) {
          navigate('/forgot-password');
        } else {
          navigate('/register');
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [userEmail, userRole, isPasswordReset, navigate]);
  
  // First page load countdown check
  useEffect(() => {
    // 移除自动启动倒计时的逻辑
    // 我们只希望在用户点击"重发验证码"按钮时才启动倒计时
    // 不再需要此效果
  }, []);
  
  // Load reCAPTCHA Enterprise script
  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="recaptcha/enterprise.js"]')) {
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/enterprise.js?render=6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y';
    script.async = true;
    script.id = 'recaptcha-script';
    document.body.appendChild(script);
    
    return () => {
      // Don't remove the script when unmounting the component, as other pages may need to use it
      // Only output logs in development environment
      if (process.env.NODE_ENV !== 'production') {
        // Script remains for other components
      }
    };
  }, []);

  // 45-minute timeout check - completely rewritten this part
  useEffect(() => {
    let timeoutId;
    
    // Only set timeout when page is initialized, verification hasn't succeeded, and email information exists
    if (isPageInitialized && !isVerified && userEmail && countdown > 0) {
      // Set 45-minute timeout (45 * 60 * 1000 = 2700000 milliseconds)
      timeoutId = setTimeout(() => {
        // Double-check conditions to avoid incorrect display
        // Add additional condition: ensure other modals aren't displayed
        if (!isVerified && !isSuccessModalVisible && !isErrorModalVisible) {
          // Clean up other possible modals to ensure only timeout modal is displayed
          hideErrorModal();
          hideSuccessModal();
          showTimeoutModal(); 
        }
      }, 2700000); // 45-minute timeout
    }
    
    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  // Reduce dependencies, only keep necessary states
  }, [isPageInitialized, userEmail, isVerified, isSuccessModalVisible, isErrorModalVisible, countdown, showTimeoutModal, hideErrorModal, hideSuccessModal]);
  
  // Form control - 根据流程选择不同的验证规则
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(isPasswordReset ? resetPasswordSchema : codeSchema),
    defaultValues: isPasswordReset ? {
      code: '',
      password: '',
      confirmPassword: ''
    } : {
      code: ''
    }
  });

  // Create a function to clear all modals
  const clearAllModals = () => {
    hideErrorModal();
    hideSuccessModal();
    hideTimeoutModal();
  };
  
  // Validate code
  const validateCode = useCallback(async (code) => {
    // Clear any existing modals
    clearAllModals();
    
    if (!userEmail) {
      setErrorMessage('Missing required information. Please go back and try again.');
      showErrorModal();
      return false;
    }
    
    try {
      // Get reCAPTCHA token
      let recaptchaToken;
      try {
        if (!window.grecaptcha?.enterprise) {
          setErrorMessage('Security verification not loaded. Please refresh and try again.');
          showErrorModal();
          return false;
        }
        
        console.log("Executing reCAPTCHA");
        recaptchaToken = await executeReCaptcha('retrievePassword');
        console.log("reCAPTCHA token obtained:", recaptchaToken ? "yes" : "no");
        
        if (!recaptchaToken) {
          setErrorMessage('Failed to verify human presence. Please try again.');
          showErrorModal();
          return false;
        }
      } catch (error) {
        setErrorMessage('Security verification failed. Please try again.');
        showErrorModal();
        return false;
      }
      
      // Different validation based on whether it's password reset or registration
      let response;
      if (isPasswordReset) {
        // For password reset, just validate the code without completing registration
        response = await verifyCode({
          email: userEmail,
          code,
          headers: {
            'X-Recaptcha-Token': recaptchaToken,
            'X-Action': 'verifyResetCode'
          }
        }).unwrap();
      } else {
        // For registration, proceed with the regular verification process
        response = await verifyCode({
          email: userEmail,
          userName: userName || '',
          code,
          role: userRole || 'member',
          headers: {
            'X-Recaptcha-Token': recaptchaToken,
            'X-Action': 'verify'
          }
        }).unwrap();
      }
      
      if (response.code === 0) {
        // Different navigation based on flow
        if (isPasswordReset) {
          // For password reset, navigate to reset password page
          navigate('/reset-password', { 
            state: { 
              email: userEmail,
              verificationCode: code
            },
            replace: true 
          });
          return true;
        } else {
          // Regular registration success handling
          setIsVerified(true);
          showSuccessModal();
          successModalDisplayed.current = true;
          return true;
        }
      } else {
        setErrorMessage(response.msg || 'Verification failed. Please try again.');
        showErrorModal();
        return false;
      }
    } catch (error) {
      let errorMsg = 'An error occurred during verification.';
      
      // 优先使用后端返回的错误消息
      if (error.data && error.data.msg) {
        errorMsg = error.data.msg;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      showErrorModal();
      return false;
    }
  }, [userEmail, userName, userRole, isPasswordReset, executeReCaptcha, verifyCode, navigate, clearAllModals, showErrorModal, setErrorMessage, setIsVerified, showSuccessModal]);

  // Form submission
  const onSubmit = async (formData) => {
    setHasManuallyVerified(true);
    
    try {
      // Manually set loading state
      setVerifying(true);
      
      // Get reCAPTCHA token
      if (!isScriptLoaded || !window.grecaptcha?.enterprise) {
        message.error('Security verification not loaded. Please refresh and try again.');
        return;
      }
      
      // 根据不同流程选择不同的action值
      let recaptchaToken;
      if (isPasswordReset) {
        console.log("Executing reCAPTCHA for password reset");
        recaptchaToken = await executeReCaptcha('retrievePassword');
      } else {
        console.log("Executing reCAPTCHA for registration");
        recaptchaToken = await executeReCaptcha('sendCode');
      }
      
      if (!recaptchaToken) {
        message.error('Failed to verify human presence. Please try again.');
        return;
      }
      
      if (isPasswordReset) {
        // 密码重置流程 - 一次性验证码并重置密码
        const response = await resetPassword({
          email: userEmail,
          code: formData.code,
          password: formData.password,
          headers: {
            'X-Recaptcha-Token': recaptchaToken,
            'X-Action': 'retrievePassword'
          }
        }).unwrap();
        
        if (response.code === 0) {
          // 完全不显示任何消息，只在登录页面显示一次
          
          // 使用replace: true导航到登录页面，并设置一个唯一的message ID
          navigate('/login', { 
            replace: true,
            state: { 
              message: 'Your password has been reset. Please login with your new password.',
              messageId: Date.now() // 添加唯一ID防止重复
            }
          });
        } else {
          // 显示后端返回的错误消息
          message.error(response.msg || 'Failed to reset password, please try again later');
        }
      } else {
        // 注册流程验证
        const response = await verifyCode({
          email: userEmail,
          userName: userName || '',
          code: formData.code,
          role: userRole || 'member',
          headers: {
            'X-Recaptcha-Token': recaptchaToken,
            'X-Action': 'sendCode'
          }
        }).unwrap();
        
        if (response.code === 0) {
          // 注册验证成功
          setIsVerified(true);
          showSuccessModal();
          successModalDisplayed.current = true;
          
          // 创建庆祝效果
          const duration = 2 * 1000;
          const animationEnd = Date.now() + duration;

          // 简单彩带效果
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { x: 0.5, y: 0.5 }
          });

          // 设置定时器直接跳转
          setTimeout(() => {
            navigate('/login', {
              state: { 
                message: 'Registration successful! You can now login with your credentials.',
                messageId: Date.now()
              },
              replace: true
            });
          }, 2000);
        } else {
          message.error(response.msg || 'Verification failed. Please try again.');
        }
      }
    } catch (error) {
      let errorMsg = 'An error occurred during verification.';
      
      // 优先使用后端返回的错误消息
      if (error.data && error.data.msg) {
        errorMsg = error.data.msg;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      message.error(errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    console.log("Resend button clicked"); // 添加日志
    
    // Only allow resending when countdown is not active
    if (isCountdownActive) {
      console.log("Countdown active, not sending request");
      return;
    }
    
    // Get required information
    if (!userEmail) {
      console.log("No email provided");
      setErrorMessage('Missing required information. Please go back and try again.');
      showErrorModal();
      return;
    }
    
    try {
      // 直接设置loading状态而不是通过withResending
      setResending(true);
      
      // Get reCAPTCHA token
      let recaptchaToken;
      try {
        if (!window.grecaptcha?.enterprise) {
          console.log("reCAPTCHA not loaded");
          setErrorMessage('Security verification not loaded. Please refresh and try again.');
          showErrorModal();
          setResending(false);
          return;
        }
        
        // 根据不同流程选择不同的action值
        if (isPasswordReset) {
          console.log("Executing reCAPTCHA for password reset");
          recaptchaToken = await executeReCaptcha('retrievePassword');
        } else {
          console.log("Executing reCAPTCHA for registration");
          recaptchaToken = await executeReCaptcha('sendCode');
        }
        
        console.log("reCAPTCHA token obtained:", recaptchaToken ? "yes" : "no");
        
        if (!recaptchaToken) {
          console.log("Failed to get reCAPTCHA token");
          setErrorMessage('Failed to verify human presence. Please try again.');
          showErrorModal();
          setResending(false);
          return;
        }
      } catch (error) {
        console.error("reCAPTCHA error:", error);
        setErrorMessage('Security verification failed. Please try again.');
        showErrorModal();
        setResending(false);
        return;
      }
      
      console.log("Sending resend request, isPasswordReset:", isPasswordReset);
      let response;
      
      if (isPasswordReset) {
        // 密码重置流程 - 使用重新发送密码重置验证码的API
        console.log("Using password reset resend API");
        response = await resendPasswordResetCode({
          email: userEmail,
          headers: {
            'X-Recaptcha-Token': recaptchaToken,
            'X-Action': 'retrievePassword'
          }
        }).unwrap();
        console.log("Password reset resend response:", response);
      } else {
        // 注册流程 - 使用原有的重新发送验证码的API
        console.log("Using registration resend API");
        response = await resendCode({
          email: userEmail,
          headers: {
            'X-Recaptcha-Token': recaptchaToken,
            'X-Action': 'sendCode'
          }
        }).unwrap();
        console.log("Registration resend response:", response);
      }
      
      // Process response
      if (response.code === 0) {
        console.log("Resend successful");
        // Show success message
        message.success('Verification code resent successfully!');
        
        // 不需要在这里启动倒计时，在最后已经有一次了
        startCountdown(60);
      } else {
        console.log("Resend failed with code:", response.code, "message:", response.msg);
        // 显示后端返回的错误消息
        message.error(response.msg || 'Failed to resend verification code.');
        
        // 不要显示额外的错误弹窗，直接使用message组件显示错误
        // 这样更符合用户体验
      }
    } catch (error) {
      console.error("Resend request error:", error);
      let errorMsg = 'An error occurred while resending the code.';
      
      // 优先使用后端返回的错误消息
      if (error.data && error.data.msg) {
        errorMsg = error.data.msg;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      // 直接使用message组件显示错误，不使用弹窗
      message.error(errorMsg);
    } finally {
      setResending(false);
    }
  };

  // Handle timeout
  const handleTimeout = () => {
    hideTimeoutModal();
    if (isPasswordReset) {
      navigate('/forgot-password', { replace: true });
    } else {
      navigate('/register', { replace: true });
    }
  };

  // Error modal OK handler
  const handleErrorOk = () => {
    hideErrorModal();
  };

  // Back to login button handler
  const handleBackToLogin = () => {
    navigate('/login');
  };

  // Success modal handler
  const handleSuccessOk = () => {
    hideSuccessModal();
    navigate('/login', {
      state: { 
        message: 'Registration successful! You can now login with your credentials.',
        messageId: Date.now()
      },
      replace: true
    });
  };

  // Update page title based on flow
  const pageTitle = isPasswordReset ? "Reset Password" : "Verify Registration Code";

  return (
    <PageTransition>
      <div className="flex justify-center items-center min-h-screen" style={styles.container}>
        <Card className="w-full max-w-md shadow-md" style={styles.box}>
          <div className="text-center mb-6">
            <Title level={2} style={styles.title}>{pageTitle}</Title>
          </div>
          
          {/* Update description based on flow */}
          <p style={styles.description}>
            {isPasswordReset
              ? `We've sent a verification code to ${userEmail}. Please enter it below to reset your password.`
              : `We've sent a verification code to ${userEmail}. Please enter it below to complete your registration.`
            }
          </p>

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={styles.form}>
            <Form.Item
              label="Verification Code"
              validateStatus={errors.code ? 'error' : ''}
              help={errors.code?.message}
              style={styles.formItem}
            >
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter 6-digit code"
                    style={styles.input}
                    maxLength={6}
                    size="large"
                  />
                )}
              />
            </Form.Item>

            {isPasswordReset && (
              <>
                <Divider style={{ margin: '24px 0' }} />
                
                <Form.Item
                  label="New Password"
                  validateStatus={errors.password ? 'error' : ''}
                  help={errors.password?.message}
                  style={styles.formItem}
                >
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        placeholder="Enter your new password"
                        size="large"
                      />
                    )}
                  />
                </Form.Item>
                
                <Form.Item
                  label="Confirm Password"
                  validateStatus={errors.confirmPassword ? 'error' : ''}
                  help={errors.confirmPassword?.message}
                  style={styles.formItem}
                >
                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        placeholder="Confirm your new password"
                        size="large"
                      />
                    )}
                  />
                </Form.Item>
                
                <div style={styles.passwordRequirements}>
                  <p style={styles.passwordRequirementsTitle}>Password must contain:</p>
                  <ul style={styles.passwordRequirementsList}>
                    <li>At least 6 characters</li>
                    <li>At least one uppercase letter (A-Z)</li>
                    <li>At least one lowercase letter (a-z)</li>
                    <li>At least one number (0-9)</li>
                    <li>At least one special character (@$!%*?&)</li>
                  </ul>
                </div>
              </>
            )}

            <Form.Item style={{...styles.formItem, marginTop: '24px'}}>
              <Button
                type="primary"
                htmlType="submit"
                style={styles.verifyButton}
                loading={isVerifying || verifyCodeResult.isLoading || resetPasswordResult.isLoading}
                disabled={isVerifying || verifyCodeResult.isLoading || resetPasswordResult.isLoading}
              >
                {isPasswordReset ? 'Reset Password' : 'Verify Code'}
              </Button>
            </Form.Item>
          </Form>

          <div style={styles.resendContainer}>
            <Button
              type="link"
              onClick={() => {
                console.log("Resend button clicked in JSX");
                handleResendCode();
              }}
              disabled={isCountdownActive || isResending || resendCodeResult.isLoading || resendPasswordResetCodeResult.isLoading}
              style={styles.resendButton}
            >
              {isCountdownActive 
                ? `Resend code in ${countdown}s` 
                : (isResending || resendCodeResult.isLoading || resendPasswordResetCodeResult.isLoading) 
                  ? 'Sending...' 
                  : 'Resend verification code'}
            </Button>
          </div>
          
          <div style={styles.backToLoginContainer}>
            <Button
              type="link"
              onClick={handleBackToLogin}
              style={styles.backToLoginButton}
            >
              Back to Login
            </Button>
          </div>
        </Card>

        {/* Error Modal */}
        <Modal
          title="Verification Failed"
          open={isErrorModalVisible}
          onOk={handleErrorOk}
          onCancel={handleErrorOk}
          cancelButtonProps={{ style: { display: 'none' } }}
          okText="Try Again"
        >
          <p>{errorMessage || 'An error occurred during verification. Please try again.'}</p>
        </Modal>

        {/* Timeout Modal */}
        <Modal
          title="Verification Timeout"
          open={isTimeoutModalVisible}
          onOk={handleTimeout}
          onCancel={handleTimeout}
          cancelButtonProps={{ style: { display: 'none' } }}
          okText={isPasswordReset ? "Return to Forgot Password" : "Return to Registration"}
        >
          <p>
            {isPasswordReset 
              ? "The password reset verification process has timed out. Please start the process again."
              : "The verification process has timed out. Please start the registration process again."}
          </p>
        </Modal>

        {/* Success Modal */}
        <Modal
          title="Verification Successful"
          open={isSuccessModalVisible}
          onOk={handleSuccessOk}
          onCancel={handleSuccessOk}
          cancelButtonProps={{ style: { display: 'none' } }}
          okText="Continue"
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 60, color: '#52c41a' }} />
            <Title level={4} style={{ marginTop: 16 }}>Email Verified!</Title>
            <p>Your email has been successfully verified. You can now login with your account.</p>
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
    fontSize: '40px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '600',
    textAlign: 'center',
    color: '#003366',
    marginBottom: '20px',
  },
  description: {
    textAlign: 'center',
    marginBottom: '32px',
    fontSize: '14px',
    color: '#555',
  },
  form: {
    width: '100%'
  },
  formItem: {
    marginBottom: '16px'
  },
  input: {
    fontSize: '18px',
    textAlign: 'center',
    letterSpacing: '8px'
  },
  verifyButton: {
    width: '100%',
    height: '48px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: '#1976D2',
    border: 'none',
  },
  resendContainer: {
    textAlign: 'center',
    marginTop: '16px'
  },
  resendButton: {
    padding: '0'
  },
  backToLoginContainer: {
    textAlign: 'center',
    marginTop: '16px'
  },
  backToLoginButton: {
    padding: '0'
  },
  passwordRequirements: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'left',
  },
  passwordRequirementsTitle: {
    fontWeight: 'bold',
    marginBottom: '8px',
    fontSize: '14px',
  },
  passwordRequirementsList: {
    paddingLeft: '20px',
    margin: 0,
    fontSize: '12px',
    color: '#555',
  },
};

export default VerifyCode; 