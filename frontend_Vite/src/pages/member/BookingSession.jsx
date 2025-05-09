import React, { useState, useEffect } from 'react';
import { Card, Modal, Spin, Tag, Alert, Empty, Avatar, Row, Col, Space, Button, Divider, Typography, message, List, Timeline, Input, Form } from 'antd';
import { useGetSubscriptionCoachListQuery, useUnsubscribeCoachMutation, useGetCoachAppropriateTimeListQuery, useBookSessionMutation } from '../../store/api/memberApi';
import { UserOutlined, EnvironmentOutlined, MailOutlined, TagOutlined, CalendarOutlined, DisconnectOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import NoticeModal from '../../components/common/NoticeModal';

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
    // Disable caching to ensure each query is a new request
    refetchOnMountOrArgChange: true
  });
  
  // Unsubscribe mutation hook
  const [unsubscribeCoach, { isLoading: isUnsubscribing }] = useUnsubscribeCoachMutation();
  
  // Book session mutation hook
  const [bookSession, { isLoading: isBooking }] = useBookSessionMutation();
  
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUnsubscribeModalVisible, setIsUnsubscribeModalVisible] = useState(false);
  
  // Add state for displaying coach available times
  const [isTimeModalVisible, setIsTimeModalVisible] = useState(false);
  const [selectedCoachForBooking, setSelectedCoachForBooking] = useState(null);
  
  // Add booking information state
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  
  // State and handlers for the Notice Modal
  const [isNoticeModalVisible, setIsNoticeModalVisible] = useState(false);
  const showNoticeModal = () => setIsNoticeModalVisible(true);
  const handleCloseNoticeModal = () => setIsNoticeModalVisible(false);
  
  // Load coach's available time data in a lazy way, only when needed
  const { data: timeSlots, isLoading: isLoadingTimeSlots, error: timeSlotsError, refetch: refetchTimeSlots } = useGetCoachAppropriateTimeListQuery(
    selectedCoachForBooking?.coachId,
    { 
      skip: !selectedCoachForBooking,
      // Disable caching to ensure each query is a new request
      refetchOnMountOrArgChange: true
    }
  );

  // Refresh data when component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleCardClick = (coach) => {
    setSelectedCoach(coach);
    setIsModalVisible(true);
  };

  // Function for handling booking session
  const handleBookSession = (coach) => {
    setSelectedCoachForBooking(coach);
    setIsTimeModalVisible(true);
    setIsModalVisible(false); // Close details modal
    
    // Force refetch coach's available time
    setTimeout(() => {
      refetchTimeSlots();
    }, 0);
  };

  // Function for handling click on book button
  const handleBookClick = (day, slot) => {
    setSelectedDay(day);
    setSelectedTimeSlot(slot);
    setBookingMessage('');
    setIsBookingModalVisible(true);
  };
  
  // Submit booking request
  const handleSubmitBooking = async () => {
    if (!selectedCoachForBooking || !selectedTimeSlot || !selectedDay) {
      message.error('Missing required booking information');
      return;
    }
    
    if (!bookingMessage.trim()) {
      message.error('Please describe your fitness goals for this session');
      return;
    }
    
    try {
      // Prepare request data
      const bookingData = {
        coachId: selectedCoachForBooking.coachId,
        dayOfWeek: parseInt(selectedDay, 10),  // Convert to integer
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        message: bookingMessage.trim()
      };
      
      // Send booking request
      const response = await bookSession(bookingData).unwrap();
      
      if (response.code === 0) {
        // Booking successful
        message.success('Session booked successfully!');
        setIsBookingModalVisible(false);
        setIsTimeModalVisible(false);
        
        // Refresh coach list and time slots
        refetch();
        refetchTimeSlots();
      } else {
        // API returned error
        message.error(response.msg || 'Failed to book session. Please try again.');
      }
    } catch (error) {
      // Error during request
      message.error(error.data?.msg || 'Failed to book session. Please try again.');
    }
  };

  // Format day of week
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

  // Show unsubscribe confirmation modal
  const showUnsubscribeConfirm = () => {
    setIsUnsubscribeModalVisible(true);
  };

  // Handle unsubscribe
  const handleUnsubscribe = async () => {
    if (!selectedCoach) return;
    
    try {
      // Call API to unsubscribe
      const response = await unsubscribeCoach(selectedCoach.coachId).unwrap();
      
      if (response.code === 0) {
        // Successfully unsubscribed
        message.success('Successfully unsubscribed from coach.');
        setIsUnsubscribeModalVisible(false);
        setIsModalVisible(false);
        
        // Refresh coach list
        refetch();
      } else {
        // API returned error
        message.error(response.msg || 'Failed to unsubscribe. Please try again.');
      }
    } catch (error) {
      // Error during request
      message.error(error.data?.msg || 'Failed to unsubscribe. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading available coaches..." />
      </div>
    );
  }

  if (error) {
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
    return (
      <Empty
        description="You are not subscribed to any coaches yet, or no coaches are available for booking."
        className="p-8"
      />
    );
  }

  return (
    <PageWrapper>
      {/* Add main title */}
      <div className="mb-8 text-center">
        <Title level={2} className="font-bold" style={{ 
          background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          My Subscribed Coaches
        </Title>
      </div>

      {/* Add the Alert for important notice */}
      <Alert
        message={(
          <Button type="link" onClick={showNoticeModal} style={{ padding: 0, height: 'auto', lineHeight: 'inherit' }}>
            Important Notice for Booking - Click to view details
          </Button>
        )}
        description="Please review the terms regarding session booking before selecting a time slot."
        type="info"
        showIcon
        className="mb-6" // Add margin below the alert
      />

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

      {/* Unsubscribe confirmation modal */}
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

      {/* Coach available time modal */}
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
                          title={`${slot.date} ${slot.start} - ${slot.end}`}
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

      {/* Booking confirmation modal */}
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
            disabled={!bookingMessage.trim()}
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
              <p><strong>Time:</strong> {`${selectedTimeSlot.date} ${selectedTimeSlot.start} - ${selectedTimeSlot.end}`}</p>
            </div>
            <Form.Item 
              label={
                <span>
                  Fitness Goals <span className="text-red-500">*</span>
                </span>
              }
              name="message"
              required
              rules={[{ required: true, message: 'Please describe your fitness goals' }]}
              help="Describe what you want to achieve in this session"
            >
              <TextArea 
                rows={4} 
                placeholder="Enter your fitness goals and what you would like to achieve in this session..."
                value={bookingMessage}
                onChange={e => setBookingMessage(e.target.value)}
                maxLength={500}
                showCount
                status={bookingMessage.trim() ? '' : 'error'}
              />
            </Form.Item>
            {!bookingMessage.trim() && (
              <div className="text-red-500 mt-1 mb-3 text-sm">Please describe your fitness goals for this session</div>
            )}
          </Form>
        )}
      </Modal>

      {/* Render the reusable NoticeModal */}
      <NoticeModal
        isVisible={isNoticeModalVisible}
        onClose={handleCloseNoticeModal}
        title="Booking Important Notice"
      >
        {/* Updated content for BookingSession notice */}
        <p>Please read the following notes carefully before booking a session:</p>
        <ul>
          <li>
            <strong>Plan Ahead:</strong> To allow coaches adequate time for preparation and venue coordination, sessions can only be booked for the <strong>following week</strong>.
          </li>
          <li>
            <strong>No Sunday Bookings:</strong> Please note that sessions cannot be booked for Sundays.
          </li>
          <li>
            <strong>Await Confirmation:</strong> After submitting your booking request, please wait for the coach to review and accept it. Your session is not confirmed until accepted.
          </li>
          <li>
            <strong>Avoid Time Conflicts:</strong> Bookings that overlap with your existing accepted sessions or other pending requests are not permitted.
          </li>
          <li>
            <strong>Resolving Conflicts:</strong> If you encounter a time conflict with a new booking, you must first cancel the existing accepted session or withdraw the conflicting pending request before proceeding.
          </li>
        </ul>
        <p>Thank you for your cooperation.</p>
      </NoticeModal>

    </PageWrapper>
  );
};

export default BookingSession; 