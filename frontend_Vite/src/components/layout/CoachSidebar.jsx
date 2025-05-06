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
 * 教练侧边栏组件
 * 用于Coach Dashboard和Details等页面的共享侧边栏
 */
const CoachSidebar = ({ colorToken, onCollapse }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // 从Redux中获取activeMenu
  const activeMenu = useSelector((state) => state.navigation.activeMenu);
  
  // 添加 RTK Query 的 logout mutation hook
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  
  // 获取未读订阅请求计数
  const { 
    data: unreadSubscriptionCount = 0, 
    refetch: refetchUnreadSubscriptionCount 
  } = useGetUnreadRequestsCountQuery(null, {
    pollingInterval: 60000, // 每60秒轮询一次
    refetchOnMountOrArgChange: true, // 组件挂载时始终重新获取
    refetchOnFocus: true, // 窗口获得焦点时刷新
    refetchOnReconnect: true, // 网络重连时刷新
  });
  
  // 获取未读Session请求计数
  const { 
    data: unreadSessionCount = 0, 
    refetch: refetchUnreadSessionCount 
  } = useGetUnreadSessionCountQuery(null, {
    pollingInterval: 60000, // 每60秒轮询一次
    refetchOnMountOrArgChange: true, // 组件挂载时始终重新获取
    refetchOnFocus: true, // 窗口获得焦点时刷新
    refetchOnReconnect: true, // 网络重连时刷新
  });
  
  // 获取未记录Session计数
  const { 
    data: unrecordedSessionCount = 0, 
    refetch: refetchUnrecordedSessionCount 
  } = useGetUnrecordedSessionCountDataQuery(null, {
    pollingInterval: 60000, // 每60秒轮询一次
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  
  // 计算总未读消息数 (Requests)
  const totalUnreadRequestsCount = unreadSubscriptionCount + unreadSessionCount;
  
  // 组件挂载或激活时刷新未读计数
  useEffect(() => {
    refetchUnreadSubscriptionCount();
    refetchUnreadSessionCount();
    refetchUnrecordedSessionCount();
    
    // 注册事件监听器，用于强制刷新计数
    const refreshHandler = () => {
      refetchUnreadSubscriptionCount();
      refetchUnreadSessionCount();
      refetchUnrecordedSessionCount();
      
      // 如果当前在订阅请求页面，自动刷新请求列表
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
  
  // 监听未读计数变化，如果当前在请求页面且有未读消息，自动刷新请求列表
  useEffect(() => {
    if (activeMenu === 'subscription-requests' && unreadSubscriptionCount > 0) {
      window.dispatchEvent(new Event('refresh-subscription-requests'));
    } else if (activeMenu === 'session-requests' && unreadSessionCount > 0) {
      window.dispatchEvent(new Event('refresh-coach-session-requests'));
    }
  }, [unreadSubscriptionCount, unreadSessionCount, activeMenu]);
  
  // 处理登出
  const handleLogout = () => {
    Modal.confirm({
      title: '退出登录确认',
      content: '确定要退出登录吗？',
      onOk: async () => {
        try {
          const response = await logout().unwrap();
          dispatch(logoutAction());
          navigate('/login');
        } catch (error) {
          console.error('Logout failed:', error);
          message.error('登出失败，请重试。');
        }
      },
      okText: '退出',
      cancelText: '取消',
    });
  };
  
  // 处理菜单点击
  const handleMenuItemClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
      return;
    }
    
    // 更新Redux中的activeMenu状态
    dispatch(setActiveMenu(key));
    
    if (key === 'profile') {
      navigate('/coach/details');
      return;
    }
    
    if (key === 'subscription-requests') {
      // 强制刷新未读计数
      refetchUnreadSubscriptionCount();
      // 触发订阅请求列表刷新事件
      window.dispatchEvent(new Event('refresh-subscription-requests'));
      navigate('/coach/subscription-requests');
      return;
    }
    
    if (key === 'session-requests') {
      // 强制刷新未读计数
      refetchUnreadSessionCount();
      // 触发会话请求列表刷新事件
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
    
    // 导航到dashboard 只包含仍然需要导向dashboard的菜单项
    if (key === 'dashboard' || key === 'members' || key === 'settings') {
      navigate('/coach/dashboard');
      return;
    }
    
    // 处理requests父菜单项点击 - 如果用户点击了父菜单项而不是子菜单项
    if (key === 'requests') {
      // 默认导航到subscription-requests子菜单
      if (unreadSubscriptionCount > 0) {
        dispatch(setActiveMenu('subscription-requests'));
        navigate('/coach/subscription-requests');
      } else if (unreadSessionCount > 0) {
        dispatch(setActiveMenu('session-requests'));
        navigate('/coach/session-requests');
      } else {
        // 如果两者都没有未读消息，默认导航到subscription
        dispatch(setActiveMenu('subscription-requests'));
        navigate('/coach/subscription-requests');
      }
      return;
    }
  };
  
  // 处理侧边栏折叠状态变化
  const handleCollapse = (value) => {
    setCollapsed(value);
    if (onCollapse) {
      onCollapse(value);
    }
  };
  
  // 获取菜单项
  const getMenuItems = ({ unreadSubscriptionCount = 0, unreadSessionCount = 0, unreadTrainingHistoryCount = 0 }) => {

    // 计算请求总数
    const totalRequestsCount = unreadSubscriptionCount + unreadSessionCount;

    // 创建导航菜单项目
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