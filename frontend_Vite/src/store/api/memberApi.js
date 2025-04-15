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

    // 获取会员Session请求列表
    getMemberSessionRequests: builder.query({
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
          url: `/member/session-requests?${queryParams.toString()}`,
          method: 'GET'
        };
      },
      // 确保每次调用都是新的请求，不使用缓存
      keepUnusedDataFor: 0,
      providesTags: ['MemberSessionRequests']
    }),
    
    // 标记Session请求为已读
    markSessionRequestAsRead: builder.mutation({
      query: (requestId) => ({
        url: `/member/session/${requestId}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['MemberUnreadCount', 'MemberSessionRequests']
    }),

    // 获取会员已订阅的教练列表 (用于预约 Session)
    getSubscriptionCoachList: builder.query({
      query: () => ({
        url: '/member/subscriptionCoachList',
        method: 'GET',
        // 添加时间戳确保获取最新数据
        params: { _t: Date.now() } 
      }),
      // 假设返回的数据结构是 { code: number, msg: string, data: Coach[] }
      // 直接返回 data 部分或根据需要转换
      transformResponse: (response) => {
        if (response.code === 0 && Array.isArray(response.data)) {
          return response.data;
        }
        // 返回空数组或抛出错误，根据错误处理策略决定
        console.error('Failed to fetch subscription coach list:', response.msg);
        return []; 
      },
      // 不保留未使用的数据，确保每次查询都是全新的请求
      keepUnusedDataFor: 0,
      // 可以添加 tag 用于缓存管理，例如 'SubscriptionCoaches'
      providesTags: ['SubscriptionCoaches'] 
    }),
    
    // 会员取消订阅教练
    unsubscribeCoach: builder.mutation({
      query: (coachId) => ({
        url: `/member/subscription/${coachId}`,
        method: 'PATCH'
      }),
      // 当取消订阅成功时，使缓存的订阅教练列表失效，强制重新获取
      invalidatesTags: ['SubscriptionCoaches']
    }),
    
    // 获取教练合适的上课时间
    getCoachAppropriateTimeList: builder.query({
      query: (coachId) => ({
        url: `/member/appropriateTimeList/${coachId}`,
        method: 'GET',
        // 添加时间戳确保获取最新数据
        params: { _t: Date.now() }
      }),
      transformResponse: (response) => {
        if (response.code === 0 && response.data) {
          return response.data;
        }
        // 处理错误情况
        console.error('Failed to fetch coach appropriate time list:', response.msg);
        return {};
      },
      // 禁用缓存，确保每次查询都是全新的请求
      keepUnusedDataFor: 0, // 设置为0，不保留未使用的数据
      // 不提供任何 tag，避免缓存管理
    }),
    
    // 预约课程时间
    bookSession: builder.mutation({
      query: (bookingData) => ({
        url: '/member/bookingSession',
        method: 'POST',
        body: bookingData
      }),
      // 当预约成功时，使缓存的时间槽数据和教练列表数据失效，强制重新获取
      invalidatesTags: ['SubscriptionCoaches']
    }),
  }),
});

// 导出自动生成的hooks
export const {
  useGetMemberSubscriptionRequestsQuery,
  useGetMemberUnreadRequestsCountQuery,
  useMarkMemberRequestAsReadMutation,
  useGetMemberSessionRequestsQuery,
  useMarkSessionRequestAsReadMutation,
  useGetSubscriptionCoachListQuery,
  useUnsubscribeCoachMutation,
  useGetCoachAppropriateTimeListQuery,
  useBookSessionMutation,
} = memberApi; 