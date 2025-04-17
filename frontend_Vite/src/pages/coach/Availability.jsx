import { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Form, 
  TimePicker, 
  Select, 
  Button, 
  message, 
  Typography,
  Space,
  Tabs,
  Table,
  Tag,
  Empty,
  Popconfirm,
  Modal
} from 'antd';
import { PlusOutlined, CalendarOutlined, UnorderedListOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  useAddAvailabilityMutation, 
  useGetAvailabilityQuery, 
  useDeleteAvailabilityMutation, 
  useUpdateAvailabilityMutation
} from '../../store/api/coachApi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

const { Title } = Typography;

const Availability = () => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const calendarRef = useRef(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  
  // 使用RTK Query的hooks
  const [addAvailability, { isLoading: isAddingAvailability }] = useAddAvailabilityMutation();
  const { data: availabilityData, isLoading: isLoadingAvailability, refetch } = useGetAvailabilityQuery();
  const [deleteAvailability, { isLoading: isDeletingAvailability }] = useDeleteAvailabilityMutation();
  const [updateAvailability, { isLoading: isUpdatingAvailability }] = useUpdateAvailabilityMutation();

  // 处理Tab切换，修复日历视图问题
  useEffect(() => {
    if (activeTab === '2' && calendarRef.current) {
      // 在下一个渲染周期中让日历重新计算尺寸
      setTimeout(() => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }, 0);
    }
  }, [activeTab]);

  // 监听窗口大小变化，确保日历视图正确调整大小
  useEffect(() => {
    const handleResize = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 星期选项
  const dayOptions = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
  ];

  // 获取星期几的文本表示
  const getDayText = (dayOfWeek) => {
    const day = dayOptions.find(day => day.value === dayOfWeek);
    return day ? day.label : '';
  };

  const handleSubmit = async (values) => {
    try {
      // 格式化时间为 "HH:mm" 格式
      const startTime = values.timeRange[0].format('HH:mm');
      const endTime = values.timeRange[1].format('HH:mm');
      
      const response = await addAvailability({
        dayOfWeek: values.dayOfWeek,
        startTime: startTime,
        endTime: endTime
      }).unwrap();

      if (response.code === 0) {
        message.success('Successfully added new availability');
        form.resetFields();
        // 刷新空闲时间列表
        refetch();
      } else {
        message.error(response.msg || 'Failed to add availability');
      }
    } catch (error) {
      console.error('Error adding availability:', error);
      message.error(error.data?.msg || 'Failed to add availability');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await deleteAvailability(id).unwrap();
      if (response.code === 0) {
        message.success('Successfully deleted availability');
        // 刷新列表和日历
        refetch();
      } else {
        message.error(response.msg || 'Failed to delete availability');
      }
    } catch (error) {
      console.error('Error deleting availability:', error);
      message.error(error.data?.msg || 'Failed to delete availability');
    }
  };

  // --- Edit Functionality ---

  // 打开编辑模态框
  const handleEdit = (record) => {
    setEditingRecord(record);
    // 使用 dayjs 解析时间字符串，以便 TimePicker.RangePicker 能正确显示
    editForm.setFieldsValue({
      dayOfWeek: record.dayOfWeek,
      timeRange: [
        dayjs(record.startTime, 'HH:mm'),
        dayjs(record.endTime, 'HH:mm')
      ]
    });
    setIsEditModalVisible(true);
  };

  // 关闭编辑模态框
  const handleCancelEdit = () => {
    setIsEditModalVisible(false);
    setEditingRecord(null);
    editForm.resetFields();
  };

  // 提交编辑表单
  const handleUpdate = async (values) => {
    if (!editingRecord) return;

    try {
      const startTime = values.timeRange[0].format('HH:mm');
      const endTime = values.timeRange[1].format('HH:mm');

      const response = await updateAvailability({
        id: editingRecord.id,
        dayOfWeek: values.dayOfWeek,
        startTime: startTime,
        endTime: endTime
      }).unwrap();

      if (response.code === 0) {
        message.success('Successfully updated availability');
        handleCancelEdit();
        refetch();
      } else {
        message.error(response.msg || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      message.error(error.data?.msg || 'Failed to update availability');
    }
  };

  // 列表视图列定义
  const columns = [
    {
      title: 'Day',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      render: (dayOfWeek) => <span>{getDayText(dayOfWeek)}</span>,
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
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this availability?"
            description="Are you sure you want to delete this time slot?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 准备日历视图的事件数据
  const prepareCalendarEvents = () => {
    if (!availabilityData || !availabilityData.data || !availabilityData.data.calendarView) {
      return [];
    }

    const events = [];
    const calendarView = availabilityData.data.calendarView;

    // 遍历每个星期几
    Object.keys(calendarView).forEach(dayOfWeek => {
      // 遍历该星期几的所有时间段
      calendarView[dayOfWeek].forEach(slot => {
        // 对于每个时间段，创建一个事件
        events.push({
          id: slot.id,
          title: `Available`,
          daysOfWeek: [parseInt(dayOfWeek) % 7], // FullCalendar使用0-6代表周日至周六
          startTime: slot.startTime,
          endTime: slot.endTime,
          backgroundColor: '#1677ff',
          borderColor: '#1677ff',
          textColor: '#ffffff',
          extendedProps: {
            description: `${slot.startTime} - ${slot.endTime}`
          }
        });
      });
    });

    return events;
  };

  // 渲染添加表单
  const renderAddForm = () => (
    <Card title="Add New Availability" className="mb-6 max-w-2xl">
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
      >
        <Form.Item
          name="dayOfWeek"
          label="Day of Week"
          rules={[{ required: true, message: 'Please select a day' }]}
        >
          <Select
            placeholder="Select a day"
            options={dayOptions}
            className="w-full"
          />
        </Form.Item>

        <Form.Item
          name="timeRange"
          label="Time Range"
          rules={[{ required: true, message: 'Please select time range' }]}
        >
          <TimePicker.RangePicker
            format="HH:mm"
            className="w-full"
            minuteStep={15}
            disabledTime={() => ({
              // 只禁用 0-7 点和 23 点
              disabledHours: () => [...Array.from(Array(8).keys()), 23]
            })}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusOutlined />}
            loading={isAddingAvailability}
            className="w-full"
          >
            Add Availability
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  // 渲染列表视图
  const renderListView = () => {
    const listData = availabilityData?.data?.listView || [];

    return (
      <Card title="Availability List" className="max-w-2xl">
        {listData.length > 0 ? (
          <Table 
            dataSource={listData}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <Empty description="No availability slots found" />
        )}
      </Card>
    );
  };

  // 渲染编辑模态框
  const renderEditModal = () => (
    <Modal
      title="Edit Availability"
      open={isEditModalVisible}
      onCancel={handleCancelEdit}
      footer={null}
      destroyOnClose
    >
      <Form
        form={editForm}
        layout="vertical"
        onFinish={handleUpdate}
      >
        <Form.Item
          name="dayOfWeek"
          label="Day of Week"
          rules={[{ required: true, message: 'Please select a day' }]}
        >
          <Select
            placeholder="Select a day"
            options={dayOptions}
            className="w-full"
          />
        </Form.Item>
        <Form.Item
          name="timeRange"
          label="Time Range"
          rules={[{ required: true, message: 'Please select time range' }]}
        >
          <TimePicker.RangePicker
            format="HH:mm"
            className="w-full"
            minuteStep={15}
            disabledTime={() => ({
              disabledHours: () => [...Array.from(Array(8).keys()), 23]
            })}
          />
        </Form.Item>
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancelEdit}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isUpdatingAvailability}>
              Update
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );

  // 渲染日历视图
  const renderCalendarView = () => {
    const events = prepareCalendarEvents();

    return (
      <Card title="Weekly Schedule" className="mt-6">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: '',
            center: '',
            right: ''
          }}
          dayHeaderFormat={{ weekday: 'long' }}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="23:00:00"
          height="auto"
          expandRows={true}
          firstDay={1}
          events={events}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          eventContent={(eventInfo) => {
            return (
              <div className="fc-event-main-frame" style={{ padding: '2px 4px' }}>
                <div className="fc-event-title-container">
                  <div className="fc-event-title">{eventInfo.event.title}</div>
                  <div className="text-xs">{eventInfo.event.extendedProps.description}</div>
                </div>
              </div>
            );
          }}
        />
      </Card>
    );
  };

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">Manage Your Availability</Title>
      
      {renderAddForm()}
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: '1',
            label: (
              <span>
                <UnorderedListOutlined />
                List View
              </span>
            ),
            children: isLoadingAvailability ? (
              <div className="flex justify-center p-8">Loading...</div>
            ) : (
              renderListView()
            ),
          },
          {
            key: '2',
            label: (
              <span>
                <CalendarOutlined />
                Calendar View
              </span>
            ),
            children: isLoadingAvailability ? (
              <div className="flex justify-center p-8">Loading...</div>
            ) : (
              renderCalendarView()
            ),
          },
        ]}
      />

      {renderEditModal()}

    </div>
  );
};

export default Availability; 