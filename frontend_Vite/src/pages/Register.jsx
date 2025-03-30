import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Form, Input, Button, Card, Typography, Select, DatePicker, Modal } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs'; // 导入dayjs，Ant Design v5使用的日期库

import { sendVerificationCode } from '../api/authApi';

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
}).required();

const Register = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

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
      userName: '',
      gender: undefined,
      birthday: null,
      address: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  // Send verification code request
  const sendCodeMutation = useMutation({
    mutationFn: sendVerificationCode,
    onSuccess: (data) => {
      console.log('API Response:', data); // 调试日志
      if (data.code === 0) {
        navigate('/verify-code', { 
          state: { 
            email: data.data?.email || control._formValues.email,
            userName: control._formValues.userName
          } 
        });
      } else {
        setErrorMessage(data.msg);
        setIsModalVisible(true);
      }
    },
    onError: (error) => {
      console.error('API Error:', error); // 调试日志
      let errorMessage = 'Registration failed';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.msg || errorMessage;
      }
      setErrorMessage(errorMessage);
      setIsModalVisible(true);
    }
  });

  // Handle form submission
  const onSubmit = async (formData) => {
    // 调试日志
    console.log('Form submitted', formData);
    
    if (!window.grecaptcha?.enterprise) {
      console.error('reCAPTCHA not loaded'); // 调试日志
      setErrorMessage('reCAPTCHA is not ready, please wait...');
      setIsModalVisible(true);
      return;
    }
    
    try {
      console.log('Getting reCAPTCHA token...'); // 调试日志
      
      // Get reCAPTCHA token
      const recaptchaToken = await window.grecaptcha.enterprise.execute(
        '6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y',
        { action: 'sendCode' }
      );
      
      console.log('Token received', recaptchaToken.substring(0, 10) + '...'); // 调试日志，只显示token的前10个字符
      
      // 处理生日数据，确保在提交前正确转换格式
      let formattedBirthday = '';
      if (formData.birthday) {
        // 检查是否是dayjs对象
        if (dayjs.isDayjs(formData.birthday)) {
          formattedBirthday = formData.birthday.format('YYYY-MM-DD');
        } 
        // 检查是否是Moment对象
        else if (formData.birthday._isAMomentObject) {
          formattedBirthday = formData.birthday.format('YYYY-MM-DD');
        } 
        // 检查是否是JavaScript Date对象
        else if (formData.birthday instanceof Date) {
          formattedBirthday = dayjs(formData.birthday).format('YYYY-MM-DD');
        } 
        // 检查是否是字符串
        else if (typeof formData.birthday === 'string') {
          formattedBirthday = formData.birthday;
        } 
        // 如果是其他未知类型，则尝试转换
        else {
          console.warn('Unknown birthday format:', formData.birthday);
          try {
            formattedBirthday = dayjs(formData.birthday).format('YYYY-MM-DD');
          } catch (e) {
            console.error('Failed to format birthday:', e);
            formattedBirthday = dayjs().format('YYYY-MM-DD'); // 使用当前日期作为备选
          }
        }
      } else {
        console.warn('No birthday provided');
        formattedBirthday = dayjs().format('YYYY-MM-DD'); // 使用当前日期作为备选
      }
      
      console.log('Formatted birthday:', formattedBirthday); // 调试日志
      
      const submitData = {
        ...formData,
        gender: Number(formData.gender),
        birthday: formattedBirthday, // 使用处理后的生日格式
        headers: {
          'X-Recaptcha-Token': recaptchaToken,
          'X-Action': 'sendCode'
        }
      };
      
      console.log('Sending data to API...', submitData); // 调试日志
      sendCodeMutation.mutate(submitData);
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      setErrorMessage('Human verification failed, please refresh the page and try again');
      setIsModalVisible(true);
    }
  };

  return (
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
                loading={sendCodeMutation.isPending}
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
            >
              Login
            </Button>
          </div>
        </div>
      </div>

      <Modal
        title="Registration Failed"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="Retry"
      >
        <p>{errorMessage || 'Registration failed, please try again.'}</p>
      </Modal>
    </div>
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