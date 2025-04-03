import { useState, useEffect } from 'react';
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
  Divider
} from 'antd';
import { 
  UploadOutlined, 
  SaveOutlined, 
  ArrowLeftOutlined,
  UserOutlined
} from '@ant-design/icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';

import { 
  useGetCoachDetailQuery,
  useUpdateCoachIntroMutation,
  useUploadCoachPhotoMutation,
  useUpdateCoachTagsMutation
} from '../../store/api/coachApi';
import PageTransition from '../../components/PageTransition';
import TagsContainer from '../../components/TagsContainer';
import ImgWithToken from '../../components/ImgWithToken';
import { getAuthHeaders, getFullImageUrl, createImageUrlWithToken } from '../../utils/imageUtils';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Header, Content } = Layout;

const CoachDetails = () => {
  const navigate = useNavigate();
  const { token } = useSelector(state => state.auth);
  
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

  // 状态管理
  const [intro, setIntro] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [coachTags, setCoachTags] = useState([]);
  const [otherTags, setOtherTags] = useState([]);
  const [fileList, setFileList] = useState([]);
  
  // 加载教练数据
  useEffect(() => {
    if (coachData && coachData.code === 0) {
      const data = coachData.data;
      setIntro(data.intro || '');
      setPhotoUrl(data.photo || '');
      
      setCoachTags(data.coachTags || []);
      setOtherTags(data.otherTags || []);
      
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
  
  // 处理介绍保存
  const handleSaveIntro = async () => {
    try {
      const response = await updateIntro(intro);
      if (response.data?.code === 0) {
        message.success('Introduction updated successfully');
      } else {
        message.error(response.data?.message || 'Failed to update introduction');
      }
    } catch (error) {
      message.error('Failed to update introduction');
      console.error('Error updating intro:', error);
    }
  };
  
  // 处理照片上传
  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await uploadPhoto(formData).unwrap();
      
      if (response.code === 0 && response.data?.photoUrl) {
        setPhotoUrl(response.data.photoUrl);
        message.success('Photo uploaded successfully');
        onSuccess(response, file);
      } else {
        message.error(response.message || 'Failed to upload photo');
        onError(new Error('Upload failed'));
      }
    } catch (error) {
      message.error('Failed to upload photo');
      console.error('Error uploading photo:', error);
      onError(error);
    }
  };
  
  // 处理保存标签
  const handleSaveTags = async () => {
    try {
      // 提取教练标签ID
      const tagIds = coachTags.map(tag => tag.id);
      
      const response = await updateTags(tagIds);
      
      if (response.data?.code === 0) {
        message.success('Tags updated successfully');
      } else {
        message.error(response.data?.message || 'Failed to update tags');
      }
    } catch (error) {
      message.error('Failed to update tags');
      console.error('Error updating tags:', error);
    }
  };
  
  // 返回上一页
  const handleGoBack = () => {
    navigate('/coach/dashboard');
  };
  
  // 上传组件属性
  const uploadProps = {
    name: 'photo',
    listType: 'picture',
    fileList: fileList,
    customRequest: handleUpload,
    onChange: ({ fileList }) => setFileList(fileList),
    headers: getAuthHeaders(),
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG file!');
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
      }
      return isJpgOrPng && isLt2M;
    },
  };
  
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
      <Layout style={{ minHeight: '100vh', background: 'linear-gradient(150deg, #e6f7ff 0%, #e3f2fd 50%, #bbdefb 100%)' }}>
        <Header style={{ 
          background: '#ffffff', 
          padding: '0 30px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1,
          height: '64px'
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
            onClick={handleSaveTags}
            loading={isUpdatingTags}
          >
            Save All Changes
          </Button>
        </Header>

        <Content style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
          <Row gutter={[30, 30]}>
            {/* 左侧面板：个人资料 */}
            <Col xs={24} lg={8}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card 
                  className="shadow-md hover:shadow-lg transition-shadow duration-300"
                  style={{ borderRadius: '12px', overflow: 'hidden' }}
                >
                  <div className="flex flex-col items-center text-center">
                    {photoUrl ? (
                      <ImgWithToken 
                        src={photoUrl}
                        avatar
                        size={180}
                        className="mb-6"
                        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        fallbackIcon={<UserOutlined />}
                        fallbackColor="#1890ff"
                      />
                    ) : (
                      <ImgWithToken 
                        avatar
                        size={180}
                        className="mb-6"
                        fallbackIcon={<UserOutlined />}
                        fallbackColor="#1890ff"
                        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    )}
                    
                    <Title level={4} className="mb-2">Profile Photo</Title>
                    <Paragraph type="secondary" className="mb-6">
                      A professional photo helps build trust with clients
                    </Paragraph>
                    
                    <Upload {...uploadProps} showUploadList={false}>
                      <Button 
                        icon={<UploadOutlined />} 
                        loading={isUploadingPhoto}
                        type="primary"
                        shape="round"
                        size="large"
                        block
                      >
                        {photoUrl ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                    </Upload>
                  </div>
                  
                  <Divider />
                  
                  <div className="mt-6">
                    <Title level={5} className="mb-4">Tips for a Great Profile</Title>
                    <ul className="list-disc pl-5">
                      <li className="mb-2">Use a clear, professional headshot</li>
                      <li className="mb-2">Highlight your unique teaching approach</li>
                      <li className="mb-2">Clearly state your areas of expertise</li>
                      <li className="mb-2">Mention relevant certifications or qualifications</li>
                    </ul>
                  </div>
                </Card>
              </motion.div>
            </Col>
            
            {/* 右侧面板：个人介绍和专业标签 */}
            <Col xs={24} lg={16}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card 
                  title={
                    <div className="flex items-center">
                      <span className="text-xl font-medium">Personal Introduction</span>
                    </div>
                  }
                  className="shadow-md hover:shadow-lg transition-shadow duration-300 mb-6"
                  style={{ borderRadius: '12px' }}
                  extra={
                    <Button 
                      type="primary" 
                      icon={<SaveOutlined />} 
                      onClick={handleSaveIntro}
                      loading={isUpdatingIntro}
                      shape="round"
                    >
                      Save
                    </Button>
                  }
                >
                  <TextArea
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                    placeholder="Briefly introduce yourself, your expertise, and your teaching style..."
                    rows={8}
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
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {/* 添加提示标签数量的信息 */}
                <div className="mb-4">
                  <Text type="secondary">
                    Selected Tags: {coachTags.length} | Available Tags: {otherTags.length}
                  </Text>
                </div>
                
                <DndProvider backend={HTML5Backend}>
                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                      <TagsContainer 
                        title="Your Expertise"
                        tags={coachTags}
                        type="coach"
                        onMove={handleTagMove}
                        style={{ 
                          borderRadius: '12px',
                          minHeight: '300px'
                        }}
                      />
                    </Col>
                    
                    <Col xs={24} md={12}>
                      <TagsContainer 
                        title="Available Tags"
                        tags={otherTags}
                        type="other"
                        onMove={handleTagMove}
                        style={{ 
                          borderRadius: '12px',
                          minHeight: '300px'
                        }}
                      />
                    </Col>
                  </Row>
                  
                  <div className="mt-6 text-center">
                    <Paragraph type="secondary" className="mb-4">
                      Drag and drop tags between containers to select your expertise
                    </Paragraph>
                  </div>
                </DndProvider>
              </motion.div>
            </Col>
          </Row>
        </Content>
      </Layout>
    </PageTransition>
  );
};

export default CoachDetails; 