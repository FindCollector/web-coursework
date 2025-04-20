import { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Table, 
  Tag, 
  Space, 
  Empty, 
  Button, 
  Modal, 
  Descriptions,
  Row,
  Col,
  Badge,
  message,
  DatePicker,
  Form
} from 'antd';
import { 
  useGetMemberTrainingHistoryQuery,
  useMarkTrainingHistoryAsReadMutation
} from '../../store/api/memberApi';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const TrainingHistory = () => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [wasUnread, setWasUnread] = useState(false);
  
  // 添加日期范围状态
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'), // 默认开始日期：30天前
    dayjs() // 默认结束日期：今天
  ]);

  // 使用RTK Query获取数据
  const { data, isLoading, refetch, isFetching } = useGetMemberTrainingHistoryQuery({
    pageNow: currentPage,
    pageSize,
    startDate: dateRange[0].format('YYYY/MM/DD'),
    endDate: dateRange[1].format('YYYY/MM/DD')
  }, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000 // 每30秒自动刷新一次
  });

  // 标记已读mutation
  const [markAsRead] = useMarkTrainingHistoryAsReadMutation();

  // 监听刷新事件
  useEffect(() => {
    const handleRefresh = () => {
      refetch();
    };
    
    window.addEventListener('refresh-training-history', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-training-history', handleRefresh);
    };
  }, [refetch]);

  // 日期范围变化处理函数
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
      setCurrentPage(1); // 重置到第一页
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'Coach Name',
      dataIndex: 'coachName',
      key: 'coachName',
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
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
    },
    {
      title: 'Training Types',
      key: 'tags',
      render: (_, record) => (
        <Space size={[0, 8]} wrap>
          {record.tagList && record.tagList.map(tag => (
            <Tag color="blue" key={tag.id}>
              {tag.tagName}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => showDetails(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  // 查看详情并标记为已读
  const showDetails = (record) => {
    setSelectedRecord(record);
    setDetailsVisible(true);
    
    // 记录原始未读状态
    const isUnread = record && record.memberIsRead === false;
    setWasUnread(isUnread);
    
    // 如果是未读消息，则标记为已读
    if (isUnread) {
      markAsRead(record.id)
        .unwrap()
        .then((response) => {
          if (response.code === 0) {
            // 标记成功后刷新数据
            refetch();
            // 触发全局事件，强制刷新侧边栏计数
            window.dispatchEvent(new Event('refresh-unread-count'));
          } else {
            // 显示后端返回的错误信息
            message.error(response.msg || 'Failed to mark as read');
          }
        })
        .catch(error => {
          console.error('Failed to mark as read:', error);
          // 显示后端返回的错误信息
          message.error(error.data?.msg || 'Failed to mark as read');
        });
    }
  };

  const handleCloseDetails = () => {
    setDetailsVisible(false);
    
    // 如果查看的记录之前是未读状态，关闭详情时刷新列表
    if (wasUnread) {
      refetch();
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
        <Title level={3} className="mb-6">Training History</Title>

        {/* 日期范围选择器 */}
        <Form layout="inline" className="mb-6">
          <Form.Item label="Date Range">
            <RangePicker 
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY/MM/DD"
              allowClear={false}
            />
          </Form.Item>
        </Form>

        {/* 训练历史列表 */}
        <Table
          columns={columns}
          dataSource={tableDataSource}
          rowKey="id"
          loading={isLoading || isFetching}
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
            emptyText: <Empty description="No training history found" />,
          }}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="Training Session Details"
        open={detailsVisible}
        onCancel={handleCloseDetails}
        footer={[
          <Button key="close" onClick={handleCloseDetails}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedRecord && (
          <Descriptions bordered column={1} className="mt-4">
            <Descriptions.Item label="Member Name">{selectedRecord.memberName}</Descriptions.Item>
            <Descriptions.Item label="Coach Name">{selectedRecord.coachName}</Descriptions.Item>
            <Descriptions.Item label="Start Time">{selectedRecord.startTime}</Descriptions.Item>
            <Descriptions.Item label="End Time">{selectedRecord.endTime}</Descriptions.Item>
            <Descriptions.Item label="Training Types">
              <Space size={[0, 8]} wrap>
                {selectedRecord.tagList && selectedRecord.tagList.map(tag => (
                  <Tag color="blue" key={tag.id}>
                    {tag.tagName}
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Message">{selectedRecord.message}</Descriptions.Item>
            <Descriptions.Item label="Coach Feedback">{selectedRecord.feedback}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default TrainingHistory; 