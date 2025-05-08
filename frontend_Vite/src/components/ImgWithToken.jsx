import { Spin, Image, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useTokenizedImage } from '../hooks';
import { useState, useEffect, useRef } from 'react';

const ImgWithToken = ({ 
  src, 
  alt = "Image", 
  className = "", 
  style = {}, 
  width, 
  height,
  avatar = false,
  size = 100,
  fallbackIcon = <UserOutlined />,
  fallbackColor = "#1890ff",
  preview = false,
  onClick,
  onLoad,
  onError,
  lazy = true, // 默认启用懒加载
  rootMargin = "100px 0px", // 提前100px开始加载
  threshold = 0.1 // 当图片有10%进入视口时触发加载
}) => {
  const imgRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(!lazy); // 如果不使用懒加载，则立即加载
  
  // 使用自定义 hook 处理图片 URL 和状态
  const {
    tokenUrl,
    loading,
    error,
    handleLoad,
    handleError
  } = useTokenizedImage(src);
  
  // 初始化Intersection Observer实现懒加载
  useEffect(() => {
    if (!lazy || shouldLoad) return; // 如果已设置加载或不使用懒加载，则跳过
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold
      }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => {
      if (imgRef.current) {
        observer.disconnect();
      }
    };
  }, [lazy, shouldLoad, rootMargin, threshold]);
  
  // 自定义处理函数
  const handleImageLoad = (e) => {
    handleLoad();
    if (onLoad) onLoad(e);
  };
  
  const handleImageError = (e) => {
    handleError();
    if (onError) onError(e);
  };
  
  const handleImageClick = (e) => {
    if (onClick) onClick(e);
  };
  
  // 渲染占位符
  if (lazy && !shouldLoad) {
    const placeholderStyle = {
      width: width || (avatar ? size : '100%'),
      height: height || (avatar ? size : '100px'),
      background: '#f5f5f5',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    };
    
    return (
      <div ref={imgRef} style={placeholderStyle} className={className}>
        {/* 仅显示占位符，不加载图片 */}
      </div>
    );
  }
  
  // Avatar模式
  if (avatar) {
    return error ? (
      <Avatar 
        size={size} 
        icon={fallbackIcon} 
        style={{ 
          backgroundColor: fallbackColor,
          ...style
        }}
        className={className}
        onClick={handleImageClick}
      />
    ) : (
      <Avatar 
        size={size}
        src={shouldLoad ? tokenUrl : undefined}
        style={style}
        className={className}
        onLoad={handleImageLoad}
        onError={handleImageError}
        onClick={handleImageClick}
      />
    );
  }
  
  // 标准图片模式
  return (
    <div 
      ref={imgRef}
      style={{ 
        position: 'relative',
        display: 'inline-block',
        width: width || 'auto',
        height: height || 'auto',
        ...style
      }}
      className={className}
    >
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f5f5f5'
        }}>
          <Spin size="small" />
        </div>
      )}
      
      {error ? (
        <div 
          style={{
            width: width || '100%',
            height: height || '100px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f5f5f5',
            color: '#999',
            fontSize: '12px'
          }}
        >
          图片加载失败
        </div>
      ) : (
        <Image
          src={shouldLoad ? tokenUrl : undefined}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={handleImageClick}
          preview={preview}
          style={{ 
            display: loading ? 'none' : 'block',
          }}
        />
      )}
    </div>
  );
};

export default ImgWithToken; 