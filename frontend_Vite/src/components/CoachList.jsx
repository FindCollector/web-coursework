import React, { useState, useEffect, useCallback } from 'react';
import { Card, Modal, Spin, Tag, Alert, Empty, Avatar, Row, Col, Space, Form, Input, Select, Button, Divider, message, Tooltip } from 'antd';
import { useGetCoachListQuery, useGetCoachFilterOptionsQuery, useSendSubscriptionRequestMutation } from '../store/api/coachApi';
import { useGetCoachLocationInfoQuery } from '../store/api/memberApi';
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
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapError, setMapError] = useState('');

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
      
      const icon = document.createElement('div');
      icon.style.fontSize = '48px';
      icon.style.color = '#ccc';
      icon.style.marginBottom = '16px';
      icon.innerHTML = '<svg viewBox="64 64 896 896" fill="currentColor" width="1em" height="1em" aria-hidden="true"><path d="M955.7 856l-416-720c-6.2-10.7-16.9-16-27.7-16s-21.6 5.3-27.7 16l-416 720C56 877.4 71.4 904 96 904h832c24.6 0 40-26.6 27.7-48zm-783.5-27.9L512 272l339.8 556.1H172.2z"></path><path d="M512 640m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0z"></path><path d="M512 766c-16.5 0-30 13.5-30 30s13.5 30 30 30 30-13.5 30-30-13.5-30-30-30z"></path></svg>';
      
      const text = document.createElement('div');
      text.style.fontSize = '16px';
      text.style.color = '#888';
      text.textContent = 'No location data available';
      
      emptyState.appendChild(icon);
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

  // Add map related states
  const { 
    data: locationInfo, 
    isLoading: isLoadingLocations, 
    error: locationError, 
    refetch: refetchLocationInfo 
  } = useGetCoachLocationInfoQuery(undefined, {
    skip: !isMapModalVisible, // Only request data when map modal is visible
    // Add data transformation to ensure correct format
    selectFromResult: (result) => {
      console.log('Location data processing:', result);
      
      // 1. Ensure data exists
      if (!result.data) {
        console.log('No location data');
        return { ...result, data: [] };
      }
      
      // 2. Ensure data is an array
      if (!Array.isArray(result.data)) {
        console.log('Location data is not an array, attempting conversion:', typeof result.data);
        
        try {
          // If data is a string, try to parse as JSON
          if (typeof result.data === 'string') {
            try {
              const parsed = JSON.parse(result.data);
              if (Array.isArray(parsed)) {
                console.log('Successfully parsed string to array');
                return { ...result, data: parsed };
              }
            } catch (e) {
              console.error('Failed to parse string:', e);
            }
          }
          
          // If data is an object, try to convert to array
          if (typeof result.data === 'object') {
            const asArray = Object.values(result.data);
            console.log('Converting object to array:', asArray);
            return { ...result, data: asArray };
          }
          
          console.log('Cannot convert location data, returning empty array');
          return { ...result, data: [] };
        } catch (error) {
          console.error('Error processing location data:', error);
          return { ...result, data: [] };
        }
      }
      
      // 3. Data validation: ensure each entry has necessary fields
      const validData = result.data
        .filter(item => item && typeof item === 'object')
        .map(item => {
          // Try to convert string lat/lng to numbers
          let latitude = item.latitude;
          let longitude = item.longitude;
          
          if (typeof latitude === 'string') {
            latitude = parseFloat(latitude);
          }
          
          if (typeof longitude === 'string') {
            longitude = parseFloat(longitude);
          }
          
          // Validate all required fields
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
      
      console.log('Valid location data count:', validData.length);
      return { ...result, data: validData };
    }
  });

  // Add debug info, monitor map state changes
  useEffect(() => {
    console.log('Map state changes:', {
      isMapModalVisible,
      hasLocationData: !!locationInfo,
      locationDataCount: locationInfo?.length,
      isLoadingLocations,
      locationError,
      isMapLoaded
    });
    
    if (locationError) {
      console.error('Error getting location data:', locationError);
    }
    
    if (locationInfo) {
      console.log('Location data retrieved:', locationInfo);
    }
  }, [isMapModalVisible, locationInfo, isLoadingLocations, locationError, isMapLoaded]);

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
    // 只在地图模态框可见时执行
    if (!isMapModalVisible) return;
    
    console.log('Map modal visible, checking Google Maps status');
    
    // 如果Google Maps API已加载，设置状态
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      setIsMapLoaded(true);
      return;
    }
    
    // 检查脚本标签是否存在
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    
    if (existingScript) {
      console.log('Google Maps script tag exists, waiting for it to load');
      // 脚本标签已存在，等待加载完成
      return;
    }
    
    // 创建全局初始化回调
    window.initMap = () => {
      console.log('Google Maps API initialization complete');
      window.googleMapsLoaded = true;
      setIsMapLoaded(true);
    };
    
    // 添加新的脚本标签
    console.log('Adding Google Maps API script');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&v=beta&libraries=maps&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    
    // 清理函数
    return () => {
      // 不要移除脚本标签，但可以清理回调
      if (!window.googleMapsLoaded) {
        window.initMap = () => {
          window.googleMapsLoaded = true;
        };
      }
    };
  }, [isMapModalVisible]);

  // 先定义renderMap函数，放在useEffect之前
  // Modify map rendering function
  const renderMap = useCallback(() => {
    if (!isMapModalVisible || !isMapLoaded) {
      console.log('Map cannot be rendered - modal not visible or maps not loaded');
      return;
    }

    console.log('Rendering map with location info:', locationInfo);
    
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      try {
        // 获取地图容器
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
          console.error('Map container not found - will retry in 500ms');
          // Retry after a delay
          setTimeout(() => renderMap(), 500);
          return;
        }

        // 如果没有位置信息或发生错误，显示相应状态
        if (mapError) {
          showErrorMapState(mapError);
          return;
        }
        
        if (!locationInfo || (Array.isArray(locationInfo) && locationInfo.length === 0)) {
          showEmptyMapState();
          return;
        }

        // Clear container first
        mapContainer.innerHTML = '';

        // 创建地图实例
        const map = new window.google.maps.Map(mapContainer, {
          zoom: 15,
          center: { lat: 0, lng: 0 },
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          },
          fullscreenControl: true
        });

        // 根据位置信息类型处理 (可能是数组或单个对象)
        const locations = Array.isArray(locationInfo) ? locationInfo : [locationInfo];
        
        if (locations.length === 0) {
          showEmptyMapState();
          return;
        }

        // 创建边界对象来计算合适的缩放级别
        const bounds = new window.google.maps.LatLngBounds();
        
        // 添加所有位置的标记
        locations.forEach((location, index) => {
          if (!location || !location.latitude || !location.longitude) {
            console.warn('Invalid location data:', location);
            return;
          }
          
          const position = {
            lat: parseFloat(location.latitude),
            lng: parseFloat(location.longitude)
          };
          
          // 添加标记
          const marker = new window.google.maps.Marker({
            position,
            map,
            title: location.title || mapTitle || `Location ${index + 1}`
          });
          
          // 扩展边界以包含此标记
          bounds.extend(position);
          
          // 添加点击信息窗口
          const infoContent = `<div class="info-window">
            <h3>${location.title || location.locationName || mapTitle || 'Location'}</h3>
            <p>${location.address || location.postcode || ''}</p>
          </div>`;
          
          const infoWindow = new window.google.maps.InfoWindow({
            content: infoContent
          });
          
          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        });
        
        // 调整地图视图以包含所有标记
        if (locations.length > 0) {
          map.fitBounds(bounds);
          
          // 如果只有一个位置，设置适当的缩放级别
          if (locations.length === 1) {
            map.setZoom(15);
          }
        }
        
        console.log('Map rendered successfully with', locations.length, 'locations');
      } catch (error) {
        console.error('Error rendering map:', error);
        showErrorMapState(error.message);
      }
    }, 100); // Small delay to ensure DOM is ready
  }, [isMapModalVisible, isMapLoaded, locationInfo, mapTitle, mapError, showEmptyMapState, showErrorMapState]);

  // 新增useEffect，处理地图渲染
  useEffect(() => {
    if (!isMapModalVisible || !isMapLoaded || !locationInfo) return;
    
    console.log('Maps API loaded and modal visible - rendering map');
    renderMap();
  }, [isMapModalVisible, isMapLoaded, locationInfo, renderMap]);

  // 清理loadFallbackMap函数
  const loadFallbackMap = useCallback(() => {
    // 如果没有位置信息，显示空状态
    if (!locationInfo || !Array.isArray(locationInfo) || locationInfo.length === 0) {
      console.log('Fallback: No location data');
      showEmptyMapState();
      return;
    }
    
    // 获取地图容器
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container not found for fallback');
      return;
    }
    
    // 清空现有内容
    mapContainer.innerHTML = '';
    
    // 创建简单的地图替代界面
    // 创建标题
    const title = document.createElement('h3');
    title.innerText = 'Training Locations';
    title.style.margin = '0 0 16px 0';
    title.style.fontWeight = '600';
    title.style.fontSize = '18px';
    title.style.color = '#1890ff';
    
    // 创建位置列表
    const locationsList = document.createElement('div');
    locationsList.style.display = 'grid';
    locationsList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    locationsList.style.gap = '16px';
    
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
      
      const locationName = loc.locationName || loc.title || `Location ${index + 1}`;
      const postcode = loc.postcode || 'Not available';
      
      card.innerHTML = `
        <div style="display:flex; align-items:center; margin-bottom:12px;">
          <div style="width:40px; height:40px; display:flex; align-items:center; justify-content:center; 
                      background:#e6f7ff; border-radius:50%; margin-right:12px;">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="#1890ff" stroke-width="2" fill="none">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h4 style="margin:0; font-size:16px;">${locationName}</h4>
        </div>
        <div style="margin-left:52px; color:#666; font-size:14px;">
          <p style="margin:4px 0;">Location info: ${loc.address || postcode || 'Not available'}</p>
        </div>
      `;
      
      locationsList.appendChild(card);
    });
    
    // 添加注释
    const note = document.createElement('div');
    note.style.marginTop = '20px';
    note.style.textAlign = 'center';
    note.style.fontSize = '13px';
    note.style.color = '#999';
    note.innerHTML = 'Map display function temporarily unavailable, please check location list above';
    
    // 添加所有元素到容器
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
    
    mapFallback.appendChild(title);
    mapFallback.appendChild(locationsList);
    mapFallback.appendChild(note);
    
    // 添加到地图容器
    mapContainer.appendChild(mapFallback);
    
    // 设置地图加载状态
    setIsMapLoaded(true);
  }, [locationInfo, showEmptyMapState]);

  // 修改地图加载时的中文提示为英文
  useEffect(() => {
    // 如果地图加载超时（5秒），尝试使用替代方案
    let timeoutId;
    
    if (isMapModalVisible && !isMapLoaded) {
      console.log('Map loading timeout monitoring started');
      
      // 设置超时
      timeoutId = setTimeout(() => {
        console.log('Map loading timed out, switching to fallback display');
        if (!isMapLoaded) {
          loadFallbackMap();
        }
      }, 5000);
    }
    
    // 清理超时
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isMapModalVisible, isMapLoaded, loadFallbackMap]);

  // 添加额外的调试代码来检查RTK Query返回的数据结构
  useEffect(() => {
    if (locationInfo) {
      console.log('Location information from RTK Query:', locationInfo);
      if (Array.isArray(locationInfo)) {
        locationInfo.forEach((loc, index) => {
          console.log(`Location ${index} details:`, loc);
        });
      }
    }
  }, [locationInfo]);

  // Update current selected coach status to Pending
  const updateLocalCoachStatus = useCallback((coachId) => {
    if (!coachId) return;
    
    // Update coach status in list
    if (coachListData && Array.isArray(coachListData)) {
      // ... existing code ...
      
      // Apply update to local state
      // Use RTK Query's updateQueryData method to update cache
      // Or refetch coach list data
      refetch();
    }
    
    // Trigger event to notify other components to refresh request lists
    window.dispatchEvent(new Event('refresh-subscription-requests'));
    
    // Also refresh unread count
    window.dispatchEvent(new Event('refresh-unread-count'));
  }, [coachListData, refetch]);
  
  // Modify function to show map modal
  const showMapModal = (coach, index) => {
    console.log('Coach data for map:', coach);
    
    // 设置地图标题
    const coachName = coach?.userName || `${coach?.lastName || ''} ${coach?.firstName || ''}`;
    setMapTitle(coachName.trim() || 'Coach Location');
    setMapError(''); // 清除之前的错误
    
    // 检查是否已有该教练的位置信息
    if (coach.location) {
      console.log('Using existing location data:', coach.location);
      setLocationInfo(coach.location);
      setIsMapModalVisible(true);
      return;
    }
    
    // 显示地图模态框，但先标记为加载中
    setIsMapModalVisible(true);
    setIsMapLoading(true);
    
    // Don't use refetch directly, as it might not be initialized yet
    // Instead, use the existing locationInfo if available
    if (locationInfo && Array.isArray(locationInfo) && locationInfo.length > 0) {
      console.log('Using existing location data from RTK Query:', locationInfo);
      setIsMapLoading(false);
      // The useEffect will handle rendering once isMapModalVisible is true
    } else {
      // If not available, try to extract from coach object
      try {
        console.log('No RTK Query data, extracting from coach object:', coach);
        
        // 尝试从coach对象的不同属性提取位置数据
        let locationData = [];
        
        // 方法1: 检查是否有locations数组
        if (coach.locations && Array.isArray(coach.locations) && coach.locations.length > 0) {
          locationData = coach.locations.map((loc, idx) => ({
            title: coach.locationNames?.[idx] || `Location ${idx + 1}`,
            locationName: coach.locationNames?.[idx] || `Location ${idx + 1}`,
            latitude: parseFloat(loc.latitude) || 0,
            longitude: parseFloat(loc.longitude) || 0,
            address: loc.address || ''
          }));
          console.log('Extracted location data from coach.locations:', locationData);
        } 
        // 方法2: 检查是否有locationNames数组和locationIds数组
        else if (coach.locationNames && Array.isArray(coach.locationNames) && 
                coach.locationIds && Array.isArray(coach.locationIds) &&
                coach.locationNames.length > 0) {
          
          locationData = coach.locationNames.map((name, idx) => ({
            id: coach.locationIds[idx],
            title: name,
            locationName: name,
            latitude: coach.locationLatitudes?.[idx] || 0,
            longitude: coach.locationLongitudes?.[idx] || 0,
            address: coach.locationAddresses?.[idx] || ''
          }));
          console.log('Extracted location data from coach arrays:', locationData);
        }
        
        if (locationData.length > 0) {
          // 过滤无效数据
          const validLocationData = locationData.filter(loc => 
            loc && 
            ((typeof loc.latitude === 'number' && !isNaN(loc.latitude) && 
            typeof loc.longitude === 'number' && !isNaN(loc.longitude)) ||
            (loc.id)) // 保留有ID的位置，因为可能后面会通过ID查询详情
          );
          
          if (validLocationData.length > 0) {
            console.log('Final valid location data from coach:', validLocationData);
            setLocationInfo(validLocationData);
          } else {
            console.error('No valid coordinates in extracted location data');
            setMapError('No valid location coordinates available');
          }
        } else {
          console.error('Could not extract location data from coach');
          setMapError('No location data available for this coach');
        }
      } catch (error) {
        console.error('Error processing coach location data:', error);
        setMapError('Unable to process location data');
      } finally {
        setIsMapLoading(false);
      }
    }
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

      {/* Modify location map modal style */}
      <Modal
        title={mapTitle || "Map"}
        open={isMapModalVisible}
        onCancel={() => setIsMapModalVisible(false)}
        footer={null}
        width={800}
      >
        <div className="map-container">
          {isMapLoading ? (
            <div className="map-loading">
              <Spin size="large" />
              <p>Loading map...</p>
            </div>
          ) : (
            <div id="map" style={{ height: '500px', width: '100%', border: '1px solid #eee' }}></div>
          )}
        </div>
      </Modal>

      <style>{MapModalStyles}</style>
    </PageWrapper>
  );
};

export default CoachList;