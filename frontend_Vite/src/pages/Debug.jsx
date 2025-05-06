import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Input, Tabs, message, Tag, Alert, Divider, Space } from 'antd';
import { 
  useLoginMutation,
  useLogoutMutation,
  useSendVerificationCodeMutation
} from '../store/api/authApi';
import { logAuthState } from '../utils/debugTools';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 获取带页面ID的存储键名，防止多页面混淆
const getStorageKey = (key) => {
  return window.PAGE_INSTANCE_ID ? `${key}_${window.PAGE_INSTANCE_ID}` : key;
};

const DebugPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [requestHeaders, setRequestHeaders] = useState({});
  
  // RTK Query hooks
  const [login, loginResult] = useLoginMutation();
  const [logout, logoutResult] = useLogoutMutation();
  const [sendCode, sendCodeResult] = useSendVerificationCodeMutation();
  
  // 认证状态
  const [authState, setAuthState] = useState({
    token: null,
    userType: null,
    userName: null
  });
  
  // 加载存储的认证状态
  useEffect(() => {
    // 读取认证状态
    const token = localStorage.getItem(getStorageKey('token'));
    const userType = localStorage.getItem(getStorageKey('userType'));
    const userName = localStorage.getItem(getStorageKey('userName'));
    
    if (token) {
      setAuthState({
        token,
        userType: userType || 'unknown',
        userName: userName || 'User'
      });
    }
  }, []);
  
  // 测试直接登录
  const handleDirectLogin = async () => {
    try {
      console.log('测试登录:', email, password);
      
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('登录响应:', data);
      setResponseData(data);
      
      if (data.code === 0 && data.data?.userInfo?.token) {
        localStorage.setItem(getStorageKey('token'), data.data.userInfo.token);
        localStorage.setItem(getStorageKey('userType'), data.data.userInfo.role || 'user');
        localStorage.setItem(getStorageKey('userName'), data.data.userInfo.userName || 'User');
        
        setAuthState({
          token: data.data.userInfo.token,
          userType: data.data.userInfo.role || 'user',
          userName: data.data.userInfo.userName || 'User'
        });
        
        message.success('Login successful!');
      } else {
        message.error('Login failed: ' + (data.msg || 'Unknown error'));
      }
    } catch (err) {
      console.error('登录请求错误:', err);
      setResponseData({ error: err.message });
      message.error('Request error: ' + err.message);
    }
  };
  
  // 测试RTK Query登录
  const handleRtkLogin = async () => {
    try {
      const result = await login({ email, password }).unwrap();
      console.log('RTK Query登录结果:', result);
      setResponseData(result);
      
      if (result.code === 0) {
        message.success('RTK Query login successful!');
        // localStorage会由authSlice处理
        
        // 刷新显示的认证状态
        setTimeout(() => {
          const token = localStorage.getItem(getStorageKey('token'));
          const userType = localStorage.getItem(getStorageKey('userType'));
          const userName = localStorage.getItem(getStorageKey('userName'));
          
          setAuthState({
            token: token,
            userType: userType,
            userName: userName
          });
        }, 500);
      } else {
        message.error('RTK Query login failed: ' + (result.msg || 'Unknown error'));
      }
    } catch (err) {
      console.error('RTK Query登录错误:', err);
      setResponseData({ error: err.message || JSON.stringify(err) });
      message.error('RTK Query request error: ' + (err.message || JSON.stringify(err)));
    }
  };
  
  // 发送验证码测试
  const handleSendCode = async () => {
    if (!email || !userName) {
      message.error('Please enter email and username');
      return;
    }
    
    try {
      const result = await sendCode({
        email,
        userName,
        role: 'member',
        gender: 1,
        birthday: '1990-01-01',
        password: password || 'Test123!',
        headers: {
          'Content-Type': 'application/json'
        }
      }).unwrap();
      
      console.log('发送验证码结果:', result);
      setResponseData(result);
      
      if (result.code === 0) {
        message.success('Verification code sent successfully!');
      } else {
        message.error('Failed to send verification code: ' + (result.msg || 'Unknown error'));
      }
    } catch (err) {
      console.error('发送验证码错误:', err);
      setResponseData({ error: err.message || JSON.stringify(err) });
      message.error('Verification code request error: ' + (err.message || JSON.stringify(err)));
    }
  };
  
  // 清除令牌
  const handleClearToken = () => {
    localStorage.removeItem(getStorageKey('token'));
    localStorage.removeItem(getStorageKey('userType'));
    localStorage.removeItem(getStorageKey('userName'));
    
    setAuthState({
      token: null,
      userType: null,
      userName: null
    });
    
    message.success('Token cleared');
  };
  
  // 检查认证状态
  const handleCheckAuth = () => {
    logAuthState();
    
    const token = localStorage.getItem(getStorageKey('token'));
    const userType = localStorage.getItem(getStorageKey('userType'));
    const userName = localStorage.getItem(getStorageKey('userName'));
    
    setAuthState({
      token: token,
      userType: userType,
      userName: userName
    });
    
    message.info('Authentication status refreshed');
  };
  
  const checkAuth = () => {
    // 实时读取认证状态
    const token = localStorage.getItem(getStorageKey('token'));
    const userType = localStorage.getItem(getStorageKey('userType'));
    const userName = localStorage.getItem(getStorageKey('userName'));
    
    const currentState = {
      token,
      userType,
      userName
    };
    
    setResponseData(currentState);
    
    message.info(token 
      ? `Authentication successful, Role: ${userType || 'Unknown'}, Username: ${userName || 'Unknown'}`
      : 'Not authenticated'
    );
  };
  
  const handleLogout = () => {
    // 清除认证状态
    localStorage.removeItem(getStorageKey('token'));
    localStorage.removeItem(getStorageKey('userType'));
    localStorage.removeItem(getStorageKey('userName'));
    
    setAuthState({
      token: null,
      userType: null,
      userName: null
    });
    
    message.success('Logged out!');
  };
  
  const handleCheckLocalAuth = () => {
    // 检查认证状态
    const token = localStorage.getItem(getStorageKey('token'));
    const userType = localStorage.getItem(getStorageKey('userType'));
    const userName = localStorage.getItem(getStorageKey('userName'));
    
    if (token) {
      message.success(`Authenticated, Role: ${userType || 'Unknown'}, Username: ${userName || 'Unknown'}`);
    } else {
      message.error('Not authenticated');
    }
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Card title={<Title level={3}>API Debug Page</Title>}>
        <Alert 
          message="Developer Tools" 
          description="This page is intended for debugging and troubleshooting API issues during development only and should not be used in production." 
          type="warning" 
          showIcon 
          style={{ marginBottom: '20px' }} 
        />
        
        <Tabs defaultActiveKey="1">
          <TabPane tab="Authentication Status" key="1">
            <Card type="inner" title="Current Authentication Status">
              <Paragraph>
                <Text strong>Token: </Text>
                {authState.token ? (
                  <Tag color="green">Set</Tag>
                ) : (
                  <Tag color="red">Not set</Tag>
                )}
              </Paragraph>
              
              {authState.token && (
                <Paragraph>
                  <Text strong>Token Value: </Text>
                  <Text code>{authState.token.substring(0, 20)}...</Text>
                </Paragraph>
              )}
              
              <Paragraph>
                <Text strong>User Type: </Text>
                {authState.userType ? (
                  <Tag color="blue">{authState.userType}</Tag>
                ) : (
                  <Tag color="red">Not set</Tag>
                )}
              </Paragraph>
              
              <Paragraph>
                <Text strong>Username: </Text>
                {authState.userName ? (
                  <Text>{authState.userName}</Text>
                ) : (
                  <Tag color="red">Not set</Tag>
                )}
              </Paragraph>
              
              <Space>
                <Button onClick={handleCheckAuth}>Refresh Status</Button>
                <Button danger onClick={handleClearToken}>Clear Token</Button>
              </Space>
            </Card>
          </TabPane>
          
          <TabPane tab="Login Test" key="2">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input 
                placeholder="Email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
              
              <Input.Password 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              
              <Space>
                <Button type="primary" onClick={handleDirectLogin}>
                  Native Fetch Login
                </Button>
                
                <Button type="primary" onClick={handleRtkLogin}>
                  RTK Query Login
                </Button>
              </Space>
            </Space>
          </TabPane>
          
          <TabPane tab="Registration Test" key="3">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input 
                placeholder="Email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
              
              <Input 
                placeholder="User Name" 
                value={userName} 
                onChange={e => setUserName(e.target.value)} 
              />
              
              <Input.Password 
                placeholder="Password (Optional)" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              
              <Button type="primary" onClick={handleSendCode}>
                Send Verification Code
              </Button>
            </Space>
          </TabPane>
        </Tabs>
        
        <Divider />
        
        <Title level={4}>API Response</Title>
        <pre style={{ 
          background: '#f0f0f0', 
          padding: '10px', 
          borderRadius: '4px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {responseData ? JSON.stringify(responseData, null, 2) : 'Waiting for API response...'}
        </pre>
      </Card>
    </div>
  );
};

export default DebugPage; 