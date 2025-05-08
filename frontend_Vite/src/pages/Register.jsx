import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSendVerificationCodeMutation } from '../store/api/authApi';
import { Form, Input, Button, Card, Typography, Select, DatePicker, Modal } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs'; // Import dayjs, date library used by Ant Design v5

import PageTransition from '../components/PageTransition';

const { Title, Text } = Typography;
const { Option } = Select;

// Form validation rules (remains the same)
const schema = yup.object({
  userName: yup.string().required('Username is required'),
  gender: yup.number().required('Please select gender'),
  birthday: yup.mixed() // Use mixed type for more flexibility with dates
    .required('Please select birthday')
    .test('is-valid-date', 'Birthday cannot be in the future', (value) => {
      // Check if value exists
      if (!value) return false;
      
      // If it's a dayjs object
      if (dayjs.isDayjs(value)) {
        return value.isBefore(dayjs());
      }
      
      // If it's a Date object
      if (value instanceof Date) {
        return value <= new Date();
      }
      
      // Other cases, try to convert to dayjs and compare
      try {
        return dayjs(value).isBefore(dayjs());
      } catch (e) {
        return false;
      }
    }),
  address: yup.string(),
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email address is required'),
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
  role: yup.string()
    .required('Please select your role')
    .oneOf(['member', 'coach'], 'Invalid role selected'),
}).required();

const Register = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Use RTK Query hooks
  const [sendVerificationCode, sendCodeResult] = useSendVerificationCodeMutation();
  
  // Add button loading state
  const [isLoading, setIsLoading] = useState(false);

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
      // Don't remove the script when unmounting the component as verification page will use it
      if (process.env.NODE_ENV !== 'production') {
        // Script remains for other components
      }
    };
  }, []);

  // Form control
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      userName: '',
      gender: undefined,
      birthday: null,
      address: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: undefined,
    }
  });

  // Handle form submission
  const onSubmit = async (formData) => {
    // First check if already processing to avoid duplicate submissions
    if (isLoading || sendCodeResult.isPending) {
      return;
    }
    
    if (!window.grecaptcha?.enterprise) {
      setErrorMessage('reCAPTCHA is not ready, please wait...');
      setIsModalVisible(true);
      return;
    }
    
    try {
      // Set loading state
      setIsLoading(true);
      
      // Add timeout handling
      let recaptchaToken;
      try {
        // Add a timeout limit for reCAPTCHA call
        const tokenPromise = window.grecaptcha.enterprise.execute(
          '6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y',
          { action: 'sendCode' }
        );
        
        // Create a timeout Promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('reCAPTCHA token request timed out')), 10000);
        });
        
        // Use Promise.race to handle potential timeout
        recaptchaToken = await Promise.race([tokenPromise, timeoutPromise]);
      } catch (error) {
        setErrorMessage('Failed to verify human presence. Please try again.');
        setIsModalVisible(true);
        setIsLoading(false);
        return;
      }
      
      let formattedBirthday = '';
      if (formData.birthday) {
        if (dayjs.isDayjs(formData.birthday)) {
          formattedBirthday = formData.birthday.format('YYYY-MM-DD');
        } 
        else if (formData.birthday._isAMomentObject) {
          formattedBirthday = formData.birthday.format('YYYY-MM-DD');
        } 
        else if (formData.birthday instanceof Date) {
          formattedBirthday = dayjs(formData.birthday).format('YYYY-MM-DD');
        } 
        else if (typeof formData.birthday === 'string') {
          formattedBirthday = formData.birthday;
        } 
        else {
          try {
            formattedBirthday = dayjs(formData.birthday).format('YYYY-MM-DD');
          } catch (e) {
            formattedBirthday = dayjs().format('YYYY-MM-DD');
          }
        }
      } else {
        formattedBirthday = dayjs().format('YYYY-MM-DD');
      }
      
      const submitData = {
        ...formData,
        gender: Number(formData.gender),
        birthday: formattedBirthday,
        role: formData.role,
        headers: {
          'X-Recaptcha-Token': recaptchaToken,
          'X-Action': 'sendCode'
        }
      };
      
      // Use RTK Query mutation with better error handling
      try {
        const data = await sendVerificationCode(submitData).unwrap();
        
        if (data.code === 0) {
          // Ensure page state parameters are correctly passed
          const email = data.data?.email || control._formValues.email;
          const userName = control._formValues.userName;
          const role = control._formValues.role;
          
          // Add a short delay to ensure state updates and API requests are completed
          setTimeout(() => {
            // Use replace instead of push to prevent going back
            navigate('/verify-code', { 
              state: { email, userName, role },
              replace: true
            });
            // Reset state
            setIsLoading(false);
          }, 500);
        } else {
          setErrorMessage(data.msg || 'Registration failed');
          setIsModalVisible(true);
          setIsLoading(false);
        }
      } catch (error) {
        let errorMessage = 'Registration failed';
        if (error.data) {
          errorMessage = error.data.msg || errorMessage;
        } else if (error.response && error.response.data) {
          errorMessage = error.response.data.msg || errorMessage;
        } else if (error.message) {
          errorMessage = error.message;
        }
        setErrorMessage(errorMessage);
        setIsModalVisible(true);
        setIsLoading(false); // Reset loading state
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsModalVisible(true);
      setIsLoading(false); // Reset loading state
    }
  };
  
  // Reset loading state when Modal closes
  const handleModalClose = () => {
    setIsModalVisible(false);
    setIsLoading(false);
  };

  return (
    <PageTransition isVisible={!isLoginPage}>
      <div style={styles.container}>
        <div style={styles.leftPanel}>
          <Title level={2} style={styles.title}>Join the Fitness Revolution</Title>
          <Text style={styles.subtitle}>Create your free account and start your journey toward a healthier, stronger you!</Text>
          <ul style={styles.benefitsList}>
            <li>Track your workouts and progress</li>
            <li>Connect with personal coaches</li>
            <li>Earn badges and rewards</li>
            <li>Stay motivated every day</li>
          </ul>
        </div>
        <div style={styles.rightPanel}>
          <div style={styles.formContainer}>
            <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
              <Form.Item
                label="I want to register as"
                validateStatus={errors.role ? 'error' : ''}
                help={errors.role?.message}
              >
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      placeholder="Select your role"
                      {...field}
                      style={{ width: '100%' }}
                    >
                      <Option value="member">Member</Option>
                      <Option value="coach">Coach</Option>
                    </Select>
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Name"
                validateStatus={errors.userName ? 'error' : ''}
                help={errors.userName?.message}
              >
                <Controller
                  name="userName"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="Enter your name" />}
                />
              </Form.Item>

              <Form.Item
                label="Gender"
                validateStatus={errors.gender ? 'error' : ''}
                help={errors.gender?.message}
              >
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      placeholder="Select gender"
                      {...field}
                    >
                      <Option value={0}>Male</Option>
                      <Option value={1}>Female</Option>
                    </Select>
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Birthday"
                validateStatus={errors.birthday ? 'error' : ''}
                help={errors.birthday?.message}
              >
                <Controller
                  name="birthday"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={(date) => {
                        // Ensure a valid date object is passed to the form
                        field.onChange(date);
                      }}
                      onBlur={field.onBlur}
                      placeholder="Select birthday"
                      style={{ width: '100%' }}
                      disabledDate={(current) => current && current > new Date()}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Address"
                validateStatus={errors.address ? 'error' : ''}
                help={errors.address?.message}
              >
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="Enter your address" />}
                />
              </Form.Item>

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
                  render={({ field }) => (
                    <Input.Password {...field} placeholder="Enter password" />
                  )}
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
                  render={({ field }) => <Input.Password {...field} placeholder="Confirm password" />}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={styles.registerButton}
                  loading={isLoading || sendCodeResult.isPending}
                  disabled={isLoading || sendCodeResult.isPending}
                >
                  Register
                </Button>
              </Form.Item>
            </Form>
            
            <div style={styles.footerText}>
              Already have an account? 
              <Button 
                type="link" 
                onClick={() => navigate('/login')} 
                style={styles.loginLink}
                disabled={isLoading || sendCodeResult.isPending}
              >
                Login
              </Button>
            </div>
          </div>
        </div>

        <Modal
          title="Registration Failed"
          open={isModalVisible}
          onOk={handleModalClose}
          onCancel={handleModalClose}
          cancelButtonProps={{ style: { display: 'none' } }}
          okText="Retry"
        >
          <p>{errorMessage || 'Registration failed, please try again.'}</p>
        </Modal>
      </div>
    </PageTransition>
  );
};

// Updated Styles
const styles = {
  container: {
    background: '#E3F2FD',
    display: 'flex',
    height: '100vh',
    width: '100%',
    margin: 0,
    padding: 0,
    fontFamily: "'Inter', sans-serif",
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  leftPanel: {
    width: '50%',
    backgroundColor: '#2081E2',
    color: 'white',
    padding: '50px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  rightPanel: {
    width: '50%',
    backgroundColor: '#E3F2FD',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    minWidth: '50%',
    flex: 1,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '40px',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  title: {
    color: 'white',
    fontSize: '2.5rem',
    marginBottom: '20px',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '1rem',
    marginBottom: '30px',
  },
  benefitsList: {
    color: 'white',
    listStyleType: 'disc',
    paddingLeft: '20px',
    fontSize: '1rem',
    lineHeight: 2,
  },
  registerButton: {
    width: '100%',
    height: '50px',
    backgroundColor: '#2081E2',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
  },
  footerText: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#6c757d',
  },
  loginLink: {
    color: '#2081E2',
    fontWeight: 600,
    marginLeft: '5px',
  },
};

export default Register;