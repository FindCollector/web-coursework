import React, { useState, useEffect } from 'react';
import { Layout, Typography, Menu, Avatar, Button, Badge } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  HeartOutlined,
  HistoryOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons';
import CoachList from '../../components/CoachList';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout as logoutAction } from '../../store/authSlice';
import { useLogoutMutation } from '../../store/api/authApi';
import { useGetMemberUnreadRequestsCountQuery } from '../../store/api/memberApi';
import SubscriptionRequests from './SubscriptionRequests';

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
  
  // 获取未读订阅请求数量
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useGetMemberUnreadRequestsCountQuery(null, {
    pollingInterval: 60000, // 每60秒轮询一次
    refetchOnMountOrArgChange: true, // 组件挂载时始终重新获取
    refetchOnFocus: true, // 窗口获得焦点时刷新
    refetchOnReconnect: true, // 网络重连时刷新
  });

  useEffect(() => {
    console.log('Current user state:', auth);
    
    // 组件挂载时立即刷新未读计数
    refetchUnreadCount();
  }, [auth, refetchUnreadCount]);
  
  // 添加刷新未读计数的事件监听器
  useEffect(() => {
    const handleRefreshUnreadCount = () => {
      refetchUnreadCount();
      
      // 如果当前在请求页面，自动刷新请求列表
      if (activeMenu === 'requests') {
        window.dispatchEvent(new Event('refresh-requests'));
      }
    };
    
    window.addEventListener('refresh-unread-count', handleRefreshUnreadCount);
    
    return () => {
      window.removeEventListener('refresh-unread-count', handleRefreshUnreadCount);
    };
  }, [refetchUnreadCount, activeMenu]);
  
  // 监听未读计数变化，如果当前在请求页面且有未读消息，自动刷新请求列表
  useEffect(() => {
    if (activeMenu === 'requests' && unreadCount > 0) {
      window.dispatchEvent(new Event('refresh-requests'));
    }
  }, [unreadCount, activeMenu]);

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
      key: 'requests',
      icon: (
        <Badge count={unreadCount} size="small" offset={[10, 0]}>
          <BellOutlined />
        </Badge>
      ),
      label: 'My Requests',
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

  // 切换菜单时的处理函数
  const handleMenuChange = (key) => {
    setActiveMenu(key);
    
    // 当切换到请求页面时，触发请求刷新事件
    if (key === 'requests') {
      window.dispatchEvent(new Event('refresh-requests'));
      // 同时刷新未读计数
      refetchUnreadCount();
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'coaches':
        return <CoachList />;
      case 'requests':
        return <SubscriptionRequests />;
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
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Header 
        className="fixed w-full z-20"
        style={{ 
          height: `${headerHeight}px`, 
          top: 0, 
          left: 0,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        <div className="text-lg font-bold" style={{ color: '#fff' }}>
          {getPageTitle(activeMenu)}
        </div>
        <div className="flex items-center">
          <span style={{ color: '#fff' }} className="mr-4">{userName}</span>
          <Button 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            type="text"
            style={{
              color: '#fff',
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
            top: `${headerHeight}px`,
            bottom: 0,
            zIndex: 10,
            background: 'linear-gradient(180deg, #ffffff 0%, #f0f2f5 100%)',
            borderRight: '1px solid rgba(0,0,0,0.06)'
          }}
        >
          <div className="h-16 flex items-center justify-center m-4">
            <Title level={collapsed ? 5 : 4} className="m-0" style={{ 
              background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {collapsed ? 'FC' : 'Fitness Center'}
            </Title>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeMenu]}
            onClick={({ key }) => handleMenuChange(key)}
            items={menuItems}
            className="border-r-0"
            style={{
              background: 'transparent'
            }}
          />
        </Sider>
        <Layout 
          style={{ 
            marginLeft: collapsed ? 80 : 200, 
            transition: 'margin-left 0.2s',
            background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)'
          }}
        >
          <Content 
            className="m-6 p-6 bg-white rounded-lg" 
            style={{ 
              minHeight: `calc(100vh - ${headerHeight}px - 48px)`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
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