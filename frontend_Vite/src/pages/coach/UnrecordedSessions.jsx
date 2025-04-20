import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Typography, Spin, Alert, Tag, Space, Descriptions, Input, Checkbox, Form, message } from 'antd';
import { useGetUnrecordedSessionsQuery, useGetCoachTagsQuery, useRecordSessionHistoryMutation } from '../../store/api/coachApi';
import dayjs from 'dayjs'; // 用于格式化日期时间

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input; // 获取 TextArea

const UnrecordedSessions = () => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // --- 新增状态用于记录弹窗 ---
  const [isRecordModalVisible, setIsRecordModalVisible] = useState(false);
  const [recordingSessionId, setRecordingSessionId] = useState(null);
  const [recordForm] = Form.useForm(); // 创建 Form 实例
  // ---------------------------

  // 使用 RTK Query hook 获取数据
  const { 
    data: sessionData, 
    isLoading: isLoadingSessions, 
    isError: isErrorSessions, 
    error: errorSessions,
    refetch: refetchSessions
  } = useGetUnrecordedSessionsQuery({
    pageNow: pagination.current,
    pageSize: pagination.pageSize,
  });

  // 使用 RTK Query hook 获取 Tags 数据
  const { 
    data: tagsData = [], // 默认空数组
    isLoading: isLoadingTags, 
    isError: isErrorTags, 
    error: errorTags 
  } = useGetCoachTagsQuery();
  
  // --- 获取记录 Session 的 Mutation --- 
  const [recordSession, { isLoading: isRecording }] = useRecordSessionHistoryMutation();
  // ----------------------------------

  // 处理表格分页、排序、筛选变化
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // 显示详情弹窗
  const showDetailModal = (record) => {
    setSelectedSession(record);
    setIsDetailModalVisible(true);
  };

  // 关闭详情弹窗
  const handleDetailModalClose = () => {
    setIsDetailModalVisible(false);
    setSelectedSession(null);
  };
  
  // --- 更新处理 Record 按钮点击 ---
  const handleRecordClick = (record) => {
    setRecordingSessionId(record.id); // 设置当前要记录的 Session ID
    setIsRecordModalVisible(true); // 打开记录弹窗
    recordForm.resetFields(); // 重置表单
  };
  // ---------------------------

  // --- 新增：关闭记录弹窗 ---
  const handleRecordModalClose = () => {
    setIsRecordModalVisible(false);
    setRecordingSessionId(null);
    recordForm.resetFields(); // 关闭时也重置表单
  };
  // -----------------------

  // --- 新增：处理记录表单提交 ---
  const handleRecordFormSubmit = async () => {
    try {
      const values = await recordForm.validateFields(); 
      console.log('Recording Session ID:', recordingSessionId);
      console.log('Feedback:', values.feedback);
      console.log('Selected Tags:', values.tags);
      
      // 调用 Mutation 记录 Session
      const result = await recordSession({ 
        sessionId: recordingSessionId, 
        feedback: values.feedback, 
        tagList: values.tags // `tags` 应该是 Checkbox.Group 返回的 value 数组 (即 tag IDs)
      }).unwrap();
      
      // 使用后端返回的成功消息
      message.success(result.msg || 'Session recorded successfully!');
      
      handleRecordModalClose(); // 关闭弹窗
      // 列表和计数会在 invalidateTags 后自动刷新，无需手动 refetch
      
    } catch (errorInfo) {
      console.error('Failed to record session:', errorInfo);
      // 使用后端返回的错误消息
      if (errorInfo.data && errorInfo.data.code !== 0) {
        // 如果是后端返回的错误，显示后端的错误消息
        message.error(errorInfo.data.msg || 'Failed to record session');
      } else {
        // 其他错误（如网络错误等）
        message.error(errorInfo.message || 'Failed to record session. Please try again.');
      }
    }
  };
  // -------------------------

  // 定义表格列
  const columns = [
    {
      title: 'Member Name',
      dataIndex: 'memberName',
      key: 'memberName',
    },
    {
      title: 'Coach Name',
      dataIndex: 'coachName',
      key: 'coachName',
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'), // 格式化时间
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'), // 格式化时间
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => showDetailModal(record)}>
            Detail
          </Button>
          <Button type="primary" onClick={() => handleRecordClick(record)}>
            Record
          </Button>
        </Space>
      ),
    },
  ];

  // 处理加载状态
  if (isLoadingSessions) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" tip="Loading sessions..." />
      </div>
    );
  }

  // 处理错误状态
  if (isErrorSessions) {
    return (
      <Alert 
        message="Error Loading Sessions" 
        description={errorSessions?.data?.msg || errorSessions?.message || 'Failed to load unrecorded sessions. Please try again.'} 
        type="error" 
        showIcon 
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: '24px' }}>Unrecorded Sessions</Title>
      
      <Table
        columns={columns}
        dataSource={sessionData?.records || []}
        rowKey="id" // 使用 Session ID 作为 key
        pagination={{
          current: sessionData?.current || 1,
          pageSize: sessionData?.size || 10,
          total: sessionData?.total || 0,
        }}
        loading={isLoadingSessions}
        onChange={handleTableChange}
        bordered
      />

      {/* 详情 Modal */}
      <Modal
        title="Session Details"
        open={isDetailModalVisible}
        onCancel={handleDetailModalClose}
        footer={[
          <Button key="close" onClick={handleDetailModalClose}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedSession && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Member">{selectedSession.memberName}</Descriptions.Item>
            <Descriptions.Item label="Coach">{selectedSession.coachName}</Descriptions.Item>
            <Descriptions.Item label="Start Time">{dayjs(selectedSession.startTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="End Time">{dayjs(selectedSession.endTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Message">{selectedSession.message || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Reply">{selectedSession.reply || 'N/A'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* --- 新增：记录 Session Modal --- */}
      <Modal
        title="Record Session Feedback"
        open={isRecordModalVisible}
        onCancel={handleRecordModalClose}
        footer={[
          <Button key="back" onClick={handleRecordModalClose}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={isRecording} onClick={handleRecordFormSubmit}> {/* 使用 isRecording 控制 loading 状态 */}
            Submit Record
          </Button>,
        ]}
        width={600}
        destroyOnClose // 关闭时销毁内部组件状态
      >
        <Form
          form={recordForm}
          layout="vertical"
          name="record_session_form"
        >
          <Form.Item
            name="feedback"
            label="Feedback"
            rules={[{ required: true, message: 'Please input your feedback for this session!' }]}
          >
            <TextArea rows={4} placeholder="Enter feedback here..." />
          </Form.Item>

          <Form.Item
            name="tags"
            label="Select Relevant Tags"
            rules={[{ required: true, message: 'Please select at least one tag!' }]}
          >
            {isLoadingTags ? (
              <Spin tip="Loading tags..." />
            ) : isErrorTags ? (
              <Alert message="Error loading tags" type="error" />
            ) : (
              <Checkbox.Group options={tagsData} />
            )}
          </Form.Item>
        </Form>
      </Modal>
      {/* ----------------------------- */}
    </div>
  );
};

export default UnrecordedSessions; 