import { baseApi } from './baseApi';

// 扩展基础API，添加会员相关的端点
export const memberApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 获取会员订阅请求列表
    getMemberSubscriptionRequests: builder.query({
      query: (params = {}) => {
        const { pageNow = 1, pageSize = 10, statusList } = params;
        
        // 构建查询参数
        const queryParams = new URLSearchParams();
        queryParams.append('pageNow', pageNow);
        queryParams.append('pageSize', pageSize);
        // 添加时间戳参数，确保不使用缓存
        queryParams.append('_t', Date.now());
        
        // 处理状态列表
        if (statusList && statusList.length > 0) {
          statusList.forEach(status => {
            queryParams.append('statusList', status);
          });
        }
        
        return {
          url: `/member/subscriptionRequest?${queryParams.toString()}`,
          method: 'GET'
        };
      },
      // 确保每次调用都是新的请求，不使用缓存
      keepUnusedDataFor: 0,
      providesTags: ['MemberSubscriptionRequests']
    }),

    // 获取会员未读订阅请求计数
    getMemberUnreadRequestsCount: builder.query({
      query: () => ({
        url: '/member/unreadRequest/count',
        method: 'GET',
        // 添加时间戳参数，确保不使用缓存
        params: { _t: Date.now() }
      }),
      transformResponse: (response) => {
        if (response.code === 0 && response.data) {
          return response.data.count || 0;
        }
        return 0;
      },
      // 确保每次调用都是新的请求，不使用缓存
      keepUnusedDataFor: 0,
      providesTags: ['MemberUnreadCount', 'MemberSubscriptionRequests']
    }),
    
    // 标记会员订阅请求为已读
    markMemberRequestAsRead: builder.mutation({
      query: (requestId) => ({
        url: `/member/subscription/${requestId}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['MemberUnreadCount', 'MemberSubscriptionRequests']
    }),
  }),
});

// 导出自动生成的hooks
export const {
  useGetMemberSubscriptionRequestsQuery,
  useGetMemberUnreadRequestsCountQuery,
  useMarkMemberRequestAsReadMutation,
} = memberApi; 