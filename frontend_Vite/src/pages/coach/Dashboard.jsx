import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Layout,
  Card, 
  Button, 
  Typography, 
  Alert, 
  Statistic, 
  Row, 
  Col, 
  Spin, 
  Space, 
  Modal,
  message,
  Avatar,
  theme
} from 'antd';
import { 
  UserOutlined, 
  IdcardOutlined, 
  CalendarOutlined, 
  BarChartOutlined,
  LogoutOutlined,
  DashboardOutlined,
  TeamOutlined,
  SettingOutlined,
  BellOutlined
} from '@ant-design/icons';
import { logout as logoutAction } from '../../store/authSlice';
import { useDispatch } from 'react-redux';
import { useCheckCoachDetailsQuery } from '../../store/api/coachApi';
import { useLogoutMutation } from '../../store/api/authApi';
import PageTransition from '../../components/PageTransition';
import SubscriptionRequests from './SubscriptionRequests';
import SessionRequests from './SessionRequests';
import CoachSidebar from '../../components/layout/CoachSidebar';
import Availability from './Availability';

const { Title, Text } = Typography;
const { Header, Content } = Layout;

const CoachDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userName } = useSelector((state) => state.auth);
  const { token } = theme.useToken();
  
  // 使用Redux状态
  const activeMenu = useSelector((state) => state.navigation.activeMenu);
  
  // 本地状态管理
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // 获取教练信息完整性数据
  const { 
    data: checkData, 
    isLoading,
    isError,
    refetch 
  } = useCheckCoachDetailsQuery();
  
  // 添加 RTK Query 的 logout mutation hook
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  
  // 处理教练信息检查
  useEffect(() => {
    if (checkData && checkData.code === 0) {
      const { isComplete, missingFields } = checkData.data;
      
      if (!isComplete && missingFields && missingFields.length > 0) {
        setShowProfileAlert(true);
        setMissingFields(missingFields);
      } else {
        setShowProfileAlert(false);
        setMissingFields([]);
      }
    }
  }, [checkData]);
  
  // 增加监听activeMenu变化，当选择profile时导航到details页面
  useEffect(() => {
    if (activeMenu === 'profile') {
      navigate('/coach/details');
    }
  }, [activeMenu, navigate]);
  
  // 跳转到个人资料编辑页面
  const goToProfileEdit = () => {
    navigate('/coach/details');
  };
  
  // 处理登出
  const handleLogout = () => {
    Modal.confirm({
      title: 'Logout Confirmation',
      content: 'Are you sure you want to logout?',
      onOk: async () => {
        try {
          // 调用 RTK Query 的 logout mutation
          const response = await logout().unwrap();
          dispatch(logoutAction());
          navigate('/login');
        } catch (error) {
          console.error('Logout failed:', error);
          message.error('Logout failed. Please try again.');
        }
      },
      okText: 'Logout',
      cancelText: 'Cancel',
    });
  };
  
  // 占位数据 - 实际项目中应从API获取
  const dashboardStats = {
    sessionCount: 12,
    upcomingSessions: 3,
    memberCount: 8,
    rating: 4.8
  };

  // 渲染内容
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return renderDashboardContent();
      case 'subscription-requests':
        return <SubscriptionRequests />;
      case 'session-requests':
        return <SessionRequests />;
      case 'availability':
        return <Availability />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <Title level={4}>Coming Soon</Title>
            <Text>This feature is under development</Text>
          </div>
        );
    }
  };
  
  // 渲染仪表盘内容
  const renderDashboardContent = () => {
    return (
      <>
        {/* 个人资料完整性提醒 */}
        {showProfileAlert && (
          <Alert
            message="Complete Your Profile"
            description={
              <div>
                <p>
                  Your profile is incomplete. Please add the following information:
                  <ul>
                    {missingFields.map((field, index) => (
                      <li key={index}>{field}</li>
                    ))}
                  </ul>
                </p>
              </div>
            }
            type="warning"
            showIcon
            closable
            onClose={() => setShowProfileAlert(false)}
            action={
              <Button size="small" type="primary" onClick={goToProfileEdit}>
                Complete Profile
              </Button>
            }
            className="mb-6"
          />
        )}
        
        {/* 欢迎信息 */}
        <Card className="mb-6">
          <div className="flex items-center">
            <UserOutlined style={{ fontSize: '32px', marginRight: '16px' }} />
            <div>
              <Title level={4}>Welcome back, {userName}!</Title>
              <Text>Here's an overview of your coaching activity</Text>
            </div>
          </div>
        </Card>
        
        {/* 统计数据 */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Total Sessions"
                value={dashboardStats.sessionCount}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Upcoming Sessions"
                value={dashboardStats.upcomingSessions}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Active Members"
                value={dashboardStats.memberCount}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Rating"
                value={dashboardStats.rating}
                precision={1}
                prefix={<BarChartOutlined />}
                suffix="/ 5"
              />
            </Card>
          </Col>
        </Row>
      </>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-6">
        <Alert
          message="Error"
          description="Failed to load coach information. Please try again later."
          type="error"
          showIcon
          action={
            <Button onClick={refetch} type="primary" size="small">
              Retry
            </Button>
          }
        />
      </div>
    );
  }
  
  return (
    <PageTransition isVisible={true}>
      <Layout style={{ minHeight: '100vh' }}>
        <CoachSidebar 
          colorToken={token}
          onCollapse={setSidebarCollapsed}
        />
        <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 200, transition: 'all 0.2s' }}>
          <Header style={{ 
            background: token.colorBgContainer, 
            padding: '0 16px', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            zIndex: 10
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {activeMenu === 'dashboard' && 'Dashboard'}
              {activeMenu === 'profile' && 'Profile Management'}
              {activeMenu === 'schedule' && 'Schedule Management'}
              {activeMenu === 'members' && 'Member Management'}
              {activeMenu === 'subscription-requests' && 'Subscription Requests'}
              {activeMenu === 'session-requests' && 'Session Requests'}
              {activeMenu === 'availability' && 'Availability Management'}
              {activeMenu === 'settings' && 'Settings'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar style={{ marginRight: 8, backgroundColor: token.colorPrimary }}>
                <UserOutlined />
              </Avatar>
              <span style={{ marginRight: 16 }}>{userName}</span>
              <Button 
                icon={<LogoutOutlined />} 
                onClick={handleLogout}
                type="link"
              >
                Logout
              </Button>
            </div>
          </Header>
          <Content style={{ 
            margin: '24px 16px', 
            padding: 24, 
            background: token.colorBgContainer,
            borderRadius: 4,
            minHeight: 280,
            overflow: 'initial'
          }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </PageTransition>
  );
};

export default CoachDashboard; 