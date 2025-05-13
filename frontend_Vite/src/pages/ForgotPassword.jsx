import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useReCaptcha, useButtonLoading } from '../hooks';
import { useRetrievePasswordMutation } from '../store/api/authApi';
import PageTransition from '../components/PageTransition';

const { Title } = Typography;

// Form validation schema
const schema = yup.object({
  email: yup.string().email('Please enter a valid email address').required('Email address is required'),
}).required();

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // Use custom hooks
  const { executeReCaptcha, isScriptLoaded, isInitialized, error: recaptchaError } = useReCaptcha('6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y');
  const [isLoading, setLoading, withLoading] = useButtonLoading(false);
  
  // Use RTK Query hook
  const [retrievePassword, retrievePasswordResult] = useRetrievePasswordMutation();
  
  // Form control
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
    }
  });

  // Handle form submission
  const onSubmit = async (formData) => {
    if (!isScriptLoaded || !isInitialized) {
      message.error(recaptchaError || 'reCAPTCHA not ready, please refresh the page and try again');
      return;
    }
    
    try {
      console.log("Submitting forgot password request for email:", formData.email);
      // Manually set loading state
      setLoading(true);
      
      // Get reCAPTCHA token
      const recaptchaToken = await executeReCaptcha('retrievePassword');
      console.log("reCAPTCHA token obtained:", !!recaptchaToken);
      
      // Send request to backend
      console.log("Sending retrieve password request to /auth/retrieve/password");
      const response = await retrievePassword({
        email: formData.email,
        headers: {
          'X-Recaptcha-Token': recaptchaToken,
          'X-Action': 'retrievePassword'
        }
      }).unwrap();
      
      console.log("Retrieve password response:", response);
      
      if (response.code === 0) {
        // Show success message
        message.success('Verification code has been sent to your email');
        
        // Navigate to verification page
        navigate('/verify-code', { 
          state: { 
            email: formData.email,
            isPasswordReset: true 
          },
          replace: true 
        });
      } else {
        // Show error message
        message.error(response.msg || 'Failed to send verification code, please try again later');
      }
    } catch (error) {
      console.error("Retrieve password error:", error);
      let errorMessage = 'Failed to send verification code';
      
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
            <Title level={2} style={styles.title}>Forgot Password</Title>
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
            
            <Form.Item style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  ...styles.submitButton,
                  width: '80%',
                  margin: '0 auto',
                }}
                loading={isLoading || retrievePasswordResult.isLoading}
                disabled={isLoading || retrievePasswordResult.isLoading || !isScriptLoaded || !isInitialized}
              >
                {!isScriptLoaded || !isInitialized ? 'reCAPTCHA Loading...' : 'Send Verification Code'}
              </Button>
            </Form.Item>
          </Form>
          
          <div style={styles.footerText}>
            <span>Back to </span>
            <Button 
              type="link" 
              onClick={() => navigate('/login')} 
              style={styles.loginLink}
              disabled={isLoading || retrievePasswordResult.isLoading}
            >
              Sign In
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
  footerText: {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: '14px',
    color: '#555',
  },
  loginLink: {
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'transform 0.3s ease',
    ':hover': {
      transform: 'scale(1.1)',
    }
  },
};

export default ForgotPassword; 