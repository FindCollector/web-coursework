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
  useGetSessionRequestsQuery, 
  useMarkCoachSessionRequestAsReadMutation,
  useGetUnreadRequestsCountQuery,
  useGetUnreadSessionCountQuery,
  useHandleSessionRequestMutation
} from '../../store/api/coachApi';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const SessionRequests = () => {
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [handleVisible, setHandleVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [replyText, setReplyText] = useState('');
  // Track if currently viewed request was originally unread
  const [wasUnread, setWasUnread] = useState(false);
  // Add processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Use RTK Query to fetch data
  const { data, isLoading, refetch } = useGetSessionRequestsQuery({
    pageNow: currentPage,
    pageSize,
    statusList: selectedStatus
  }, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000 // Auto refresh every 30 seconds
  });

  // Add mark as read mutation
  const [markAsRead] = useMarkCoachSessionRequestAsReadMutation();
  
  // Get unread subscription count query
  const { refetch: refetchUnreadSubscriptionCount } = useGetUnreadRequestsCountQuery();
  
  // Get unread session count query
  const { refetch: refetchUnreadSessionCount } = useGetUnreadSessionCountQuery();
  
  // Add handle session request mutation
  const [handleSessionRequest] = useHandleSessionRequestMutation();

  // Refresh data when component is first loaded or activated
  useEffect(() => {
    // Immediately refresh data when component mounts or activates
    refetch();
    
    // Add event listener to refresh list after sending new requests
    const handleRefreshRequests = () => {
      refetch();
    };
    
    window.addEventListener('refresh-coach-session-requests', handleRefreshRequests);
    
    return () => {
      window.removeEventListener('refresh-coach-session-requests', handleRefreshRequests);
    };
  }, [refetch]);

  // Status options
  const statusOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Accepted', value: 'ACCEPT' },
    { label: 'Rejected', value: 'REJECT' },
    { label: 'Cancelled', value: 'CANCEL' }
  ];

  // Table column definitions
  const columns = [
    {
      title: 'Member Name',
      dataIndex: 'memberName',
      key: 'memberName',
      render: (text, record) => (
        <div className="flex items-center">
          {!record.coachIsRead && (
            <Tag color="blue" className="mr-2">NEW</Tag>
          )}
          {text}
        </div>
      ),
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
          cancel: 'grey',
          PENDING: 'gold',
          ACCEPT: 'green',
          REJECT: 'red',
          CANCEL: 'grey'
        };
        
        // Get color, use grey as default if status not in mapping
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
          {record.status === 'PENDING' && (
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
          refetchUnreadSessionCount();
          refetchUnreadSubscriptionCount();
          
          // Trigger global event to force refresh sidebar counts
          window.dispatchEvent(new Event('refresh-unread-count'));
        })
        .catch(error => {
          message.error('Failed to mark as read');
        });
    }
  };

  const handleCloseDetails = () => {
    setDetailsVisible(false);
    
    // Only refresh counts if the viewed request was originally unread
    if (wasUnread) {
      // Refresh unread counts when closing details to ensure sidebar numbers update
      refetchUnreadSessionCount();
      refetchUnreadSubscriptionCount();
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
          refetchUnreadSessionCount();
          refetchUnreadSubscriptionCount();
          
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
      refetchUnreadSessionCount();
      refetchUnreadSubscriptionCount();
      // Trigger global event to force refresh sidebar counts
      window.dispatchEvent(new Event('refresh-unread-count'));
    }
    
    // Reset unread state marker
    setWasUnread(false);
  };

  // Handle request (accept or reject)
  const handleRequest = async (status) => {
    if (!replyText.trim()) {
      message.error('Please enter a reply');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await handleSessionRequest({
        requestId: selectedRequest.id,
        status: status,
        reply: replyText.trim()
      }).unwrap();

      if (response.code === 0) {
        message.success('Successfully processed');
        setHandleVisible(false);
        refetch(); // Refresh list
        refetchUnreadSessionCount(); // Refresh unread count
        refetchUnreadSubscriptionCount(); // Refresh subscription unread count
      } else {
        message.error(response.msg || 'Processing failed');
      }
    } catch (error) {
      message.error(error.data?.msg || 'Processing failed, please try again later');
    } finally {
      setIsProcessing(false);
    }
  };

  // Ensure dataSource passed to Table is always an array
  const tableDataSource = Array.isArray(data?.data?.records) ? data.data.records : [];

  return (
    <div className="p-6">
      <Card>
        <Title level={3} className="mb-6">Session Requests</Title>
        
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
          rowClassName={(record) => !record.coachIsRead ? 'bg-blue-50' : ''}
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
                  CANCEL: 'grey'
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
        title="Handle Session Request"
        open={handleVisible}
        onCancel={handleCloseHandleModal}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <div>
            <Descriptions column={1} className="mb-4">
              <Descriptions.Item label="Member Name">{selectedRequest.memberName}</Descriptions.Item>
              <Descriptions.Item label="Fitness Goals">{selectedRequest.message}</Descriptions.Item>
              <Descriptions.Item label="Start Time">
                {dayjs(selectedRequest.startTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="End Time">
                {dayjs(selectedRequest.endTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
            
            <div className="mb-4">
              <label className="block mb-2">
                <span className="mr-1">Your Response</span>
                <span className="text-red-500 font-bold">*</span>
                <span className="text-gray-500 text-sm ml-2">(required)</span>
              </label>
              <TextArea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Enter your response to the member's session request..."
                status={replyText.trim() ? '' : 'error'}
                showCount
                maxLength={500}
              />
              {!replyText.trim() && (
                <div className="text-red-500 mt-1 text-sm">You must provide a response before accepting or rejecting</div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button onClick={handleCloseHandleModal}>
                Cancel
              </Button>
              <Button 
                danger 
                type="primary"
                onClick={() => handleRequest('REJECT')}
                disabled={!replyText.trim() || isProcessing}
                loading={isProcessing}
                style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
              >
                Reject
              </Button>
              <Button 
                type="primary" 
                onClick={() => handleRequest('ACCEPT')}
                disabled={!replyText.trim() || isProcessing}
                loading={isProcessing}
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

export default SessionRequests; 