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
  // 追踪当前查看的请求是否原本是未读状态
  const [wasUnread, setWasUnread] = useState(false);

  // 使用RTK Query获取数据
  const { data, isLoading, error, refetch } = useGetSubscriptionRequestsQuery({
    pageNow: currentPage,
    pageSize,
    statusList: selectedStatus
  }, {
    // 组件挂载或参数变化时重新获取
    refetchOnMountOrArgChange: true,
    // 定期自动刷新
    pollingInterval: 30000 // 每30秒自动刷新一次
  });

  // 添加标记已读的mutation
  const [markAsRead] = useMarkRequestAsReadMutation();
  
  // 获取未读数量查询
  const { refetch: refetchUnreadCount } = useGetUnreadRequestsCountQuery();
  
  // 添加处理请求的mutation
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptSubscriptionRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectSubscriptionRequestMutation();

  // 添加监听，当收到刷新事件时重新获取数据
  useEffect(() => {
    // 首次加载时刷新一次
    refetch();
    
    // 注册事件监听器
    const handleRefresh = () => {
      console.log('Refreshing subscription requests...');
      refetch();
    };
    
    window.addEventListener('refresh-subscription-requests', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-subscription-requests', handleRefresh);
    };
  }, [refetch]);

  // 状态选项
  const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accept' },
    { label: 'Rejected', value: 'reject' }
  ];

  // 表格列定义
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
        // 创建颜色映射，处理不同大小写的状态值
        const colorMap = {
          pending: 'gold',
          accept: 'green',
          reject: 'red',
          PENDING: 'gold',
          ACCEPT: 'green',
          REJECT: 'red'
        };
        
        // 获取颜色，如果状态不在映射中则使用灰色
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
    const isUnread = record && !record.coachIsRead;
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
          message.error(error?.data?.msg || 'Failed to mark as read');
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

  const showHandleModal = (record) => {
    setSelectedRequest(record);
    setReplyText('');
    setHandleVisible(true);
    
    // 记录原始未读状态
    const isUnread = record && !record.coachIsRead;
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
          message.error(error?.data?.msg || 'Failed to mark as read');
        });
    }
  };

  const handleCloseHandleModal = () => {
    setHandleVisible(false);
    
    // 只有当查看的请求之前是未读状态时，才刷新计数
    if (wasUnread) {
      // 关闭处理模态框时刷新未读计数
      refetchUnreadCount();
      // 触发全局事件，强制刷新侧边栏计数
      window.dispatchEvent(new Event('refresh-unread-count'));
    }
    
    // 重置未读状态标记
    setWasUnread(false);
  };

  const handleAccept = async () => {
    // 验证reply是否为空
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
      
      // 只有原来是未读的请求才需要刷新计数
      if (wasUnread) {
        // 处理请求后刷新未读计数
        refetchUnreadCount();
        // 触发全局事件，强制刷新侧边栏计数
        window.dispatchEvent(new Event('refresh-unread-count'));
      }
      
      // 重置未读状态标记
      setWasUnread(false);
    } catch (error) {
      console.error('Failed to accept request:', error);
      message.error(error?.data?.msg || 'Failed to accept the request');
    }
  };

  const handleReject = async () => {
    // 验证reply是否为空
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
      
      // 只有原来是未读的请求才需要刷新计数
      if (wasUnread) {
        // 处理请求后刷新未读计数
        refetchUnreadCount();
        // 触发全局事件，强制刷新侧边栏计数
        window.dispatchEvent(new Event('refresh-unread-count'));
      }
      
      // 重置未读状态标记
      setWasUnread(false);
    } catch (error) {
      console.error('Failed to reject request:', error);
      message.error(error?.data?.msg || 'Failed to reject the request');
    }
  };

  return (
    <div className="p-6">
      <Card>
        <Title level={3} className="mb-6">Subscription Requests</Title>
        
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

      {/* 详情模态框 */}
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
                // 创建颜色映射，处理不同大小写的状态值
                const colorMap = {
                  pending: 'gold',
                  accept: 'green',
                  reject: 'red',
                  PENDING: 'gold',
                  ACCEPT: 'green',
                  REJECT: 'red'
                };
                
                // 获取颜色，如果状态不在映射中则使用灰色
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

      {/* 处理请求模态框 */}
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