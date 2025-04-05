import React, { useState, useEffect } from 'react';
import { Layout, Typography, Menu, Avatar, Button } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  HeartOutlined,
  HistoryOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import CoachList from '../../components/CoachList';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout as logoutAction } from '../../store/authSlice';
import { useLogoutMutation } from '../../store/api/authApi';

// Note: We are using Header from Layout, but positioning it manually outside the main Layout flow.
const { Content, Sider, Header } = Layout;
const { Title } = Typography;

const MemberDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('coaches');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const userName = auth?.userName || 'Member';
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  useEffect(() => {
    console.log('Current user state:', auth);
  }, [auth]);

  const handleLogout = async () => {
    try {
      const response = await logout().unwrap();
      
      if (response.code === 0) {
        dispatch(logoutAction());
        navigate('/login');
      } else {
        console.error('Logout failed:', response.msg);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    {
      key: 'coaches',
      icon: <UserOutlined />,
      label: 'Find Coaches',
    },
    {
      key: 'schedule',
      icon: <CalendarOutlined />,
      label: 'My Schedule',
    },
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: 'My Favorites',
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: 'Training History',
    },
  ];

  const getPageTitle = (key) => {
    const item = menuItems.find(item => item.key === key);
    return item ? item.label : 'Fitness Center';
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'coaches':
        return <CoachList />;
      case 'schedule':
      case 'favorites':
      case 'history':
      default:
        return (
          <div className="p-8 text-center">
            <Title level={3}>{getPageTitle(activeMenu)} - Content coming soon</Title>
          </div>
        );
    }
  };

  const headerHeight = 64;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}> {/* Use a simple div as the outermost container */}
      {/* Manually positioned Header, outside of AntD Layout flow */}
      <Header 
        className="fixed w-full z-20 shadow-sm"
        style={{ 
          height: `${headerHeight}px`, 
          top: 0, 
          left: 0,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff'
        }}
      >
        <div className="text-lg font-bold" style={{ color: '#000' }}>
          {getPageTitle(activeMenu)}
        </div>
        <div className="flex items-center">
          <span style={{ color: '#1890ff' }} className="mr-4">{userName}</span>
          <Button 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            type="link"
            style={{
              color: '#1890ff',
              padding: '4px 15px',
              height: '32px',
              lineHeight: '24px'
            }}
            loading={isLoggingOut}
          >
            Logout
          </Button>
        </div>
      </Header>

      {/* Main Layout container, pushed down to accommodate the fixed header */}
      <Layout style={{ minHeight: '100vh', paddingTop: `${headerHeight}px` }}>
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          theme="light"
          className="shadow-md"
          style={{
            overflow: 'auto',
            height: `calc(100vh - ${headerHeight}px)`,
            position: 'fixed',
            left: 0,
            top: `${headerHeight}px`, // Start below the manually positioned header
            bottom: 0,
            zIndex: 10 // Sider should be above Content
          }}
        >
          <div className="h-16 flex items-center justify-center m-4">
            <Title level={collapsed ? 5 : 4} className="m-0 text-blue-600">
              {collapsed ? 'FC' : 'Fitness Center'}
            </Title>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeMenu]}
            onClick={({ key }) => setActiveMenu(key)}
            items={menuItems}
            className="border-r-0"
          />
        </Sider>
        <Layout 
          style={{ 
            marginLeft: collapsed ? 80 : 200, 
            transition: 'margin-left 0.2s', 
            // paddingTop is handled by the parent Layout
          }}
        >
          <Content 
            className="m-6 p-6 bg-gray-100 rounded-md" 
            style={{ 
              minHeight: `calc(100vh - ${headerHeight}px - 48px)` // Adjust minHeight
            }}
          >
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default MemberDashboard; 