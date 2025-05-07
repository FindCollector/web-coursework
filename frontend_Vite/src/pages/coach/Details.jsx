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
  Tooltip,
  Menu,
  Avatar,
  theme
} from 'antd';
import { 
  UploadOutlined, 
  SaveOutlined, 
  ArrowLeftOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  HomeOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  DashboardOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';

import { 
  useGetCoachDetailQuery,
  useUpdateCoachIntroMutation,
  useUploadCoachPhotoMutation,
  useUpdateCoachTagsMutation,
  useUpdateCoachLocationsMutation,
  useUpdateCoachDetailsMutation
} from '../../store/api/coachApi';
import { useLogoutMutation } from '../../store/api/authApi';
import { logout as logoutAction } from '../../store/authSlice';
import { setActiveMenu } from '../../store/navSlice';
import PageTransition from '../../components/PageTransition';
import TagsContainer from '../../components/TagsContainer';
import ImgWithToken from '../../components/ImgWithToken';
import GoogleMap from '../../components/GoogleMap';
import { getAuthHeaders, getFullImageUrl, createImageUrlWithToken } from '../../utils/imageUtils';
import { loginSuccess } from '../../store/authSlice';
import CoachSidebar from '../../components/layout/CoachSidebar';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Header, Content, Sider } = Layout;

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
        marker.setAttribute('title', location.locationName);
        
        // Create info content
        const content = document.createElement('div');
        content.innerHTML = `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0;">${location.locationName}</h3>
            <p style="margin: 0;">Postcode: ${location.postcode || 'Not available'}</p>
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
  const dispatch = useDispatch();
  const { token, userName: authUserName } = useSelector(state => state.auth);
  const { token: themeToken } = theme.useToken();
  
  // 在组件加载时设置activeMenu为profile
  useEffect(() => {
    dispatch(setActiveMenu('profile'));
  }, [dispatch]);
  
  // 添加 RTK Query 的 logout mutation hook
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  
  // 添加调试日志
  console.log('CoachDetails 组件渲染 - Auth Token:', token);
  
  // Add state for map modal
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  
  // 获取教练详情数据
  const { 
    data: coachData, 
    isLoading: isLoadingDetails, 
    isError: isErrorDetails,
    error,
    refetch: refetchDetails 
  } = useGetCoachDetailQuery();
  
  // 添加更详细的调试日志
  useEffect(() => {
    console.log('CoachDetails API 响应:', {
      data: coachData,
      isLoading: isLoadingDetails,
      isError: isErrorDetails,
      error: error,
      token: token
    });
    
    // 检查是否为认证错误
    if (error) {
      console.error('API 错误详情:', {
        status: error.status,
        data: error.data,
        message: error.message
      });
    }
  }, [coachData, isLoadingDetails, isErrorDetails, error, token]);
  
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
      
      // 添加详细的数据检查
      console.log('API响应完整数据:', data);
      
      // 设置基本信息
      setIntro(data.intro || '');
      setPhotoUrl(data.photo || '');
      setTempPhotoUrl(''); // 重置临时照片URL
      setUserName(data.userName || '');
      setAddress(data.address || '');
      setBirthday(data.birthday ? dayjs(data.birthday) : null);
      
      // 设置标签数据并检查
      const coachTagsData = Array.isArray(data.coachTags) ? data.coachTags : [];
      const otherTagsData = Array.isArray(data.otherTags) ? data.otherTags : [];
      setCoachTags(coachTagsData);
      setOtherTags(otherTagsData);
      console.log('设置标签数据 - 教练标签:', coachTagsData);
      console.log('设置标签数据 - 其他标签:', otherTagsData);
      
      // 设置位置数据并检查
      const coachLocationsData = Array.isArray(data.coachLocations) ? data.coachLocations : [];
      const otherLocationsData = Array.isArray(data.otherLocations) ? data.otherLocations : [];
      console.log('设置位置数据 - 教练位置:', coachLocationsData);
      console.log('设置位置数据 - 其他位置:', otherLocationsData);
      
      // 检查位置数据结构
      if (coachLocationsData.length > 0) {
        console.log('位置数据示例:', coachLocationsData[0]);
      }
      
      setCoachLocations(coachLocationsData);
      setOtherLocations(otherLocationsData);
      
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
    } else if (coachData) {
      // API返回了错误
      console.error('API返回错误:', coachData);
      message.error(coachData.msg || '获取教练数据失败');
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
          // 如果用户名被更新了，同时更新 Redux store
          if (updatedData.userName) {
            // 从 sessionStorage 获取当前的认证信息
            const token = sessionStorage.getItem('token');
            const userType = sessionStorage.getItem('userType');
            
            // 更新 Redux store 中的用户信息
            dispatch(loginSuccess({
              token,
              userType,
              userName: updatedData.userName
            }));
          }
          
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
    console.log('位置选择变更 - ID:', locationId);
    
    // 合并所有位置数据进行查找
    const allLocations = [...coachLocations, ...otherLocations];
    const location = allLocations.find(loc => loc.id === locationId);
    
    console.log('找到位置对象:', location);
    
    if (!location) {
      console.error('未找到位置对象, ID:', locationId);
      return;
    }
    
    if (coachLocations.some(loc => loc.id === locationId)) {
      // 如果已选中，则取消选中
      console.log('取消选择位置:', location.locationName);
      const newCoachLocations = coachLocations.filter(loc => loc.id !== locationId);
      const newOtherLocations = [...otherLocations, location];
      
      console.log('更新后的教练位置:', newCoachLocations);
      console.log('更新后的其他位置:', newOtherLocations);
      
      setCoachLocations(newCoachLocations);
      setOtherLocations(newOtherLocations);
    } else {
      // 如果未选中，则选中
      console.log('选择位置:', location.locationName);
      const newOtherLocations = otherLocations.filter(loc => loc.id !== locationId);
      const newCoachLocations = [...coachLocations, location];
      
      console.log('更新后的教练位置:', newCoachLocations);
      console.log('更新后的其他位置:', newOtherLocations);
      
      setOtherLocations(newOtherLocations);
      setCoachLocations(newCoachLocations);
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
  
  // 处理登出
  const handleLogout = () => {
    Modal.confirm({
      title: 'Logout Confirmation',
      content: 'Are you sure you want to logout?',
      onOk: async () => {
        try {
          // 调用 RTK Query 的 logout mutation
          const response = await logout().unwrap();
          dispatch(logoutAction());
          navigate('/login');
        } catch (error) {
          console.error('Logout failed:', error);
          message.error('Logout failed. Please try again.');
        }
      },
      okText: 'Logout',
      cancelText: 'Cancel',
    });
  };
  
  // 返回Dashboard
  const goToDashboard = () => {
    navigate('/coach/dashboard');
  };
  
  // 导航到其他菜单
  const handleMenuClick = ({ key }) => {
    if (key !== 'profile') {
      dispatch(setActiveMenu(key));
      navigate('/coach/dashboard');
    }
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

  // 在class或function组件内部添加sidebarCollapsed状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoadingDetails) {
    return (
      <PageTransition isVisible={true} noAnimation={true}>
        <div className="flex justify-center items-center h-screen" style={{
          background: 'linear-gradient(150deg, #e6f7ff 0%, #e3f2fd 50%, #bbdefb 100%)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, fontSize: 16, color: '#1890ff' }}>
              加载教练详情中，请稍候...
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }
  
  if (isErrorDetails) {
    return (
      <PageTransition isVisible={true} noAnimation={true}>
        <div className="flex flex-col justify-center items-center h-screen" style={{
          background: 'linear-gradient(150deg, #e6f7ff 0%, #e3f2fd 50%, #bbdefb 100%)',
          padding: '20px'
        }}>
          <Alert
            message="加载失败"
            description={error?.data?.msg || error?.error || "无法加载教练详情，请稍后重试或联系管理员"}
            type="error"
            showIcon
            style={{ marginBottom: 20, width: '100%', maxWidth: 500 }}
          />
          <div style={{ display: 'flex', gap: 16 }}>
            <Button 
              type="primary" 
              onClick={refetchDetails} 
              icon={<ReloadOutlined />}
            >
              重试
            </Button>
            <Button 
              onClick={() => navigate('/coach/dashboard')}
              icon={<ArrowLeftOutlined />}
            >
              返回仪表板
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }
  
  return (
    <PageTransition isVisible={true} noAnimation={true}>
      <style>{scrollbarStyles}</style>
      <DndProvider backend={HTML5Backend}>
        <Layout style={{ minHeight: '100vh' }}>
          <CoachSidebar 
            colorToken={themeToken}
            onCollapse={setSidebarCollapsed}
          />
          <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 200, transition: 'all 0.2s' }}>
            <Header style={{ 
              background: themeToken.colorBgContainer, 
              padding: '0 16px', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(0,21,41,.08)',
              zIndex: 10,
              height: '64px',
              position: 'sticky',
              top: 0,
              width: '100%',
              overflow: 'hidden'
            }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Profile Management
              </div>
              <Space size={16} style={{ flexShrink: 0 }}>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={handleSaveAll}
                  loading={isUpdatingDetails}
                >
                  Save All Changes
                </Button>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: 0
                }}>
                  <Avatar style={{ 
                    backgroundColor: themeToken.colorPrimary,
                    flexShrink: 0 
                  }}>
                    <UserOutlined />
                  </Avatar>
                  <span style={{ 
                    margin: '0 8px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '120px'
                  }}>{authUserName}</span>
                  <Button 
                    icon={<LogoutOutlined />} 
                    onClick={handleLogout}
                    type="link"
                    style={{ flexShrink: 0 }}
                  >
                    Logout
                  </Button>
                </div>
              </Space>
            </Header>
            <Content style={{ 
              margin: '24px 16px', 
              padding: 24, 
              background: themeToken.colorBgContainer,
              borderRadius: 4,
              minHeight: 280,
              overflow: 'initial'
            }}>
              <Row gutter={[24, 24]}>
                {/* 左侧面板：个人资料和基本信息 */}
                <Col xs={24} lg={8}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
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
                          <Button icon={<UploadOutlined />}>Upload New Photo</Button>
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
                        {[...coachLocations, ...otherLocations].length > 0 ? (
                          [...coachLocations, ...otherLocations]
                            .filter(location => location && location.locationName) // 使用locationName替代name
                            .sort((a, b) => (a.locationName || '').localeCompare(b.locationName || ''))
                            .map(location => {
                              // 增加调试信息
                              console.log('渲染位置条目:', location);
                              return (
                                <div 
                                  key={location.id} 
                                  style={{ 
                                    marginBottom: '12px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: coachLocations.some(loc => loc.id === location.id) 
                                      ? '#e6f7ff' 
                                      : 'transparent',
                                    transition: 'all 0.3s',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'flex-start'
                                  }}
                                  onClick={() => handleLocationChange(location.id)}
                                >
                                  <Checkbox
                                    checked={coachLocations.some(loc => loc.id === location.id)}
                                    style={{ marginRight: '12px', marginTop: '2px', flexShrink: 0 }}
                                    onChange={(e) => {
                                      // 阻止事件冒泡
                                      e.stopPropagation();
                                      handleLocationChange(location.id);
                                    }}
                                  />
                                  <div style={{ width: '100%' }}>
                                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>{location.locationName}</div>
                                    <div style={{ 
                                      fontSize: '12px', 
                                      color: '#666', 
                                      display: 'inline-block',
                                      backgroundColor: '#f0f0f0',
                                      padding: '2px 8px',
                                      borderRadius: '4px'
                                    }}>
                                      {location.postcode ? 
                                        `${location.postcode}` :
                                        'Postcode not available'
                                      }
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <div style={{ 
                            padding: '30px', 
                            textAlign: 'center', 
                            color: '#999',
                            background: '#f9f9f9',
                            borderRadius: '8px',
                            marginTop: '10px'
                          }}>
                            No locations available
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                </Col>
              </Row>

              {/* Map Modal */}
              <MapModal 
                visible={isMapModalVisible} 
                onClose={hideMapModal} 
                locations={coachLocations}
              />
            </Content>
          </Layout>
        </Layout>
      </DndProvider>
    </PageTransition>
  );
};

export default CoachDetails; 