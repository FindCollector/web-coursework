import { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Tag, 
  Space, 
  Checkbox,
  Row,
  Col,
  Empty,
  Button,
  Modal,
  Descriptions,
  message
} from 'antd';
import { 
  useGetMemberSessionRequestsQuery, 
  useMarkSessionRequestAsReadMutation,
  useGetMemberUnreadSessionCountQuery,
  useWithdrawSessionRequestMutation
} from '../../store/api/memberApi';
import dayjs from 'dayjs';

const { Title } = Typography;

const SessionRequests = () => {
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [wasUnread, setWasUnread] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 使用RTK Query获取数据
  const { data, isLoading, refetch } = useGetMemberSessionRequestsQuery({
    pageNow: currentPage,
    pageSize,
    statusList: selectedStatus
  }, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000 // 每30秒自动刷新一次
  });

  // 添加标记已读的mutation
  const [markAsRead] = useMarkSessionRequestAsReadMutation();
  
  // 获取未读Session数量查询
  const { refetch: refetchUnreadCount } = useGetMemberUnreadSessionCountQuery();
  
  // 添加撤回Session请求的mutation
  const [withdrawRequest] = useWithdrawSessionRequestMutation();

  // 当组件首次加载或被激活时刷新数据
  useEffect(() => {
    // 组件挂载或激活时立即刷新数据
    refetch();
    
    // 添加事件监听器，在发送新请求后刷新列表
    const handleRefreshRequests = () => {
      refetch();
    };
    
    window.addEventListener('refresh-session-requests', handleRefreshRequests);
    
    return () => {
      window.removeEventListener('refresh-session-requests', handleRefreshRequests);
    };
  }, [refetch]);

  // 状态选项
  const statusOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Accepted', value: 'ACCEPT' },
    { label: 'Rejected', value: 'REJECT' },
    { label: 'Cancelled', value: 'CANCEL' },
    { label: 'Withdrawn', value: 'WITHDRAWN' }
  ];

  // 处理撤回请求
  const handleWithdraw = (record) => {
    setWithdrawingId(record.id);
    setWithdrawModalVisible(true);
  };

  // 确认撤回请求
  const confirmWithdraw = async () => {
    if (!withdrawingId) return;
    
    setIsWithdrawing(true);
    
    try {
      const response = await withdrawRequest(withdrawingId).unwrap();
      
      if (response.code === 0) {
        message.success('Session request withdrawn successfully');
        setWithdrawModalVisible(false);
        
        // 刷新列表
        refetch();
        // 刷新未读计数
        refetchUnreadCount();
      } else {
        message.error(response.msg || 'Failed to withdraw request');
      }
    } catch (error) {
      console.error('Error withdrawing session request:', error);
      message.error(error.data?.msg || 'Failed to withdraw request. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'Member Name',
      dataIndex: 'memberName',
      key: 'memberName',
      render: (text, record) => (
        <div className="flex items-center">
          {(record.memberIsRead === false) && (
            <Tag color="blue" className="mr-2">NEW</Tag>
          )}
          {text}
        </div>
      ),
    },
    {
      title: 'Coach Name',
      dataIndex: 'coachName',
      key: 'coachName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        // 创建颜色映射，处理不同大小写的状态值
        const colorMap = {
          pending: 'gold',
          accept: 'green',
          reject: 'red',
          cancel: 'grey',
          PENDING: 'gold',
          ACCEPT: 'green',
          REJECT: 'red',
          CANCEL: 'grey',
          WITHDRAWN: 'purple'
        };
        
        // 获取颜色，如果状态不在映射中则使用灰色
        const color = colorMap[status] || 'default';
        
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Request Time',
      dataIndex: 'requestTime',
      key: 'requestTime',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Response Time',
      dataIndex: 'responseTime',
      key: 'responseTime',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            onClick={() => showDetails(record)}
          >
            Details
          </Button>
          {(record.status === 'PENDING' || record.status === 'pending') && (
            <Button 
              type="primary" 
              size="small"
              onClick={() => handleWithdraw(record)}
              style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
            >
              Withdraw
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleStatusChange = (checkedValues) => {
    setSelectedStatus(checkedValues);
    setCurrentPage(1); // 重置页码
    
    // 强制重新获取数据，避免使用缓存
    setTimeout(() => {
      refetch();
    }, 0);
  };

  // 查看详情时标记为已读
  const showDetails = (record) => {
    setSelectedRequest(record);
    setDetailsVisible(true);
    
    // 记录原始未读状态
    const isUnread = record && record.memberIsRead === false;
    setWasUnread(isUnread);
    
    // 如果是未读消息，则标记为已读
    if (isUnread) {
      markAsRead(record.id)
        .unwrap()
        .then(() => {
          // 标记成功后主动刷新未读计数
          refetchUnreadCount();
          
          // 触发全局事件，强制刷新侧边栏计数
          window.dispatchEvent(new Event('refresh-unread-count'));
        })
        .catch(error => {
          console.error('Failed to mark as read:', error);
        });
    }
  };

  const handleCloseDetails = () => {
    setDetailsVisible(false);
    
    // 只有当查看的请求之前是未读状态时，才刷新计数
    if (wasUnread) {
      // 关闭详情时刷新未读计数，确保侧边栏数字更新
      refetchUnreadCount();
      // 触发全局事件，强制刷新侧边栏计数
      window.dispatchEvent(new Event('refresh-unread-count'));
    }
    
    // 重置未读状态标记
    setWasUnread(false);
  };

  // 确保传递给Table的dataSource始终是数组
  const tableDataSource = Array.isArray(data?.data?.records) ? data.data.records : [];

  return (
    <div className="p-6">
      <Card>
        <Title level={3} className="mb-6">My Session Requests</Title>
        
        {/* 状态过滤器 */}
        <Row className="mb-6">
          <Col>
            <Checkbox.Group
              options={statusOptions}
              value={selectedStatus}
              onChange={handleStatusChange}
            />
          </Col>
        </Row>

        {/* 请求列表 */}
        <Table
          columns={columns}
          dataSource={tableDataSource}
          rowKey="id"
          loading={isLoading}
          rowClassName={(record) => record.memberIsRead === false ? 'bg-blue-50' : ''}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.data?.total || 0,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          locale={{
            emptyText: <Empty description="No session requests found" />,
          }}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="Session Request Details"
        open={detailsVisible}
        onCancel={handleCloseDetails}
        footer={[
          <Button key="close" onClick={handleCloseDetails}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedRequest && (
          <Descriptions bordered column={1} className="mt-4">
            <Descriptions.Item label="Member Name">{selectedRequest.memberName}</Descriptions.Item>
            <Descriptions.Item label="Coach Name">{selectedRequest.coachName}</Descriptions.Item>
            <Descriptions.Item label="Status">
              {(() => {
                const colorMap = {
                  pending: 'gold',
                  accept: 'green',
                  reject: 'red',
                  cancel: 'grey',
                  PENDING: 'gold',
                  ACCEPT: 'green',
                  REJECT: 'red',
                  CANCEL: 'grey',
                  WITHDRAWN: 'purple'
                };
                const color = colorMap[selectedRequest.status] || 'default';
                return <Tag color={color}>{selectedRequest.status}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Fitness Goals">{selectedRequest.message}</Descriptions.Item>
            <Descriptions.Item label="Start Time">
              {dayjs(selectedRequest.startTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="End Time">
              {dayjs(selectedRequest.endTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Request Time">
              {dayjs(selectedRequest.requestTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            
            {(selectedRequest.status !== 'pending' && selectedRequest.status !== 'PENDING') && (
              <>
                <Descriptions.Item label="Response Time">
                  {selectedRequest.responseTime ? dayjs(selectedRequest.responseTime).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Coach's Response">
                  {selectedRequest.reply || '-'}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 撤回确认模态框 */}
      <Modal
        title="Withdraw Session Request"
        open={withdrawModalVisible}
        onCancel={() => setWithdrawModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setWithdrawModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="withdraw" 
            type="primary" 
            danger
            loading={isWithdrawing}
            onClick={confirmWithdraw}
          >
            Withdraw
          </Button>
        ]}
      >
        <p>Are you sure you want to withdraw this session request? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default SessionRequests; 