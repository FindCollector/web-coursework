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
  // 追踪当前查看的请求是否原本是未读状态
  const [wasUnread, setWasUnread] = useState(false);
  // 添加处理状态
  const [isProcessing, setIsProcessing] = useState(false);

  // 使用RTK Query获取数据
  const { data, isLoading, refetch } = useGetSessionRequestsQuery({
    pageNow: currentPage,
    pageSize,
    statusList: selectedStatus
  }, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000 // 每30秒自动刷新一次
  });

  // 添加标记已读的mutation
  const [markAsRead] = useMarkCoachSessionRequestAsReadMutation();
  
  // 获取未读订阅计数查询
  const { refetch: refetchUnreadSubscriptionCount } = useGetUnreadRequestsCountQuery();
  
  // 获取未读Session计数查询
  const { refetch: refetchUnreadSessionCount } = useGetUnreadSessionCountQuery();
  
  // 添加处理Session请求的mutation
  const [handleSessionRequest] = useHandleSessionRequestMutation();

  // 当组件首次加载或被激活时刷新数据
  useEffect(() => {
    // 组件挂载或激活时立即刷新数据
    refetch();
    
    // 添加事件监听器，在发送新请求后刷新列表
    const handleRefreshRequests = () => {
      refetch();
    };
    
    window.addEventListener('refresh-coach-session-requests', handleRefreshRequests);
    
    return () => {
      window.removeEventListener('refresh-coach-session-requests', handleRefreshRequests);
    };
  }, [refetch]);

  // 状态选项
  const statusOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Accepted', value: 'ACCEPT' },
    { label: 'Rejected', value: 'REJECT' },
    { label: 'Cancelled', value: 'CANCEL' }
  ];

  // 表格列定义
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
          CANCEL: 'grey'
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
          refetchUnreadSessionCount();
          refetchUnreadSubscriptionCount();
          
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
      refetchUnreadSessionCount();
      refetchUnreadSubscriptionCount();
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
          refetchUnreadSessionCount();
          refetchUnreadSubscriptionCount();
          
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
      refetchUnreadSessionCount();
      refetchUnreadSubscriptionCount();
      // 触发全局事件，强制刷新侧边栏计数
      window.dispatchEvent(new Event('refresh-unread-count'));
    }
    
    // 重置未读状态标记
    setWasUnread(false);
  };

  // 处理请求（接受或拒绝）
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
        refetch(); // 刷新列表
        refetchUnreadSessionCount(); // 刷新未读计数
        refetchUnreadSubscriptionCount(); // 刷新订阅未读计数
      } else {
        message.error(response.msg || 'Processing failed');
      }
    } catch (error) {
      console.error('处理Session请求失败:', error);
      message.error(error.data?.msg || 'Processing failed, please try again later');
    } finally {
      setIsProcessing(false);
    }
  };

  // 确保传递给Table的dataSource始终是数组
  const tableDataSource = Array.isArray(data?.data?.records) ? data.data.records : [];

  return (
    <div className="p-6">
      <Card>
        <Title level={3} className="mb-6">Session Requests</Title>
        
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
                  CANCEL: 'grey'
                };
                const color = colorMap[selectedRequest.status] || 'default';
                return <Tag color={color}>{selectedRequest.status}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Message">{selectedRequest.message}</Descriptions.Item>
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

      {/* 处理请求模态框 */}
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
              <Descriptions.Item label="Message">{selectedRequest.message}</Descriptions.Item>
              <Descriptions.Item label="Start Time">
                {dayjs(selectedRequest.startTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="End Time">
                {dayjs(selectedRequest.endTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
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