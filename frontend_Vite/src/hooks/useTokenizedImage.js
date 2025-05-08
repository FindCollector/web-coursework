import { useState, useEffect } from 'react';
import { 
  getToken,
  getFullImageUrl,
  createImageUrlWithToken
} from '../utils/imageUtils';

const useTokenizedImage = (imagePath) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tokenUrl, setTokenUrl] = useState('');
  
  // Generate URL with authentication token
  useEffect(() => {
    if (imagePath) {
      try {
        const url = createImageUrlWithToken(imagePath);
        setTokenUrl(url);
        setError(false);
      } catch (err) {
        setError(true);
      }
    } else {
      setError(true);
    }
    setLoading(false);
  }, [imagePath]);
  
  // Image handling functions
  const handleLoad = () => {
    setLoading(false);
  };
  
  const handleError = () => {
    setError(true);
    setLoading(false);
  };
  
  // Get authentication headers
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