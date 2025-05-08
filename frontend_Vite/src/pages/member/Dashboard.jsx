import React, { useState, useEffect } from 'react';
import { Layout, Typography, Menu, Avatar, Button, Badge, message } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  HeartOutlined,
  HistoryOutlined,
  LogoutOutlined,
  BellOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import CoachList from '../../components/CoachList';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout as logoutAction } from '../../store/authSlice';
import { useLogoutMutation } from '../../store/api/authApi';
import { 
  useGetMemberUnreadRequestsCountQuery,
  useGetMemberUnreadSessionCountQuery,
  useGetMemberUnreadTrainingHistoryCountQuery
} from '../../store/api/memberApi';
import SubscriptionRequests from './SubscriptionRequests';
import SessionRequests from './SessionRequests';
import BookingSession from './BookingSession';
import MemberSchedule from './MemberSchedule';
import TrainingHistory from './TrainingHistory';

// Note: We are using Header from Layout, but positioning it manually outside the main Layout flow.
const { Content, Sider, Header } = Layout;
const { Title } = Typography;

const MemberDashboard = ({ initialActiveMenu }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState(initialActiveMenu || 'coaches');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const userName = auth?.userName || 'Member';
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  
  // Get unread counts
  const { data: unreadSubscriptionData, refetch: refetchUnreadSubscriptionCount } = useGetMemberUnreadRequestsCountQuery();
  const { data: unreadSessionData, refetch: refetchUnreadSessionCount } = useGetMemberUnreadSessionCountQuery();
  const { data: unreadTrainingHistoryData, refetch: refetchUnreadTrainingHistoryCount } = useGetMemberUnreadTrainingHistoryCountQuery();

  // Calculate unread counts
  const unreadSubscriptionCount = unreadSubscriptionData?.data || 0;
  const unreadSessionCount = unreadSessionData?.data || 0;
  const unreadTrainingHistoryCount = unreadTrainingHistoryData || 0;
  // Total unread messages related to requests (excluding training history)
  const requestsUnreadCount = unreadSubscriptionCount + unreadSessionCount;
  // Total of all unread messages
  const totalUnreadCount = requestsUnreadCount + unreadTrainingHistoryCount;

  useEffect(() => {
    // Refresh unread counts immediately when component mounts
    refetchUnreadSubscriptionCount();
    refetchUnreadSessionCount();
    refetchUnreadTrainingHistoryCount();
  }, [auth, refetchUnreadSubscriptionCount, refetchUnreadSessionCount, refetchUnreadTrainingHistoryCount]);
  
  // Listen for initialActiveMenu changes
  useEffect(() => {
    if (initialActiveMenu) {
      setActiveMenu(initialActiveMenu);
    }
  }, [initialActiveMenu]);
  
  // Listen for refresh unread count events
  useEffect(() => {
    const handleRefreshUnreadCount = () => {
      refetchUnreadSubscriptionCount();
      refetchUnreadSessionCount();
      refetchUnreadTrainingHistoryCount();
      
      // If currently on requests page, automatically refresh the request list
      if (activeMenu === 'subscription-requests' || activeMenu === 'session-requests') {
        if (activeMenu === 'subscription-requests') {
          window.dispatchEvent(new Event('refresh-requests'));
        } else if (activeMenu === 'session-requests') {
          window.dispatchEvent(new Event('refresh-session-requests'));
        }
      }
    };
    
    window.addEventListener('refresh-unread-count', handleRefreshUnreadCount);
    
    return () => {
      window.removeEventListener('refresh-unread-count', handleRefreshUnreadCount);
    };
  }, [refetchUnreadSubscriptionCount, refetchUnreadSessionCount, refetchUnreadTrainingHistoryCount, activeMenu]);
  
  // Listen for unread count changes, if currently on requests page and there are unread messages, automatically refresh request list
  useEffect(() => {
    if (activeMenu === 'subscription-requests' && unreadSubscriptionCount > 0) {
      window.dispatchEvent(new Event('refresh-requests'));
    } else if (activeMenu === 'session-requests' && unreadSessionCount > 0) {
      window.dispatchEvent(new Event('refresh-session-requests'));
    }
  }, [unreadSubscriptionCount, unreadSessionCount, activeMenu]);

  const handleLogout = async () => {
    try {
      const response = await logout().unwrap();
      
      if (response.code === 0) {
        dispatch(logoutAction());
        navigate('/login');
      } else {
        message.error(response.msg || 'Logout failed');
      }
    } catch (error) {
      message.error('Logout failed. Please try again.');
    }
  };

  const menuItems = [
    {
      key: 'coaches',
      icon: <UserOutlined />,
      label: 'Find Coaches',
    },
    {
      key: 'booking',
      icon: <CalendarOutlined />,
      label: 'Booking Session',
    },
    {
      key: 'requests',
      icon: (
        <Badge dot={requestsUnreadCount > 0} size="small">
          <BellOutlined />
        </Badge>
      ),
      label: 'My Requests',
      children: [
        {
          key: 'subscription-requests',
          label: (
            <span>
              Subscription
              {unreadSubscriptionCount > 0 && (
                <Badge 
                  count={unreadSubscriptionCount} 
                  size="small" 
                  style={{ 
                    marginLeft: 6, 
                    fontSize: '10px', 
                    padding: '0 4px',
                    height: '16px',
                    lineHeight: '16px',
                    boxShadow: 'none' 
                  }} 
                />
              )}
            </span>
          ),
        },
        {
          key: 'session-requests',
          label: (
            <span>
              Session
              {unreadSessionCount > 0 && (
                <Badge 
                  count={unreadSessionCount} 
                  size="small" 
                  style={{ 
                    marginLeft: 6, 
                    fontSize: '10px', 
                    padding: '0 4px',
                    height: '16px',
                    lineHeight: '16px',
                    boxShadow: 'none' 
                  }} 
                />
              )}
            </span>
          ),
        }
      ]
    },
    {
      key: 'schedule',
      icon: <CalendarOutlined />,
      label: 'My Schedule',
    },
    {
      key: 'history',
      icon: (
        <Badge dot={unreadTrainingHistoryCount > 0} size="small">
          <HistoryOutlined />
        </Badge>
      ),
      label: (
        <span>
          Training History
          {unreadTrainingHistoryCount > 0 && (
            <Badge 
              count={unreadTrainingHistoryCount} 
              size="small" 
              style={{ 
                marginLeft: 6, 
                fontSize: '10px', 
                padding: '0 4px',
                height: '16px',
                lineHeight: '16px',
                boxShadow: 'none' 
              }} 
            />
          )}
        </span>
      ),
    },
  ];

  const getPageTitle = (key) => {
    // Handle submenu items
    if (key === 'subscription-requests') {
      return 'Subscription Requests';
    } else if (key === 'session-requests') {
      return 'Session Requests';
    }
    
    // Handle main menu items
    const item = menuItems.find(item => item.key === key);
    return item ? item.label : 'Fitness Center';
  };

  // Menu change handler function
  const handleMenuChange = (key) => {
    setActiveMenu(key);
    
    // Navigate to the corresponding URL path
    if (key === 'coaches') {
      navigate('/member/coaches');
      return;
    }
    
    if (key === 'booking') {
      navigate('/member/booking');
      return;
    }
    
    if (key === 'subscription-requests') {
      window.dispatchEvent(new Event('refresh-requests'));
      // Also refresh unread count
      refetchUnreadSubscriptionCount();
      navigate('/member/subscription-requests');
      return;
    }
    
    if (key === 'session-requests') {
      window.dispatchEvent(new Event('refresh-session-requests'));
      // Also refresh unread count
      refetchUnreadSessionCount();
      navigate('/member/session-requests');
      return;
    }
    
    if (key === 'schedule') {
      navigate('/member/schedule');
      return;
    }
    
    if (key === 'history') {
      window.dispatchEvent(new Event('refresh-training-history'));
      // Also refresh unread count
      refetchUnreadTrainingHistoryCount();
      navigate('/member/history');
      return;
    }
    
    if (key === 'requests') {
      // Default navigate to subscription-requests submenu
      if (unreadSubscriptionCount > 0) {
        setActiveMenu('subscription-requests');
        navigate('/member/subscription-requests');
      } else if (unreadSessionCount > 0) {
        setActiveMenu('session-requests');
        navigate('/member/session-requests');
      } else {
        // If neither has unread messages, default to subscription
        setActiveMenu('subscription-requests');
        navigate('/member/subscription-requests');
      }
      return;
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'coaches':
        return <CoachList />;
      case 'booking':
        return <BookingSession />;
      case 'subscription-requests':
        return <SubscriptionRequests />;
      case 'session-requests':
        return <SessionRequests />;
      case 'schedule':
        return <MemberSchedule />;
      case 'history':
        return <TrainingHistory />;
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
            defaultOpenKeys={['requests']}
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