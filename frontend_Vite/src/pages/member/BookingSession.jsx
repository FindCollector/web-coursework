import React, { useState, useEffect } from 'react';
import { Card, Modal, Spin, Tag, Alert, Empty, Avatar, Row, Col, Space, Button, Divider, Typography, message, List, Timeline, Input, Form } from 'antd';
import { useGetSubscriptionCoachListQuery, useUnsubscribeCoachMutation, useGetCoachAppropriateTimeListQuery, useBookSessionMutation } from '../../store/api/memberApi';
import { UserOutlined, EnvironmentOutlined, MailOutlined, TagOutlined, CalendarOutlined, DisconnectOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

const { Title } = Typography; // Import Typography.Title
const { TextArea } = Input;

// Reusing styled components from CoachList or define new ones if needed
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(120deg, #e0f2f7 0%, #ffffff 100%); // Lighter background
  padding: 24px;
`;

const StyledCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  height: 100%;
  background: white;
  border: none;
  transition: all 0.3s ease;
  
  .ant-card-body {
    padding: 24px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,1));
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(31, 38, 135, 0.1);
  }
`;

const CoachAvatar = styled(Avatar)`
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(31, 38, 135, 0.15);
  margin-bottom: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(31, 38, 135, 0.2);
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
  background: ${props => props.type === 'specialty' ? '#e6fffb' : '#e6f7ff'};
  color: ${props => props.type === 'specialty' ? '#13c2c2' : '#1890ff'};
  border: 1px solid ${props => props.type === 'specialty' ? '#87e8de' : '#91d5ff'};
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .anticon {
    font-size: 12px;
  }
`;

const BookingSession = () => {
  // Fetch the list of subscribed coaches
  const { data: coachList = [], isLoading, error, refetch } = useGetSubscriptionCoachListQuery(undefined, {
    // 禁用缓存，确保每次查询都是新的请求
    refetchOnMountOrArgChange: true
  });
  
  // 取消订阅的mutation hook
  const [unsubscribeCoach, { isLoading: isUnsubscribing }] = useUnsubscribeCoachMutation();
  
  // 预约课程的mutation hook
  const [bookSession, { isLoading: isBooking }] = useBookSessionMutation();
  
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUnsubscribeModalVisible, setIsUnsubscribeModalVisible] = useState(false);
  
  // 添加显示教练可用时间的状态
  const [isTimeModalVisible, setIsTimeModalVisible] = useState(false);
  const [selectedCoachForBooking, setSelectedCoachForBooking] = useState(null);
  
  // 添加预约信息状态
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  
  // 通过 lazy 方式加载教练的可用时间数据，只有在需要时才加载
  const { data: timeSlots, isLoading: isLoadingTimeSlots, error: timeSlotsError, refetch: refetchTimeSlots } = useGetCoachAppropriateTimeListQuery(
    selectedCoachForBooking?.coachId,
    { 
      skip: !selectedCoachForBooking,
      // 禁用缓存，确保每次查询都是新的请求
      refetchOnMountOrArgChange: true
    }
  );

  // 组件挂载时刷新数据
  useEffect(() => {
    refetch();
  }, [refetch]);

  console.log('[BookingSession] State:', { isLoading, error, coachList });

  const handleCardClick = (coach) => {
    console.log('[BookingSession] Card clicked:', coach);
    setSelectedCoach(coach);
    setIsModalVisible(true);
  };

  // 修改处理预约课程的函数
  const handleBookSession = (coach) => {
    console.log(`Showing available time slots for coach: ${coach.coachId}`);
    setSelectedCoachForBooking(coach);
    setIsTimeModalVisible(true);
    setIsModalVisible(false); // 关闭详情弹窗
    
    // 强制重新获取教练的可用时间
    setTimeout(() => {
      refetchTimeSlots();
    }, 0);
  };

  // 修改处理点击预约按钮的函数
  const handleBookClick = (day, slot) => {
    setSelectedDay(day);
    setSelectedTimeSlot(slot);
    setBookingMessage('');
    setIsBookingModalVisible(true);
  };
  
  // 提交预约请求
  const handleSubmitBooking = async () => {
    if (!selectedCoachForBooking || !selectedTimeSlot || !selectedDay) {
      message.error('Missing required booking information');
      return;
    }
    
    try {
      // 准备请求数据
      const bookingData = {
        coachId: selectedCoachForBooking.coachId,
        dayOfWeek: parseInt(selectedDay, 10),  // 转换为整数
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        message: bookingMessage.trim() || 'No additional message'
      };
      
      console.log('Submitting booking request:', bookingData);
      
      // 发送预约请求
      const response = await bookSession(bookingData).unwrap();
      
      if (response.code === 0) {
        // 预约成功
        message.success('Session booked successfully!');
        setIsBookingModalVisible(false);
        setIsTimeModalVisible(false);
        
        // 重新获取教练列表和时间槽
        refetch();
        refetchTimeSlots();
      } else {
        // API返回错误
        message.error(response.msg || 'Failed to book session. Please try again.');
      }
    } catch (error) {
      // 请求过程中出错
      console.error('Error booking session:', error);
      message.error(error.data?.msg || 'Failed to book session. Please try again.');
    }
  };

  // 格式化星期几
  const getDayName = (day) => {
    const days = {
      '1': 'Monday',
      '2': 'Tuesday',
      '3': 'Wednesday',
      '4': 'Thursday',
      '5': 'Friday',
      '6': 'Saturday',
      '7': 'Sunday'
    };
    return days[day] || `Day ${day}`;
  };

  // 显示取消订阅确认弹窗
  const showUnsubscribeConfirm = () => {
    setIsUnsubscribeModalVisible(true);
  };

  // 处理取消订阅
  const handleUnsubscribe = async () => {
    if (!selectedCoach) return;
    
    try {
      // 调用API取消订阅
      const response = await unsubscribeCoach(selectedCoach.coachId).unwrap();
      
      if (response.code === 0) {
        // 成功取消订阅
        message.success('Successfully unsubscribed from coach.');
        setIsUnsubscribeModalVisible(false);
        setIsModalVisible(false);
        
        // 刷新教练列表
        refetch();
      } else {
        // API返回错误
        message.error(response.msg || 'Failed to unsubscribe. Please try again.');
      }
    } catch (error) {
      // 请求过程中出错
      console.error('Error unsubscribing from coach:', error);
      message.error(error.data?.msg || 'Failed to unsubscribe. Please try again.');
    }
  };

  if (isLoading) {
    console.log('[BookingSession] Rendering: Loading state'); // Log loading state
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading available coaches..." />
      </div>
    );
  }

  if (error) {
    console.error('[BookingSession] Rendering: Error state', error); // Log error state
    return (
      <Alert
        message="Error"
        description={`Failed to load coaches: ${error.message || 'Unknown error'}`}
        type="error"
        showIcon
        className="m-4"
      />
    );
  }

  if (!coachList || coachList.length === 0) { // Make the empty check more robust
    console.log('[BookingSession] Rendering: Empty state'); // Log empty state
    return (
      <Empty
        description="You are not subscribed to any coaches yet, or no coaches are available for booking."
        className="p-8"
      />
    );
  }

  console.log('[BookingSession] Rendering: Coach list'); // Log rendering list
  return (
    <PageWrapper>
      {/* 添加大标题 */}
      <div className="mb-8 text-center">
        <Title level={2} className="font-bold" style={{ 
          background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          My Subscribed Coaches
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {coachList.map((coach) => (
          <Col key={coach.coachId} xs={24} sm={12} md={8} lg={6}>
            <StyledCard
              hoverable
              onClick={() => handleCardClick(coach)}
              cover={
                <div className="flex justify-center p-4 bg-gradient-to-b from-blue-100 to-white">
                  <CoachAvatar
                    size={100}
                    src={coach.photo ? `http://127.0.0.1:8080${coach.photo}` : undefined}
                    icon={<UserOutlined />}
                  />
                </div>
              }
            >
              <Card.Meta
                title={<div className="text-center font-semibold text-lg">{coach.coachName}</div>}
              />
              <TagContainer>
                {coach.tagNames?.map((tag) => (
                  <StyledTag key={tag} type="specialty">
                    <TagOutlined /> {tag}
                  </StyledTag>
                ))}
              </TagContainer>
              <Divider style={{ margin: '16px 0' }} />
              <div className="text-center">
                <Button 
                  type="primary" 
                  icon={<CalendarOutlined />} 
                  onClick={(e) => { e.stopPropagation(); handleBookSession(coach); }}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
                >
                  Book Session
                </Button>
              </div>
            </StyledCard>
          </Col>
        ))}
      </Row>

      {/* Coach Details Modal */}
      <Modal
        title="Coach Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button 
            key="book" 
            type="primary" 
            icon={<CalendarOutlined />}
            onClick={() => handleBookSession(selectedCoach)}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white mr-2"
          >
            Book Session
          </Button>,
          <Button 
            key="unsubscribe" 
            type="default" 
            danger
            icon={<DisconnectOutlined />}
            onClick={showUnsubscribeConfirm}
          >
            Unsubscribe
          </Button>
        ]}
        width={600}
      >
        {selectedCoach && (
          <Space direction="vertical" size="large" className="w-full">
            <div className="flex items-center">
              <Avatar 
                size={64} 
                src={selectedCoach.photo ? `http://127.0.0.1:8080${selectedCoach.photo}` : undefined}
                icon={<UserOutlined />}
              />
              <div className="ml-4">
                <div className="font-semibold text-xl">{selectedCoach.coachName}</div>
                <div className="text-gray-500"><MailOutlined /> {selectedCoach.email}</div>
                {selectedCoach.age > 0 && <div className="text-gray-500">Age: {selectedCoach.age}</div>}
              </div>
            </div>
            
            <div>
              <strong>Introduction:</strong>
              <p className="text-gray-700">{selectedCoach.intro || 'Not provided'}</p>
            </div>

            <div>
              <strong>Specialties:</strong>
              <div className="mt-2">
                {selectedCoach.tagNames?.length > 0 ? selectedCoach.tagNames.map(tag => (
                  <Tag color="blue" key={tag} className="m-1"><TagOutlined /> {tag}</Tag>
                )) : <span className="text-gray-500">None specified</span>}
              </div>
            </div>

            <div>
              <strong>Available Locations:</strong>
              <div className="mt-2">
                {selectedCoach.locationName?.length > 0 ? selectedCoach.locationName.map(loc => (
                  <Tag color="green" key={loc} className="m-1"><EnvironmentOutlined /> {loc}</Tag>
                )) : <span className="text-gray-500">None specified</span>}
              </div>
            </div>
          </Space>
        )}
      </Modal>

      {/* 添加取消订阅确认弹窗 */}
      <Modal
        title="Confirm Unsubscription"
        open={isUnsubscribeModalVisible}
        onCancel={() => setIsUnsubscribeModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsUnsubscribeModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            danger 
            loading={isUnsubscribing} 
            onClick={handleUnsubscribe}
          >
            Confirm Unsubscribe
          </Button>
        ]}
      >
        <p>Are you sure you want to unsubscribe from this coach? This action cannot be undone.</p>
        {selectedCoach && (
          <p className="font-bold">Coach: {selectedCoach.coachName}</p>
        )}
      </Modal>

      {/* 添加教练可用时间弹窗 */}
      <Modal
        title={
          <div>
            <span>Available Time Slots</span>
            {selectedCoachForBooking && (
              <span className="ml-2 text-blue-500"> - Coach {selectedCoachForBooking.coachName}</span>
            )}
          </div>
        }
        open={isTimeModalVisible}
        onCancel={() => setIsTimeModalVisible(false)}
        footer={[
          <Button key="refresh" onClick={() => refetchTimeSlots()} type="default" className="mr-2">
            Refresh
          </Button>,
          <Button key="close" onClick={() => setIsTimeModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {isLoadingTimeSlots ? (
          <div className="flex justify-center my-8">
            <Spin size="large" tip="Loading available time slots..." />
          </div>
        ) : timeSlotsError ? (
          <Alert
            message="Error"
            description="Failed to load available time slots. Please try again later."
            type="error"
            showIcon
          />
        ) : timeSlots && Object.keys(timeSlots).length > 0 ? (
          <div>
            <p className="mb-4">Please select a time slot to book your session:</p>
            <Timeline className="mt-4">
              {Object.entries(timeSlots).map(([day, slots]) => (
                <Timeline.Item 
                  key={day} 
                  color="blue" 
                  dot={<CalendarOutlined style={{ fontSize: '16px' }} />}
                >
                  <div className="font-bold text-lg mb-2">{getDayName(day)}</div>
                  <List
                    itemLayout="horizontal"
                    dataSource={slots}
                    renderItem={slot => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<ClockCircleOutlined style={{ fontSize: '18px', color: '#1890ff' }} />}
                          title={`${slot.start} - ${slot.end}`}
                          description="Available"
                        />
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={() => handleBookClick(day, slot)}
                        >
                          Book
                        </Button>
                      </List.Item>
                    )}
                  />
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        ) : (
          <Empty description="No available time slots found for this coach." />
        )}
      </Modal>

      {/* 添加预约确认弹窗 */}
      <Modal
        title="Book Session"
        open={isBookingModalVisible}
        onCancel={() => setIsBookingModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsBookingModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={isBooking}
            onClick={handleSubmitBooking}
          >
            Confirm Booking
          </Button>
        ]}
      >
        {selectedCoachForBooking && selectedTimeSlot && selectedDay && (
          <Form layout="vertical">
            <div className="mb-4">
              <p><strong>Coach:</strong> {selectedCoachForBooking.coachName}</p>
              <p><strong>Day:</strong> {getDayName(selectedDay)}</p>
              <p><strong>Time:</strong> {selectedTimeSlot.start} - {selectedTimeSlot.end}</p>
            </div>
            <Form.Item 
              label="Fitness Goals (Optional)" 
              name="message"
            >
              <TextArea 
                rows={4} 
                placeholder="Enter your fitness goals and what you would like to achieve in this session..."
                value={bookingMessage}
                onChange={e => setBookingMessage(e.target.value)}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </PageWrapper>
  );
};

export default BookingSession; 