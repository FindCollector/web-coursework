import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/enterprise.js?render=6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleLogin = async (values) => {
    const { email, password } = values;

    if (!window.grecaptcha?.enterprise) {
      message.error("reCAPTCHA not ready, please wait...");
      return;
    }

    try {
      setLoading(true);

      const recaptchaToken = await window.grecaptcha.enterprise.execute(
        '6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y',
        { action: 'login' }
      );

      const response = await axios.post("http://localhost:8080/auth/login", {
        email,
        password,
        action: "login",
        recaptchaToken,
      });

      if (response.data.code === 200) {
        const token = response.data.data.token;
        localStorage.setItem("token", token);
        message.success("Login successful!");
        navigate("/");
      } else {
        setIsModalVisible(true);
      }
    } catch (error) {
      console.error("Login error:", error);
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <Title level={2} style={styles.title}>Sign In</Title>

        <Form layout="vertical" onFinish={handleLogin} style={styles.form}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Please enter your email' }]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={styles.signInButton}
              loading={loading}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={styles.footerText}>
          <span>Don't have an account? </span>
          <Button type="link" onClick={() => navigate('/register')} style={styles.signUpLink}>
            Sign Up
          </Button>
        </div>
      </div>

      {/* 登录失败弹窗 */}
      <Modal
        title="Login Failed"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)} // ✅ 修复点：加上 onCancel
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="Try Again"
      >
        <p>Email or password is incorrect. Please try again.</p>
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(to right, #3f78d1, #67a8ff, #a3d8ff)',
  },
  box: {
    background: 'rgba(255, 255, 255, 0.85)',
    padding: '40px 50px',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(10px)',
    width: '400px',
    textAlign: 'left',
  },
  title: {
    fontSize: '50px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '600',
    textAlign: 'center',
    color: '#003366',
    marginBottom: '20px',
  },
  form: {
    width: '100%',
  },
  signInButton: {
    fontSize: '18px',
    fontWeight: 'bold',
    height: '45px',
    backgroundColor: '#1976D2',
    border: 'none',
  },
  footerText: {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: '14px',
    color: '#555',
  },
  signUpLink: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
};

export default LoginPage;
