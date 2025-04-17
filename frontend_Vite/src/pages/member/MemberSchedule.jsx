import { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Typography, 
  Tabs, 
  Table, 
  Spin, 
  Empty, 
  Tag, 
  Alert,
  Space,
  Modal,
  Descriptions,
  Button,
  Popconfirm,
  message
} from 'antd';
import { CalendarOutlined, UnorderedListOutlined, DeleteOutlined } from '@ant-design/icons';
import { 
  useGetMemberSessionScheduleQuery, 
  useCancelMemberSessionMutation
} from '../../store/api/memberApi';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayjs from 'dayjs';

const { Title } = Typography;

const MemberSchedule = () => {
  const [activeTab, setActiveTab] = useState('1');
  const calendarRef = useRef(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  const { 
    data: scheduleData, 
    isLoading, 
    error, 
    refetch 
  } = useGetMemberSessionScheduleQuery();

  const [cancelSession, { isLoading: isCanceling }] = useCancelMemberSessionMutation();

  useEffect(() => {
    if (activeTab === '2' && calendarRef.current) {
      setTimeout(() => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }, 0);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleResize = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const dayOptions = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
  ];

  const getDayText = (dayOfWeek) => {
    const numericDay = parseInt(dayOfWeek, 10);
    const day = dayOptions.find(day => day.value === numericDay);
    return day ? day.label : '';
  };

  const handleCancelSession = async (sessionId) => {
    try {
      const response = await cancelSession(sessionId).unwrap();
      if (response.code === 0) {
        message.success('Session cancelled successfully!');
        refetch();
      } else {
        message.error(response.msg || 'Failed to cancel session.');
      }
    } catch (err) {
      console.error('Error cancelling session:', err);
      message.error(err.data?.msg || 'An error occurred while cancelling the session.');
    }
  };

  const columns = [
    {
      title: 'Day',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      render: (dayOfWeek) => <span>{getDayText(dayOfWeek)}</span>,
    },
    { title: 'Start Time', dataIndex: 'startTime', key: 'startTime' },
    { title: 'End Time', dataIndex: 'endTime', key: 'endTime' },
    { title: 'Coach', dataIndex: 'coachName', key: 'coachName', render: (text) => <Tag color="blue">{text}</Tag> },
    { title: 'Message', dataIndex: 'message', key: 'message', ellipsis: true },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="Cancel this session?"
          description="Are you sure you want to cancel this scheduled session?"
          onConfirm={() => handleCancelSession(record.id)}
          okText="Yes, Cancel"
          cancelText="No"
          okButtonProps={{ loading: isCanceling }}
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            disabled={isCanceling}
          >
            Cancel
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const prepareCalendarEvents = () => {
    if (!scheduleData || !scheduleData.calenderView) { 
      return [];
    }
    
    const calendarView = scheduleData.calenderView;
    
    const events = [];
    Object.keys(calendarView).forEach(dayOfWeek => {
      if (!Array.isArray(calendarView[dayOfWeek])) {
          return;
      }
      
      calendarView[dayOfWeek].forEach(slot => {
        if (!slot || typeof slot.startTime !== 'string' || typeof slot.endTime !== 'string') {
            return;
        }
        
        const fcDayOfWeek = parseInt(dayOfWeek) % 7;
        events.push({
          id: slot.id,
          daysOfWeek: [fcDayOfWeek],
          startTime: slot.startTime,
          endTime: slot.endTime,
          backgroundColor: '#1677ff',
          borderColor: '#1677ff',
          textColor: '#ffffff',
          extendedProps: {
            coachName: slot.coachName,
            memberName: slot.memberName,
            startTime: slot.startTime,
            endTime: slot.endTime,
            message: slot.message,
            dayOfWeek: parseInt(dayOfWeek, 10)
          }
        });
      });
    });
    return events;
  };

  const handleEventClick = (clickInfo) => {
    const eventDetails = {
      coachName: clickInfo.event.extendedProps.coachName,
      day: getDayText(clickInfo.event.extendedProps.dayOfWeek),
      startTime: clickInfo.event.extendedProps.startTime,
      endTime: clickInfo.event.extendedProps.endTime,
      message: clickInfo.event.extendedProps.message,
    };
    setSelectedEventDetails(eventDetails);
    setIsDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false);
    setSelectedEventDetails(null);
  };

  const renderListView = () => {
    const listData = scheduleData?.listView || [];
    return (
      <Card title="My Training Schedule List" className="max-w-4xl mx-auto">
        {listData.length > 0 ? (
          <Table 
            dataSource={listData} 
            columns={columns}
            rowKey="id" 
            pagination={false} 
          />
        ) : (
          <Empty description="No training sessions scheduled" />
        )}
      </Card>
    );
  };

  const renderCalendarView = () => {
    const events = prepareCalendarEvents();
    
    return (
      <Card title="Weekly Training Schedule" className="mt-6">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          todayHighlight={false}
          dayHeaderFormat={{ weekday: 'long' }}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="23:00:00"
          height="auto"
          expandRows={true}
          firstDay={1}
          events={events}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          eventClick={handleEventClick}
          eventContent={(eventInfo) => {
            return (
              <div className="p-1 overflow-hidden text-xs leading-tight">
                <div className="font-semibold truncate">{eventInfo.event.extendedProps.coachName}</div>
                <div>{`${eventInfo.event.extendedProps.startTime} - ${eventInfo.event.extendedProps.endTime}`}</div>
              </div>
            );
          }}
        />
      </Card>
    );
  };
  
  const renderDetailsModal = () => (
    <Modal
      title="Session Details"
      open={isDetailModalVisible}
      onCancel={handleCloseDetailModal}
      footer={null}
    >
      {selectedEventDetails && (
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Coach">{selectedEventDetails.coachName}</Descriptions.Item>
          <Descriptions.Item label="Day">{selectedEventDetails.day}</Descriptions.Item>
          <Descriptions.Item label="Time">{`${selectedEventDetails.startTime} - ${selectedEventDetails.endTime}`}</Descriptions.Item>
          <Descriptions.Item label="Message">{selectedEventDetails.message || 'N/A'}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-full p-8"><Spin size="large" tip="Loading your schedule..." /></div>;
  }

  if (error) {
    return <div className="p-8"><Alert message="Error loading schedule" description="Could not load schedule. Please try again." type="error" showIcon /></div>;
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">My Training Schedule</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="pl-4" 
        tabBarStyle={{ paddingLeft: '12px' }} 
        items={[
          { key: '1', label: <span><UnorderedListOutlined /> List View</span>, children: renderListView() },
          { key: '2', label: <span><CalendarOutlined /> Calendar View</span>, children: renderCalendarView() },
        ]}
      />
      {renderDetailsModal()}
    </div>
  );
};

export default MemberSchedule; 