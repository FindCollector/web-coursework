import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
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
  message
} from 'antd';
import { 
  UserOutlined, 
  IdcardOutlined, 
  CalendarOutlined, 
  BarChartOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { logout as logoutAction } from '../../store/authSlice';
import { useDispatch } from 'react-redux';
import { useCheckCoachDetailsQuery } from '../../store/api/coachApi';
import { useLogoutMutation } from '../../store/api/authApi';
import PageTransition from '../../components/PageTransition';

const { Title, Text } = Typography;

const CoachDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userName } = useSelector((state) => state.auth);
  
  // 状态管理
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  
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
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Title level={2}>Coach Dashboard</Title>
          <Space>
            <Button 
              icon={<IdcardOutlined />} 
              onClick={goToProfileEdit}
            >
              Edit Profile
            </Button>
            <Button 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Space>
        </div>
        
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
        
        {/* 快捷操作按钮 */}
        <div className="mt-6">
          <Title level={4}>Quick Actions</Title>
          <Row gutter={[16, 16]} className="mt-4">
            <Col xs={24} sm={8}>
              <Button 
                type="primary" 
                size="large" 
                block
                onClick={goToProfileEdit}
              >
                Manage Profile
              </Button>
            </Col>
            <Col xs={24} sm={8}>
              <Button 
                type="default" 
                size="large" 
                block
              >
                View Schedule
              </Button>
            </Col>
            <Col xs={24} sm={8}>
              <Button 
                type="default" 
                size="large" 
                block
              >
                Manage Members
              </Button>
            </Col>
          </Row>
        </div>
      </div>
    </PageTransition>
  );
};

export default CoachDashboard; 