import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSendVerificationCodeMutation } from '../store/api/authApi';
import { Form, Input, Button, Card, Typography, Select, DatePicker, Modal } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs'; // 导入dayjs，Ant Design v5使用的日期库

import PageTransition from '../components/PageTransition';

const { Title, Text } = Typography;
const { Option } = Select;

// Form validation rules (remains the same)
const schema = yup.object({
  userName: yup.string().required('Username is required'),
  gender: yup.number().required('Please select gender'),
  birthday: yup.mixed() // 使用mixed类型更灵活地处理日期
    .required('Please select birthday')
    .test('is-valid-date', 'Birthday cannot be in the future', (value) => {
      // 检查值是否存在
      if (!value) return false;
      
      // 如果是dayjs对象
      if (dayjs.isDayjs(value)) {
        return value.isBefore(dayjs());
      }
      
      // 如果是Date对象
      if (value instanceof Date) {
        return value <= new Date();
      }
      
      // 其他情况，尝试转换为dayjs并比较
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

  // 使用RTK Query hooks
  const [sendVerificationCode, sendCodeResult] = useSendVerificationCodeMutation();
  
  // 添加按钮加载状态
  const [isLoading, setIsLoading] = useState(false);

  // Load reCAPTCHA Enterprise script
  useEffect(() => {
    // 检查是否已经加载了脚本
    if (document.querySelector('script[src*="recaptcha/enterprise.js"]')) {
      console.log('reCAPTCHA script already loaded in Register page, skipping...');
      return;
    }
    
    console.log('Loading reCAPTCHA script in Register page...');
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/enterprise.js?render=6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y';
    script.async = true;
    script.id = 'recaptcha-script';
    script.onload = () => {
      console.log('reCAPTCHA script loaded successfully in Register page.');
    };
    script.onerror = (error) => {
      console.error('Error loading reCAPTCHA script in Register page:', error);
    };
    document.body.appendChild(script);
    
    return () => {
      // 不要在卸载组件时移除脚本，因为验证码页面会使用
      if (process.env.NODE_ENV !== 'production') {
        console.log('Register component unmounted, reCAPTCHA script remains for other components');
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
    console.log('Form submitted', formData);
    
    // 先检查是否已经在处理中，避免重复提交
    if (isLoading || sendCodeResult.isPending) {
      console.log('Request already in progress, ignoring');
      return;
    }
    
    if (!window.grecaptcha?.enterprise) {
      console.error('reCAPTCHA not loaded');
      setErrorMessage('reCAPTCHA is not ready, please wait...');
      setIsModalVisible(true);
      return;
    }
    
    try {
      // 设置加载状态
      setIsLoading(true);
      
      console.log('Getting reCAPTCHA token...');
      
      // 增加超时处理
      let recaptchaToken;
      try {
        // 给reCAPTCHA调用增加一个超时限制
        const tokenPromise = window.grecaptcha.enterprise.execute(
          '6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y',
          { action: 'sendCode' }
        );
        
        // 创建一个超时Promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('reCAPTCHA token request timed out')), 10000);
        });
        
        // 使用Promise.race来处理可能的超时
        recaptchaToken = await Promise.race([tokenPromise, timeoutPromise]);
        console.log('Token received', recaptchaToken.substring(0, 10) + '...');
      } catch (error) {
        console.error('Failed to get reCAPTCHA token:', error);
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
          console.warn('Unknown birthday format:', formData.birthday);
          try {
            formattedBirthday = dayjs(formData.birthday).format('YYYY-MM-DD');
          } catch (e) {
            console.error('Failed to format birthday:', e);
            formattedBirthday = dayjs().format('YYYY-MM-DD');
          }
        }
      } else {
        console.warn('No birthday provided');
        formattedBirthday = dayjs().format('YYYY-MM-DD');
      }
      
      console.log('Formatted birthday:', formattedBirthday);
      
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
      
      console.log('Sending data to API...', submitData);
      
      // 使用RTK Query mutation，添加更好的错误处理
      try {
        const data = await sendVerificationCode(submitData).unwrap();
        console.log('API Response:', data);
        
        if (data.code === 0) {
          // 添加调试日志
          console.log('跳转到验证码页面，传递数据:', { 
            email: data.data?.email || control._formValues.email,
            userName: control._formValues.userName,
            role: control._formValues.role
          });
          
          // 确保页面state参数正确传递
          const email = data.data?.email || control._formValues.email;
          const userName = control._formValues.userName;
          const role = control._formValues.role;
          
          // 添加短暂延迟，确保状态更新和API请求都已完成
          setTimeout(() => {
            // 使用replace而非push，防止后退
            navigate('/verify-code', { 
              state: { email, userName, role },
              replace: true
            });
            // 重置状态
            setIsLoading(false);
          }, 500);
        } else {
          setErrorMessage(data.msg || 'Registration failed');
          setIsModalVisible(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('API Error:', error);
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
        setIsLoading(false); // 重置加载状态
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsModalVisible(true);
      setIsLoading(false); // 重置加载状态
    }
  };
  
  // 在Modal关闭时重置加载状态
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
                        // 确保传递一个有效的日期对象给表单
                        field.onChange(date);
                        console.log("Selected date:", date); // 调试日志
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