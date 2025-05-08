import { useState, useEffect, useRef } from 'react';

/**
 * Lazy loading component for regular images
 * 
 * Usage:
 * <ImgLazy 
 *   src="path/to/image.jpg" 
 *   alt="description" 
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
  loading = "lazy", // Use native lazy loading or Intersection Observer
  rootMargin = "200px 0px", // Default: load 200px before becoming visible
  threshold = 0.1, // Load when 10% visible
  onLoad,
  onError,
  ...props
}) => {
  const imgRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  
  // Use Intersection Observer API for lazy loading
  useEffect(() => {
    // If browser supports native lazy loading and user chooses to use it, return directly
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
  
  // Handle image load completion
  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };
  
  // Handle image load error
  const handleError = (e) => {
    if (onError) onError(e);
  };
  
  // Prioritize native lazy loading, fall back to custom Intersection Observer implementation when not supported
  const usesNativeLazy = loading === 'lazy' && 'loading' in HTMLImageElement.prototype;
  const shouldUseObserver = !usesNativeLazy && shouldLoad;
  
  const imgStyle = {
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s',
    width: width || '100%',
    height: height || 'auto',
    ...style
  };
  
  // Placeholder style
  const placeholderStyle = {
    width: width || '100%',
    height: height || '200px',
    background: '#f0f0f0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };
  
  // If native lazy loading is not supported and the image hasn't entered the viewport yet, show placeholder
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