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
  Descriptions
} from 'antd';
import { 
  useGetMemberSubscriptionRequestsQuery, 
  useMarkMemberRequestAsReadMutation,
  useGetMemberUnreadRequestsCountQuery
} from '../../store/api/memberApi';
import dayjs from 'dayjs';

const { Title } = Typography;

const SubscriptionRequests = () => {
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  // Track if currently viewed request was originally unread
  const [wasUnread, setWasUnread] = useState(false);

  // Use RTK Query to fetch data
  const { data, isLoading, error, refetch } = useGetMemberSubscriptionRequestsQuery({
    pageNow: currentPage,
    pageSize,
    statusList: selectedStatus
  }, {
    // Refetch when component mounts or parameters change
    refetchOnMountOrArgChange: true,
    // Regular automatic refresh
    pollingInterval: 30000 // Auto refresh every 30 seconds
  });

  // Add mark as read mutation
  const [markAsRead] = useMarkMemberRequestAsReadMutation();
  
  // Get unread count query
  const { refetch: refetchUnreadCount } = useGetMemberUnreadRequestsCountQuery();
  
  // Refresh data when component first loads or is activated
  useEffect(() => {
    // Immediately refresh data when component mounts or is activated
    refetch();
    
    // Add event listener to refresh list after sending new requests
    const handleRefreshRequests = () => {
      refetch();
    };
    
    window.addEventListener('refresh-requests', handleRefreshRequests);
    
    return () => {
      window.removeEventListener('refresh-requests', handleRefreshRequests);
    };
  }, [refetch]);
  
  // Trigger coach list refresh when data changes
  useEffect(() => {
    if (data && data.records && data.records.length > 0) {
      // Send event to notify CoachList component to refresh data
      window.dispatchEvent(new Event('refresh-coach-status'));
    }
  }, [data]);

  // Status options
  const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accept' },
    { label: 'Rejected', value: 'reject' }
  ];

  // Table column definitions
  const columns = [
    {
      title: 'Member Name',
      dataIndex: 'memberName',
      key: 'memberName',
      render: (text, record) => (
        <div className="flex items-center">
          {(record.memberIsRead === false || record.member_is_read === false) && (
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
          PENDING: 'gold',
          ACCEPT: 'green',
          REJECT: 'red'
        };
        
        // Get color, if status not in mapping use default
        const color = colorMap[status] || 'default';
        
        return <Tag color={color}>{status}</Tag>;
      },
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
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
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
    
    // Record original unread status, compatible with both possible field names
    const isUnread = record && (record.memberIsRead === false || record.member_is_read === false);
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

  return (
    <div className="p-6">
      <Card>
        <Title level={3} className="mb-6">My Subscription Requests</Title>
        
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
          dataSource={data?.records || []}
          rowKey="id"
          loading={isLoading}
          rowClassName={(record) => (record.memberIsRead === false || record.member_is_read === false) ? 'bg-blue-50' : ''}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.total || 0,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
          locale={{
            emptyText: <Empty description="No subscription requests found" />,
          }}
        />
      </Card>

      {/* Details modal */}
      <Modal
        title="Subscription Request Details"
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
                // Create color mapping, handle different case status values
                const colorMap = {
                  pending: 'gold',
                  accept: 'green',
                  reject: 'red',
                  PENDING: 'gold',
                  ACCEPT: 'green',
                  REJECT: 'red'
                };
                
                // Get color, if status not in mapping use default
                const color = colorMap[selectedRequest.status] || 'default';
                
                return <Tag color={color}>{selectedRequest.status}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Message">{selectedRequest.message}</Descriptions.Item>
            <Descriptions.Item label="Request Time">
              {dayjs(selectedRequest.requestTime).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            
            {(selectedRequest.status !== 'pending' && selectedRequest.status !== 'PENDING') && (
              <>
                <Descriptions.Item label="Response Time">
                  {selectedRequest.responseTime ? dayjs(selectedRequest.responseTime).format('YYYY-MM-DD HH:mm') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Reply">
                  {selectedRequest.reply || '-'}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default SubscriptionRequests; 