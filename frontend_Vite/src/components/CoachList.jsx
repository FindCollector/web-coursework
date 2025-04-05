import React, { useState, useEffect } from 'react';
import { Card, Modal, Spin, Tag, Alert, Empty, Avatar, Row, Col, Space } from 'antd';
import { useGetCoachListQuery } from '../store/api/coachApi';
import { UserOutlined, EnvironmentOutlined, MailOutlined, TagOutlined } from '@ant-design/icons';

const CoachList = () => {
  const { data: coachListData, isLoading, error } = useGetCoachListQuery();
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    console.log('CoachList组件状态:', { 
      isLoading, 
      hasData: !!coachListData, 
      error: error?.message,
      coachCount: coachListData?.records?.length 
    });
  }, [coachListData, isLoading, error]);

  const handleCardClick = (coach) => {
    setSelectedCoach(coach);
    setIsModalVisible(true);
  };

  if (isLoading) {
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
    <div className="w-full">
      <Row gutter={[16, 16]} className="justify-center sm:justify-start">
        {coachListData.records.map((coach) => (
          <Col xs={24} sm={12} md={8} lg={6} key={coach.coachId} className="flex">
            <Card
              hoverable
              className="w-full cursor-pointer transition-all duration-300 hover:shadow-lg flex flex-col h-full"
              onClick={() => handleCardClick(coach)}
            >
              <div className="flex items-center space-x-4">
                <Avatar
                  size={64}
                  src={`http://127.0.0.1:8080${coach.photo}`}
                  icon={<UserOutlined />}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold truncate">{coach.userName}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {coach.tagNames?.map((tag, index) => (
                      <Tag key={index} color="green" icon={<TagOutlined />}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={
          <Space size="large" align="center">
            <Avatar
              size={48}
              src={selectedCoach && `http://127.0.0.1:8080${selectedCoach.photo}`}
              icon={<UserOutlined />}
            />
            <span className="text-lg">{selectedCoach?.userName}</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
        centered
      >
        {selectedCoach && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <p className="flex items-center space-x-2">
                  <UserOutlined className="mr-2" />
                  <span>Age: {selectedCoach.age || 'Not specified'}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <MailOutlined className="mr-2" />
                  <span className="truncate">{selectedCoach.email}</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <TagOutlined className="mr-2" />
                  Specialties:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCoach.tagNames?.map((tag, index) => (
                    <Tag key={index} color="green" icon={<TagOutlined />}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <EnvironmentOutlined className="mr-2" />
                  Available Locations:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCoach.locationNames?.map((location, index) => (
                    <Tag key={index} color="blue" icon={<EnvironmentOutlined />}>
                      {location}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="font-semibold mb-2">Introduction:</p>
              <p className="text-gray-600">{selectedCoach.intro || 'No introduction available'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CoachList; 