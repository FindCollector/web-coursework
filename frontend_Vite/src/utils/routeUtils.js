/**
 * Get redirect path based on user type
 * @param {string} userType - User type parsed from login response message
 * @returns {string} Redirect path
 */
export const getRedirectPath = (userType) => {
  switch (userType) {
    case 'admin':
      return '/admin/dashboard';
    case 'member':
      return '/member/dashboard';
    case 'coach':
      return '/coach/dashboard';
    default:
      return '/';
  }
};

/**
 * Check if the user is authenticated by checking for token in localStorage
 * @returns {boolean} Whether the user is authenticated
 */
export const isUserAuthenticated = () => {
  try {
    // 获取带有页面ID的存储键名
    const getStorageKey = (key) => {
      return window.PAGE_INSTANCE_ID ? `${key}_${window.PAGE_INSTANCE_ID}` : key;
    };
    
    const token = localStorage.getItem(getStorageKey('token'));
    console.log('isUserAuthenticated检查 - 键名:', getStorageKey('token'), '值:', token ? '存在' : '不存在');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Extract user type from login response data
 * @param {object} data - Login response data
 * @returns {string} User type
 */
export const getUserTypeFromData = (data) => {
  // 适应新的数据结构，从userInfo中获取role
  if (data && data.userInfo && data.userInfo.role) {
    return data.userInfo.role;
  }
  
  // 兼容旧版数据结构
  return data?.role || 'member';
}; 