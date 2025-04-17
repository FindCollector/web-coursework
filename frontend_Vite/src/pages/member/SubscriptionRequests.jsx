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
  // 追踪当前查看的请求是否原本是未读状态
  const [wasUnread, setWasUnread] = useState(false);

  // 使用RTK Query获取数据
  const { data, isLoading, error, refetch } = useGetMemberSubscriptionRequestsQuery({
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
  const [markAsRead] = useMarkMemberRequestAsReadMutation();
  
  // 获取未读数量查询
  const { refetch: refetchUnreadCount } = useGetMemberUnreadRequestsCountQuery();
  
  // 当组件首次加载或被激活时刷新数据
  useEffect(() => {
    // 组件挂载或激活时立即刷新数据
    refetch();
    
    // 添加事件监听器，在发送新请求后刷新列表
    const handleRefreshRequests = () => {
      refetch();
    };
    
    window.addEventListener('refresh-requests', handleRefreshRequests);
    
    return () => {
      window.removeEventListener('refresh-requests', handleRefreshRequests);
    };
  }, [refetch]);
  
  // 当数据发生变化时，触发教练列表刷新
  useEffect(() => {
    if (data && data.records && data.records.length > 0) {
      // 发送事件，通知CoachList组件刷新数据
      window.dispatchEvent(new Event('refresh-coach-status'));
    }
  }, [data]);

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
    
    // 记录原始未读状态，兼容两种可能的字段名
    const isUnread = record && (record.memberIsRead === false || record.member_is_read === false);
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

  return (
    <div className="p-6">
      <Card>
        <Title level={3} className="mb-6">My Subscription Requests</Title>
        
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
    </div>
  );
};

export default SubscriptionRequests; 