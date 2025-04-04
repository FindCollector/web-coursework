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
    const token = sessionStorage.getItem('token');
    const userType = sessionStorage.getItem('userType');
    const userName = sessionStorage.getItem('userName');
    
    setAuthState({
      token: token,
      userType: userType,
      userName: userName
    });
  }, []);
  
  // 测试直接登录
  const handleDirectLogin = async () => {
    try {
      console.log('测试直接登录:', email, password);
      
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
        sessionStorage.setItem('token', data.data.userInfo.token);
        sessionStorage.setItem('userType', data.data.userInfo.role || 'user');
        sessionStorage.setItem('userName', data.data.userInfo.userName || 'User');
        
        setAuthState({
          token: data.data.userInfo.token,
          userType: data.data.userInfo.role || 'user',
          userName: data.data.userInfo.userName || 'User'
        });
        
        message.success('登录成功!');
      } else {
        message.error('登录失败: ' + (data.msg || '未知错误'));
      }
    } catch (err) {
      console.error('登录请求错误:', err);
      setResponseData({ error: err.message });
      message.error('请求错误: ' + err.message);
    }
  };
  
  // 测试RTK Query登录
  const handleRtkLogin = async () => {
    try {
      const result = await login({ email, password }).unwrap();
      console.log('RTK Query登录结果:', result);
      setResponseData(result);
      
      if (result.code === 0) {
        message.success('RTK Query登录成功!');
        // sessionStorage会由authSlice处理
        
        // 刷新显示的认证状态
        setTimeout(() => {
          const token = sessionStorage.getItem('token');
          const userType = sessionStorage.getItem('userType');
          const userName = sessionStorage.getItem('userName');
          
          setAuthState({
            token: token,
            userType: userType,
            userName: userName
          });
        }, 500);
      } else {
        message.error('RTK Query登录失败: ' + (result.msg || '未知错误'));
      }
    } catch (err) {
      console.error('RTK Query登录错误:', err);
      setResponseData({ error: err.message || JSON.stringify(err) });
      message.error('RTK Query请求错误: ' + (err.message || JSON.stringify(err)));
    }
  };
  
  // 发送验证码测试
  const handleSendCode = async () => {
    if (!email || !userName) {
      message.error('请输入邮箱和用户名');
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
        message.success('验证码发送成功!');
      } else {
        message.error('验证码发送失败: ' + (result.msg || '未知错误'));
      }
    } catch (err) {
      console.error('发送验证码错误:', err);
      setResponseData({ error: err.message || JSON.stringify(err) });
      message.error('发送验证码请求错误: ' + (err.message || JSON.stringify(err)));
    }
  };
  
  // 清除令牌
  const handleClearToken = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('userName');
    
    setAuthState({
      token: null,
      userType: null,
      userName: null
    });
    
    message.success('令牌已清除');
  };
  
  // 检查认证状态
  const handleCheckAuth = () => {
    logAuthState();
    
    const token = sessionStorage.getItem('token');
    const userType = sessionStorage.getItem('userType');
    const userName = sessionStorage.getItem('userName');
    
    setAuthState({
      token: token,
      userType: userType,
      userName: userName
    });
    
    message.info('已刷新认证状态');
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Card title={<Title level={3}>API调试页面</Title>}>
        <Alert 
          message="开发者工具" 
          description="此页面仅用于开发阶段调试和排查API问题，不应在生产环境中使用。" 
          type="warning" 
          showIcon 
          style={{ marginBottom: '20px' }} 
        />
        
        <Tabs defaultActiveKey="1">
          <TabPane tab="认证状态" key="1">
            <Card type="inner" title="当前认证状态">
              <Paragraph>
                <Text strong>令牌: </Text>
                {authState.token ? (
                  <Tag color="green">已设置</Tag>
                ) : (
                  <Tag color="red">未设置</Tag>
                )}
              </Paragraph>
              
              {authState.token && (
                <Paragraph>
                  <Text strong>令牌值: </Text>
                  <Text code>{authState.token.substring(0, 20)}...</Text>
                </Paragraph>
              )}
              
              <Paragraph>
                <Text strong>用户类型: </Text>
                {authState.userType ? (
                  <Tag color="blue">{authState.userType}</Tag>
                ) : (
                  <Tag color="red">未设置</Tag>
                )}
              </Paragraph>
              
              <Paragraph>
                <Text strong>用户名: </Text>
                {authState.userName ? (
                  <Text>{authState.userName}</Text>
                ) : (
                  <Tag color="red">未设置</Tag>
                )}
              </Paragraph>
              
              <Space>
                <Button onClick={handleCheckAuth}>刷新状态</Button>
                <Button danger onClick={handleClearToken}>清除令牌</Button>
              </Space>
            </Card>
          </TabPane>
          
          <TabPane tab="登录测试" key="2">
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
                  原生Fetch登录
                </Button>
                
                <Button type="primary" onClick={handleRtkLogin}>
                  RTK Query登录
                </Button>
              </Space>
            </Space>
          </TabPane>
          
          <TabPane tab="注册测试" key="3">
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
                placeholder="Password (可选)" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              
              <Button type="primary" onClick={handleSendCode}>
                发送验证码
              </Button>
            </Space>
          </TabPane>
        </Tabs>
        
        <Divider />
        
        <Title level={4}>API响应</Title>
        <pre style={{ 
          background: '#f0f0f0', 
          padding: '10px', 
          borderRadius: '4px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {responseData ? JSON.stringify(responseData, null, 2) : '等待API响应...'}
        </pre>
      </Card>
    </div>
  );
};

export default DebugPage; 