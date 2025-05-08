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
  Input,
  message
} from 'antd';
import { 
  useGetSubscriptionRequestsQuery, 
  useMarkRequestAsReadMutation, 
  useAcceptSubscriptionRequestMutation,
  useRejectSubscriptionRequestMutation,
  useGetUnreadRequestsCountQuery 
} from '../../store/api/coachApi';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const SubscriptionRequests = () => {
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [handleVisible, setHandleVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [replyText, setReplyText] = useState('');
  // Track if currently viewed request was originally unread
  const [wasUnread, setWasUnread] = useState(false);

  // Use RTK Query to fetch data
  const { data, isLoading, error, refetch } = useGetSubscriptionRequestsQuery({
    pageNow: currentPage,
    pageSize,
    statusList: selectedStatus
  }, {
    // Refetch when component mounts or parameters change
    refetchOnMountOrArgChange: true,
    // Periodic auto-refresh
    pollingInterval: 30000 // Auto refresh every 30 seconds
  });

  // Add mark as read mutation
  const [markAsRead] = useMarkRequestAsReadMutation();
  
  // Get unread count query
  const { refetch: refetchUnreadCount } = useGetUnreadRequestsCountQuery();
  
  // Add request handling mutations
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptSubscriptionRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectSubscriptionRequestMutation();

  // Add listener to refresh data when refresh event is received
  useEffect(() => {
    // Refresh once on initial load
    refetch();
    
    // Register event listener
    const handleRefresh = () => {
      refetch();
    };
    
    window.addEventListener('refresh-subscription-requests', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-subscription-requests', handleRefresh);
    };
  }, [refetch]);

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
          {text} 
          {!record.coachIsRead && (
            <Tag color="blue" className="ml-2">NEW</Tag>
          )}
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
        // Create color mapping, handling different case status values
        const colorMap = {
          pending: 'gold',
          accept: 'green',
          reject: 'red',
          PENDING: 'gold',
          ACCEPT: 'green',
          REJECT: 'red'
        };
        
        // Get color, use grey as default if status not in mapping
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
          {(record.status === 'PENDING') && (
            <Button 
              type="default" 
              size="small"
              onClick={() => showHandleModal(record)}
            >
              Handle
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleStatusChange = (checkedValues) => {
    setSelectedStatus(checkedValues);
    setCurrentPage(1); // Reset page number
    
    // Force refetch data to avoid using cache
    setTimeout(() => {
      refetch();
    }, 0);
  };

  // Mark as read when viewing details
  const showDetails = (record) => {
    setSelectedRequest(record);
    setDetailsVisible(true);
    
    // Record original unread state
    const isUnread = record && !record.coachIsRead;
    setWasUnread(isUnread);
    
    // Mark as read if unread
    if (isUnread) {
      markAsRead(record.id)
        .unwrap()
        .then(() => {
          // Actively refresh unread count after successful marking
          refetchUnreadCount();
          
          // Trigger global event to force refresh sidebar counts
          window.dispatchEvent(new Event('refresh-unread-count'));
        })
        .catch(error => {
          message.error(error?.data?.msg || 'Failed to mark as read');
        });
    }
  };

  const handleCloseDetails = () => {
    setDetailsVisible(false);
    
    // Only refresh counts if the viewed request was originally unread
    if (wasUnread) {
      // Refresh unread counts when closing details to ensure sidebar numbers update
      refetchUnreadCount();
      // Trigger global event to force refresh sidebar counts
      window.dispatchEvent(new Event('refresh-unread-count'));
    }
    
    // Reset unread state marker
    setWasUnread(false);
  };

  const showHandleModal = (record) => {
    setSelectedRequest(record);
    setReplyText('');
    setHandleVisible(true);
    
    // Record original unread state
    const isUnread = record && !record.coachIsRead;
    setWasUnread(isUnread);
    
    // Mark as read if unread
    if (isUnread) {
      markAsRead(record.id)
        .unwrap()
        .then(() => {
          // Actively refresh unread count after successful marking
          refetchUnreadCount();
          
          // Trigger global event to force refresh sidebar counts
          window.dispatchEvent(new Event('refresh-unread-count'));
        })
        .catch(error => {
          message.error(error?.data?.msg || 'Failed to mark as read');
        });
    }
  };

  const handleCloseHandleModal = () => {
    setHandleVisible(false);
    
    // Only refresh counts if the viewed request was originally unread
    if (wasUnread) {
      // Refresh unread counts when closing handle modal
      refetchUnreadCount();
      // Trigger global event to force refresh sidebar counts
      window.dispatchEvent(new Event('refresh-unread-count'));
    }
    
    // Reset unread state marker
    setWasUnread(false);
  };

  const handleAccept = async () => {
    // Validate if reply is empty
    if (!replyText.trim()) {
      message.error('Reply cannot be empty');
      return;
    }
    
    try {
      await acceptRequest({
        requestId: selectedRequest.id,
        reply: replyText
      }).unwrap();
      
      message.success('Subscription request accepted');
      setHandleVisible(false);
      
      // Only refresh counts if the request was originally unread
      if (wasUnread) {
        // Refresh unread counts after handling request
        refetchUnreadCount();
        // Trigger global event to force refresh sidebar counts
        window.dispatchEvent(new Event('refresh-unread-count'));
      }
      
      // Reset unread state marker
      setWasUnread(false);
    } catch (error) {
      message.error(error?.data?.msg || 'Failed to accept the request');
    }
  };

  const handleReject = async () => {
    // Validate if reply is empty
    if (!replyText.trim()) {
      message.error('Reply cannot be empty');
      return;
    }
    
    try {
      await rejectRequest({
        requestId: selectedRequest.id,
        reply: replyText
      }).unwrap();
      
      message.success('Subscription request rejected');
      setHandleVisible(false);
      
      // Only refresh counts if the request was originally unread
      if (wasUnread) {
        // Refresh unread counts after handling request
        refetchUnreadCount();
        // Trigger global event to force refresh sidebar counts
        window.dispatchEvent(new Event('refresh-unread-count'));
      }
      
      // Reset unread state marker
      setWasUnread(false);
    } catch (error) {
      message.error(error?.data?.msg || 'Failed to reject the request');
    }
  };

  return (
    <div className="p-6">
      <Card>
        <Title level={3} className="mb-6">Subscription Requests</Title>
        
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
          rowClassName={(record) => !record.coachIsRead ? 'bg-blue-50' : ''}
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
                // Create color mapping, handling different case status values
                const colorMap = {
                  pending: 'gold',
                  accept: 'green',
                  reject: 'red',
                  PENDING: 'gold',
                  ACCEPT: 'green',
                  REJECT: 'red'
                };
                
                // Get color, use grey as default if status not in mapping
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

      {/* Handle request modal */}
      <Modal
        title="Handle Subscription Request"
        open={handleVisible}
        onCancel={handleCloseHandleModal}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <div>
            <Descriptions column={1} className="mb-4">
              <Descriptions.Item label="Member Name">{selectedRequest.memberName}</Descriptions.Item>
              <Descriptions.Item label="Message">{selectedRequest.message}</Descriptions.Item>
            </Descriptions>
            
            <div className="mb-4">
              <label className="block mb-2">
                <span className="mr-1">Reply</span>
                <span className="text-red-500 font-bold">*</span>
                <span className="text-gray-500 text-sm ml-2">(required)</span>
              </label>
              <TextArea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Enter your reply to the member... (required)"
                status={replyText.trim() ? '' : 'error'}
                showCount
                maxLength={500}
              />
              {!replyText.trim() && (
                <div className="text-red-500 mt-1 text-sm">Please enter a reply before accepting or rejecting</div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button onClick={handleCloseHandleModal}>
                Cancel
              </Button>
              <Button 
                danger 
                type="primary"
                onClick={handleReject} 
                loading={isRejecting}
                disabled={!replyText.trim()}
                style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
              >
                Reject
              </Button>
              <Button 
                type="primary" 
                onClick={handleAccept} 
                loading={isAccepting}
                disabled={!replyText.trim()}
                className="bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
              >
                Accept
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SubscriptionRequests; 