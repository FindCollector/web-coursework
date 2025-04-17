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
  Modal,
  Descriptions
} from 'antd';
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useGetCoachSessionScheduleQuery } from '../../store/api/coachApi'; // 使用 coachApi
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek'; // Import isoWeek plugin
import utc from 'dayjs/plugin/utc'; // Import utc plugin
import timezone from 'dayjs/plugin/timezone'; // Import timezone plugin

dayjs.extend(isoWeek); // Extend dayjs with isoWeek support
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;

// Helper function to prepare calendar events for a specific week's data
// Now accepts weekStartDate (a dayjs object)
const prepareCalendarEventsForWeek = (weekData, getDayText, weekStartDate) => {
  if (!weekData || !weekData.calendarView || !weekStartDate) {
    return [];
  }
  const calendarView = weekData.calendarView;
  const events = [];

  Object.keys(calendarView).forEach(dayOfWeekStr => {
    const dayOfWeek = parseInt(dayOfWeekStr, 10);

    if (!Array.isArray(calendarView[dayOfWeekStr])) {
      return;
    }

    calendarView[dayOfWeekStr].forEach(slot => {
      if (!slot || typeof slot.startTime !== 'string' || typeof slot.endTime !== 'string') {
        return;
      }

      const targetDate = weekStartDate.isoWeekday(dayOfWeek);
      const startDateTime = targetDate.format('YYYY-MM-DD') + 'T' + slot.startTime;
      const endDateTime = targetDate.format('YYYY-MM-DD') + 'T' + slot.endTime;

      events.push({
        id: slot.id,
        start: startDateTime,
        end: endDateTime,
        backgroundColor: '#52c41a', // Coach color
        borderColor: '#52c41a',
        textColor: '#ffffff',
        extendedProps: {
          coachName: slot.coachName,
          memberName: slot.memberName,
          startTime: slot.startTime, // Keep original time for display
          endTime: slot.endTime,   // Keep original time for display
          message: slot.message,
          dayOfWeek: dayOfWeek
        }
      });
    });
  });
  return events;
};

const CoachSchedule = () => {
  const [activeViewTab, setActiveViewTab] = useState('list'); // 'list' or 'calendar'
  const [activeWeekTab, setActiveWeekTab] = useState('current'); // 'current' or 'next'
  const calendarRef = useRef(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  // 使用 coach 的 hook 获取日程数据
  const {
    data: scheduleData, // Contains { currentWeek: {...}, nextWeek: {...} }
    isLoading,
    error,
    refetch
  } = useGetCoachSessionScheduleQuery();

  // Calculate start dates
  const today = dayjs();
  const currentWeekStartDate = today.startOf('isoWeek');
  const nextWeekStartDate = currentWeekStartDate.add(1, 'week');

  // Update calendar size when view or week tab changes
  useEffect(() => {
    // Only handle tab changes here, initial render handled by viewDidMount
    if (activeViewTab === 'calendar' && calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const targetDate = activeWeekTab === 'current' ? currentWeekStartDate : nextWeekStartDate;
      // Use a minimal delay to ensure API is ready after tab switch if needed,
      // but prioritize viewDidMount for initial load.
      setTimeout(() => {
          calendarApi.gotoDate(targetDate.toDate());
          // updateSize might still be useful here after gotoDate if layout shifts
          calendarApi.updateSize();
      }, 50); // Keep a small delay for tab changes
    }
  }, [activeViewTab, activeWeekTab, currentWeekStartDate, nextWeekStartDate]);

  // --- (existing useEffect hooks for resize and refetch) ---
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
  // --- (useEffect hooks 结束) ---

  // --- (existing dayOptions, getDayText) ---
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
  // --- (dayOptions, getDayText 结束) ---

  // --- (existing columns definition) ---
  const columns = [
    {
      title: 'Day',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      render: (dayOfWeek) => <span>{getDayText(dayOfWeek)}</span>,
    },
    { title: 'Start Time', dataIndex: 'startTime', key: 'startTime' },
    { title: 'End Time', dataIndex: 'endTime', key: 'endTime' },
    { 
      title: 'Member', // 改为 Member
      dataIndex: 'memberName', // 显示 memberName
      key: 'memberName', 
      render: (text) => <Tag color="purple">{text}</Tag> // 使用不同颜色区分
    },
    { title: 'Member Message', dataIndex: 'message', key: 'message', ellipsis: true }, // 明确是 Member Message
  ];
  // --- (columns 结束) ---

  // No longer need a single prepareCalendarEvents, use helper function
  // const prepareCalendarEvents = () => { ... } // REMOVED

  // --- (existing handleEventClick) ---
  const handleEventClick = (clickInfo) => {
    const eventDetails = {
      memberName: clickInfo.event.extendedProps.memberName, // 显示 Member Name
      day: getDayText(clickInfo.event.extendedProps.dayOfWeek),
      startTime: clickInfo.event.extendedProps.startTime,
      endTime: clickInfo.event.extendedProps.endTime,
      message: clickInfo.event.extendedProps.message, // 这是 Member Message
    };
    setSelectedEventDetails(eventDetails);
    setIsDetailModalVisible(true);
  };
  // --- (handleEventClick 结束) ---

  // --- (existing handleCloseDetailModal) ---
  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false);
    setSelectedEventDetails(null);
  };
  // --- (handleCloseDetailModal 结束) ---

  // Render function for the content of a specific week (list or calendar)
  const renderWeekContent = (weekData, weekStartDate) => {
    if (!weekData) {
      return <Card className="mt-6"><Empty description="No schedule data available for this week." /></Card>;
    }

    const listData = weekData.listView || [];
    const calendarEvents = prepareCalendarEventsForWeek(weekData, getDayText, weekStartDate);

    const viewItems = [
      {
        key: 'list',
        label: <span><UnorderedListOutlined /> List View</span>,
        children: (
          <Card title="Session List" className="max-w-4xl mx-auto mt-4">
            {listData.length > 0 ? (
              <Table
                dataSource={listData}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="No sessions scheduled" />
            )}
          </Card>
        )
      },
      {
        key: 'calendar',
        label: <span><CalendarOutlined /> Calendar View</span>,
        children: (
          <Card title="Weekly Session Calendar" className="mt-4">
            {calendarEvents.length > 0 ? (
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin]}
                initialView="timeGridWeek"
                headerToolbar={false}
                firstDay={1}
                dayHeaderFormat={{ weekday: 'short' }}
                allDaySlot={false}
                slotMinTime="08:00:00"
                slotMaxTime="23:00:00"
                height="auto"
                expandRows={true}
                events={calendarEvents}
                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                eventClick={handleEventClick}
                viewDidMount={(args) => { // Add viewDidMount callback
                  const calendarApi = args.view.calendar;
                  const targetDate = activeWeekTab === 'current' ? currentWeekStartDate : nextWeekStartDate;
                  // Delay slightly to ensure layout stabilizes after initial render
                  setTimeout(() => {
                    calendarApi.gotoDate(targetDate.toDate());
                    calendarApi.updateSize();
                  }, 50); // Minimal delay
                }}
                eventContent={(eventInfo) => (
                  <div className="p-1 overflow-hidden text-xs leading-tight">
                    <div className="font-semibold truncate">{eventInfo.event.extendedProps.memberName}</div>
                  </div>
                )}
              />
            ) : (
              <Empty description="No sessions found in calendar view for this week." />
            )}
          </Card>
        )
      },
    ];

    return (
      <Tabs
        activeKey={activeViewTab}
        onChange={setActiveViewTab}
        type="card"
        size="small"
        items={viewItems}
        className="mt-0"
      />
    );
  };

  // --- (existing renderDetailsModal) ---
  const renderDetailsModal = () => (
    <Modal
      title="Session Details"
      open={isDetailModalVisible}
      onCancel={handleCloseDetailModal}
      footer={null}
    >
      {selectedEventDetails && (
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Member">{selectedEventDetails.memberName}</Descriptions.Item>
          <Descriptions.Item label="Day">{selectedEventDetails.day}</Descriptions.Item>
          <Descriptions.Item label="Time">{`${selectedEventDetails.startTime} - ${selectedEventDetails.endTime}`}</Descriptions.Item>
          <Descriptions.Item label="Member Message">{selectedEventDetails.message || 'N/A'}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
  // --- (renderDetailsModal 结束) ---

  // --- (existing Loading/Error states) ---
  if (isLoading) {
    return <div className="flex justify-center items-center h-full p-8"><Spin size="large" tip="Loading your schedule..." /></div>;
  }

  if (error) {
    return <div className="p-8"><Alert message="Error loading schedule" description="Could not load schedule. Please try again." type="error" showIcon /></div>;
  }
  // --- (Loading/Error states 结束) ---

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">My Schedule</Title>
      <Tabs
        activeKey={activeWeekTab}
        onChange={setActiveWeekTab}
        type="line"
        items={[
          {
            key: 'current',
            label: 'This Week',
            children: renderWeekContent(scheduleData?.currentWeek, currentWeekStartDate)
          },
          {
            key: 'next',
            label: 'Next Week',
            children: renderWeekContent(scheduleData?.nextWeek, nextWeekStartDate)
          },
        ]}
      />
      {renderDetailsModal()}
    </div>
  );
};

export default CoachSchedule; 