import { useState, useEffect } from 'react';
import { Spin, Image, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { createImageSrcObject, createImageUrlWithToken } from '../utils/imageUtils';

/**
 * 带认证token的图片组件
 * 使用方法一：直接渲染带token的图片
 * <ImgWithToken src="/path/to/image.jpg" />
 * 
 * 使用方法二：渲染Avatar组件
 * <ImgWithToken 
 *   src="/path/to/image.jpg" 
 *   avatar 
 *   size={100} 
 *   fallbackIcon={<CustomIcon />} 
 * />
 */
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
  onError
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tokenUrl, setTokenUrl] = useState('');
  
  // 请求头信息，用于Image组件
  const srcObject = createImageSrcObject(src);
  
  // 生成URL参数形式的认证图片链接
  useEffect(() => {
    if (src) {
      setTokenUrl(createImageUrlWithToken(src));
      setError(false);
      setLoading(true);
    } else {
      setError(true);
      setLoading(false);
    }
  }, [src]);
  
  // 图片加载处理
  const handleLoad = (e) => {
    setLoading(false);
    if (onLoad) onLoad(e);
  };
  
  // 图片错误处理
  const handleError = (e) => {
    console.error('Image failed to load:', src);
    setError(true);
    setLoading(false);
    if (onError) onError(e);
  };
  
  // 图片点击处理
  const handleClick = (e) => {
    if (onClick) onClick(e);
  };
  
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
        onClick={handleClick}
      />
    ) : (
      <Avatar 
        size={size}
        src={tokenUrl}
        style={style}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        onClick={handleClick}
      />
    );
  }
  
  // 标准图片模式
  return (
    <div 
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
          src={tokenUrl}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          onClick={handleClick}
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