import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, DatePicker, Select } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';
import { useCompleteProfileMutation } from '../store/api/authApi';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import { getRedirectPath } from '../utils/routeUtils';
import PageTransition from '../components/PageTransition';

const { Title } = Typography;
const { Option } = Select;

// Form validation schema
const schema = yup.object({
  userName: yup.string().required('Username is required'),
  gender: yup.number().required('Gender is required'),
  birthday: yup.date()
    .required('Birthday is required')
    .max(new Date(), 'Birthday cannot be in the future'),
  address: yup.string().required('Address is required'),
  role: yup.string().required('Role is required'),
}).required();

const CompleteProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  
  // Use RTK Query mutation
  const [completeProfile] = useCompleteProfileMutation();
  
  // Get email from location state
  const email = location.state?.email;
  
  // If no email, redirect to login page
  if (!email) {
    navigate('/login', { replace: true });
    return null;
  }
  
  // Form control
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      userName: '',
      gender: undefined,
      birthday: null,
      address: '',
      role: undefined,
    }
  });

  // Handle form submission
  const onSubmit = async (formData) => {
    try {
      setIsLoading(true);
      
      // Convert date format and add email
      const submitData = {
        ...formData,
        birthday: formData.birthday ? dayjs(formData.birthday).format('YYYY-MM-DD') : null,
        email: email, // Add email to submission data
      };
      
      const response = await completeProfile(submitData).unwrap();
      
      if (response && response.code === 0) {
        // Get user information
        const userInfo = response.data?.userInfo || {};
        
        // Get token and role from userInfo
        const token = userInfo.token;
        const userType = userInfo.role;
        const userName = userInfo.userName || 'User';
        
        if (!token) {
          message.error('Profile completed but no token received');
          return;
        }

        // Auto login: dispatch login success action
        dispatch(loginSuccess({
          token,
          userType,
          userName
        }));

        message.success('Profile completed successfully!');
        
        // Use utility function to get redirect path
        const redirectPath = getRedirectPath(userType);
        
        // Add a small delay to ensure Redux store has updated
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100);
      } else {
        message.error(response?.msg || 'Failed to complete profile');
      }
    } catch (error) {
      // Handle error response
      const errorMessage = error?.data?.msg || error?.message || 'An error occurred while completing your profile';
      message.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Disable future dates
  const disabledDate = (current) => {
    return current && current > dayjs().endOf('day');
  };

  return (
    <PageTransition>
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md shadow-md">
          <div className="text-center mb-6">
            <Title level={2}>Complete Your Profile</Title>
            <p className="text-gray-600">Please provide your basic information to continue</p>
          </div>
          
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="Username"
              validateStatus={errors.userName ? 'error' : ''}
              help={errors.userName?.message}
            >
              <Controller
                name="userName"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter your username" />}
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
                  <Select {...field} placeholder="Select your gender">
                    <Option value={1}>Male</Option>
                    <Option value={2}>Female</Option>
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
                    {...field}
                    style={{ width: '100%' }}
                    placeholder="Select your birthday"
                    disabledDate={disabledDate}
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
              label="Role"
              validateStatus={errors.role ? 'error' : ''}
              help={errors.role?.message}
            >
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Select your role">
                    <Option value="member">Member</Option>
                    <Option value="trainer">Trainer</Option>
                  </Select>
                )}
              />
            </Form.Item>
            
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                className="w-full"
              >
                Complete Profile
              </Button>
            </Form.Item>

            <Form.Item>
              <Button
                type="link"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Back to Login
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </PageTransition>
  );
};

export default CompleteProfile; 