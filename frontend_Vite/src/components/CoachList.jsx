import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Modal, Spin, Tag, Alert, Empty, Avatar, Row, Col, Space, Form, Input, Select, Button, Divider, message, Tooltip } from 'antd';
import { useGetCoachListQuery, useGetCoachFilterOptionsQuery, useSendSubscriptionRequestMutation } from '../store/api/coachApi';
import { useGetCoachLocationInfoQuery } from '../store/api/memberApi';
import { UserOutlined, EnvironmentOutlined, MailOutlined, TagOutlined, SearchOutlined, ClearOutlined, CalendarOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

// 添加样式组件
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
  padding: 24px;
`;

const FilterCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
  backdrop-filter: blur(8px);
  padding: 24px;
  margin-bottom: 32px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.18);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.2);
  }
`;

const StyledCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  height: 100%;
  background: white;
  border: none;
  
  .ant-card-body {
    padding: 24px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,1));
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(31, 38, 135, 0.15);
  }
`;

const CoachAvatar = styled(Avatar)`
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(31, 38, 135, 0.2);
  margin-bottom: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(31, 38, 135, 0.25);
  }
`;

const TagContainer = styled.div`
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
`;

const StyledTag = styled(Tag)`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  white-space: nowrap;
  background: ${props => props.color === 'green' ? '#e6f7e9' : '#e6f4ff'};
  color: ${props => props.color === 'green' ? '#52c41a' : '#1890ff'};
  border: 1px solid ${props => props.color === 'green' ? '#b7eb8f' : '#91caff'};
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .anticon {
    font-size: 12px;
  }
`;

const CoachList = () => {
  // Filter form state
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    userName: '',
    tags: [],
    locations: [],
  });
  
  // 获取过滤器选项
  const { data: filterOptions, isLoading: isLoadingOptions } = useGetCoachFilterOptionsQuery();
  
  // 添加地图相关状态
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const mapContainerRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapTitle, setMapTitle] = useState('');

  // 将函数声明移到顶部，避免引用问题 - 显示空地图状态
  const showEmptyMapState = useCallback(() => {
    if (!mapContainerRef.current) return;
    
    mapContainerRef.current.innerHTML = '';
    const emptyDiv = document.createElement('div');
    emptyDiv.style.display = 'flex';
    emptyDiv.style.flexDirection = 'column';
    emptyDiv.style.alignItems = 'center';
    emptyDiv.style.justifyContent = 'center';
    emptyDiv.style.height = '100%';
    emptyDiv.style.padding = '20px';
    emptyDiv.innerHTML = `
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path d="M32 56C45.2548 56 56 45.2548 56 32C56 18.7452 45.2548 8 32 8C18.7452 8 8 18.7452 8 32C8 45.2548 18.7452 56 32 56Z" stroke="#BFBFBF" stroke-width="2"/>
        <path d="M32 48V48.01" stroke="#BFBFBF" stroke-width="4" stroke-linecap="round"/>
        <path d="M32 40L32 24" stroke="#BFBFBF" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <p style="margin-top: 16px; color: #8c8c8c; font-size: 16px;">No location data available</p>
      <p style="color: #8c8c8c; font-size: 14px;">Data format may be incorrect or no data returned</p>
    `;
    mapContainerRef.current.appendChild(emptyDiv);
  }, []);
  
  // 将函数声明移到顶部，避免引用问题 - 显示错误地图状态
  const showErrorMapState = useCallback((errorMessage) => {
    if (!mapContainerRef.current) return;
    
    mapContainerRef.current.innerHTML = '';
    const errorDiv = document.createElement('div');
    errorDiv.style.display = 'flex';
    errorDiv.style.flexDirection = 'column';
    errorDiv.style.alignItems = 'center';
    errorDiv.style.justifyContent = 'center';
    errorDiv.style.height = '100%';
    errorDiv.style.padding = '20px';
    errorDiv.innerHTML = `
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path d="M32 56C45.2548 56 56 45.2548 56 32C56 18.7452 45.2548 8 32 8C18.7452 8 8 18.7452 8 32C8 45.2548 18.7452 56 32 56Z" stroke="#ff4d4f" stroke-width="2"/>
        <path d="M32 48V48.01" stroke="#ff4d4f" stroke-width="4" stroke-linecap="round"/>
        <path d="M32 40L32 24" stroke="#ff4d4f" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <p style="margin-top: 16px; color: #ff4d4f; font-size: 16px;">Error loading map</p>
      <p style="color: #8c8c8c; font-size: 14px;">${errorMessage || 'An error occurred while loading the map'}</p>
    `;
    mapContainerRef.current.appendChild(errorDiv);
  }, []);
  
  // Query with filters
  const { data: coachListData, isLoading, error, refetch } = useGetCoachListQuery(filters, {
    pollingInterval: 60000, // 每60秒自动刷新一次数据
    refetchOnFocus: true,   // 当页面重新获得焦点时刷新
    refetchOnReconnect: true // 网络重连时刷新
  });
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubscribeModalVisible, setIsSubscribeModalVisible] = useState(false);
  const [selectedCoachForSubscription, setSelectedCoachForSubscription] = useState(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [sendSubscription, { isLoading: isSubscribing }] = useSendSubscriptionRequestMutation();

  // 添加地图相关状态
  const { 
    data: locationInfo, 
    isLoading: isLoadingLocations, 
    error: locationError, 
    refetch: refetchLocationInfo 
  } = useGetCoachLocationInfoQuery(undefined, {
    skip: !isMapModalVisible, // 只有在地图弹窗显示时才请求数据
    // 添加数据转换处理，确保格式正确
    selectFromResult: (result) => {
      console.log('位置数据处理:', result);
      
      // 1. 确保有数据
      if (!result.data) {
        console.log('无位置数据');
        return { ...result, data: [] };
      }
      
      // 2. 确保数据是数组
      if (!Array.isArray(result.data)) {
        console.log('位置数据不是数组，尝试转换:', typeof result.data);
        
        try {
          // 如果数据是字符串，尝试解析JSON
          if (typeof result.data === 'string') {
            try {
              const parsed = JSON.parse(result.data);
              if (Array.isArray(parsed)) {
                console.log('成功将字符串解析为数组');
                return { ...result, data: parsed };
              }
            } catch (e) {
              console.error('解析字符串失败:', e);
            }
          }
          
          // 如果数据是对象，尝试转换为数组
          if (typeof result.data === 'object') {
            const asArray = Object.values(result.data);
            console.log('将对象转换为数组:', asArray);
            return { ...result, data: asArray };
          }
          
          console.log('无法转换位置数据，返回空数组');
          return { ...result, data: [] };
        } catch (error) {
          console.error('处理位置数据时出错:', error);
          return { ...result, data: [] };
        }
      }
      
      // 3. 数据验证：确保每个条目都有必要的字段
      const validData = result.data
        .filter(item => item && typeof item === 'object')
        .map(item => {
          // 尝试将字符串经纬度转为数字
          let latitude = item.latitude;
          let longitude = item.longitude;
          
          if (typeof latitude === 'string') {
            latitude = parseFloat(latitude);
          }
          
          if (typeof longitude === 'string') {
            longitude = parseFloat(longitude);
          }
          
          // 验证所有必需的字段
          if (
            typeof latitude === 'number' && !isNaN(latitude) &&
            typeof longitude === 'number' && !isNaN(longitude) &&
            typeof item.locationName === 'string'
          ) {
            return {
              ...item,
              latitude,
              longitude
            };
          }
          
          return null;
        })
        .filter(item => item !== null);
      
      console.log('有效位置数据数量:', validData.length);
      return { ...result, data: validData };
    }
  });

  // 添加调试信息，监控地图状态变化
  useEffect(() => {
    console.log('地图状态变化:', {
      isMapModalVisible,
      hasLocationData: !!locationInfo,
      locationDataCount: locationInfo?.length,
      isLoadingLocations,
      locationError,
      isMapLoaded
    });
    
    if (locationError) {
      console.error('获取位置数据错误:', locationError);
    }
    
    if (locationInfo) {
      console.log('获取到的位置数据:', locationInfo);
    }
  }, [isMapModalVisible, locationInfo, isLoadingLocations, locationError, isMapLoaded]);

  useEffect(() => {
    console.log('CoachList组件状态:', { 
      isLoading, 
      hasData: !!coachListData, 
      error: error?.message,
      coachCount: coachListData?.records?.length,
      currentFilters: filters
    });
  }, [coachListData, isLoading, error, filters]);

  // 添加事件监听器，当会员的请求状态变化时刷新教练列表
  useEffect(() => {
    // 定义刷新教练列表的处理函数
    const handleRefreshCoachList = () => {
      console.log('Refreshing coach list due to request status change...');
      refetch();
    };
    
    // 监听请求状态变化事件
    window.addEventListener('refresh-coach-status', handleRefreshCoachList);
    
    // 组件卸载时移除事件监听器
    return () => {
      window.removeEventListener('refresh-coach-status', handleRefreshCoachList);
    };
  }, [refetch]);

  // 修改谷歌地图加载处理函数
  useEffect(() => {
    if (isMapModalVisible) {
      // 调试信息：检查谷歌地图API状态
      console.log('谷歌地图API状态:', {
        windowExists: typeof window !== 'undefined',
        googleMapsLoaded: !!window.googleMapsLoaded,
        googleExists: !!window.google,
        googleMapsExists: !!(window.google && window.google.maps)
      });
      
      // 检查谷歌地图API是否已加载
      const checkGoogleMapsLoaded = () => {
        // 再次打印状态
        console.log('检查谷歌地图API:', {
          googleMapsLoaded: !!window.googleMapsLoaded,
          googleExists: !!window.google,
          googleMapsExists: !!(window.google && window.google.maps)
        });
        
        if (window.googleMapsLoaded && window.google) {
          console.log('谷歌地图API已加载');
          setIsMapLoaded(true);
          return;
        }
        
        // 检查是否存在script标签
        const existingScript = document.getElementById('google-maps-script');
        if (!existingScript) {
          console.log('添加谷歌地图API脚本');
          // 如果谷歌地图API脚本不存在，添加它
          window.initGoogleMaps = () => {
            console.log('谷歌地图API初始化完成');
            window.googleMapsLoaded = true;
            setIsMapLoaded(true);
          };
          
          const script = document.createElement('script');
          script.id = 'google-maps-script';
          // 使用Google Maps Web Components 
          script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&libraries=places&callback=initGoogleMaps&v=beta';
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        } else {
          setTimeout(checkGoogleMapsLoaded, 100);
        }
      };
      
      checkGoogleMapsLoaded();
    }
  }, [isMapModalVisible]);

  // 修改地图渲染处理函数
  useEffect(() => {
    if (isMapModalVisible && isMapLoaded && mapContainerRef.current) {
      console.log('尝试渲染地图:', {
        isMapLoaded,
        hasLocationData: !!locationInfo,
        locationDataCount: locationInfo?.length,
        locationData: locationInfo
      });

      // 清除之前的内容
      mapContainerRef.current.innerHTML = '';

      // 如果没有位置数据或数据有错，则显示空状态
      if (!locationInfo || !Array.isArray(locationInfo) || locationInfo.length === 0) {
        console.log('没有位置数据或数据格式不正确，显示空状态');
        showEmptyMapState();
        return;
      }

      try {
        // 检查位置数据是否包含必要的字段
        const validLocations = locationInfo.filter(loc => 
          loc && typeof loc === 'object' && 
          typeof loc.latitude === 'number' && 
          typeof loc.longitude === 'number' &&
          typeof loc.locationName === 'string'
        );

        if (validLocations.length === 0) {
          throw new Error('No valid location data found');
        }

        // 创建地图元素
        console.log('创建谷歌地图元素，有效位置数:', validLocations.length);
        
        // 使用Web Components API (与教练端保持一致)
        console.log('使用Google Maps Web Components API');
        const mapElement = document.createElement('gmp-map');
        mapElement.style.height = '500px';
        mapElement.style.width = '100%';
        mapElement.style.borderRadius = '8px';
        mapElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        mapElement.setAttribute('center', `${validLocations[0].latitude},${validLocations[0].longitude}`);
        mapElement.setAttribute('zoom', '12');
        mapElement.setAttribute('map-id', '8f348c95237d5e1a');
        
        // 为每个位置添加标记
        validLocations.forEach(location => {
          const marker = document.createElement('gmp-advanced-marker');
          marker.setAttribute('position', `${location.latitude},${location.longitude}`);
          marker.setAttribute('title', location.locationName);
          
          // 创建信息窗口内容
          const content = document.createElement('div');
          content.innerHTML = `
            <div style="padding: 8px; font-family: Arial, sans-serif;">
              <h3 style="margin: 0 0 8px 0;">${location.locationName}</h3>
              <p style="margin: 0;">Postcode: ${location.postcode || 'Not available'}</p>
            </div>
          `;
          
          // 尝试添加点击事件监听器以显示信息窗口
          marker.addEventListener('click', () => {
            try {
              if (window.google && window.google.maps) {
                const infoWindow = new window.google.maps.InfoWindow({
                  content: content,
                  ariaLabel: `Information about ${location.locationName}`
                });
                infoWindow.open(mapElement, marker);
              }
            } catch (err) {
              console.error('无法打开信息窗口:', err);
            }
          });

          mapElement.appendChild(marker);
        });
        
        // 将地图添加到容器
        mapContainerRef.current.appendChild(mapElement);
      } catch (error) {
        console.error('渲染地图时出错:', error);
        showErrorMapState(error.message || 'An error occurred while loading the map');
      }
    }
  }, [isMapModalVisible, isMapLoaded, locationInfo, showEmptyMapState, showErrorMapState]);

  // OSM备用地图加载函数修改为与教练端风格一致的备用方案
  const loadOSMFallbackMap = useCallback(() => {
    try {
      console.log('加载备用地图方案');
      
      // 清除容器内容
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
      }
      
      // 如果没有位置数据，显示空状态
      if (!locationInfo || !Array.isArray(locationInfo) || locationInfo.length === 0) {
        console.log('备用方案：没有位置数据');
        showEmptyMapState();
        return;
      }
      
      // 创建一个简单的地图替代方案
      const mapFallback = document.createElement('div');
      mapFallback.style.width = '100%';
      mapFallback.style.height = '500px';
      mapFallback.style.border = 'none';
      mapFallback.style.borderRadius = '8px';
      mapFallback.style.overflow = 'hidden';
      mapFallback.style.position = 'relative';
      mapFallback.style.backgroundColor = '#f0f2f5';
      mapFallback.style.padding = '24px';
      mapFallback.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      
      // 创建一个标题
      const title = document.createElement('h3');
      title.innerText = 'Training Locations';
      title.style.margin = '0 0 16px 0';
      title.style.fontWeight = '600';
      title.style.fontSize = '18px';
      title.style.color = '#1890ff';
      
      // 创建位置列表
      const locationList = document.createElement('div');
      locationList.style.display = 'grid';
      locationList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
      locationList.style.gap = '16px';
      
      // 添加每个位置卡片
      locationInfo.forEach((loc, index) => {
        const card = document.createElement('div');
        card.style.background = 'white';
        card.style.borderRadius = '8px';
        card.style.padding = '16px';
        card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        card.style.transition = 'all 0.3s ease';
        card.style.cursor = 'pointer';
        
        // 悬停效果
        card.onmouseover = () => {
          card.style.transform = 'translateY(-4px)';
          card.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
        };
        
        card.onmouseout = () => {
          card.style.transform = 'translateY(0)';
          card.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        };
        
        card.innerHTML = `
          <div style="display:flex; align-items:center; margin-bottom:12px;">
            <div style="width:40px; height:40px; display:flex; align-items:center; justify-content:center; 
                        background:#e6f7ff; border-radius:50%; margin-right:12px;">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="#1890ff" stroke-width="2" fill="none">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h4 style="margin:0; font-size:16px;">${loc.locationName}</h4>
          </div>
          <div style="margin-left:52px; color:#666; font-size:14px;">
            <p style="margin:4px 0;">Postcode: ${loc.postcode || 'Not available'}</p>
          </div>
        `;
        
        locationList.appendChild(card);
      });
      
      // 添加一个注释
      const note = document.createElement('div');
      note.style.marginTop = '20px';
      note.style.textAlign = 'center';
      note.style.fontSize = '13px';
      note.style.color = '#999';
      note.innerHTML = '地图显示功能暂时不可用，请查看上方位置列表';
      
      // 将所有元素添加到容器
      mapFallback.appendChild(title);
      mapFallback.appendChild(locationList);
      mapFallback.appendChild(note);
      
      if (mapContainerRef.current) {
        mapContainerRef.current.appendChild(mapFallback);
      }
      
      // 设置地图已加载状态
      setIsMapLoaded(true);
    } catch (error) {
      console.error('加载备用地图失败:', error);
      showErrorMapState('Failed to load location information');
    }
  }, [locationInfo, showEmptyMapState, showErrorMapState]);

  // 添加备用地图加载处理函数
  useEffect(() => {
    if (isMapModalVisible && !isMapLoaded && mapContainerRef.current) {
      // 如果Google Maps加载超时（5秒），尝试使用OSM地图作为备用
      const timeoutId = setTimeout(() => {
        if (!window.google || !window.google.maps) {
          console.log('Google地图加载超时，尝试使用OSM备用方案');
          loadOSMFallbackMap();
        }
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isMapModalVisible, isMapLoaded, loadOSMFallbackMap]);

  const handleCardClick = (coach) => {
    setSelectedCoach(coach);
    setIsModalVisible(true);
  };
  
  const handleFilterSubmit = (values) => {
    console.log('Filter form submitted:', values);
    setFilters({
      userName: values.userName || '',
      tags: values.tags || [],
      locations: values.locations || [],
    });
  };
  
  const handleResetFilters = () => {
    form.resetFields();
    setFilters({
      userName: '',
      tags: [],
      locations: [],
    });
  };

  const handleSubscribe = (coach) => {
    setSelectedCoachForSubscription(coach);
    setSubscriptionMessage('');
    setIsSubscribeModalVisible(true);
  };

  const handleSubscriptionSubmit = async () => {
    if (!subscriptionMessage.trim()) {
      message.error('Please enter a message for the coach');
      return;
    }

    try {
      const response = await sendSubscription({
        coachId: selectedCoachForSubscription.coachId,
        message: subscriptionMessage.trim()
      }).unwrap();

      if (response.code === 0) {
        message.success('Subscription request sent successfully');
        setIsSubscribeModalVisible(false);
        
        // 更新当前选中的教练状态为Pending
        if (selectedCoach && selectedCoach.coachId === selectedCoachForSubscription.coachId) {
          setSelectedCoach({
            ...selectedCoach,
            status: 'Pending'
          });
        }
        
        // 更新列表中的教练状态
        if (coachListData && coachListData.records) {
          const updatedRecords = coachListData.records.map(coach => {
            if (coach.coachId === selectedCoachForSubscription.coachId) {
              return { ...coach, status: 'Pending' };
            }
            return coach;
          });
          
          // 应用更新到本地状态
          const updatedData = { ...coachListData, records: updatedRecords };
          
          // 使用RTK Query的updateQueryData方法来更新缓存
          // 或者重新获取教练列表数据
          refetch();
        }
        
        setSubscriptionMessage('');
        setSelectedCoachForSubscription(null);
        
        // 触发事件，通知其他组件刷新请求列表
        window.dispatchEvent(new Event('refresh-requests'));
        // 同时刷新未读计数
        window.dispatchEvent(new Event('refresh-unread-count'));
      } else {
        message.error(response.msg || 'Failed to send subscription request');
      }
    } catch (error) {
      message.error(error.data?.msg || 'Failed to send subscription request');
    }
  };

  // 修改显示地图弹窗的处理函数
  const showMapModal = () => {
    console.log('点击了显示地图按钮');
    setIsMapModalVisible(true);
    setIsMapLoaded(false); // 重置地图加载状态
    
    // 强制重新获取位置数据
    try {
      console.log('主动触发位置数据请求');
      
      // 确保使用异步方式调用
      setTimeout(() => {
        if (refetchLocationInfo) {
          refetchLocationInfo()
            .then(result => {
              console.log('成功重新获取位置数据:', result?.data);
              
              // 检查数据有效性
              const hasValidData = 
                result?.data && 
                Array.isArray(result.data) && 
                result.data.length > 0;
                
              if (!hasValidData) {
                message.warning('No location data available');
              }
            })
            .catch(err => {
              console.error('获取位置数据失败:', err);
              message.error('Failed to load location data');
            });
        }
      }, 300);
    } catch (error) {
      console.error('请求位置数据出错:', error);
    }
  };

  // 添加关闭地图弹窗的处理函数
  const hideMapModal = () => {
    setIsMapModalVisible(false);
    setMapTitle('');
  };

  if (isLoading || isLoadingOptions) {
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
    <PageWrapper>
      <FilterCard>
        <div className="flex items-center mb-4">
          <h2 className="text-2xl font-semibold m-0 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Find Your Perfect Coach
          </h2>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilterSubmit}
          initialValues={{
            userName: filters.userName,
            tags: filters.tags,
            locations: filters.locations,
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item name="userName" label={<span className="text-gray-700">Coach Name</span>}>
                <Input 
                  placeholder="Search by name" 
                  prefix={<SearchOutlined className="text-gray-400" />}
                  className="rounded-lg" 
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="tags" label={<span className="text-gray-700">Specialties</span>}>
                <Select
                  mode="multiple"
                  placeholder="Select specialties"
                  options={filterOptions?.tags || []}
                  allowClear
                  maxTagCount={3}
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="locations" label={<span className="text-gray-700">Locations</span>}>
                <Select
                  mode="multiple"
                  placeholder="Select locations"
                  options={filterOptions?.locations || []}
                  allowClear
                  maxTagCount={3}
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end gap-3">
            <Button 
              onClick={handleResetFilters} 
              icon={<ClearOutlined />}
              className="rounded-lg hover:bg-gray-100 border border-gray-200"
            >
              Reset
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 border-0 hover:from-blue-600 hover:to-blue-700"
            >
              Apply Filters
            </Button>
          </div>
        </Form>
      </FilterCard>

      <Row gutter={[24, 24]} className="justify-center sm:justify-start">
        {coachListData.records.map((coach) => (
          <Col xs={24} sm={12} md={8} lg={6} key={coach.coachId}>
            <StyledCard
              hoverable
              onClick={() => handleCardClick(coach)}
              className="transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <CoachAvatar
                  size={100}
                  src={`http://127.0.0.1:8080${coach.photo}`}
                  icon={<UserOutlined />}
                />
                <h3 className="mt-4 mb-2 text-xl font-semibold">{coach.userName}</h3>
                <TagContainer>
                  {coach.tagNames?.map((tag, index) => (
                    <StyledTag key={index} color="green">
                      <TagOutlined />
                      {tag}
                    </StyledTag>
                  ))}
                </TagContainer>
              </div>
            </StyledCard>
          </Col>
        ))}
      </Row>

      <Modal
        title={null}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
        centered
        className="rounded-2xl overflow-hidden"
      >
        {selectedCoach && (
          <div className="space-y-8">
            <div className="text-center pb-8 border-b">
              <CoachAvatar
                size={120}
                src={selectedCoach && `http://127.0.0.1:8080${selectedCoach.photo}`}
                icon={<UserOutlined />}
                className="mb-6"
              />
              <h2 className="text-2xl font-bold mb-4">{selectedCoach?.userName}</h2>
              <p className="text-gray-500 text-base">{selectedCoach.intro || 'No introduction available'}</p>
              {selectedCoach.status === 'Normal' && (
                <Button
                  type="primary"
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe(selectedCoach);
                  }}
                >
                  Subscribe
                </Button>
              )}
              {selectedCoach.status === 'Pending' || selectedCoach.status === 'PENDING' ? (
                <Button
                  type="default"
                  className="mt-4"
                  disabled
                >
                  Pending
                </Button>
              ) : selectedCoach.status === 'Accept' || selectedCoach.status === 'ACCEPT' ? (
                <Button
                  type="primary"
                  className="mt-4 bg-green-500 hover:bg-green-600 border-green-500"
                  disabled
                >
                  Accepted
                </Button>
              ) : selectedCoach.status === 'Reject' || selectedCoach.status === 'REJECT' ? (
                <Button
                  type="primary"
                  className="mt-4 bg-red-500 hover:bg-red-600 border-red-500"
                  disabled
                >
                  Rejected
                </Button>
              ) : selectedCoach.status !== 'Normal' && (
                <Button
                  type="default"
                  className="mt-4"
                  disabled
                >
                  {selectedCoach.status}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                    <UserOutlined className="text-blue-500 text-lg" />
                    <span className="text-gray-500">Age:</span>
                    <span className="font-medium">{selectedCoach.age || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                    <MailOutlined className="text-blue-500 text-lg" />
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium truncate">{selectedCoach.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <TagOutlined className="text-blue-500 text-lg" />
                    <span className="font-semibold text-lg">Specialties</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {selectedCoach.tagNames?.map((tag, index) => (
                      <StyledTag key={index} color="green">
                        <TagOutlined />
                        <span>{tag}</span>
                      </StyledTag>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <EnvironmentOutlined className="text-blue-500 text-lg" />
                    <span className="font-semibold text-lg">Available Locations</span>
                    <Button 
                      type="link" 
                      size="small"
                      icon={<EnvironmentOutlined />}
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止事件冒泡
                        showMapModal();
                      }}
                    >
                      View Map
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {selectedCoach.locationNames?.map((location, index) => (
                      <StyledTag key={index} color="blue">
                        <EnvironmentOutlined />
                        <span>{location}</span>
                      </StyledTag>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Send Subscription Request"
        open={isSubscribeModalVisible}
        onCancel={() => setIsSubscribeModalVisible(false)}
        onOk={handleSubscriptionSubmit}
        okText="Send"
        confirmLoading={isSubscribing}
      >
        <Form layout="vertical">
          <Form.Item
            label="Message to Coach"
            required
            rules={[{ required: true, message: 'Please enter your message' }]}
          >
            <Input.TextArea
              value={subscriptionMessage}
              onChange={(e) => setSubscriptionMessage(e.target.value)}
              placeholder="Write a message to introduce yourself and explain why you'd like to train with this coach..."
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改位置地图弹窗样式 */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EnvironmentOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
              <span style={{ fontWeight: '600' }}>{mapTitle}</span>
            </div>
          </div>
        }
        open={isMapModalVisible}
        onCancel={hideMapModal}
        footer={null}
        width={800}
        centered
        bodyStyle={{ padding: '12px' }}
        className="map-modal"
      >
        {!isMapLoaded ? (
          <div style={{ 
            height: '500px', 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            background: 'rgba(240, 242, 245, 0.4)',
            borderRadius: '8px'
          }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#1890ff', fontWeight: '500' }}>Loading Map...</div>
          </div>
        ) : isLoadingLocations ? (
          <div style={{ 
            height: '500px', 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            background: 'rgba(240, 242, 245, 0.4)',
            borderRadius: '8px'
          }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#1890ff', fontWeight: '500' }}>Loading location data...</div>
          </div>
        ) : locationError ? (
          <div style={{ 
            height: '500px', 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            padding: '0 24px',
            background: 'rgba(240, 242, 245, 0.4)',
            borderRadius: '8px'
          }}>
            <Alert 
              type="error" 
              message="Error loading location data" 
              description={locationError?.message || 'Failed to load location data. Please try again.'}
              showIcon
              style={{ maxWidth: '400px', width: '100%' }}
            />
            <Button 
              onClick={refetchLocationInfo} 
              type="primary" 
              style={{ marginTop: '16px' }}
            >
              Retry
            </Button>
          </div>
        ) : (!locationInfo || locationInfo.length === 0) ? (
          <div style={{ 
            height: '500px', 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            background: 'rgba(240, 242, 245, 0.4)',
            borderRadius: '8px'
          }}>
            <Empty 
              description="No location data available" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div 
            ref={mapContainerRef}
            style={{ 
              height: '500px', 
              width: '100%',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          />
        )}
      </Modal>
    </PageWrapper>
  );
};

export default CoachList;