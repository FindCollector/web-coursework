import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Select, DatePicker, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const RegisterPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isVerificationVisible, setIsVerificationVisible] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/enterprise.js?render=6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleRegister = () => {
    form.validateFields().then(() => {
      setIsVerificationVisible(true);
    });
  };

  const sendCode = () => {
    const email = form.getFieldValue('email');
    if (!email) return message.error("Email is required");
    message.success(`Verification code sent to ${email}`);
    setTimer(60);
  };

  const handleVerifyAndSubmit = async () => {
    if (emailCode !== '123456') {
      message.error('Invalid verification code');
      return;
    }

    if (!window.grecaptcha?.enterprise) {
      message.error("reCAPTCHA not ready, please wait...");
      return;
    }

    let recaptchaToken = '';
    try {
      recaptchaToken = await window.grecaptcha.enterprise.execute(
        '6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y',
        { action: 'register' }
      );
    } catch (err) {
      console.error("reCAPTCHA error:", err);
      message.error("reCAPTCHA failed. Please try again.");
      return;
    }

    setIsVerificationVisible(false);
    setIsModalVisible(true);
  };

  const handleReturn = () => {
    const duration = 2 * 1000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    setTimeout(() => navigate('/welcome'), duration);
  };

  const passwordRules = [
    { required: true, message: 'Please enter your password' },
    {
      validator(_, value) {
        if (!value) return Promise.reject('Please enter your password');

        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecial = /[^A-Za-z0-9]/.test(value);
        const isLongEnough = value.length >= 6;

        if (!isLongEnough) {
          return Promise.reject('Password must be at least 6 characters long');
        }
        if (!hasUpper || !hasLower) {
          return Promise.reject('Password must include both uppercase and lowercase letters');
        }
        if (!hasNumber) {
          return Promise.reject('Password must include at least one number');
        }
        if (!hasSpecial) {
          return Promise.reject('Password must include at least one special character');
        }

        return Promise.resolve();
      }
    }
  ];

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.leftPane}>
          <Title level={2} style={{ color: 'white' }}>Join the Fitness Revolution</Title>
          <Paragraph style={{ color: 'white', fontSize: '16px' }}>
            Create your free account and start your journey toward a healthier, stronger you! With our app, you’ll gain the tools and motivation to crush your fitness goals.
          </Paragraph>
          <ul style={{ color: 'white', fontSize: '16px' }}>
            <li>Track your workouts and progress</li>
            <li>Connect with personal coaches</li>
            <li>Earn badges and rewards</li>
            <li>Stay motivated every day</li>
          </ul>
        </div>

        <div style={styles.rightPane}>
          <Form layout="vertical" form={form} style={styles.form}>
            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter your name' }]}> 
              <Input placeholder="Enter your name" />
            </Form.Item>
            <Form.Item label="Gender" name="gender" rules={[{ required: true, message: 'Please select your gender' }]}> 
              <Select placeholder="Select gender">
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Birthday" name="birthday" rules={[{ required: true, message: 'Please select your birthday' }]}> 
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Address" name="address" rules={[{ required: true, message: 'Please enter your address' }]}> 
              <Input placeholder="Enter your address" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Please enter your email' }]}> 
              <Input placeholder="Enter your email" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={passwordRules}> 
              <Input.Password placeholder="Enter your password" />
            </Form.Item>
            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm your password" />
            </Form.Item>
            <Form.Item style={{ marginBottom: '20px' }}>
              <Button type="primary" block style={styles.nextButton} onClick={handleRegister}>Next</Button>
            </Form.Item>
          </Form>
          <div style={styles.footerText}>
            Already have an account? <Button type="link" onClick={() => navigate('/login')} style={styles.signInLink}>Sign in</Button>
          </div>
        </div>
      </div>

      <Modal
        title="Verify Your Email"
        open={isVerificationVisible}
        onCancel={() => setIsVerificationVisible(false)}
        footer={null}
        closable
      >
        <Form layout="vertical">
          <Form.Item label="Email">
            <Input value={form.getFieldValue('email')} disabled />
          </Form.Item>
          <Form.Item label="Verification Code">
            <div style={{ display: 'flex', gap: '10px' }}>
              <Input placeholder="Enter code" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} />
              <Button disabled={timer > 0} onClick={sendCode} type="primary">
                {timer > 0 ? `${timer}s` : 'Send Code'}
              </Button>
            </div>
          </Form.Item>
          <Button type="primary" block onClick={handleVerifyAndSubmit}>Confirm</Button>
        </Form>
      </Modal>

      <Modal title="Welcome to our club! 🎉" open={isModalVisible} footer={null} closable={false}>
        <p>Thank you for signing up!</p>
        <Button type="primary" block onClick={handleReturn}>Return to Home</Button>
      </Modal>
    </div>
  );
};

const styles = {
  wrapper: {
    height: '100vh',
    background: 'linear-gradient(to right, #b2dbff, #d6f0ff)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: '1200px',
    height: '80vh',
    display: 'flex',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)',
    background: 'white'
  },
  leftPane: {
    width: '45%',
    padding: '60px',
    backgroundColor: '#3f78d1',
  },
  rightPane: {
    width: '55%',
    padding: '60px',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    overflowY: 'auto',
    maxHeight: '100%',
  },
  form: {
    maxWidth: '400px',
    margin: '0 auto',
  },
  nextButton: {
    fontSize: '18px',
    fontWeight: 'bold',
    height: '45px',
    backgroundColor: '#1976D2',
    border: 'none',
  },
  footerText: {
    marginTop: '12px',
    textAlign: 'center'
  },
  signInLink: {
    fontWeight: 'bold'
  }
};

export default RegisterPage;
