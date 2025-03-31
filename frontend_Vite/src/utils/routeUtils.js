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