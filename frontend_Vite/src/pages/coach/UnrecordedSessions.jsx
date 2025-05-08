import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Typography, Spin, Alert, Tag, Space, Descriptions, Input, Checkbox, Form, message } from 'antd';
import { useGetUnrecordedSessionsQuery, useGetCoachTagsQuery, useRecordSessionHistoryMutation } from '../../store/api/coachApi';
import dayjs from 'dayjs'; // For formatting date and time

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input; // Get TextArea

const UnrecordedSessions = () => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  
  // --- Add states for record modal ---
  const [isRecordModalVisible, setIsRecordModalVisible] = useState(false);
  const [recordingSessionId, setRecordingSessionId] = useState(null);
  const [recordForm] = Form.useForm(); // Create Form instance
  // ---------------------------

  // Use RTK Query hook to get data
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

  // Use RTK Query hook to get Tags data
  const { 
    data: tagsData = [], // Default empty array
    isLoading: isLoadingTags, 
    isError: isErrorTags, 
    error: errorTags 
  } = useGetCoachTagsQuery();
  
  // --- Get Record Session Mutation --- 
  const [recordSession, { isLoading: isRecording }] = useRecordSessionHistoryMutation();
  // ----------------------------------

  // Handle table pagination, sorting, filtering changes
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // Show detail modal
  const showDetailModal = (record) => {
    setSelectedSession(record);
    setIsDetailModalVisible(true);
  };

  // Close detail modal
  const handleDetailModalClose = () => {
    setIsDetailModalVisible(false);
    setSelectedSession(null);
  };
  
  // --- Update handling Record button click ---
  const handleRecordClick = (record) => {
    setRecordingSessionId(record.id); // Set current Session ID to record
    setIsRecordModalVisible(true); // Open record modal
    recordForm.resetFields(); // Reset form
  };
  // ---------------------------

  // --- New: Close record modal ---
  const handleRecordModalClose = () => {
    setIsRecordModalVisible(false);
    setRecordingSessionId(null);
    recordForm.resetFields(); // Also reset form when closing
  };
  // -----------------------

  // --- New: Handle record form submission ---
  const handleRecordFormSubmit = async () => {
    try {
      const values = await recordForm.validateFields(); 
      
      // Call Mutation to record Session
      const result = await recordSession({ 
        sessionId: recordingSessionId, 
        feedback: values.feedback, 
        tagList: values.tags // `tags` should be the value array returned by Checkbox.Group (i.e. tag IDs)
      }).unwrap();
      
      // Use success message returned from backend
      message.success(result.msg || 'Session recorded successfully!');
      
      handleRecordModalClose(); // Close modal
      // List and count will auto-refresh after invalidateTags, no need to manually refetch
      
    } catch (errorInfo) {
      // Use error message returned from backend
      if (errorInfo.data && errorInfo.data.code !== 0) {
        // If it's an error returned from backend, show backend error message
        message.error(errorInfo.data.msg || 'Failed to record session');
      } else {
        // Other errors (like network errors)
        message.error(errorInfo.message || 'Failed to record session. Please try again.');
      }
    }
  };
  // -------------------------

  // Define table columns
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
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'), // Format time
    },
    {
      title: 'End Time',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'), // Format time
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

  // Handle loading state
  if (isLoadingSessions) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Spin size="large" tip="Loading sessions..." />
      </div>
    );
  }

  // Handle error state
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
        rowKey="id" // Use Session ID as key
        pagination={{
          current: sessionData?.current || 1,
          pageSize: sessionData?.size || 10,
          total: sessionData?.total || 0,
        }}
        loading={isLoadingSessions}
        onChange={handleTableChange}
        bordered
      />

      {/* Detail Modal */}
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

      {/* --- New: Record Session Modal --- */}
      <Modal
        title="Record Session Feedback"
        open={isRecordModalVisible}
        onCancel={handleRecordModalClose}
        footer={[
          <Button key="back" onClick={handleRecordModalClose}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={isRecording} onClick={handleRecordFormSubmit}> {/* Use isRecording to control loading state */}
            Submit Record
          </Button>,
        ]}
        width={600}
        destroyOnClose // Destroy internal component state when closed
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