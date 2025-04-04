// 图片工具函数

/**
 * 获取服务器完整URL
 * @returns {string} 服务器基础URL
 */
export const getBaseUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? '/' 
    : 'http://localhost:8080';
};

/**
 * 构建完整的图片URL
 * @param {string} path - 图片相对路径
 * @returns {string} 完整的图片URL
 */
export const getFullImageUrl = (path) => {
  if (!path) return '';
  
  // 如果已经是完整URL，则直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
};

/**
 * 从sessionStorage获取认证token
 * @returns {string|null} 认证token或null
 */
export const getToken = () => {
  return sessionStorage.getItem('token');
};

/**
 * 创建包含认证信息的请求头
 * @returns {Object} 包含认证信息的请求头对象
 */
export const getAuthHeaders = () => {
  const token = getToken();
  
  if (!token) {
    console.warn('No authentication token found');
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'token': token
  };
};

/**
 * 创建图片URL对象，包含源和认证头信息
 * @param {string} path - 图片路径
 * @returns {Object} 包含src和headers的对象
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
 * 创建带认证参数的图片URL
 * 用于img标签等无法设置请求头的场景
 * @param {string} path - 图片路径
 * @returns {string} 带认证参数的完整URL
 */
export const createImageUrlWithToken = (path) => {
  const baseUrl = getFullImageUrl(path);
  return baseUrl;
};

/**
 * 创建CSS背景图片样式，包含认证信息
 * @param {string} path - 图片路径
 * @returns {Object} CSS样式对象
 */
export const createBackgroundImageStyle = (path) => {
  const imageUrl = createImageUrlWithToken(path);
  
  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };
}; 