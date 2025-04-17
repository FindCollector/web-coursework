import React, { useState, useEffect } from 'react';
import { Card, Modal, Spin, Tag, Alert, Empty, Avatar, Row, Col, Space, Form, Input, Select, Button, Divider, message } from 'antd';
import { useGetCoachListQuery, useGetCoachFilterOptionsQuery, useSendSubscriptionRequestMutation } from '../store/api/coachApi';
import { UserOutlined, EnvironmentOutlined, MailOutlined, TagOutlined, FilterOutlined, SearchOutlined, ClearOutlined, CalendarOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

// 添加样式组件
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
  padding: 24px;
`;

const FilterCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
  backdrop-filter: blur(8px);
  padding: 24px;
  margin-bottom: 32px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.18);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.2);
  }
`;

const StyledCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  height: 100%;
  background: white;
  border: none;
  
  .ant-card-body {
    padding: 24px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,1));
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(31, 38, 135, 0.15);
  }
`;

const CoachAvatar = styled(Avatar)`
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(31, 38, 135, 0.2);
  margin-bottom: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(31, 38, 135, 0.25);
  }
`;

const TagContainer = styled.div`
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
`;

const StyledTag = styled(Tag)`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  white-space: nowrap;
  background: ${props => props.color === 'green' ? '#e6f7e9' : '#e6f4ff'};
  color: ${props => props.color === 'green' ? '#52c41a' : '#1890ff'};
  border: 1px solid ${props => props.color === 'green' ? '#b7eb8f' : '#91caff'};
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .anticon {
    font-size: 12px;
  }
`;

const CoachList = () => {
  // Filter form state
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    userName: '',
    tags: [],
    locations: [],
  });
  
  // 获取过滤器选项
  const { data: filterOptions, isLoading: isLoadingOptions } = useGetCoachFilterOptionsQuery();
  
  // Query with filters
  const { data: coachListData, isLoading, error, refetch } = useGetCoachListQuery(filters, {
    pollingInterval: 60000, // 每60秒自动刷新一次数据
    refetchOnFocus: true,   // 当页面重新获得焦点时刷新
    refetchOnReconnect: true // 网络重连时刷新
  });
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubscribeModalVisible, setIsSubscribeModalVisible] = useState(false);
  const [selectedCoachForSubscription, setSelectedCoachForSubscription] = useState(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [sendSubscription, { isLoading: isSubscribing }] = useSendSubscriptionRequestMutation();

  useEffect(() => {
    console.log('CoachList组件状态:', { 
      isLoading, 
      hasData: !!coachListData, 
      error: error?.message,
      coachCount: coachListData?.records?.length,
      currentFilters: filters
    });
  }, [coachListData, isLoading, error, filters]);

  // 添加事件监听器，当会员的请求状态变化时刷新教练列表
  useEffect(() => {
    // 定义刷新教练列表的处理函数
    const handleRefreshCoachList = () => {
      console.log('Refreshing coach list due to request status change...');
      refetch();
    };
    
    // 监听请求状态变化事件
    window.addEventListener('refresh-coach-status', handleRefreshCoachList);
    
    // 组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('refresh-coach-status', handleRefreshCoachList);
    };
  }, [refetch]);

  const handleCardClick = (coach) => {
    setSelectedCoach(coach);
    setIsModalVisible(true);
  };
  
  const handleFilterSubmit = (values) => {
    console.log('Filter form submitted:', values);
    setFilters({
      userName: values.userName || '',
      tags: values.tags || [],
      locations: values.locations || [],
    });
  };
  
  const handleResetFilters = () => {
    form.resetFields();
    setFilters({
      userName: '',
      tags: [],
      locations: [],
    });
  };

  const handleSubscribe = (coach) => {
    setSelectedCoachForSubscription(coach);
    setSubscriptionMessage('');
    setIsSubscribeModalVisible(true);
  };

  const handleSubscriptionSubmit = async () => {
    if (!subscriptionMessage.trim()) {
      message.error('Please enter a message for the coach');
      return;
    }

    try {
      const response = await sendSubscription({
        coachId: selectedCoachForSubscription.coachId,
        message: subscriptionMessage.trim()
      }).unwrap();

      if (response.code === 0) {
        message.success('Subscription request sent successfully');
        setIsSubscribeModalVisible(false);
        
        // 更新当前选中的教练状态为Pending
        if (selectedCoach && selectedCoach.coachId === selectedCoachForSubscription.coachId) {
          setSelectedCoach({
            ...selectedCoach,
            status: 'Pending'
          });
        }
        
        // 更新列表中的教练状态
        if (coachListData && coachListData.records) {
          const updatedRecords = coachListData.records.map(coach => {
            if (coach.coachId === selectedCoachForSubscription.coachId) {
              return { ...coach, status: 'Pending' };
            }
            return coach;
          });
          
          // 应用更新到本地状态
          const updatedData = { ...coachListData, records: updatedRecords };
          
          // 使用RTK Query的updateQueryData方法来更新缓存
          // 或者重新获取教练列表数据
          refetch();
        }
        
        setSubscriptionMessage('');
        setSelectedCoachForSubscription(null);
        
        // 触发事件，通知其他组件刷新请求列表
        window.dispatchEvent(new Event('refresh-requests'));
        // 同时刷新未读计数
        window.dispatchEvent(new Event('refresh-unread-count'));
      } else {
        message.error(response.msg || 'Failed to send subscription request');
      }
    } catch (error) {
      message.error(error.data?.msg || 'Failed to send subscription request');
    }
  };

  if (isLoading || isLoadingOptions) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading coaches..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={`Failed to load coaches: ${error.message}`}
        type="error"
        showIcon
        className="m-4"
      />
    );
  }

  if (!coachListData?.records?.length) {
    return (
      <Empty
        description="No coaches found"
        className="my-8"
      />
    );
  }

  return (
    <PageWrapper>
      <FilterCard>
        <div className="flex items-center mb-4">
          <FilterOutlined className="text-2xl text-blue-500 mr-3" />
          <h2 className="text-2xl font-semibold m-0 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Find Your Perfect Coach
          </h2>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilterSubmit}
          initialValues={{
            userName: filters.userName,
            tags: filters.tags,
            locations: filters.locations,
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="userName" label={<span className="text-gray-700">Coach Name</span>}>
                <Input 
                  placeholder="Search by name" 
                  prefix={<SearchOutlined className="text-gray-400" />}
                  className="rounded-lg" 
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="tags" label={<span className="text-gray-700">Specialties</span>}>
                <Select
                  mode="multiple"
                  placeholder="Select specialties"
                  options={filterOptions?.tags || []}
                  allowClear
                  maxTagCount={3}
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="locations" label={<span className="text-gray-700">Locations</span>}>
                <Select
                  mode="multiple"
                  placeholder="Select locations"
                  options={filterOptions?.locations || []}
                  allowClear
                  maxTagCount={3}
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end gap-3">
            <Button 
              onClick={handleResetFilters} 
              icon={<ClearOutlined />}
              className="rounded-lg hover:bg-gray-100 border border-gray-200"
            >
              Reset
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<FilterOutlined />}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 border-0 hover:from-blue-600 hover:to-blue-700"
            >
              Apply Filters
            </Button>
          </div>
        </Form>
      </FilterCard>

      <Row gutter={[24, 24]} className="justify-center sm:justify-start">
        {coachListData.records.map((coach) => (
          <Col xs={24} sm={12} md={8} lg={6} key={coach.coachId}>
            <StyledCard
              hoverable
              onClick={() => handleCardClick(coach)}
              className="transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <CoachAvatar
                  size={100}
                  src={`http://127.0.0.1:8080${coach.photo}`}
                  icon={<UserOutlined />}
                />
                <h3 className="mt-4 mb-2 text-xl font-semibold">{coach.userName}</h3>
                <TagContainer>
                  {coach.tagNames?.map((tag, index) => (
                    <StyledTag key={index} color="green">
                      <TagOutlined />
                      {tag}
                    </StyledTag>
                  ))}
                </TagContainer>
              </div>
            </StyledCard>
          </Col>
        ))}
      </Row>

      <Modal
        title={null}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
        centered
        className="rounded-2xl overflow-hidden"
      >
        {selectedCoach && (
          <div className="space-y-8">
            <div className="text-center pb-8 border-b">
              <CoachAvatar
                size={120}
                src={selectedCoach && `http://127.0.0.1:8080${selectedCoach.photo}`}
                icon={<UserOutlined />}
                className="mb-6"
              />
              <h2 className="text-2xl font-bold mb-4">{selectedCoach?.userName}</h2>
              <p className="text-gray-500 text-base">{selectedCoach.intro || 'No introduction available'}</p>
              {selectedCoach.status === 'Normal' && (
                <Button
                  type="primary"
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe(selectedCoach);
                  }}
                >
                  Subscribe
                </Button>
              )}
              {selectedCoach.status === 'Pending' || selectedCoach.status === 'PENDING' ? (
                <Button
                  type="default"
                  className="mt-4"
                  disabled
                >
                  Pending
                </Button>
              ) : selectedCoach.status === 'Accept' || selectedCoach.status === 'ACCEPT' ? (
                <Button
                  type="primary"
                  className="mt-4 bg-green-500 hover:bg-green-600 border-green-500"
                  disabled
                >
                  Accepted
                </Button>
              ) : selectedCoach.status === 'Reject' || selectedCoach.status === 'REJECT' ? (
                <Button
                  type="primary"
                  className="mt-4 bg-red-500 hover:bg-red-600 border-red-500"
                  disabled
                >
                  Rejected
                </Button>
              ) : selectedCoach.status !== 'Normal' && (
                <Button
                  type="default"
                  className="mt-4"
                  disabled
                >
                  {selectedCoach.status}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                    <UserOutlined className="text-blue-500 text-lg" />
                    <span className="text-gray-500">Age:</span>
                    <span className="font-medium">{selectedCoach.age || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                    <MailOutlined className="text-blue-500 text-lg" />
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium truncate">{selectedCoach.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <TagOutlined className="text-blue-500 text-lg" />
                    <span className="font-semibold text-lg">Specialties</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {selectedCoach.tagNames?.map((tag, index) => (
                      <StyledTag key={index} color="green">
                        <TagOutlined />
                        <span>{tag}</span>
                      </StyledTag>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <EnvironmentOutlined className="text-blue-500 text-lg" />
                    <span className="font-semibold text-lg">Available Locations</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {selectedCoach.locationNames?.map((location, index) => (
                      <StyledTag key={index} color="blue">
                        <EnvironmentOutlined />
                        <span>{location}</span>
                      </StyledTag>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Send Subscription Request"
        open={isSubscribeModalVisible}
        onCancel={() => setIsSubscribeModalVisible(false)}
        onOk={handleSubscriptionSubmit}
        okText="Send"
        confirmLoading={isSubscribing}
      >
        <Form layout="vertical">
          <Form.Item
            label="Message to Coach"
            required
            rules={[{ required: true, message: 'Please enter your message' }]}
          >
            <Input.TextArea
              value={subscriptionMessage}
              onChange={(e) => setSubscriptionMessage(e.target.value)}
              placeholder="Write a message to introduce yourself and explain why you'd like to train with this coach..."
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageWrapper>
  );
};

export default CoachList;