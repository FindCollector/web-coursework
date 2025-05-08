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

  // Use RTK Query to get data
  const { data, isLoading, refetch } = useGetMemberSessionRequestsQuery({
    pageNow: currentPage,
    pageSize,
    statusList: selectedStatus
  }, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000 // Auto refresh every 30 seconds
  });

  // Add mark as read mutation
  const [markAsRead] = useMarkSessionRequestAsReadMutation();
  
  // Get unread session count query
  const { refetch: refetchUnreadCount } = useGetMemberUnreadSessionCountQuery();
  
  // Add withdraw session request mutation
  const [withdrawRequest] = useWithdrawSessionRequestMutation();

  // Refresh data when component first loads or is activated
  useEffect(() => {
    // Immediately refresh data when component mounts or is activated
    refetch();
    
    // Add event listener to refresh list after sending new requests
    const handleRefreshRequests = () => {
      refetch();
    };
    
    window.addEventListener('refresh-session-requests', handleRefreshRequests);
    
    return () => {
      window.removeEventListener('refresh-session-requests', handleRefreshRequests);
    };
  }, [refetch]);

  // Status options
  const statusOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Accepted', value: 'ACCEPT' },
    { label: 'Rejected', value: 'REJECT' },
    { label: 'Cancelled', value: 'CANCEL' },
  ];

  // Handle withdraw request
  const handleWithdraw = (record) => {
    setWithdrawingId(record.id);
    setWithdrawModalVisible(true);
  };

  // Confirm withdraw request
  const confirmWithdraw = async () => {
    if (!withdrawingId) return;
    
    setIsWithdrawing(true);
    
    try {
      const response = await withdrawRequest(withdrawingId).unwrap();
      
      if (response.code === 0) {
        message.success('Session request withdrawn successfully');
        setWithdrawModalVisible(false);
        
        // Refresh list
        refetch();
        // Refresh unread count
        refetchUnreadCount();
      } else {
        message.error(response.msg || 'Failed to withdraw request');
      }
    } catch (error) {
      message.error(error.data?.msg || 'Failed to withdraw request. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Table column definitions
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
        // Create color mapping, handle different case status values
        const colorMap = {
          pending: 'gold',
          accept: 'green',
          reject: 'red',
          cancel: 'grey',
          PENDING: 'gold',
          ACCEPT: 'green',
          REJECT: 'red',
          CANCEL: 'grey',
        };
        
        // Get color, if status not in mapping use default
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
    setCurrentPage(1); // Reset page number
    
    // Force data refetch, avoid using cache
    setTimeout(() => {
      refetch();
    }, 0);
  };

  // Mark as read when viewing details
  const showDetails = (record) => {
    setSelectedRequest(record);
    setDetailsVisible(true);
    
    // Record original unread status
    const isUnread = record && record.memberIsRead === false;
    setWasUnread(isUnread);
    
    // If unread message, mark as read
    if (isUnread) {
      markAsRead(record.id)
        .unwrap()
        .then(() => {
          // Actively refresh unread count after marking as successful
          refetchUnreadCount();
          
          // Trigger global event to force refresh sidebar count
          window.dispatchEvent(new Event('refresh-unread-count'));
        })
        .catch(error => {
          // Nothing to do on error
        });
    }
  };

  const handleCloseDetails = () => {
    setDetailsVisible(false);
    
    // Only refresh count if the previously viewed request was unread
    if (wasUnread) {
      // Refresh unread count when closing details to ensure sidebar number is updated
      refetchUnreadCount();
      // Trigger global event to force refresh sidebar count
      window.dispatchEvent(new Event('refresh-unread-count'));
    }
    
    // Reset unread status marker
    setWasUnread(false);
  };

  // Ensure dataSource passed to Table is always an array
  const tableDataSource = Array.isArray(data?.data?.records) ? data.data.records : [];

  return (
    <div className="p-6">
      <Card>
        <Title level={3} className="mb-6">My Session Requests</Title>
        
        {/* Status filter */}
        <Row className="mb-6">
          <Col>
            <Checkbox.Group
              options={statusOptions}
              value={selectedStatus}
              onChange={handleStatusChange}
            />
          </Col>
        </Row>

        {/* Request list */}
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

      {/* Details modal */}
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

      {/* Withdraw confirmation modal */}
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