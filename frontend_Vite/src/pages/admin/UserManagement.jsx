import { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Form, 
  Space, 
  Modal, 
  Card, 
  Tag, 
  message, 
  Popconfirm, 
  Tooltip,
  Typography,
  Row,
  Col,
  ConfigProvider
} from 'antd';
import { 
  SearchOutlined, 
  UserAddOutlined, 
  UserDeleteOutlined, 
  UserSwitchOutlined, 
  ReloadOutlined,
  CheckCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useGetUserListQuery, useUpdateUserStatusMutation, useDeleteUserMutation } from '../../store/api/userApi';
import enUS from 'antd/lib/locale/en_US';

const { Option } = Select;
const { Title, Text } = Typography;

const UserManagement = () => {
  const [searchForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({});
  const [sorter, setSorter] = useState({});
  const [skip, setSkip] = useState(false);

  // --- State for custom delete modal ---
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  // --- End State ---

  // 使用RTK Query hooks替换React Query
  const { data, isLoading, refetch } = useGetUserListQuery({
    pageNow: pagination.current,
    pageSize: pagination.pageSize,
    ...filters,
    sortField: sorter.field ? [sorter.field] : [],
    sortOrder: sorter.order ? [sorter.order === 'ascend' ? 'asc' : 'desc'] : []
  }, {
    skip,
    refetchOnMountOrArgChange: true
  });

  // Process data source to ensure consistency
  const getUserData = () => {
    let userData = [];
    
    // Use records property if available
    if (data && data.records) {
      userData = data.records;
    }
    // Use content property if available
    else if (data && data.content) {
      userData = data.content;
    }
    // Use data directly if it's an array
    else if (data && Array.isArray(data)) {
      userData = data;
    }
    
    // Log the userData for debugging
    console.log('Raw user data:', userData);
    
    // Process each user record to ensure it has a valid id field
    return userData.map(user => {
      // If the user doesn't have an id field, try to determine it from other fields
      if (!user.id) {
        // Create a synthetic id if none exists
        // First try common id fields, then fall back to email as a unique identifier
        user.id = user.userId || user._id || user.userID || user.email;
        console.log('Added synthetic id to user:', user.id);
      }
      return user;
    });
  };

  // Fetch user data on component load
  useEffect(() => {
    // Check if token exists
    const token = sessionStorage.getItem('token');
    if (token) {
      console.log('Found token in sessionStorage, preparing to fetch user data');
    } else {
      console.warn('No token found in sessionStorage, authentication may fail');
    }
  }, []);

  // Update pagination information
  useEffect(() => {
    if (data) {
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
      }));
    }
  }, [data]);

  // 使用RTK Query的mutation hooks
  const [updateUserStatus, updateStatusResult] = useUpdateUserStatusMutation();
  const [deleteUser, deleteUserResult] = useDeleteUserMutation();

  // Handle table changes (pagination, sorting, filtering)
  const handleTableChange = (pagination, filters, sorter) => {
    console.log('Table change:', pagination.current, pagination.pageSize);
    
    // Update pagination
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: data?.total || 0
    });
    
    // Handle sorting
    if (sorter.field && sorter.order) {
      setSorter({
        field: sorter.field,
        order: sorter.order
      });
    } else {
      setSorter({});
    }
  };

  // Handle search form submission
  const handleSearch = (values) => {
    const { role, status, userName, email } = values;
    const formattedFilters = {};
    
    if (role) formattedFilters.role = role;
    if (status !== undefined) formattedFilters.status = status;
    if (userName) formattedFilters.userName = userName;
    if (email) formattedFilters.email = email;
    
    setFilters(formattedFilters);
    
    // Reset to first page when searching
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  };

  // Handle select change
  const handleSelectChange = (value, field) => {
    const currentValues = searchForm.getFieldsValue();
    const newValues = {
      ...currentValues,
      [field]: value
    };
    searchForm.setFieldsValue(newValues);
    handleSearch(newValues);
  };

  // 添加useEffect来监听数据变化
  useEffect(() => {
    if (!skip && data) {
      console.log('Data received:', data);
    }
  }, [data, skip]);

  // Reset filters
  const resetFilters = () => {
    // 重置表单
    searchForm.resetFields();
    
    // 显示加载提示
    const loadingMessage = message.loading('Loading data...', 0);

    // 重置状态
    setFilters({});
    setSorter({});
    setPagination({
      current: 1,
      pageSize: 10
    });

    // 直接调用refetch强制刷新数据
    refetch()
      .then(() => {
        loadingMessage();
        message.success('Data refreshed successfully');
      })
      .catch(() => {
        loadingMessage();
        message.error('Failed to refresh data');
      });
  };

  // 监听状态变化
  useEffect(() => {
    console.log('[UserManagement] 状态变化:', {
      pagination,
      filters,
      sorter
    });
  }, [pagination, filters, sorter]);

  // 监听数据变化
  useEffect(() => {
    if (data) {
      console.log('[UserManagement] 收到新数据:', data);
    }
  }, [data]);

  const approveUser = (userId) => {
    // Show loading message
    const loadingMessage = message.loading('Processing...', 0);
    
    // Call API to update user status
    updateUserStatus({ userId, status: 0 })
      .unwrap()
      .then((data) => {
        // Close loading message
        loadingMessage();
        
        if (data.code === 0) {
          message.success('User approved successfully');
        } else {
          message.error(data.msg || 'Operation failed, please try again');
          console.error('Failed to approve user:', data);
        }
      })
      .catch((error) => {
        // Close loading message
        loadingMessage();
        
        message.error('Operation failed: ' + (error.message || 'Unknown error'));
        console.error('Error approving user:', error);
        
        // Show more specific prompt for network errors
        if (error.message && (error.message.includes('Network Error') || error.message.includes('CORS'))) {
          Modal.error({
            title: 'Network Error',
            content: 'A CORS or network issue occurred. Please contact your administrator.'
          });
        }
      });
  };

  // Ban user
  const banUser = (userId) => {
    // Show loading message
    const loadingMessage = message.loading('Processing...', 0);
    
    // Call API to update user status
    updateUserStatus({ userId, status: 2 })
      .unwrap()
      .then((data) => {
        // Close loading message
        loadingMessage();
        
        if (data.code === 0) {
          message.success('User banned successfully');
        } else {
          message.error(data.msg || 'Operation failed, please try again');
          console.error('Failed to ban user:', data);
        }
      })
      .catch((error) => {
        // Close loading message
        loadingMessage();
        
        message.error('Operation failed: ' + (error.message || 'Unknown error'));
        console.error('Error banning user:', error);
      });
  };

  // --- Renamed function to show the modal ---
  const showDeleteConfirm = (userId) => {
    if (!userId) {
      message.error('Cannot delete: Missing user ID');
      return;
    }
    console.log('[UserManagement.jsx] showDeleteConfirm - Opening modal, ID:', userId);
    setUserToDelete(userId);
    setIsDeleteModalVisible(true);
  };

  // 处理删除用户确认
  const handleDeleteOk = async () => {
    if (!userToDelete) {
      message.error('No user selected for deletion');
      setIsDeleteModalVisible(false);
      return;
    }
    
    try {
      console.log('[UserManagement.jsx] handleDeleteOk - Attempting to delete user ID:', userToDelete);
      
      const result = await deleteUser(userToDelete).unwrap();
      
      setIsDeleteModalVisible(false);
      setUserToDelete(null);
      
      if (result.code === 0) {
        message.success('User deleted successfully');
      } else {
        message.error(result.msg || 'Failed to delete user (Backend)');
        console.error('[UserManagement.jsx] deleteUser - Backend Failed:', result);
        Modal.error({ title: 'Delete Failed', content: result.msg || 'Unknown backend error' });
      }
    } catch (error) {
      console.error('[UserManagement.jsx] deleteUser error:', error);
      setIsDeleteModalVisible(false);
      setUserToDelete(null);
      
      message.error('Failed to delete user: ' + (error.message || 'Unknown error'));
      Modal.error({ title: 'Delete Failed', content: error.message || 'Unknown error' });
    }
  };

  const handleDeleteCancel = () => {
    console.log('[UserManagement.jsx] handleDeleteCancel - User cancelled');
    setIsDeleteModalVisible(false); 
    setUserToDelete(null);
  };

  // Render user status tag
  const renderStatusTag = (status) => {
    switch (status) {
      case 0:
        return <Tag color="success">Active</Tag>;
      case 1:
        return <Tag color="warning">Pending</Tag>;
      case 2:
        return <Tag color="error">Banned</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  // Render user role tag
  const renderRoleTag = (role) => {
    switch (role) {
      case 'admin':
        return <Tag color="purple">Admin</Tag>;
      case 'member':
        return <Tag color="blue">Member</Tag>;
      case 'coach':
        return <Tag color="green">Coach</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  // Define table columns
  const columns = [
    {
      title: 'Username',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => renderRoleTag(role),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => renderStatusTag(status),
    },
    {
      title: 'Registration Time',
      dataIndex: 'registerTime',
      key: 'registerTime',
      sorter: true,
      width: 170,
      render: (text) => text ? new Date(text).toLocaleString() : '-'
    },
    {
      title: 'Actions',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => {
        // Determine which ID field to use (different backends might use different field names)
        const userId = record.id || record.userId || record._id;
        
        // Log the determined userId
        if (userId) {
          console.log('Using userId:', userId);
        } else {
          console.error('Could not find valid user ID:', record);
        }
        
        return (
          <Space size="small">
            {/* Approve button for pending users */}
            {record.status === 1 && (
              <Tooltip title="Approve">
                <Button 
                  type="link" 
                  icon={<CheckCircleOutlined />} 
                  onClick={() => approveUser(userId)}
                  style={{ color: 'green' }}
                />
              </Tooltip>
            )}
            
            {/* Ban button for active users who are not admins */}
            {record.status === 0 && record.role !== 'admin' && (
              <Tooltip title="Ban">
                <Button 
                  type="link" 
                  danger 
                  icon={<StopOutlined />} 
                  onClick={() => banUser(userId)}
                />
              </Tooltip>
            )}
  
            {/* Unban button for banned users */}
            {record.status === 2 && (
              <Tooltip title="Unban">
                <Button 
                  type="link" 
                  icon={<CheckCircleOutlined />} 
                  onClick={() => approveUser(userId)}
                  style={{ color: 'green' }}
                />
              </Tooltip>
            )}
  
            {/* Delete button for non-admin users */}
            {record.role !== 'admin' && (
              <Tooltip title="Delete">
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    if (userId) {
                      console.log('[UserManagement.jsx] onClick - Clicked delete button, preparing to call showDeleteConfirm, userId:', userId);
                      showDeleteConfirm(userId);
                    } else {
                      message.error('Cannot find user ID');
                    }
                  }}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <ConfigProvider locale={enUS}>
      <div>
        <Card style={{ marginBottom: 16 }}>
          <Form
            form={searchForm}
            layout="horizontal"
            onFinish={handleSearch}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6} lg={6}>
                <Form.Item name="role" label="Role">
                  <Select 
                    placeholder="Select role" 
                    allowClear
                    onChange={(value) => handleSelectChange(value, 'role')}
                  >
                    <Option value="admin">Admin</Option>
                    <Option value="member">Member</Option>
                    <Option value="coach">Coach</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={6}>
                <Form.Item name="status" label="Status">
                  <Select 
                    placeholder="Select status" 
                    allowClear
                    onChange={(value) => handleSelectChange(value, 'status')}
                  >
                    <Option value={0}>Active</Option>
                    <Option value={1}>Pending</Option>
                    <Option value={2}>Banned</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={6}>
                <Form.Item name="userName" label="Username">
                  <Input placeholder="Search username" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6} lg={6}>
                <Form.Item name="email" label="Email">
                  <Input placeholder="Search email" />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24} style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={resetFilters} icon={<ReloadOutlined />}>
                    Reset
                  </Button>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    Search
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </Card>

        <Table
          columns={columns}
          rowKey={(record) => record.id || record.userId || record._id || record.email}
          dataSource={getUserData()}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} records`,
          }}
          loading={isLoading}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          size="middle"
          locale={{
            emptyText: <span>No user data available</span>,
          }}
        />

        {/* --- Custom Delete Confirmation Modal --- */}
        <Modal
          title="Confirm Delete"
          open={isDeleteModalVisible}
          onOk={handleDeleteOk}
          onCancel={handleDeleteCancel}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          confirmLoading={deleteUserResult.status === 'pending'} 
        >
          <p>{`This action cannot be undone. Are you sure you want to delete user with ID: ${userToDelete}?`}</p>
        </Modal>

        {/* Error Modal */}
        <Modal
          title="Error"
          open={!!deleteUserResult.error}
          onOk={() => deleteUserResult.reset()}
          okText="OK"
          cancelButtonProps={{ style: { display: 'none' } }}
        >
          <p>{deleteUserResult.error?.message || 'An error occurred'}</p>
        </Modal>

      </div>
    </ConfigProvider>
  );
};

export default UserManagement; 