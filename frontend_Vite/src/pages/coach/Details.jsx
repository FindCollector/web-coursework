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

// Add custom scrollbar styles
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
  
  // Set activeMenu to profile when component loads
  useEffect(() => {
    dispatch(setActiveMenu('profile'));
  }, [dispatch]);
  
  // Add RTK Query logout mutation hook
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  
  // Add state for map modal
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  
  // Get coach details data
  const { 
    data: coachData, 
    isLoading: isLoadingDetails, 
    isError: isErrorDetails,
    error,
    refetch: refetchDetails 
  } = useGetCoachDetailQuery();
  
  // API mutations
  const [updateIntro, { isLoading: isUpdatingIntro }] = useUpdateCoachIntroMutation();
  const [uploadPhoto, { isLoading: isUploadingPhoto }] = useUploadCoachPhotoMutation();
  const [updateTags, { isLoading: isUpdatingTags }] = useUpdateCoachTagsMutation();
  const [updateLocations, { isLoading: isUpdatingLocations }] = useUpdateCoachLocationsMutation();
  const [updateDetails, { isLoading: isUpdatingDetails }] = useUpdateCoachDetailsMutation();

  // State management
  const [intro, setIntro] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [tempPhotoUrl, setTempPhotoUrl] = useState(''); // Add temporary photo URL state
  const [coachTags, setCoachTags] = useState([]);
  const [otherTags, setOtherTags] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [coachLocations, setCoachLocations] = useState([]);
  const [otherLocations, setOtherLocations] = useState([]);
  const [userName, setUserName] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState(null);
  
  // Load coach data
  useEffect(() => {
    if (coachData && coachData.code === 0) {
      const data = coachData.data;
      
      // Set basic information
      setIntro(data.intro || '');
      setPhotoUrl(data.photo || '');
      setTempPhotoUrl(''); // Reset temporary photo URL
      setUserName(data.userName || '');
      setAddress(data.address || '');
      setBirthday(data.birthday ? dayjs(data.birthday) : null);
      
      // Set tag data and check
      const coachTagsData = Array.isArray(data.coachTags) ? data.coachTags : [];
      const otherTagsData = Array.isArray(data.otherTags) ? data.otherTags : [];
      setCoachTags(coachTagsData);
      setOtherTags(otherTagsData);
      
      // Set location data and check
      const coachLocationsData = Array.isArray(data.coachLocations) ? data.coachLocations : [];
      const otherLocationsData = Array.isArray(data.otherLocations) ? data.otherLocations : [];
      
      setCoachLocations(coachLocationsData);
      setOtherLocations(otherLocationsData);
      
      // Set file list for Upload component
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
      // API returned an error
      message.error(coachData.msg || 'Failed to get coach data');
    }
  }, [coachData]);
  
  // Handle tag movement
  const handleTagMove = (dragIndex, hoverIndex, sourceType, targetType, tagId) => {
    if (sourceType === targetType) {
      // Reorder within the same container
      const items = sourceType === 'coach' ? [...coachTags] : [...otherTags];
      const dragItem = items[dragIndex];
      
      // Remove from source position
      items.splice(dragIndex, 1);
      // Insert at target position
      items.splice(hoverIndex, 0, dragItem);
      
      // Update state
      if (sourceType === 'coach') {
        setCoachTags(items);
      } else {
        setOtherTags(items);
      }
    } else {
      // Drag between containers
      const sourceItems = sourceType === 'coach' ? [...coachTags] : [...otherTags];
      const targetItems = targetType === 'coach' ? [...coachTags] : [...otherTags];
      
      // Find the dragged tag
      const draggedTag = sourceItems.find(tag => tag.id === tagId);
      
      if (!draggedTag) {
        return;
      }
      
      // Remove from source container
      const newSourceItems = sourceItems.filter(tag => tag.id !== tagId);
      
      // Add to target container
      const newTargetItems = [...targetItems];
      newTargetItems.splice(hoverIndex, 0, draggedTag);
      
      // Update state
      if (sourceType === 'coach') {
        setCoachTags(newSourceItems);
        setOtherTags(newTargetItems);
      } else {
        setOtherTags(newSourceItems);
        setCoachTags(newTargetItems);
      }
    }
  };
  
  // Handle photo upload
  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    
    try {
      // Check if file is valid
      if (!file) {
        message.error('Please select a file');
        onError(new Error('No file selected'));
        return;
      }

      const formData = new FormData();
      // Make sure to use the correct field name 'file', corresponding to backend parameter name
      formData.append('file', file);
      
      const response = await uploadPhoto(formData).unwrap();
      
      if (response.code === 0) {
        setTempPhotoUrl(response.photoUrl); // Save temporary photo URL
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
        
        // Refresh the entire page after successful upload
        window.location.reload();
      } else {
        message.error(response.msg || 'Failed to upload photo');
        onError(new Error('Upload failed'));
      }
    } catch (error) {
      message.error(error.data?.msg || 'Failed to upload photo');
      onError(error);
    }
  };
  
  // Handle all save operations
  const handleSaveAll = async () => {
    try {
      // Show loading state
      const loadingMessage = message.loading('Saving changes...', 0);
      
      // Prepare data to update
      const updatedData = {};
      
      // Only add modified fields
      if (intro !== coachData?.data?.intro) {
        updatedData.intro = intro;
      }
      
      // If there's a temporary photo URL, add it to update data
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
      
      // If there's modified data, send request
      if (Object.keys(updatedData).length > 0) {
        const response = await updateDetails(updatedData).unwrap();
        
        // Close loading state
        loadingMessage();
        
        if (response.code === 0) {
          // If username was updated, also update Redux store
          if (updatedData.userName) {
            // Get current auth info from sessionStorage
            const token = sessionStorage.getItem('token');
            const userType = sessionStorage.getItem('userType');
            
            // Update user info in Redux store
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
          setTempPhotoUrl(''); // Clear temporary photo URL
          // Refresh data
          refetchDetails();
        } else {
          // Use Modal to display error message
          Modal.error({
            title: 'Save Failed',
            content: response.msg || 'An error occurred while saving changes',
            okText: 'OK'
          });
        }
      } else {
        // Close loading state
        loadingMessage();
        message.info('No changes to save');
      }
    } catch (error) {
      // Close loading state and show error
      message.destroy();
      Modal.error({
        title: 'Save Failed',
        content: error.data?.msg || 'An error occurred while saving changes',
        okText: 'OK'
      });
    }
  };
  
  // Handle location selection change
  const handleLocationChange = (locationId) => {
    // Combine all location data for searching
    const allLocations = [...coachLocations, ...otherLocations];
    const location = allLocations.find(loc => loc.id === locationId);
    
    if (!location) {
      return;
    }
    
    if (coachLocations.some(loc => loc.id === locationId)) {
      // If already selected, deselect
      const newCoachLocations = coachLocations.filter(loc => loc.id !== locationId);
      const newOtherLocations = [...otherLocations, location];
      
      setCoachLocations(newCoachLocations);
      setOtherLocations(newOtherLocations);
    } else {
      // If not selected, select
      const newOtherLocations = otherLocations.filter(loc => loc.id !== locationId);
      const newCoachLocations = [...coachLocations, location];
      
      setOtherLocations(newOtherLocations);
      setCoachLocations(newCoachLocations);
    }
  };

  // Handle saving locations
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
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    Modal.confirm({
      title: 'Logout Confirmation',
      content: 'Are you sure you want to logout?',
      onOk: async () => {
        try {
          // Call RTK Query logout mutation
          const response = await logout().unwrap();
          dispatch(logoutAction());
          navigate('/login');
        } catch (error) {
          message.error('Logout failed. Please try again.');
        }
      },
      okText: 'Logout',
      cancelText: 'Cancel',
    });
  };
  
  // Return to Dashboard
  const goToDashboard = () => {
    navigate('/coach/dashboard');
  };
  
  // Navigate to other menus
  const handleMenuClick = ({ key }) => {
    if (key !== 'profile') {
      dispatch(setActiveMenu(key));
      navigate('/coach/dashboard');
    }
  };
  
  // Upload component properties
  const uploadProps = {
    name: 'file', // Changed to match backend parameter name
    listType: 'picture',
    fileList: fileList,
    customRequest: handleUpload,
    onChange: ({ fileList }) => setFileList(fileList),
    headers: getAuthHeaders(),
    beforeUpload: (file) => {
      // Check file type
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
        return false;
      }
      // Check file size (limit to 2MB)
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return false;
      }
      return isJpgOrPng && isLt2M;
    },
    accept: 'image/jpeg,image/png', // Limit file selection type
  };
  
  // Add map modal visibility handlers
  const showMapModal = () => setIsMapModalVisible(true);
  const hideMapModal = () => setIsMapModalVisible(false);

  // Add sidebarCollapsed state in class or function component
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
              Loading coach details, please wait...
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
            message="Loading Failed"
            description={error?.data?.msg || error?.error || "Unable to load coach details, please try again later or contact an administrator"}
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
              Retry
            </Button>
            <Button 
              onClick={() => navigate('/coach/dashboard')}
              icon={<ArrowLeftOutlined />}
            >
              Return to Dashboard
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
                {/* Left Panel: Profile and Basic Information */}
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

                    {/* Basic Information Card */}
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
                              // Disable today and future dates
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
                
                {/* Right Panel: Professional Tags and Location Selection */}
                <Col xs={24} lg={16}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ 
                      position: 'relative',
                      height: 'calc(100vh - 104px)',  // Subtract height of top nav bar and padding
                      overflowY: 'auto',
                      paddingRight: '12px'  // Reserve space for scrollbar
                    }}
                    className="custom-scrollbar"  // Add custom scrollbar style
                  >
                    {/* Professional Tags Section */}
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

                    {/* Location Selection Card */}
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
                            .filter(location => location && location.locationName) // Use locationName instead of name
                            .sort((a, b) => (a.locationName || '').localeCompare(b.locationName || ''))
                            .map(location => {
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
                                      // Prevent event bubbling
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