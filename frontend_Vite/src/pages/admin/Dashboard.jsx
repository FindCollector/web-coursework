import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Typography, theme, Avatar, Modal } from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  BookOutlined,
  CalendarOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout as logoutAction } from '../../store/authSlice';
import { useLogoutMutation } from '../../store/api/authApi';

// Import user management component
import UserManagement from './UserManagement';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AdminDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('users');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const auth = useSelector((state) => state.auth);
  const userName = auth?.userName || 'Admin';
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Replace with RTK Query mutation hook
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  // Handle logout operation
  const handleLogout = async () => {
    try {
      // Call RTK Query logout mutation
      const response = await logout().unwrap();
      
      // If logout successful
      if (response.code === 0) {
        // Clear Redux state
        dispatch(logoutAction());
        // Navigate to login page
        navigate('/login');
      } else {
        // Show error message
        setErrorMessage(response.msg || 'Logout failed, please try again');
        setIsModalVisible(true);
      }
    } catch (error) {
      // Handle API call error
      let errorMessage = 'Logout failed, please try again';
      if (error.data) {
        errorMessage = error.data.msg || errorMessage;
      } else if (error.response && error.response.data) {
        errorMessage = error.response.data.msg || errorMessage;
      }
      setErrorMessage(errorMessage);
      setIsModalVisible(true);
    }
  };

  // Render the currently selected content area
  const renderContent = () => {
    switch (activeMenu) {
      case 'users':
        return <UserManagement />;
      default:
        return (
          <div className="p-8 text-center">
            <Title level={3}>Select an item from the menu</Title>
          </div>
        );
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
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
          <Title level={collapsed ? 5 : 4} style={{ color: token.colorPrimary, margin: 0 }}>
            {collapsed ? 'Admin' : 'Admin Dashboard'}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeMenu]}
          onClick={({ key }) => setActiveMenu(key)}
          items={[
            {
              key: 'users',
              icon: <UserOutlined />,
              label: 'User Management',
            },
          ]}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
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
            {activeMenu === 'users' && 'User Management'}
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
      
      {/* Error message modal */}
      <Modal
        title="Operation Notification"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        okText="OK"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>{errorMessage}</p>
      </Modal>
    </Layout>
  );
};

export default AdminDashboard; 