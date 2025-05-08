import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Modal, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import confetti from 'canvas-confetti';
import { useReCaptcha, useModalState, useButtonLoading, useCountdown } from '../hooks';
import { CheckCircleOutlined } from '@ant-design/icons';

import { 
  useVerifyCodeMutation, 
  useResendVerificationCodeMutation 
} from '../store/api/authApi';

const { Title } = Typography;

// Form validation rules
const schema = yup.object({
  code: yup.string()
    .required('Please enter the verification code')
    .matches(/^\d{6}$/, 'The verification code must be 6 digits')
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
  
  // Get email and username passed from registration page
  const userEmail = location.state?.email;
  const userName = location.state?.userName;
  const userRole = location.state?.role;
  
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
        // Only restart countdown if it was in progress but not active
        if (!isCountdownActive && countdown > 0 && userEmail && userRole) {
          startCountdown(countdown);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCountdownActive, countdown, userEmail, userRole, startCountdown]);
  
  // If there's no email information, redirect back to registration page
  useEffect(() => {
    // Add a small delay to ensure state has fully loaded
    const timer = setTimeout(() => {
      if (!userEmail || !userRole) {
        navigate('/register');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [userEmail, userRole, navigate]);
  
  // First page load countdown check
  useEffect(() => {
    // Only start countdown when page first loads
    if (userEmail && userRole && !isCountdownActive) {
      startCountdown(60);
    }
  }, [userEmail, userRole, isCountdownActive, startCountdown]);
  
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
    
    // Only set timeout when page is initialized, verification hasn't succeeded, and email and role information exist
    // Add stricter conditional checks to ensure timeout modal isn't displayed right when the page loads
    if (isPageInitialized && !isVerified && userEmail && userRole && countdown > 0) {
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
  }, [isPageInitialized, userEmail, userRole, isVerified, isSuccessModalVisible, isErrorModalVisible, countdown, showTimeoutModal, hideErrorModal, hideSuccessModal]);
  
  // Form control
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
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
    
    if (!userEmail || !userName || !userRole) {
      setErrorMessage('Missing required information. Please go back to registration.');
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
        
        recaptchaToken = await executeReCaptcha('verify_code');
        
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
      
      // Prepare verification data
      const verificationData = {
        email: userEmail,
        code,
        userName,
        role: userRole,
        headers: {
          'X-Recaptcha-Token': recaptchaToken,
          'X-Action': 'verifyCode'
        }
      };
      
      // Call verification API
      const response = await verifyCode(verificationData).unwrap();
      
      // Process response
      if (response.code === 0) {
        setIsVerified(true);
        return true;
      } else {
        setErrorMessage(response.msg || 'Verification failed. Please try again.');
        showErrorModal();
        return false;
      }
    } catch (error) {
      let errorMsg = 'An error occurred during verification.';
      
      if (error.data?.msg) {
        errorMsg = error.data.msg;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      showErrorModal();
      return false;
    }
  }, [userEmail, userName, userRole, executeReCaptcha, verifyCode, showErrorModal, clearAllModals]);

  // Form submission
  const onSubmit = async (formData) => {
    setHasManuallyVerified(true);
    
    const success = await withVerifying(() => validateCode(formData.code));
    
    if (success) {
      // Display success modal
      showSuccessModal();
      successModalDisplayed.current = true;
      
      // Create celebration effect
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          // After confetti, navigate to complete profile page
          setTimeout(() => {
            navigate('/complete-profile', {
              state: { 
                email: userEmail,
                userName,
                role: userRole,
                verified: true
              },
              replace: true
            });
          }, 2000);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Use confetti for celebration
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    // Only allow resending when countdown is not active
    if (isCountdownActive) {
      return;
    }
    
    // Get required information
    if (!userEmail || !userName) {
      setErrorMessage('Missing required information. Please go back to registration.');
      showErrorModal();
      return;
    }
    
    const success = await withResending(async () => {
      try {
        // Get reCAPTCHA token
        let recaptchaToken;
        try {
          if (!window.grecaptcha?.enterprise) {
            setErrorMessage('Security verification not loaded. Please refresh and try again.');
            showErrorModal();
            return false;
          }
          
          recaptchaToken = await executeReCaptcha('resend_code');
          
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
        
        // Prepare resend data
        const resendData = {
          email: userEmail,
          role: userRole,
          userName,
          headers: {
            'X-Recaptcha-Token': recaptchaToken,
            'X-Action': 'resendCode'
          }
        };
        
        // Call resend API
        const response = await resendCode(resendData).unwrap();
        
        // Process response
        if (response.code === 0) {
          // Show success message
          message.success('Verification code resent successfully!');
          
          // Start countdown
          startCountdown(60);
          return true;
        } else {
          setErrorMessage(response.msg || 'Failed to resend verification code.');
          showErrorModal();
          return false;
        }
      } catch (error) {
        let errorMsg = 'An error occurred while resending the code.';
        
        if (error.data?.msg) {
          errorMsg = error.data.msg;
        } else if (error.message) {
          errorMsg = error.message;
        }
        
        setErrorMessage(errorMsg);
        showErrorModal();
        return false;
      }
    });
    
    if (success) {
      // Start countdown after successful resend
      startCountdown(60);
    }
  };

  // Handle timeout
  const handleTimeout = () => {
    hideTimeoutModal();
    navigate('/register', { replace: true });
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
    navigate('/complete-profile', {
      state: { 
        email: userEmail,
        userName,
        role: userRole,
        verified: true
      },
      replace: true
    });
  };

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <Title level={3} style={styles.title}>Verify Your Email</Title>
        <p style={styles.description}>
          We've sent a 6-digit code to <strong>{userEmail}</strong>.<br />
          Please enter the code below to verify your email.
        </p>

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={styles.form}>
          <Form.Item
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

          <Form.Item style={styles.formItem}>
            <Button
              type="primary"
              htmlType="submit"
              style={styles.verifyButton}
              loading={isVerifying}
              disabled={isVerifying}
            >
              Verify Code
            </Button>
          </Form.Item>
        </Form>

        <div style={styles.resendContainer}>
          <Button
            type="link"
            onClick={handleResendCode}
            disabled={isCountdownActive || isResending}
            style={styles.resendButton}
          >
            {isCountdownActive 
              ? `Resend code in ${countdown}s` 
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
        okText="Return to Registration"
      >
        <p>The verification process has timed out. Please start the registration process again.</p>
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
          <p>Your email has been successfully verified. Please continue to complete your profile.</p>
        </div>
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: '20px'
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  title: {
    textAlign: 'center',
    marginBottom: 24
  },
  description: {
    textAlign: 'center',
    marginBottom: 32
  },
  form: {
    width: '100%'
  },
  formItem: {
    marginBottom: 16
  },
  input: {
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8
  },
  verifyButton: {
    width: '100%',
    height: 48
  },
  resendContainer: {
    textAlign: 'center',
    marginTop: 16
  },
  resendButton: {
    padding: 0
  },
  backToLoginContainer: {
    textAlign: 'center',
    marginTop: 16
  },
  backToLoginButton: {
    padding: 0
  }
};

export default VerifyCode; 