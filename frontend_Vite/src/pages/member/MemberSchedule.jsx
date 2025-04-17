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
  message,
  Tooltip
} from 'antd';
import { CalendarOutlined, UnorderedListOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { 
  useGetMemberSessionScheduleQuery, 
  useCancelMemberSessionMutation
} from '../../store/api/memberApi';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
// Import the reusable NoticeModal component
import NoticeModal from '../../components/common/NoticeModal';

dayjs.extend(isoWeek);
dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;

// Helper function to prepare calendar events for a specific week's data
const prepareCalendarEventsForWeek = (weekData, getDayText, weekStartDate) => {
  if (!weekData || !weekData.calendarView || !weekStartDate) {
    return [];
  }
  const calendarView = weekData.calendarView;
  const events = [];

  Object.keys(calendarView).forEach(dayOfWeekStr => {
    const dayOfWeek = parseInt(dayOfWeekStr, 10); // Backend uses 1 (Mon) to 7 (Sun)

    if (!Array.isArray(calendarView[dayOfWeekStr])) {
      return;
    }

    calendarView[dayOfWeekStr].forEach(slot => {
      if (!slot || typeof slot.startTime !== 'string' || typeof slot.endTime !== 'string') {
        return;
      }

      // Calculate the specific date for this day within the target week
      // dayjs().isoWeekday(1) is Monday. Backend 1 is Monday, 7 is Sunday.
      // We need to map backend dayOfWeek (1-7) to dayjs isoWeekday (1-7).
      const targetDate = weekStartDate.isoWeekday(dayOfWeek);

      // Combine date with time, assuming times are in local timezone format HH:mm
      const startDateTime = targetDate.format('YYYY-MM-DD') + 'T' + slot.startTime;
      const endDateTime = targetDate.format('YYYY-MM-DD') + 'T' + slot.endTime;

      events.push({
        id: slot.id,
        // Remove daysOfWeek, use specific start/end datetimes instead
        // daysOfWeek: [fcDayOfWeek === 0 ? 7 : fcDayOfWeek], // REMOVED
        // startTime: slot.startTime, // REMOVED
        // endTime: slot.endTime, // REMOVED
        start: startDateTime, // Use full start date-time
        end: endDateTime,     // Use full end date-time
        backgroundColor: '#1677ff',
        borderColor: '#1677ff',
        textColor: '#ffffff',
        extendedProps: {
          coachName: slot.coachName,
          memberName: slot.memberName,
          startTime: slot.startTime, // Keep original time for display if needed
          endTime: slot.endTime,   // Keep original time for display if needed
          message: slot.message,
          dayOfWeek: dayOfWeek // Original dayOfWeek for details modal
        }
      });
    });
  });
  return events;
};

const MemberSchedule = () => {
  const [activeViewTab, setActiveViewTab] = useState('list');
  const [activeWeekTab, setActiveWeekTab] = useState('current');
  const calendarRef = useRef(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [isNoticeModalVisible, setIsNoticeModalVisible] = useState(false);

  const {
    data: scheduleData,
    isLoading,
    error,
    refetch
  } = useGetMemberSessionScheduleQuery();

  const [cancelSession, { isLoading: isCanceling }] = useCancelMemberSessionMutation();

  // Calculate start dates for current and next week
  const today = dayjs();
  // .startOf('isoWeek') gets the Monday of the current week
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
  }, [activeViewTab, activeWeekTab, currentWeekStartDate, nextWeekStartDate]); // Add date dependencies

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

  const handleEventClick = (clickInfo) => {
    // Display using original times from extendedProps
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

  // --- Functions for Notice Modal ---
  const showNoticeModal = () => {
    setIsNoticeModalVisible(true);
  };

  const handleCloseNoticeModal = () => {
    setIsNoticeModalVisible(false);
  };
  // --- End Functions for Notice Modal ---

  // Render function for the content of a specific week (list or calendar)
  const renderWeekContent = (weekData, weekStartDate) => {
    if (!weekData) {
      return <Card className="mt-6"><Empty description="No schedule data available for this week." /></Card>;
    }

    // Augment listView data with specific dates for comparison
    const augmentedListData = (weekData.listView || []).map(item => {
      const sessionDate = weekStartDate.isoWeekday(item.dayOfWeek);
      return { ...item, sessionDate }; // Add sessionDate as a dayjs object
    });

    // Pass the weekStartDate to the helper function for calendar view
    const calendarEvents = prepareCalendarEventsForWeek(weekData, getDayText, weekStartDate);

    // Define columns inside renderWeekContent to access augmented data logic easily if needed
    // Or keep columns outside if sessionDate logic is simple enough for render
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
        render: (_, record) => {
          // Check if sessionDate exists and is after today
          const canCancel = record.sessionDate && record.sessionDate.isAfter(dayjs(), 'day');

          return canCancel ? (
            <Popconfirm
              title="Cancel this session?"
              description="Are you sure you want to cancel this scheduled session? Cancellation must be done at least one day in advance."
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
          ) : null; // Render nothing if cancellation is not allowed
        },
      },
    ];

    const viewItems = [
      {
        key: 'list',
        label: <span><UnorderedListOutlined /> List View</span>,
        children: (
          <Card title="Schedule List" className="max-w-4xl mx-auto mt-4">
            {/* Use augmentedListData */}
            {augmentedListData.length > 0 ? (
              <Table
                dataSource={augmentedListData}
                columns={columns} // Use the columns definition above
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="No training sessions scheduled" />
            )}
          </Card>
        )
      },
      {
        key: 'calendar',
        label: <span><CalendarOutlined /> Calendar View</span>,
        children: (
          <Card title="Weekly Schedule Calendar" className="mt-4">
            {calendarEvents.length > 0 ? (
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin]}
                initialView="timeGridWeek"
                // Set initialDate to the start of the relevant week
                // Note: FullCalendar might manage the displayed date range internally once events are loaded correctly.
                // We use gotoDate in useEffect to ensure correct week is shown on tab switch.
                // initialDate={weekStartDate.toDate()} // Set initial date
                headerToolbar={false} // Keep header simple
                firstDay={1} // Start week on Monday
                dayHeaderFormat={{ weekday: 'short' }}
                allDaySlot={false}
                slotMinTime="08:00:00"
                slotMaxTime="23:00:00"
                height="auto"
                expandRows={true}
                events={calendarEvents} // Use the correctly calculated events
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
                    {/* Display coach name */}
                    <div className="font-semibold truncate">{eventInfo.event.extendedProps.coachName}</div>
                    {/* Optionally display time from original props if needed, as event.start/end are full dates now */}
                    {/* <div>{`${eventInfo.event.extendedProps.startTime} - ${eventInfo.event.extendedProps.endTime}`}</div> */}
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
      {/* Updated Title Area */}
      <div className="flex items-center mb-4">
        <Title level={2} style={{ marginBottom: 0 }}>My Training Schedule</Title>
      </div>

      {/* Re-added Alert component for notice */}
      <Alert
        message={(
          <Button type="link" onClick={showNoticeModal} style={{ padding: 0, height: 'auto', lineHeight: 'inherit' }}>
            Important Notice - Click to view details
          </Button>
        )}
        description="Please review the terms regarding session scheduling and cancellation before proceeding."
        type="info"
        showIcon
        closable
        className="mb-6"
      />

      <Tabs
        activeKey={activeWeekTab}
        onChange={setActiveWeekTab}
        type="line"
        items={[
          {
            key: 'current',
            label: 'This Week',
            // Pass current week data and start date
            children: renderWeekContent(scheduleData?.currentWeek, currentWeekStartDate)
          },
          {
            key: 'next',
            label: 'Next Week',
            // Pass next week data and start date
            children: renderWeekContent(scheduleData?.nextWeek, nextWeekStartDate)
          },
        ]}
      />
      {renderDetailsModal()}
      {/* Use the reusable NoticeModal component */}
      <NoticeModal
        isVisible={isNoticeModalVisible}
        onClose={handleCloseNoticeModal}
        title="Important Notice"
      >
        {/* Content specific to MemberSchedule page */}
        <p>Please review the following terms regarding session scheduling and cancellation:</p>
        <ul>
          <li>Session cancellations must be made at least 24 hours in advance.</li>
          <li>Late cancellations or no-shows may be subject to a fee or loss of session credit.</li>
          <li>Please ensure you arrive on time for your scheduled sessions.</li>
          {/* Add any other specific points here */}
        </ul>
        <p>Thank you for your understanding.</p>
      </NoticeModal>
    </div>
  );
};

export default MemberSchedule; 