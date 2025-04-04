import { useState, useEffect } from 'react';
import { 
  getToken,
  getFullImageUrl,
  createImageUrlWithToken
} from '../utils/imageUtils';

/**
 * 处理带认证 token 的图片 URL 的 hook
 * @param {string} imagePath - 图片路径
 * @returns {Object} - 包含图片状态和 URL 的对象
 */
const useTokenizedImage = (imagePath) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tokenUrl, setTokenUrl] = useState('');
  
  // 生成带认证 token 的 URL
  useEffect(() => {
    if (imagePath) {
      try {
        const url = createImageUrlWithToken(imagePath);
        setTokenUrl(url);
        setError(false);
      } catch (err) {
        console.error('Error creating tokenized URL:', err);
        setError(true);
      }
    } else {
      setError(true);
    }
    setLoading(false);
  }, [imagePath]);
  
  // 图片处理函数
  const handleLoad = () => {
    setLoading(false);
  };
  
  const handleError = () => {
    console.error('Image failed to load:', imagePath);
    setError(true);
    setLoading(false);
  };
  
  // 获取认证头信息
  const getAuthHeaders = () => {
    const token = getToken();
    if (!token) return {};
    
    return {
      'Authorization': `Bearer ${token}`,
      'token': token
    };
  };
  
  return {
    tokenUrl,
    loading,
    error,
    handleLoad,
    handleError,
    getAuthHeaders,
    fullUrl: imagePath ? getFullImageUrl(imagePath) : ''
  };
};

export default useTokenizedImage; 