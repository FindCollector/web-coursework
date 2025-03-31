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
  console.log(`[userApi.js] deleteUser函数开始执行，接收到的数字ID: ${numericUserId}`, typeof numericUserId);

  // 再次确认ID是数字
  if (typeof numericUserId !== 'number' || isNaN(numericUserId)) {
    console.error('[userApi.js] 错误：传递给deleteUser的ID不是有效的数字!');
    return {
      code: -1,
      msg: '内部错误：用户ID无效',
      data: null
    };
  }

  try {
    // 确保有token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[userApi.js] 无法删除用户: 未找到认证token');
      return {
        code: -1,
        msg: '需要认证，请重新登录',
        data: null
      };
    }
    console.log('[userApi.js] 获取到token:', token ? '存在' : '不存在');

    // 设置请求选项
    const options = {
      headers: {
        'token': token
      }
    };
    
    const url = `/user/${numericUserId}`;
    console.log(`[userApi.js] 准备发送 axios DELETE 请求到: ${url}`);
    console.log('[userApi.js] 使用的请求选项(options):', options);
    
    // 发送删除请求
    const response = await client.delete(url, options);
    
    console.log('[userApi.js] Axios删除响应:', response);
    return response.data;

  } catch (error) {
    console.error(`[userApi.js] 删除用户时发生错误 (ID: ${numericUserId}):`, error);
    
    // 详细记录错误信息
    if (error.response) {
      // 请求已发出，但服务器响应状态码不在 2xx 范围
      console.error('[userApi.js] 错误响应数据:', error.response.data);
      console.error('[userApi.js] 错误响应状态码:', error.response.status);
      console.error('[userApi.js] 错误响应头:', error.response.headers);
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('[userApi.js] 未收到响应，请求对象:', error.request);
    } else {
      // 在设置请求时触发了一个错误
      console.error('[userApi.js] 请求设置错误:', error.message);
    }
    console.error('[userApi.js] 错误配置:', error.config);

    // 返回一个规范的错误响应
    return {
      code: error.response?.status || -1,
      msg: error.response?.data?.msg || error.message || '删除操作失败，请检查网络或联系管理员',
      data: null
    };
  }
}; 