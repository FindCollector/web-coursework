// Image utility functions

/**
 * Get full server URL
 * @returns {string} Server base URL
 */
export const getBaseUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? '/' 
    : 'http://localhost:8080';
};

/**
 * Build complete image URL
 * @param {string} path - Image relative path
 * @returns {string} Complete image URL
 */
export const getFullImageUrl = (path) => {
  if (!path) return '';
  
  // If already a complete URL, return directly
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
};

/**
 * Get authentication token from sessionStorage
 * @returns {string|null} Authentication token or null
 */
export const getToken = () => {
  // Get storage key with page ID
  const getStorageKey = (key) => {
    return window.PAGE_INSTANCE_ID ? `${key}_${window.PAGE_INSTANCE_ID}` : key;
  };
  
  return sessionStorage.getItem(getStorageKey('token'));
};

/**
 * Create request headers with authentication information
 * @returns {Object} Request headers object with authentication info
 */
export const getAuthHeaders = () => {
  const token = getToken();
  
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'token': token
  };
};

/**
 * Create image URL object with source and authentication headers
 * @param {string} path - Image path
 * @returns {Object} Object with src and headers
 */
export const createImageSrcObject = (path) => {
  const url = getFullImageUrl(path);
  
  return {
    src: url,
    crossOrigin: 'anonymous',
    headers: getAuthHeaders()
  };
};

/**
 * Create image URL with authentication parameters
 * For scenarios where request headers cannot be set, like img tags
 * @param {string} path - Image path
 * @returns {string} Complete URL with authentication parameters
 */
export const createImageUrlWithToken = (path) => {
  const baseUrl = getFullImageUrl(path);
  return baseUrl;
};

/**
 * Create CSS background image style with authentication information
 * @param {string} path - Image path
 * @returns {Object} CSS style object
 */
export const createBackgroundImageStyle = (path) => {
  const imageUrl = createImageUrlWithToken(path);
  
  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };
}; 