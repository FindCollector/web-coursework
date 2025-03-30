/**
 * Get redirect path based on user type
 * @param {string} userType - User type parsed from login response message
 * @returns {string} Redirect path
 */
export const getRedirectPath = (userType) => {
  switch (userType) {
    case 'Admin Login':
      return '/admin/dashboard';
    case 'Member Login':
      return '/member/dashboard';
    case 'Coach Login':
      return '/coach/dashboard';
    default:
      return '/';
  }
};

/**
 * Extract user type from login response message
 * @param {string} message - Login response message content
 * @returns {string} User type
 */
export const getUserTypeFromMessage = (message) => {
  return message;
}; 