import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useReCaptcha, useButtonLoading } from '../hooks';
import { useResetPasswordMutation } from '../store/api/authApi';
import PageTransition from '../components/PageTransition';

const { Title } = Typography;

// Form validation schema (same as registration)
const schema = yup.object({
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

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email and verification code from state
  const email = location.state?.email;
  const verificationCode = location.state?.verificationCode;
  
  // Redirect to login if no email or code
  if (!email || !verificationCode) {
    // Use effect for navigation to avoid rendering issues
    useState(() => {
      message.error('Missing required information. Please try the reset process again.');
      navigate('/forgot-password');
    });
    return null;
  }
  
  // Use custom hooks
  const { executeReCaptcha, isScriptLoaded, isInitialized, error: recaptchaError } = useReCaptcha('6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y');
  const [isLoading, setLoading, withLoading] = useButtonLoading(false);
  
  // Use RTK Query hook
  const [resetPassword, resetPasswordResult] = useResetPasswordMutation();
  
  // Form control
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    }
  });

  // Handle form submission
  const onSubmit = async (formData) => {
    if (!isScriptLoaded || !isInitialized) {
      message.error(recaptchaError || 'reCAPTCHA not ready, please refresh the page and try again');
      return;
    }
    
    try {
      // Manually set loading state
      setLoading(true);
      
      // Get reCAPTCHA token
      const recaptchaToken = await executeReCaptcha('resetPassword');
      
      // Send request to backend
      const response = await resetPassword({
        email,
        verificationCode,
        password: formData.password,
        headers: {
          'X-Recaptcha-Token': recaptchaToken,
          'X-Action': 'resetPassword'
        }
      }).unwrap();
      
      if (response.code === 0) {
        // Show success message
        message.success('Password has been successfully reset');
        
        // Navigate to login page
        navigate('/login', { 
          replace: true,
          state: { message: 'Your password has been reset. Please login with your new password.' }
        });
      } else {
        // Show error message
        message.error(response.msg || 'Failed to reset password, please try again later');
      }
    } catch (error) {
      let errorMessage = 'Failed to reset password';
      
      // Extract error message from response
      if (error.data) {
        errorMessage = error.data.msg || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show error message
      message.error(errorMessage);
    } finally {
      // Reset loading state
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex justify-center items-center min-h-screen" style={styles.container}>
        <Card className="w-full max-w-md shadow-md" style={styles.box}>
          <div className="text-center mb-6">
            <Title level={2} style={styles.title}>Reset Password</Title>
          </div>
          
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="New Password"
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => <Input.Password {...field} placeholder="Enter your new password" />}
              />
            </Form.Item>
            
            <Form.Item
              label="Confirm Password"
              validateStatus={errors.confirmPassword ? 'error' : ''}
              help={errors.confirmPassword?.message}
            >
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => <Input.Password {...field} placeholder="Confirm your new password" />}
              />
            </Form.Item>
            
            <Form.Item style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  ...styles.submitButton,
                  width: '80%',
                  margin: '0 auto',
                }}
                loading={isLoading || resetPasswordResult.isLoading}
                disabled={isLoading || resetPasswordResult.isLoading || !isScriptLoaded || !isInitialized}
              >
                {!isScriptLoaded || !isInitialized ? 'reCAPTCHA Loading...' : 'Reset Password'}
              </Button>
            </Form.Item>
          </Form>
          
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
    fontSize: '40px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '600',
    textAlign: 'center',
    color: '#003366',
    marginBottom: '20px',
  },
  submitButton: {
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

export default ResetPassword; 