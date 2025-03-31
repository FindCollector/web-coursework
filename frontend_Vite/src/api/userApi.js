import client from './client';

/**
 * 获取用户列表，支持分页、排序和筛选
 * @param {Object} params 查询参数
 * @returns {Promise<Object>} 分页响应
 */
export const getUserList = async (params) => {
  const {
    role,
    status,
    userName,
    email,
    sortField,
    sortOrder,
    pageNow = 1,
    pageSize = 10
  } = params || {};

  // 构建查询参数
  const queryParams = new URLSearchParams();
  
  // 只添加有值的参数
  if (role) queryParams.append('role', role);
  if (status !== undefined && status !== null) queryParams.append('status', status);
  if (userName) queryParams.append('userName', userName);
  if (email) queryParams.append('email', email);
  
  // 处理排序参数
  if (Array.isArray(sortField) && Array.isArray(sortOrder) && sortField.length > 0) {
    sortField.forEach(field => queryParams.append('sortField', field));
    sortOrder.forEach(order => queryParams.append('sortOrder', order));
  }
  
  // 分页参数总是添加
  queryParams.append('pageNow', pageNow);  
  queryParams.append('pageSize', pageSize);   
  
  console.log('Sending user list request with params:', queryParams.toString());
  
  const response = await client.get(`/user/list?${queryParams.toString()}`);
  
  // 确保即使后端返回数据格式不完整也能正常显示
  const defaultResponse = {
    code: 0,
    msg: 'success',
    records: [],
    total: 0,
    current: pageNow,
    size: pageSize,
    pages: 1
  };
  
  return response.data || defaultResponse;
};

/**
 * 更新用户状态
 * @param {number|string} userId 用户ID
 * @param {number} status 状态值 (0: 正常, 1: 待审核, 2: 禁用)
 * @returns {Promise<Object>} 响应结果
 */
export const updateUserStatus = async (userId, status) => {
  try {
    console.log(`正在更新用户 ${userId} 的状态为 ${status}`);
    
    // 确保有token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('无法更新用户状态：未找到认证token');
      return {
        code: -1,
        msg: '未找到认证信息，请重新登录',
        data: null
      };
    }
    
    // 设置请求选项，包括明确的headers
    const options = {
      headers: {
        'Content-Type': 'application/json',
        'token': token
      }
    };
    
    // 发送请求
    const response = await client.patch(`/user/${userId}`, { status }, options);
    return response.data;
  } catch (error) {
    console.error(`更新用户状态失败:`, error);
    // 返回一个规范的错误响应
    return {
      code: -1,
      msg: error.response?.data?.msg || '操作失败，可能是跨域或网络问题',
      data: null
    };
  }
};

/**
 * 删除用户
 * @param {number} numericUserId 必须是数字类型的用户ID
 * @returns {Promise<Object>} 响应结果
 */
export const deleteUser = async (numericUserId) => {
  console.log(`[userApi.js] deleteUser function started, received numeric ID: ${numericUserId}`, typeof numericUserId);

  // Verify ID is a number
  if (typeof numericUserId !== 'number' || isNaN(numericUserId)) {
    console.error('[userApi.js] Error: ID passed to deleteUser is not a valid number!');
    return {
      code: -1,
      msg: 'Internal error: Invalid user ID',
      data: null
    };
  }

  try {
    // Ensure token exists
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[userApi.js] Cannot delete user: No authentication token found');
      return {
        code: -1,
        msg: 'Authentication required, please login again',
        data: null
      };
    }
    console.log('[userApi.js] Token found:', token ? 'exists' : 'does not exist');

    // Set request options
    const options = {
      headers: {
        'token': token
      }
    };
    
    const url = `/user/${numericUserId}`;
    console.log(`[userApi.js] Preparing to send axios DELETE request to: ${url}`);
    console.log('[userApi.js] Using request options:', options);
    
    // Send delete request
    const response = await client.delete(url, options);
    
    console.log('[userApi.js] Axios delete response:', response);
    return response.data;

  } catch (error) {
    console.error(`[userApi.js] Error occurred while deleting user (ID: ${numericUserId}):`, error);
    
    // Detailed error logging
    if (error.response) {
      // Request was made and server responded with status code outside of 2xx range
      console.error('[userApi.js] Error response data:', error.response.data);
      console.error('[userApi.js] Error response status:', error.response.status);
      console.error('[userApi.js] Error response headers:', error.response.headers);
    } else if (error.request) {
      // Request was made but no response received
      console.error('[userApi.js] No response received, request object:', error.request);
    } else {
      // Error occurred while setting up the request
      console.error('[userApi.js] Request setup error:', error.message);
    }
    console.error('[userApi.js] Error config:', error.config);

    // Return a standardized error response
    return {
      code: error.response?.status || -1,
      msg: error.response?.data?.msg || error.message || 'Delete operation failed, please check network or contact administrator',
      data: null
    };
  }
}; 