import { useState, useEffect, useRef } from 'react';

/**
 * 普通图片的懒加载组件
 * 
 * 使用方法：
 * <ImgLazy 
 *   src="path/to/image.jpg" 
 *   alt="描述" 
 *   width={300} 
 *   height={200} 
 * />
 */
const ImgLazy = ({
  src,
  alt = "",
  width,
  height,
  className = "",
  style = {},
  loading = "lazy", // 使用原生懒加载或Intersection Observer
  rootMargin = "200px 0px", // 默认提前200px加载
  threshold = 0.1, // 当10%可见时加载
  onLoad,
  onError,
  ...props
}) => {
  const imgRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // 使用Intersection Observer API实现懒加载
  useEffect(() => {
    // 如果浏览器支持native lazy loading且用户选择使用它，直接返回
    if (loading === 'lazy' && 'loading' in HTMLImageElement.prototype) {
      return;
    }
    
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
  }, [loading, rootMargin, threshold]);
  
  // 处理图片加载完成
  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };
  
  // 处理图片加载错误
  const handleError = (e) => {
    if (onError) onError(e);
  };
  
  // 优先使用原生懒加载，不支持时回退到自定义Intersection Observer实现
  const usesNativeLazy = loading === 'lazy' && 'loading' in HTMLImageElement.prototype;
  const shouldUseObserver = !usesNativeLazy && shouldLoad;
  
  const imgStyle = {
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s',
    width: width || '100%',
    height: height || 'auto',
    ...style
  };
  
  // 占位符样式
  const placeholderStyle = {
    width: width || '100%',
    height: height || '200px',
    background: '#f0f0f0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };
  
  // 如果不支持原生懒加载且图片还未进入视图，显示占位符
  if (!usesNativeLazy && !shouldLoad) {
    return <div ref={imgRef} style={placeholderStyle} className={className} />;
  }
  
  return (
    <img
      ref={imgRef}
      src={usesNativeLazy || shouldUseObserver ? src : ''}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={imgStyle}
      loading={usesNativeLazy ? 'lazy' : undefined}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

export default ImgLazy; 