import { baseApi } from './baseApi';

// 扩展基础API，添加用户相关的端点
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 获取用户列表
    getUserList: builder.query({
      query: (params) => {
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
        
        return {
          url: `/user/list?${queryParams.toString()}`,
          method: 'GET'
        };
      },
      // 处理响应转换
      transformResponse: (response) => {
        // 确保即使后端返回数据格式不完整也能正常显示
        const defaultResponse = {
          code: 0,
          msg: 'success',
          records: [],
          total: 0,
          current: 1,
          size: 10,
          pages: 1
        };
        
        return response || defaultResponse;
      },
      // 为了确保缓存失效和重新获取正常工作
      providesTags: ['User'],
    }),

    // 更新用户状态
    updateUserStatus: builder.mutation({
      query: ({ userId, status }) => ({
        url: `/user/${userId}`,
        method: 'PATCH',
        body: { status }
      }),
      // 使缓存失效，触发重新获取
      invalidatesTags: ['User'],
      // 与旧API保持一致的错误处理
      onQueryStarted: async (arg, { dispatch, queryFulfilled, getCacheEntry }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error(`更新用户状态失败:`, error);
        }
      },
    }),

    // 删除用户
    deleteUser: builder.mutation({
      query: (userId) => {
        console.log(`[userApi.js] deleteUser function started, received ID: ${userId}`, typeof userId);
        
        // Verify ID exists
        if (!userId) {
          console.error('[userApi.js] Error: No user ID provided to deleteUser!');
          throw new Error('Internal error: Missing user ID');
        }
        
        return {
          url: `/user/${userId}`,
          method: 'DELETE'
        };
      },
      // 使缓存失效，触发重新获取
      invalidatesTags: ['User'],
    }),
  }),
});

// 导出自动生成的hooks
export const {
  useGetUserListQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation
} = userApi; 