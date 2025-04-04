import { Spin, Image, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useTokenizedImage } from '../hooks';

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
  // 使用自定义 hook 处理图片 URL 和状态
  const {
    tokenUrl,
    loading,
    error,
    handleLoad,
    handleError
  } = useTokenizedImage(src);
  
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
        src={tokenUrl}
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