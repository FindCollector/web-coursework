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

const { Title } = Typography;

const CoachSchedule = () => {
  const [activeTab, setActiveTab] = useState('1');
  const calendarRef = useRef(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);

  // 使用 coach 的 hook 获取日程数据
  const { 
    data: scheduleData, 
    isLoading, 
    error, 
    refetch 
  } = useGetCoachSessionScheduleQuery(); 

  // --- (useEffect hooks 保持不变, 与 MemberSchedule 类似) ---
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
  // --- (useEffect hooks 结束) ---

  // --- (dayOptions, getDayText 保持不变) ---
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

  // 列表视图列定义 - 显示 Member Name，移除 Action 列
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

  // 准备日历视图事件数据 - Title 显示 Member Name
  const prepareCalendarEvents = () => {
    if (!scheduleData || !scheduleData.calenderView) { 
      return [];
    }
    const calendarView = scheduleData.calenderView;
    const events = [];
    Object.keys(calendarView).forEach(dayOfWeek => {
      if (!Array.isArray(calendarView[dayOfWeek])) return;
      calendarView[dayOfWeek].forEach(slot => {
        if (!slot || typeof slot.startTime !== 'string' || typeof slot.endTime !== 'string') return;
        const fcDayOfWeek = parseInt(dayOfWeek) % 7;
        events.push({
          id: slot.id,
          daysOfWeek: [fcDayOfWeek],
          startTime: slot.startTime,
          endTime: slot.endTime,
          backgroundColor: '#52c41a', // 使用不同颜色 (例如绿色)
          borderColor: '#52c41a',
          textColor: '#ffffff',
          extendedProps: {
            coachName: slot.coachName, // 可能仍然有用，保留
            memberName: slot.memberName, // 核心信息
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

  // 处理日历事件点击 - 显示 Member 相关信息
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

  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false);
    setSelectedEventDetails(null);
  };

  // 渲染列表视图
  const renderListView = () => {
    const listData = scheduleData?.listView || [];
    return (
      <Card title="My Session Schedule List" className="max-w-4xl mx-auto">
        {listData.length > 0 ? (
          <Table 
            dataSource={listData} 
            columns={columns} // 使用教练的 columns
            rowKey="id" 
            pagination={false} 
          />
        ) : (
          <Empty description="No sessions scheduled" />
        )}
      </Card>
    );
  };

  // 渲染日历视图 - eventContent 显示 Member Name 和时间
  const renderCalendarView = () => {
    const events = prepareCalendarEvents();
    return (
      <Card title="Weekly Session Schedule" className="mt-6">
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
          eventContent={(eventInfo) => { // 自定义事件显示内容
            return (
              <div className="p-1 overflow-hidden text-xs leading-tight"> 
                <div className="font-semibold truncate">{eventInfo.event.extendedProps.memberName}</div> {/* 显示 Member Name */}
                <div>{`${eventInfo.event.extendedProps.startTime} - ${eventInfo.event.extendedProps.endTime}`}</div>
              </div>
            );
          }}
        />
      </Card>
    );
  };
  
  // 渲染详情模态框 - 显示 Member 相关信息
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

  // --- (Loading/Error states and return structure 保持不变) ---
  if (isLoading) {
    return <div className="flex justify-center items-center h-full p-8"><Spin size="large" tip="Loading your schedule..." /></div>;
  }

  if (error) {
    return <div className="p-8"><Alert message="Error loading schedule" description="Could not load schedule. Please try again." type="error" showIcon /></div>;
  }

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">My Schedule</Title> {/* 标题调整 */}
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
  // --- (Loading/Error states and return structure 结束) ---
};

export default CoachSchedule; 