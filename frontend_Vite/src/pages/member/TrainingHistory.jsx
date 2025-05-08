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
  
  // Add date range state
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'), // Default start date: 30 days ago
    dayjs() // Default end date: today
  ]);

  // Use RTK Query to get data
  const { data, isLoading, refetch, isFetching } = useGetMemberTrainingHistoryQuery({
    pageNow: currentPage,
    pageSize,
    startDate: dateRange[0].format('YYYY/MM/DD'),
    endDate: dateRange[1].format('YYYY/MM/DD')
  }, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000 // Automatically refresh every 30 seconds
  });

  // Mark as read mutation
  const [markAsRead] = useMarkTrainingHistoryAsReadMutation();

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      refetch();
    };
    
    window.addEventListener('refresh-training-history', handleRefresh);
    
    return () => {
      window.removeEventListener('refresh-training-history', handleRefresh);
    };
  }, [refetch]);

  // Date range change handler
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
      setCurrentPage(1); // Reset to first page
    }
  };

  // Table column definitions
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

  // View details and mark as read
  const showDetails = (record) => {
    setSelectedRecord(record);
    setDetailsVisible(true);
    
    // Record original unread status
    const isUnread = record && record.memberIsRead === false;
    setWasUnread(isUnread);
    
    // If unread message, mark as read
    if (isUnread) {
      markAsRead(record.id)
        .unwrap()
        .then((response) => {
          if (response.code === 0) {
            // Refresh data after marking successfully
            refetch();
            // Trigger global event to force sidebar count refresh
            window.dispatchEvent(new Event('refresh-unread-count'));
          } else {
            // Display backend error message
            message.error(response.msg || 'Failed to mark as read');
          }
        })
        .catch(error => {
          // Display backend error message
          message.error(error.data?.msg || 'Failed to mark as read');
        });
    }
  };

  const handleCloseDetails = () => {
    setDetailsVisible(false);
    
    // If viewed record was previously unread, refresh list when closing details
    if (wasUnread) {
      refetch();
      // Trigger global event to force sidebar count refresh
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
        <Title level={3} className="mb-6">Training History</Title>

        {/* Date range selector */}
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

        {/* Training history list */}
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

      {/* Details modal */}
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