import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Input, 
  Button, 
  Typography, 
  Upload, 
  message, 
  Row, 
  Col, 
  Spin, 
  Alert,
  Space,
  Layout,
  Divider,
  Checkbox,
  DatePicker,
  Form,
  Modal,
  Tooltip
} from 'antd';
import { 
  UploadOutlined, 
  SaveOutlined, 
  ArrowLeftOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  HomeOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

import { 
  useGetCoachDetailQuery,
  useUpdateCoachIntroMutation,
  useUploadCoachPhotoMutation,
  useUpdateCoachTagsMutation,
  useUpdateCoachLocationsMutation,
  useUpdateCoachDetailsMutation
} from '../../store/api/coachApi';
import PageTransition from '../../components/PageTransition';
import TagsContainer from '../../components/TagsContainer';
import ImgWithToken from '../../components/ImgWithToken';
import GoogleMap from '../../components/GoogleMap';
import { getAuthHeaders, getFullImageUrl, createImageUrlWithToken } from '../../utils/imageUtils';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Header, Content } = Layout;

// 添加自定义滚动条样式
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

// Add MapModal component before CoachDetails component
const MapModal = ({ visible, onClose, locations }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    // Check if Google Maps API is loaded
    const checkGoogleMapsLoaded = () => {
      if (window.googleMapsLoaded && window.google) {
        setIsMapLoaded(true);
        return;
      }
      setTimeout(checkGoogleMapsLoaded, 100);
    };

    if (visible) {
      checkGoogleMapsLoaded();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && isMapLoaded && locations.length > 0 && mapContainerRef.current) {
      // Clear previous content
      mapContainerRef.current.innerHTML = '';

      // Create map element
      const mapElement = document.createElement('gmp-map');
      mapElement.style.height = '500px';
      mapElement.style.width = '100%';
      mapElement.style.borderRadius = '8px';
      mapElement.setAttribute('center', `${locations[0].latitude},${locations[0].longitude}`);
      mapElement.setAttribute('zoom', '12');
      mapElement.setAttribute('map-id', '8f348c95237d5e1a');

      // Add markers for each location
      locations.forEach(location => {
        const marker = document.createElement('gmp-advanced-marker');
        marker.setAttribute('position', `${location.latitude},${location.longitude}`);
        marker.setAttribute('title', location.name);
        
        // Create info content
        const content = document.createElement('div');
        content.innerHTML = `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0;">${location.name}</h3>
            <p style="margin: 0;">Lat: ${location.latitude.toFixed(4)}</p>
            <p style="margin: 0;">Lng: ${location.longitude.toFixed(4)}</p>
          </div>
        `;
        
        // Add click event listener for info window
        marker.addEventListener('click', () => {
          const infoWindow = new google.maps.InfoWindow({
            content: content
          });
          infoWindow.open(mapElement, marker);
        });

        mapElement.appendChild(marker);
      });

      // Add map to container
      mapContainerRef.current.appendChild(mapElement);
    }
  }, [visible, isMapLoaded, locations]);

  return (
    <Modal
      title="Training Locations Map"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {!isMapLoaded ? (
        <div style={{ 
          height: '500px', 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Spin size="large" tip="Loading Google Maps..." />
        </div>
      ) : (
        <div 
          ref={mapContainerRef}
          style={{ 
            height: '500px', 
            width: '100%',
            borderRadius: '8px',
            marginTop: '16px'
          }}
        />
      )}
    </Modal>
  );
};

const CoachDetails = () => {
  const navigate = useNavigate();
  const { token } = useSelector(state => state.auth);
  
  // Add state for map modal
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  
  // 获取教练详情数据
  const { 
    data: coachData, 
    isLoading: isLoadingDetails, 
    isError: isErrorDetails,
    refetch: refetchDetails 
  } = useGetCoachDetailQuery();
  
  // API mutations
  const [updateIntro, { isLoading: isUpdatingIntro }] = useUpdateCoachIntroMutation();
  const [uploadPhoto, { isLoading: isUploadingPhoto }] = useUploadCoachPhotoMutation();
  const [updateTags, { isLoading: isUpdatingTags }] = useUpdateCoachTagsMutation();
  const [updateLocations, { isLoading: isUpdatingLocations }] = useUpdateCoachLocationsMutation();
  const [updateDetails, { isLoading: isUpdatingDetails }] = useUpdateCoachDetailsMutation();

  // 状态管理
  const [intro, setIntro] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [tempPhotoUrl, setTempPhotoUrl] = useState(''); // 添加临时照片URL状态
  const [coachTags, setCoachTags] = useState([]);
  const [otherTags, setOtherTags] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [coachLocations, setCoachLocations] = useState([]);
  const [otherLocations, setOtherLocations] = useState([]);
  const [userName, setUserName] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState(null);
  
  // 加载教练数据
  useEffect(() => {
    if (coachData && coachData.code === 0) {
      const data = coachData.data;
      setIntro(data.intro || '');
      setPhotoUrl(data.photo || '');
      setTempPhotoUrl(''); // 重置临时照片URL
      setUserName(data.userName || '');
      setAddress(data.address || '');
      setBirthday(data.birthday ? dayjs(data.birthday) : null);
      
      setCoachTags(data.coachTags || []);
      setOtherTags(data.otherTags || []);
      
      setCoachLocations(data.coachLocations || []);
      setOtherLocations(data.otherLocations || []);
      
      // 调试信息: 查看标签数据
      console.log('Coach Tags:', data.coachTags);
      console.log('Other Tags:', data.otherTags);
      
      // 设置文件列表用于Upload组件
      if (data.photo) {
        const imageUrlWithToken = createImageUrlWithToken(data.photo);
        setFileList([
          {
            uid: '-1',
            name: 'profile-photo.jpg',
            status: 'done',
            url: imageUrlWithToken,
          },
        ]);
      }
    }
  }, [coachData]);
  
  // 处理标签移动
  const handleTagMove = (dragIndex, hoverIndex, sourceType, targetType, tagId) => {
    // 调试信息: 标签移动参数
    console.log('Tag Movement:', { 
      dragIndex, 
      hoverIndex, 
      sourceType, 
      targetType, 
      tagId 
    });
    
    if (sourceType === targetType) {
      // 同一容器内排序
      const items = sourceType === 'coach' ? [...coachTags] : [...otherTags];
      const dragItem = items[dragIndex];
      
      // 删除源位置的项
      items.splice(dragIndex, 1);
      // 插入到目标位置
      items.splice(hoverIndex, 0, dragItem);
      
      // 更新状态
      if (sourceType === 'coach') {
        setCoachTags(items);
        console.log('Reordered coach tags:', items);
      } else {
        setOtherTags(items);
        console.log('Reordered other tags:', items);
      }
    } else {
      // 跨容器拖拽
      const sourceItems = sourceType === 'coach' ? [...coachTags] : [...otherTags];
      const targetItems = targetType === 'coach' ? [...coachTags] : [...otherTags];
      
      // 找到被拖拽的标签
      const draggedTag = sourceItems.find(tag => tag.id === tagId);
      console.log('Dragged tag:', draggedTag);
      
      if (!draggedTag) {
        console.error('Tag not found:', tagId);
        return;
      }
      
      // 从源容器中删除
      const newSourceItems = sourceItems.filter(tag => tag.id !== tagId);
      
      // 添加到目标容器
      const newTargetItems = [...targetItems];
      newTargetItems.splice(hoverIndex, 0, draggedTag);
      
      // 更新状态
      if (sourceType === 'coach') {
        setCoachTags(newSourceItems);
        setOtherTags(newTargetItems);
        console.log('Moved from coach to other:', { newSourceItems, newTargetItems });
      } else {
        setOtherTags(newSourceItems);
        setCoachTags(newTargetItems);
        console.log('Moved from other to coach:', { newSourceItems, newTargetItems });
      }
    }
  };
  
  // 处理照片上传
  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    
    try {
      // 检查文件是否有效
      if (!file) {
        message.error('Please select a file');
        onError(new Error('No file selected'));
        return;
      }

      const formData = new FormData();
      // 确保使用正确的字段名 'file'，与后端参数名对应
      formData.append('file', file);
      
      // 打印日志以便调试
      console.log('Uploading file:', file);
      console.log('File size:', file.size);
      console.log('File type:', file.type);
      
      const response = await uploadPhoto(formData).unwrap();
      
      if (response.code === 0) {
        setTempPhotoUrl(response.photoUrl); // 保存临时照片URL
        const imageUrlWithToken = createImageUrlWithToken(response.photoUrl);
        setFileList([
          {
            uid: '-1',
            name: file.name,
            status: 'done',
            url: imageUrlWithToken,
          },
        ]);
        message.success('Photo uploaded successfully');
        onSuccess(response, file);
        
        // 上传成功后刷新整个页面
        window.location.reload();
      } else {
        message.error(response.msg || 'Failed to upload photo');
        onError(new Error('Upload failed'));
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      message.error(error.data?.msg || 'Failed to upload photo');
      onError(error);
    }
  };
  
  // 统一处理所有保存操作
  const handleSaveAll = async () => {
    try {
      // 显示加载中状态
      const loadingMessage = message.loading('Saving changes...', 0);
      
      // 准备要更新的数据
      const updatedData = {};
      
      // 只添加修改过的字段
      if (intro !== coachData?.data?.intro) {
        updatedData.intro = intro;
      }
      
      // 如果有临时照片URL，则添加到更新数据中
      if (tempPhotoUrl) {
        updatedData.photo = tempPhotoUrl;
      }
      
      if (userName !== coachData?.data?.userName) {
        updatedData.userName = userName;
      }
      
      if (address !== coachData?.data?.address) {
        updatedData.address = address;
      }
      
      if (birthday?.format('YYYY-MM-DD') !== coachData?.data?.birthday) {
        updatedData.birthday = birthday?.format('YYYY-MM-DD');
      }
      
      const tagIds = coachTags.map(tag => tag.id);
      if (JSON.stringify(tagIds) !== JSON.stringify(coachData?.data?.coachTags?.map(tag => tag.id))) {
        updatedData.coachTagIds = tagIds;
      }
      
      const locationIds = coachLocations.map(location => location.id);
      if (JSON.stringify(locationIds) !== JSON.stringify(coachData?.data?.coachLocations?.map(loc => loc.id))) {
        updatedData.coachLocationIds = locationIds;
      }
      
      // 如果有修改的数据，则发送请求
      if (Object.keys(updatedData).length > 0) {
        const response = await updateDetails(updatedData).unwrap();
        
        // 关闭加载中状态
        loadingMessage();
        
        if (response.code === 0) {
          message.success({
            content: 'All changes saved successfully!',
            duration: 3
          });
          setTempPhotoUrl(''); // 清除临时照片URL
          // 刷新数据
          refetchDetails();
        } else {
          // 使用Modal显示错误信息
          Modal.error({
            title: 'Save Failed',
            content: response.msg || 'An error occurred while saving changes',
            okText: 'OK'
          });
        }
      } else {
        // 关闭加载中状态
        loadingMessage();
        message.info('No changes to save');
      }
    } catch (error) {
      // 关闭加载中状态并显示错误
      message.destroy();
      Modal.error({
        title: 'Save Failed',
        content: error.data?.msg || 'An error occurred while saving changes',
        okText: 'OK'
      });
      console.error('Error saving changes:', error);
    }
  };
  
  // 处理位置选择变化
  const handleLocationChange = (locationId) => {
    const location = [...coachLocations, ...otherLocations].find(loc => loc.id === locationId);
    
    if (!location) return;
    
    if (coachLocations.some(loc => loc.id === locationId)) {
      // 如果已选中，则取消选中
      setCoachLocations(coachLocations.filter(loc => loc.id !== locationId));
      setOtherLocations([...otherLocations, location]);
    } else {
      // 如果未选中，则选中
      setOtherLocations(otherLocations.filter(loc => loc.id !== locationId));
      setCoachLocations([...coachLocations, location]);
    }
  };

  // 处理位置保存
  const handleSaveLocations = async () => {
    try {
      const locationIds = coachLocations.map(location => location.id);
      const response = await updateLocations(locationIds);
      
      if (response.data?.code === 0) {
        message.success('Locations updated successfully');
      } else {
        message.error(response.data?.message || 'Failed to update locations');
      }
    } catch (error) {
      message.error('Failed to update locations');
      console.error('Error updating locations:', error);
    }
  };
  
  // 返回上一页
  const handleGoBack = () => {
    navigate('/coach/dashboard');
  };
  
  // 上传组件属性
  const uploadProps = {
    name: 'file', // 修改为与后端参数名一致
    listType: 'picture',
    fileList: fileList,
    customRequest: handleUpload,
    onChange: ({ fileList }) => setFileList(fileList),
    headers: getAuthHeaders(),
    beforeUpload: (file) => {
      // 检查文件类型
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
        return false;
      }
      // 检查文件大小（限制为2MB）
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return false;
      }
      return isJpgOrPng && isLt2M;
    },
    accept: 'image/jpeg,image/png', // 限制文件选择类型
  };
  
  // Add map modal visibility handlers
  const showMapModal = () => setIsMapModalVisible(true);
  const hideMapModal = () => setIsMapModalVisible(false);

  if (isLoadingDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Loading coach details..." />
      </div>
    );
  }
  
  if (isErrorDetails) {
    return (
      <div className="p-6">
        <Alert
          message="Error"
          description="Failed to load coach details. Please try again later."
          type="error"
          showIcon
        />
        <Button 
          type="primary" 
          onClick={refetchDetails} 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <PageTransition isVisible={true}>
      <style>{scrollbarStyles}</style>
      <Layout style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(150deg, #e6f7ff 0%, #e3f2fd 50%, #bbdefb 100%)',
        paddingTop: '56px'
      }}>
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Header style={{ 
            padding: '0 30px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1600px',
            margin: '0 auto',
            background: 'transparent',
            height: '56px'
          }}>
            <Space size={16} align="center">
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={handleGoBack}
                type="default"
                style={{ 
                  border: 'none',
                  boxShadow: 'none',
                  background: 'transparent',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                Back
              </Button>
              <Title level={3} style={{ margin: 0, lineHeight: '32px' }}>Coach Details</Title>
            </Space>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSaveAll}
              loading={isUpdatingDetails}
            >
              Save All Changes
            </Button>
          </Header>
        </div>

        <Content style={{ 
          padding: '24px',
          maxWidth: '1600px', 
          margin: '0 auto', 
          width: '100%',
          minHeight: 'calc(100vh - 56px)',
          marginTop: '56px',
          position: 'relative',
          zIndex: 1
        }}>
          <Row gutter={[24, 24]}>
            {/* 左侧面板：个人资料和基本信息 */}
            <Col xs={24} lg={8}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ position: 'sticky', top: '80px' }}
              >
                <Card 
                  className="shadow-md hover:shadow-lg transition-shadow duration-300 mb-6"
                  style={{ borderRadius: '12px', overflow: 'hidden' }}
                >
                  <div className="flex flex-col items-center text-center">
                    {photoUrl ? (
                      <ImgWithToken 
                        src={photoUrl}
                        avatar
                        size={100}
                        className="mb-4"
                        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        fallbackIcon={<UserOutlined />}
                        fallbackColor="#1890ff"
                      />
                    ) : (
                      <ImgWithToken 
                        avatar
                        size={100}
                        className="mb-4"
                        fallbackIcon={<UserOutlined />}
                        fallbackColor="#1890ff"
                        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    )}
                    
                    <Title level={5} className="mb-2">Profile Photo</Title>
                    <Paragraph type="secondary" className="mb-4">
                      A professional photo helps build trust with clients
                    </Paragraph>
                    
                    <Upload {...uploadProps} showUploadList={false}>
                      <Button 
                        icon={<UploadOutlined />} 
                        loading={isUploadingPhoto}
                        type="primary"
                        shape="round"
                        size="middle"
                        block
                      >
                        {photoUrl ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                    </Upload>
                  </div>
                </Card>

                {/* 基本信息卡片 */}
                <Card
                  title={
                    <Space>
                      <UserOutlined style={{ color: '#1890ff' }} />
                      <span>Basic Information</span>
                    </Space>
                  }
                  className="shadow-md hover:shadow-lg transition-shadow duration-300"
                  style={{ borderRadius: '12px' }}
                >
                  <Form layout="vertical">
                    <Form.Item
                      label="Name"
                      required
                      style={{ marginBottom: '12px' }}
                    >
                      <Input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Enter your name"
                        prefix={<UserOutlined className="text-gray-400" />}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Address"
                      style={{ marginBottom: '12px' }}
                    >
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your address"
                        prefix={<HomeOutlined className="text-gray-400" />}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Birthday"
                      style={{ marginBottom: '12px' }}
                    >
                      <DatePicker
                        value={birthday}
                        onChange={(date) => setBirthday(date)}
                        style={{ width: '100%' }}
                        placeholder="Select your birthday"
                        format="YYYY-MM-DD"
                        prefix={<CalendarOutlined className="text-gray-400" />}
                        disabledDate={(current) => {
                          // 禁用今天及之后的日期
                          return current && current.isAfter(dayjs().endOf('day'));
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Personal Introduction"
                      style={{ marginBottom: '0' }}
                    >
                      <TextArea
                        value={intro}
                        onChange={(e) => setIntro(e.target.value)}
                        placeholder="Briefly introduce yourself, your expertise, and your teaching style..."
                        rows={5}
                        className="text-base"
                        style={{ borderRadius: '8px', padding: '12px' }}
                      />
                      
                      {!intro && (
                        <div className="mt-4 p-4 bg-blue-50 text-gray-500 rounded-lg">
                          <Text type="secondary">
                            Your introduction is a chance to connect with potential clients. 
                            Describe your teaching philosophy, experience, and unique 
                            approach. An engaging introduction can significantly 
                            boost client engagement.
                          </Text>
                        </div>
                      )}
                    </Form.Item>
                  </Form>
                </Card>
              </motion.div>
            </Col>
            
            {/* 右侧面板：专业标签和位置选择 */}
            <Col xs={24} lg={16}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ 
                  position: 'relative',
                  height: 'calc(100vh - 104px)',  // 减去顶部导航栏高度和内边距
                  overflowY: 'auto',
                  paddingRight: '12px'  // 为滚动条预留空间
                }}
                className="custom-scrollbar"  // 添加自定义滚动条样式
              >
                {/* 专业标签部分 */}
                <Card
                  title={
                    <Space>
                      <span className="text-lg font-medium">Professional Tags</span>
                      <Text type="secondary" style={{ fontSize: '14px', marginLeft: '8px' }}>
                        Selected Tags: {coachTags.length} | Available Tags: {otherTags.length}
                      </Text>
                    </Space>
                  }
                  className="shadow-md hover:shadow-lg transition-shadow duration-300 mb-6"
                  style={{ 
                    borderRadius: '12px',
                    position: 'relative',
                    backgroundColor: '#fff'
                  }}
                >
                  <DndProvider backend={HTML5Backend}>
                    <Row gutter={[24, 24]}>
                      <Col xs={24} md={12}>
                        <div style={{ 
                          background: '#f5f5f5', 
                          padding: '16px',
                          borderRadius: '8px',
                          minHeight: '200px'
                        }}>
                          <div style={{ 
                            marginBottom: '12px',
                            color: '#1890ff',
                            fontWeight: 500
                          }}>
                            Your Expertise
                          </div>
                          <TagsContainer 
                            tags={coachTags}
                            type="coach"
                            onMove={handleTagMove}
                            style={{ 
                              minHeight: '150px'
                            }}
                          />
                        </div>
                      </Col>
                      
                      <Col xs={24} md={12}>
                        <div style={{ 
                          background: '#f5f5f5', 
                          padding: '16px',
                          borderRadius: '8px',
                          minHeight: '200px'
                        }}>
                          <div style={{ 
                            marginBottom: '12px',
                            color: '#1890ff',
                            fontWeight: 500
                          }}>
                            Available Tags
                          </div>
                          <TagsContainer 
                            tags={otherTags}
                            type="other"
                            onMove={handleTagMove}
                            style={{ 
                              minHeight: '150px'
                            }}
                          />
                        </div>
                      </Col>
                    </Row>
                  </DndProvider>
                </Card>

                {/* 位置选择卡片 */}
                <Card
                  title={
                    <Space>
                      <EnvironmentOutlined style={{ color: '#1890ff' }} />
                      <span>Training Locations</span>
                      <Tooltip title="Click to view all locations on map">
                        <QuestionCircleOutlined
                          style={{ 
                            color: '#1890ff',
                            cursor: 'pointer',
                            fontSize: '18px',
                            backgroundColor: '#e6f7ff',
                            borderRadius: '50%',
                            padding: '6px',
                            transition: 'all 0.3s'
                          }}
                          className="hover:bg-blue-100 hover:scale-110"
                          onClick={showMapModal}
                        />
                      </Tooltip>
                    </Space>
                  }
                  className="shadow-md hover:shadow-lg transition-shadow duration-300 mb-6"
                  style={{ 
                    borderRadius: '12px',
                    position: 'relative',
                    backgroundColor: '#fff'
                  }}
                >
                  <div className="mb-4">
                    <Text type="secondary">
                      Selected Locations: {coachLocations.length} | Available Locations: {otherLocations.length}
                    </Text>
                  </div>
                  
                  <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
                    {[...coachLocations, ...otherLocations]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(location => (
                        <div 
                          key={location.id} 
                          style={{ 
                            marginBottom: '12px',
                            padding: '8px',
                            borderRadius: '8px',
                            background: coachLocations.some(loc => loc.id === location.id) 
                              ? '#e6f7ff' 
                              : 'transparent',
                            transition: 'all 0.3s'
                          }}
                        >
                          <Checkbox
                            checked={coachLocations.some(loc => loc.id === location.id)}
                            onChange={() => handleLocationChange(location.id)}
                          >
                            <div>
                              <div>{location.name}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                              </div>
                            </div>
                          </Checkbox>
                        </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Content>
      </Layout>

      {/* Add GoogleMap component */}
      <GoogleMap
        locations={[...coachLocations, ...otherLocations]}
        isModal={true}
        visible={isMapModalVisible}
        onClose={hideMapModal}
        title="Training Locations Map"
        modalProps={{
          width: 800,
          bodyStyle: { padding: '16px' }
        }}
        mapProps={{
          zoom: 12
        }}
      />
    </PageTransition>
  );
};

export default CoachDetails; 