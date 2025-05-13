import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Modal, Spin, Tag, Alert, Empty, Avatar, Row, Col, Space, Form, Input, Select, Button, Divider, message, Tooltip } from 'antd';
import { useGetCoachListQuery, useGetCoachFilterOptionsQuery, useSendSubscriptionRequestMutation } from '../store/api/coachApi';
import { UserOutlined, EnvironmentOutlined, MailOutlined, TagOutlined, SearchOutlined, ClearOutlined, CalendarOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { Typography, Pagination } from 'antd';

// Add styled components
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

const MapModalStyles = `
.map-container {
  position: relative;
  width: 100%;
  height: 500px;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1;
}

.map-loading p {
  margin-top: 16px;
  color: #1890ff;
}

#map {
  height: 500px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.info-window {
  padding: 8px;
  max-width: 250px;
}

.info-window h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: bold;
}

.info-window p {
  margin: 0;
  font-size: 14px;
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
  
  // Get filter options
  const { data: filterOptions, isLoading: isLoadingOptions } = useGetCoachFilterOptionsQuery();
  
  // Add map related states
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapTitle, setMapTitle] = useState('');
  const [hasMapError, setHasMapError] = useState(false);
  const [mapErrorMessage, setMapErrorMessage] = useState('');
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [localLocationInfo, setLocalLocationInfo] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Move function declaration to the top to avoid reference issues - Show empty map state
  const showEmptyMapState = useCallback(() => {
    console.log('Showing empty map state');
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.innerHTML = '';
      
      const emptyState = document.createElement('div');
      emptyState.className = 'map-empty-state';
      emptyState.style.height = '100%';
      emptyState.style.display = 'flex';
      emptyState.style.flexDirection = 'column';
      emptyState.style.alignItems = 'center';
      emptyState.style.justifyContent = 'center';
      emptyState.style.backgroundColor = '#f5f5f5';
      emptyState.style.borderRadius = '8px';
      emptyState.style.padding = '24px';
      
      const icon = document.createElement('div');
      icon.style.fontSize = '48px';
      icon.style.color = '#bbb';
      icon.style.marginBottom = '16px';
      // Use location icon for empty state
      icon.innerHTML = '<svg viewBox="64 64 896 896" fill="currentColor" width="1em" height="1em" aria-hidden="true"><path d="M512 327c-29.9 0-58 11.6-79.2 32.8A111.6 111.6 0 00400 439c0 29.9 11.7 58 32.8 79.2A111.6 111.6 0 00512 551c29.9 0 58-11.7 79.2-32.8C612.4 497 624 469 624 439c0-29.9-11.6-58-32.8-79.2A111.6 111.6 0 00512 327zm0 160c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48z"></path><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path></svg>';
      
      const title = document.createElement('div');
      title.style.fontSize = '18px';
      title.style.fontWeight = 'bold';
      title.style.color = '#444';
      title.style.marginBottom = '8px';
      title.textContent = 'No Location Data';
      
      const text = document.createElement('div');
      text.style.fontSize = '14px';
      text.style.color = '#666';
      text.style.textAlign = 'center';
      text.textContent = 'This coach has not provided any location information yet.';
      
      emptyState.appendChild(icon);
      emptyState.appendChild(title);
      emptyState.appendChild(text);
      mapContainer.appendChild(emptyState);
    }
  }, []);
  
  // Move function declaration to the top to avoid reference issues - Show error map state
  const showErrorMapState = useCallback((errorMessage) => {
    console.log('Showing error map state:', errorMessage);
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.innerHTML = '';
      
      const errorState = document.createElement('div');
      errorState.className = 'map-error-state';
      errorState.style.height = '100%';
      errorState.style.display = 'flex';
      errorState.style.flexDirection = 'column';
      errorState.style.alignItems = 'center';
      errorState.style.justifyContent = 'center';
      errorState.style.backgroundColor = '#fff2f0';
      errorState.style.borderRadius = '8px';
      errorState.style.padding = '24px';
      
      const icon = document.createElement('div');
      icon.style.fontSize = '48px';
      icon.style.color = '#ff4d4f';
      icon.style.marginBottom = '16px';
      icon.innerHTML = '<svg viewBox="64 64 896 896" fill="currentColor" width="1em" height="1em" aria-hidden="true"><path d="M685.4 354.8c0-4.4-3.6-8-8-8l-66 .3L512 465.6l-99.3-118.4-66.1-.3c-4.4 0-8 3.5-8 8 0 1.9.7 3.7 1.9 5.2l130.1 155L340.5 670a8.32 8.32 0 00-1.9 5.2c0 4.4 3.6 8 8 8l66.1-.3L512 564.4l99.3 118.4 66 .3c4.4 0 8-3.5 8-8 0-1.9-.7-3.7-1.9-5.2L553.5 515l130.1-155c1.2-1.4 1.8-3.3 1.8-5.2z"></path><path d="M512 65C264.6 65 64 265.6 64 513s200.6 448 448 448 448-200.6 448-448S759.4 65 512 65zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path></svg>';
      
      const title = document.createElement('div');
      title.style.fontSize = '18px';
      title.style.fontWeight = 'bold';
      title.style.color = '#444';
      title.style.marginBottom = '8px';
      title.textContent = 'Error Loading Map';
      
      const message = document.createElement('div');
      message.style.fontSize = '14px';
      message.style.color = '#666';
      message.style.textAlign = 'center';
      message.textContent = errorMessage || 'Unable to load map data. Please try again later.';
      
      errorState.appendChild(icon);
      errorState.appendChild(title);
      errorState.appendChild(message);
      mapContainer.appendChild(errorState);
    }
  }, []);
  
  // Query with filters
  const { data: coachListData, isLoading, error, refetch } = useGetCoachListQuery(filters, {
    pollingInterval: 60000, // Poll data every 60 seconds
    refetchOnFocus: true,   // Refresh when page gets focus
    refetchOnReconnect: true // Refresh on network reconnection
  });
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubscribeModalVisible, setIsSubscribeModalVisible] = useState(false);
  const [selectedCoachForSubscription, setSelectedCoachForSubscription] = useState(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [sendSubscription, { isLoading: isSubscribing }] = useSendSubscriptionRequestMutation();

  // Add debug info, monitor map state changes
  useEffect(() => {
    console.log('Map state changes:', {
      isMapModalVisible,
      hasLocationData: !!localLocationInfo,
      locationDataCount: localLocationInfo?.length,
      isMapLoaded
    });
  }, [isMapModalVisible, localLocationInfo, isMapLoaded]);

  useEffect(() => {
    console.log('CoachList component state:', { 
      isLoading, 
      hasData: !!coachListData, 
      error: error?.message,
      coachCount: coachListData?.records?.length,
      currentFilters: filters
    });
  }, [coachListData, isLoading, error, filters]);

  // Add event listener to refresh coach list when member request status changes
  useEffect(() => {
    // Define function to handle coach list refresh
    const handleRefreshCoachList = () => {
      console.log('Refreshing coach list due to request status change...');
      refetch();
    };
    
    // Listen for request status change event
    window.addEventListener('refresh-coach-list', handleRefreshCoachList);
    
    // Remove event listener on component unmount
    return () => {
      window.removeEventListener('refresh-coach-list', handleRefreshCoachList);
    };
  }, [refetch]);

  // Modify Google Maps loading handler
  useEffect(() => {
    if (!isMapModalVisible) return;
    
    // 重置错误状态
    setHasMapError(false);
    setMapErrorMessage('');
    setIsMapLoading(true);

    // 如果已经加载了Google Maps，直接初始化地图
      if (window.google && window.google.maps) {
        console.log('Google Maps API already loaded');
        setIsMapLoaded(true);
      setIsMapLoading(false);
      return;
      }
      
    // 检查是否已经有脚本标签
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // 如果已存在脚本标签但尚未加载完成
      console.log('Google Maps script tag already exists');
      
      // 检查Google是否已加载
      const checkGoogleMapsLoaded = () => {
        if (window.google && window.google.maps) {
          console.log('Google Maps detected from existing script');
          setIsMapLoaded(true);
          setIsMapLoading(false);
          return true;
        }
        return false;
      };
      
      // 立即检查一次
      if (!checkGoogleMapsLoaded()) {
        // 如果尚未加载完成，使用一个轮询计时器
        let attempts = 0;
        const maxAttempts = 20; // 最多尝试20次，约10秒
        const timer = setInterval(() => {
          if (checkGoogleMapsLoaded() || attempts >= maxAttempts) {
            clearInterval(timer);
            if (attempts >= maxAttempts) {
              console.error('Google Maps failed to load after multiple attempts');
              setHasMapError(true);
              setMapErrorMessage('Maps API failed to load after multiple attempts. Please try again.');
              setIsMapLoading(false);
            }
          }
          attempts++;
        }, 500);
        
        // 组件卸载时清理计时器
        return () => clearInterval(timer);
      }
      return;
    }

    // 创建初始化回调
    window.initGoogleMap = () => {
      console.log('Google Maps API loaded successfully');
      setIsMapLoaded(true);
      setIsMapLoading(false);
    };

    // 创建错误回调
    window.gm_authFailure = () => {
      console.error('Google Maps authentication failed. Check your API key.');
      setHasMapError(true);
      setMapErrorMessage('Google Maps authentication failed. Please check your API key or network connection.');
      setIsMapLoading(false);
    };

    // 加载脚本
    console.log('Loading Google Maps script');
        const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&callback=initGoogleMap`;
        script.async = true;
        script.defer = true;
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      setHasMapError(true);
      setMapErrorMessage('Failed to load Google Maps. Please check your network connection.');
      setIsMapLoading(false);
    };
        document.head.appendChild(script);
        
    // 设置超时
    const timeout = setTimeout(() => {
          if (!window.google || !window.google.maps) {
        console.warn('Google Maps loading timed out');
        setHasMapError(true);
        setMapErrorMessage('Maps loading timed out. Please try again.');
        setIsMapLoading(false);
          }
    }, 10000); // 10秒超时
      
    // 清理函数
    return () => {
      clearTimeout(timeout);
      window.initGoogleMap = undefined;
    };
  }, [isMapModalVisible]);
    
  // 修改地图渲染函数
  const renderMap = useCallback(() => {
    // 在渲染地图之前，确保清除之前的错误状态
    if (hasMapError) {
      setHasMapError(false);
      setMapErrorMessage('');
    }

    if (!isMapModalVisible || !isMapLoaded) {
      console.log('Map cannot be rendered - modal not visible or maps not loaded');
        return;
      }
      
    console.log('Rendering map with location info:', localLocationInfo);
    
    // 检查是否有地点数据
    if (!localLocationInfo || !Array.isArray(localLocationInfo) || localLocationInfo.length === 0) {
      console.log('No location data available for map display');
      showEmptyMapState();
      return;
    }
      
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }
    
    try {
      // 先清理任何现有的标记
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }

      // 创建新的地图实例
      const map = new window.google.maps.Map(mapContainer, {
        zoom: 12,
        center: { lat: 0, lng: 0 },
        mapId: '8f348c95237d5e1a',
        fullscreenControl: true,
        streetViewControl: true,
        mapTypeControl: true,
        zoomControl: true
      });
      
      mapRef.current = map;

      // 创建边界以便自动缩放
      const bounds = new window.google.maps.LatLngBounds();
      
      // 为每个位置添加标记
      localLocationInfo.forEach(location => {
        // 支持不同的位置数据格式
        const lat = parseFloat(location.latitude || location.lat || 0);
        const lng = parseFloat(location.longitude || location.lng || 0);
        
        // 验证坐标有效性
        if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
          console.warn('Invalid coordinates for location:', location);
      return;
    }
    
        const position = { lat, lng };
        
        // 添加到边界
        bounds.extend(position);
      
        // 创建标记
        const marker = new window.google.maps.Marker({
          position: position,
          map: map,
          title: location.locationName || location.title || mapTitle || 'Location'
        });
        
        // 添加信息窗口
        const infowindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px;">
              <h3 style="margin-top: 0; margin-bottom: 8px; color: #1890ff;">${location.locationName || location.title || 'Location'}</h3>
              <p style="margin: 0; color: #666;">Postcode: ${location.postcode || 'Not available'}</p>
            </div>
          `
        });
        
        // 添加点击事件
        marker.addListener('click', () => {
          infowindow.open(map, marker);
      });
      
        // 保存标记引用
        markersRef.current.push(marker);
      });
      
      // 调整地图以显示所有标记
      if (markersRef.current.length > 0) {
        map.fitBounds(bounds);
      
        // 如果只有一个标记，设置一个适当的缩放级别
        if (markersRef.current.length === 1) {
          map.setZoom(14);
        }
      }
      
      console.log('Map rendered successfully with', markersRef.current.length, 'markers');
    } catch (error) {
      console.error('Error rendering map:', error);
      setHasMapError(true);
      setMapErrorMessage(`Error initializing map: ${error.message}`);
      }
  }, [isMapModalVisible, isMapLoaded, localLocationInfo, mapTitle]);

  // 当状态变化时渲染地图
  useEffect(() => {
    if (isMapModalVisible && isMapLoaded && localLocationInfo) {
      renderMap();
    }
  }, [isMapModalVisible, isMapLoaded, localLocationInfo, renderMap]);

  // 重构showMapModal函数
  const showMapModal = (coach, index) => {
    console.log('Coach data for map:', coach);
    
    // 获取教练ID，确保有效
    const coachId = coach?.coachId;
    if (!coachId) {
      console.error('No coach ID provided for map');
      message.error('Could not retrieve coach information');
      return;
    }
    
    // 首先重置所有状态
    setHasMapError(false);
    setMapErrorMessage('');
    setIsMapLoading(true);
    setIsMapLoaded(false); 
    
    // 设置地图标题
    const coachName = coach?.userName || `${coach?.lastName || ''} ${coach?.firstName || ''}`;
    setMapTitle(coachName.trim() || 'Coach Location');
    
    // 清除本地位置信息
    setLocalLocationInfo(null);
    
    // 显示模态框
    setIsMapModalVisible(true);
    
    // 确保在模态框显示后再加载地图
    setTimeout(() => {
      console.log('Fetching location data for coach:', coachId);
      
      // 修改fetch请求，使用正确的API基础URL
      const apiBaseUrl = 'http://127.0.0.1:8080'; // 后端API服务器地址
      const apiUrl = `${apiBaseUrl}/member/location/info/${coachId}?_t=${Date.now()}&r=${Math.random()}`;
      console.log('Fetching from URL:', apiUrl);

      // 添加错误处理和请求日志
      console.log('Sending request to backend API server');

      // 从localStorage获取token
      const token = localStorage.getItem('token');
      console.log('Using token for request:', token ? 'Token found' : 'No token available');
      
      fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Accept': 'application/json', // 明确要求JSON响应
          'Authorization': token ? `Bearer ${token}` : '', // 添加Bearer认证头
          'token': token || '' // 保留旧的token头用于兼容性
        },
        credentials: 'same-origin' // 确保发送cookies
      })
      .then(response => {
        // 检查响应格式并记录
        const contentType = response.headers.get('content-type');
        console.log('Response content type:', contentType);
        
        if (!response.ok) {
          throw new Error(`Network error: ${response.status} ${response.statusText}`);
        }
        
        // 检查是否返回HTML而不是JSON
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Received HTML response instead of JSON. API endpoint may be incorrect.');
        }
        
        return response.text().then(text => {
          // 尝试解析JSON，但首先记录响应内容以便调试
          console.log('Response text (first 100 chars):', text.substring(0, 100));
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error('Failed to parse JSON response:', e);
            throw new Error(`Invalid JSON response: ${e.message}`);
          }
        });
      })
      .then(data => {
        console.log('API response for location data:', data);
        setIsMapLoading(false);
        
        if (!data || data.code !== 0) {
          // 处理API错误
          console.error('API error:', data?.msg || 'Unknown error');
          setHasMapError(true);
          setMapErrorMessage(data?.msg || 'Failed to fetch location data');
          return;
        }
        
        // 处理空数据情况
        if (!data.data || (Array.isArray(data.data) && data.data.length === 0)) {
          console.log('No location data available for this coach');
          // 不再将其设置为错误，而是显示空状态
          setIsMapLoading(false);
          setHasMapError(false);
          // 在下一个渲染周期调用showEmptyMapState
          setTimeout(() => {
            showEmptyMapState();
          }, 0);
          return;
        }
        
        // 处理数据格式
        let locationData;
        if (Array.isArray(data.data)) {
          locationData = [...data.data]; // 创建副本避免引用问题
        } else if (typeof data.data === 'object') {
          locationData = Object.values(data.data);
        } else {
          console.error('Unexpected data format:', data.data);
          setHasMapError(true);
          setMapErrorMessage('Received invalid location data format');
          return;
        }
        
        // 数据验证与处理
        console.log('Processing location data:', locationData);
        
        const validLocationData = locationData
          .filter(loc => loc && typeof loc === 'object')
          .map(loc => {
            // 确保经纬度是数字
            let lat = loc.latitude;
            let lng = loc.longitude;
            
            if (typeof lat === 'string') lat = parseFloat(lat);
            if (typeof lng === 'string') lng = parseFloat(lng);
            
            return {
              ...loc,
              latitude: lat,
              longitude: lng
            };
          })
          .filter(loc => 
            typeof loc.latitude === 'number' && !isNaN(loc.latitude) && 
            typeof loc.longitude === 'number' && !isNaN(loc.longitude) &&
            Math.abs(loc.latitude) <= 90 && Math.abs(loc.longitude) <= 180 // 基本经纬度验证
          );
        
        if (validLocationData.length > 0) {
          console.log('Valid location data count:', validLocationData.length);
          setLocalLocationInfo(validLocationData);
          setHasMapError(false);
        } else {
          console.error('No valid coordinates found in response data');
          setHasMapError(true);
          setMapErrorMessage('No valid location coordinates available');
        }
      })
      .catch(error => {
        console.error('Error fetching location data:', error);
        setIsMapLoading(false);
        setHasMapError(true);
        setMapErrorMessage(`Error fetching location data: ${error.message}`);
      });
    }, 100);
  };

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
        
        // Update current selected coach status to Pending
        if (selectedCoach && selectedCoach.coachId === selectedCoachForSubscription.coachId) {
          setSelectedCoach({
            ...selectedCoach,
            status: 'Pending'
          });
        }
        
        // Update coach status in list
        if (coachListData && Array.isArray(coachListData)) {
          const updatedRecords = coachListData.records.map(coach => {
            if (coach.coachId === selectedCoachForSubscription.coachId) {
              return { ...coach, status: 'Pending' };
            }
            return coach;
          });
          
          // Apply update to local state
          const updatedData = { ...coachListData, records: updatedRecords };
          
          // Use RTK Query's updateQueryData method to update cache
          refetch();
        }
        
        setSubscriptionMessage('');
        setSelectedCoachForSubscription(null);
        
        // Trigger event to notify other components to refresh request lists
        window.dispatchEvent(new Event('refresh-subscription-requests'));
        // Also refresh unread count
        window.dispatchEvent(new Event('refresh-unread-count'));
      } else {
        message.error(response.msg || 'Failed to send subscription request');
      }
    } catch (error) {
      message.error(error.data?.msg || 'Failed to send subscription request');
    }
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
                        e.stopPropagation(); // Prevent event bubbling
                        showMapModal(selectedCoach, coachListData.records.indexOf(selectedCoach));
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

      {/* 修改地图模态框组件的渲染条件判断 */}
      <Modal
        title="Training Locations Map"
        open={isMapModalVisible}
        onCancel={() => {
          // 清理地图资源
          if (markersRef.current.length > 0) {
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];
          }
          mapRef.current = null;
          setIsMapModalVisible(false);
        }}
        footer={null}
        width={800}
      >
        {isMapLoading ? (
          <div style={{ 
            height: '500px', 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#f0f2f5',
            borderRadius: '8px'
          }}>
            <Spin size="large">
              <div style={{ height: '100px', width: '100px', textAlign: 'center', marginTop: '30px' }}>
                <div style={{ marginTop: '15px', color: '#1890ff' }}>Loading Google Maps...</div>
          </div>
            </Spin>
          </div>
        ) : hasMapError && !localLocationInfo ? (
          // 只在确实存在错误且没有位置数据时才显示错误界面
          <div style={{ 
            height: '500px', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#f0f2f5',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '24px', color: '#ff4d4f', marginBottom: '16px' }}>
              <span role="img" aria-label="warning">⚠️</span> Map Error
            </div>
            <p style={{ textAlign: 'center', maxWidth: '400px', color: '#666' }}>
              {mapErrorMessage || 'An error occurred while loading the map. Please try again later.'}
            </p>
            <Button 
              type="primary" 
              onClick={() => {
                setHasMapError(false);
                setIsMapLoaded(false);
                setIsMapLoading(true);
                setTimeout(() => {
                  if (window.google && window.google.maps) {
                    setIsMapLoaded(true);
                    setIsMapLoading(false);
                  } else if (window.initGoogleMap) {
                    window.initGoogleMap();
                  }
                }, 500);
              }}
              style={{ marginTop: '16px' }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div id="map" style={{ height: '500px', width: '100%', borderRadius: '8px' }}></div>
        )}
      </Modal>

      <style>{MapModalStyles}</style>
    </PageWrapper>
  );
};

export default CoachList;