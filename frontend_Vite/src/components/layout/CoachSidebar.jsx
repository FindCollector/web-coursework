import { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Badge } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  SettingOutlined,
  DashboardOutlined,
  BellOutlined,
  HistoryOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutAction } from '../../store/authSlice';
import { setActiveMenu } from '../../store/navSlice';
import { useLogoutMutation } from '../../store/api/authApi';
import { 
  useGetUnreadRequestsCountQuery, 
  useGetUnreadSessionCountQuery, 
  useGetUnrecordedSessionCountDataQuery
} from '../../store/api/coachApi';
import { Modal, message } from 'antd';

const { Sider } = Layout;
const { Title } = Typography;

/**
 * Coach Sidebar Component
 * Shared sidebar for Coach Dashboard and Details pages
 */
const CoachSidebar = ({ colorToken, onCollapse }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get activeMenu from Redux
  const activeMenu = useSelector((state) => state.navigation.activeMenu);
  
  // Add RTK Query logout mutation hook
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  
  // Get unread subscription request count
  const { 
    data: unreadSubscriptionCount = 0, 
    refetch: refetchUnreadSubscriptionCount 
  } = useGetUnreadRequestsCountQuery(null, {
    pollingInterval: 60000, // Poll every 60 seconds
    refetchOnMountOrArgChange: true, // Always refetch on component mount
    refetchOnFocus: true, // Refresh when window gets focus
    refetchOnReconnect: true, // Refresh when network reconnects
  });
  
  // Get unread Session request count
  const { 
    data: unreadSessionCount = 0, 
    refetch: refetchUnreadSessionCount 
  } = useGetUnreadSessionCountQuery(null, {
    pollingInterval: 60000, // Poll every 60 seconds
    refetchOnMountOrArgChange: true, // Always refetch on component mount
    refetchOnFocus: true, // Refresh when window gets focus
    refetchOnReconnect: true, // Refresh when network reconnects
  });
  
  // Get unrecorded Session count
  const { 
    data: unrecordedSessionCount = 0, 
    refetch: refetchUnrecordedSessionCount 
  } = useGetUnrecordedSessionCountDataQuery(null, {
    pollingInterval: 60000, // Poll every 60 seconds
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  
  // Calculate total unread messages count (Requests)
  const totalUnreadRequestsCount = unreadSubscriptionCount + unreadSessionCount;
  
  // Refresh unread counts when component mounts or becomes active
  useEffect(() => {
    refetchUnreadSubscriptionCount();
    refetchUnreadSessionCount();
    refetchUnrecordedSessionCount();
    
    // Register event listener for forced count refresh
    const refreshHandler = () => {
      refetchUnreadSubscriptionCount();
      refetchUnreadSessionCount();
      refetchUnrecordedSessionCount();
      
      // If currently on subscription requests page, auto-refresh request list
      if (activeMenu === 'subscription-requests') {
        window.dispatchEvent(new Event('refresh-subscription-requests'));
      } else if (activeMenu === 'session-requests') {
        window.dispatchEvent(new Event('refresh-coach-session-requests'));
      }
    };
    
    window.addEventListener('refresh-unread-count', refreshHandler);
    
    return () => {
      window.removeEventListener('refresh-unread-count', refreshHandler);
    };
  }, [refetchUnreadSubscriptionCount, refetchUnreadSessionCount, refetchUnrecordedSessionCount, activeMenu]);
  
  // Monitor unread count changes; if on request page with unread messages, auto-refresh request list
  useEffect(() => {
    if (activeMenu === 'subscription-requests' && unreadSubscriptionCount > 0) {
      window.dispatchEvent(new Event('refresh-subscription-requests'));
    } else if (activeMenu === 'session-requests' && unreadSessionCount > 0) {
      window.dispatchEvent(new Event('refresh-coach-session-requests'));
    }
  }, [unreadSubscriptionCount, unreadSessionCount, activeMenu]);
  
  // Handle logout
  const handleLogout = () => {
    Modal.confirm({
      title: 'Logout Confirmation',
      content: 'Are you sure you want to log out?',
      onOk: async () => {
        try {
          const response = await logout().unwrap();
          dispatch(logoutAction());
          navigate('/login');
        } catch (error) {
          message.error('Logout failed, please try again.');
        }
      },
      okText: 'Logout',
      cancelText: 'Cancel',
    });
  };
  
  // Handle menu click
  const handleMenuItemClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
      return;
    }
    
    // Update activeMenu status in Redux
    dispatch(setActiveMenu(key));
    
    if (key === 'profile') {
      navigate('/coach/details');
      return;
    }
    
    if (key === 'subscription-requests') {
      // Force refresh unread count
      refetchUnreadSubscriptionCount();
      // Trigger subscription request list refresh event
      window.dispatchEvent(new Event('refresh-subscription-requests'));
      navigate('/coach/subscription-requests');
      return;
    }
    
    if (key === 'session-requests') {
      // Force refresh unread count
      refetchUnreadSessionCount();
      // Trigger session request list refresh event
      window.dispatchEvent(new Event('refresh-coach-session-requests'));
      navigate('/coach/session-requests');
      return;
    }
    
    if (key === 'schedule') {
      navigate('/coach/schedule');
      return;
    }
    
    if (key === 'availability') {
      navigate('/coach/availability');
      return;
    }
    
    if (key === 'unrecorded-sessions') {
      navigate('/coach/unrecorded-sessions');
      return;
    }
    
    // Navigate to dashboard for menu items that still need dashboard direction
    if (key === 'dashboard' || key === 'members' || key === 'settings') {
      navigate('/coach/dashboard');
      return;
    }
    
    // Handle requests parent menu item click - if user clicked parent menu instead of submenu
    if (key === 'requests') {
      // Default navigate to subscription-requests submenu
      if (unreadSubscriptionCount > 0) {
        dispatch(setActiveMenu('subscription-requests'));
        navigate('/coach/subscription-requests');
      } else if (unreadSessionCount > 0) {
        dispatch(setActiveMenu('session-requests'));
        navigate('/coach/session-requests');
      } else {
        // If neither has unread messages, default to subscription
        dispatch(setActiveMenu('subscription-requests'));
        navigate('/coach/subscription-requests');
      }
      return;
    }
  };
  
  // Handle sidebar collapse state change
  const handleCollapse = (value) => {
    setCollapsed(value);
    if (onCollapse) {
      onCollapse(value);
    }
  };
  
  // Get menu items
  const getMenuItems = ({ unreadSubscriptionCount = 0, unreadSessionCount = 0, unreadTrainingHistoryCount = 0 }) => {

    // Calculate total requests
    const totalRequestsCount = unreadSubscriptionCount + unreadSessionCount;

    // Create navigation menu items
    return [
      // {
      //   key: 'dashboard',
      //   icon: <DashboardOutlined />,
      //   label: 'Dashboard',
      // },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
      },
      {
        key: 'requests',
        icon: (
          <Badge count={totalRequestsCount} size="small" offset={[2, 0]}>
            <BellOutlined />
          </Badge>
        ),
        label: 'Requests',
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
        label: 'Schedule',
      },
      // {
      //   key: 'members',
      //   icon: <TeamOutlined />,
      //   label: 'My Members',
      // },
      {
        key: 'availability',
        icon: <CalendarOutlined />,
        label: 'Availability',
      },
      {
        key: 'unrecorded-sessions',
        icon: <HistoryOutlined />,
        label: (
          <span>
            Unrecorded
            {unrecordedSessionCount > 0 && (
              <Badge 
                count={unrecordedSessionCount} 
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
      // {
      //   key: 'settings',
      //   icon: <SettingOutlined />,
      //   label: 'Settings',
      // }
    ];
  };
  
  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={handleCollapse}
      theme="dark"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div className="flex justify-center items-center h-16 m-4">
        <Title level={collapsed ? 5 : 4} style={{ color: colorToken?.colorPrimary, margin: 0 }}>
          {collapsed ? 'Coach' : 'Coach Dashboard'}
        </Title>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[activeMenu]}
        defaultOpenKeys={['requests']}
        onClick={handleMenuItemClick}
        items={getMenuItems({ unreadSubscriptionCount, unreadSessionCount, unrecordedSessionCount })}
      />
    </Sider>
  );
};

export default CoachSidebar; 