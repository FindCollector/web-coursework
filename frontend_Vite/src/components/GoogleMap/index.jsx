import { useEffect, useRef, useState } from 'react';
import { Modal, Spin } from 'antd';
import PropTypes from 'prop-types';

const GoogleMap = ({ 
  locations,
  isModal = false,
  visible = false,
  onClose,
  title = "Location Map",
  modalProps = {},
  mapProps = {},
  style = {}
}) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapContainerRef = useRef(null);

  // Default map props
  const defaultMapProps = {
    mapId: '8f348c95237d5e1a',
    zoom: 12,
    ...mapProps
  };

  // Check if Google Maps API is loaded
  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      if (window.googleMapsLoaded && window.google) {
        setIsMapLoaded(true);
        return;
      }
      setTimeout(checkGoogleMapsLoaded, 100);
    };

    if (!isModal || visible) {
      checkGoogleMapsLoaded();
    }
  }, [isModal, visible]);

  // Initialize map and markers
  useEffect(() => {
    const shouldInitMap = (isModal && visible && isMapLoaded) || (!isModal && isMapLoaded);
    
    if (shouldInitMap && locations.length > 0 && mapContainerRef.current) {
      // Clear previous content
      mapContainerRef.current.innerHTML = '';

      // Create map element
      const mapElement = document.createElement('gmp-map');
      Object.assign(mapElement.style, {
        height: '100%',
        width: '100%',
        borderRadius: '8px',
        ...style
      });

      // Set map attributes
      mapElement.setAttribute('center', `${locations[0].latitude},${locations[0].longitude}`);
      mapElement.setAttribute('zoom', defaultMapProps.zoom.toString());
      mapElement.setAttribute('map-id', defaultMapProps.mapId);

      // Add markers for each location
      locations.forEach(location => {
        const marker = document.createElement('gmp-advanced-marker');
        marker.setAttribute('position', `${location.latitude},${location.longitude}`);
        marker.setAttribute('title', location.locationName);
        
        // Create info content with English text
        const content = document.createElement('div');
        content.innerHTML = `
          <div style="padding: 8px; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 8px 0;">${location.locationName}</h3>
            <p style="margin: 0;">Location Details:</p>
            <p style="margin: 4px 0;">Latitude: ${location.latitude.toFixed(4)}°</p>
            <p style="margin: 4px 0;">Longitude: ${location.longitude.toFixed(4)}°</p>
          </div>
        `;
        
        // Add click event listener for info window
        marker.addEventListener('click', () => {
          const infoWindow = new google.maps.InfoWindow({
            content: content,
            ariaLabel: `Information about ${location.locationName}`
          });
          infoWindow.open(mapElement, marker);
        });

        mapElement.appendChild(marker);
      });

      // Add map to container
      mapContainerRef.current.appendChild(mapElement);
    }
  }, [visible, isMapLoaded, locations, style, mapProps]);

  const mapContent = (
    <div 
      ref={mapContainerRef}
      style={{ 
        height: isModal ? '500px' : '100%',
        width: '100%',
        position: 'relative',
        ...style
      }}
    >
      {!isMapLoaded && (
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.8)'
        }}>
          <Spin size="large" tip="Loading Google Maps..." />
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <Modal
        title={title}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
        {...modalProps}
      >
        {mapContent}
      </Modal>
    );
  }

  return mapContent;
};

GoogleMap.propTypes = {
  locations: PropTypes.arrayOf(PropTypes.shape({
    locationName: PropTypes.string.isRequired,
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired
  })).isRequired,
  isModal: PropTypes.bool,
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  modalProps: PropTypes.object,
  mapProps: PropTypes.object,
  style: PropTypes.object
};

export default GoogleMap; 