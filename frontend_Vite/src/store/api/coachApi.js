import { baseApi } from './baseApi';

// 扩展基础API，添加教练相关的端点
export const coachApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 检查教练信息完整性
    checkCoachDetails: builder.query({
      query: () => '/coach/details/check',
      providesTags: ['Coach']
    }),
    
    // 获取教练详情
    getCoachDetail: builder.query({
      query: () => '/coach/details',
      providesTags: ['Coach']
    }),
    
    // 更新教练介绍
    updateCoachIntro: builder.mutation({
      query: (intro) => ({
        url: '/coach/update/intro',
        method: 'POST',
        body: { intro }
      }),
      invalidatesTags: ['Coach']
    }),
    
    // 上传教练照片
    uploadCoachPhoto: builder.mutation({
      query: (formData) => ({
        url: '/coach/photo',
        method: 'POST',
        body: formData,
        // 不设置Content-Type，让浏览器自动设置为multipart/form-data
        formData: true,
      }),
      transformResponse: (response) => {
        if (response.code === 0) {
          return {
            code: 0,
            msg: response.msg,
            photoUrl: response.data.tempUrl
          };
        }
        return response;
      },
      invalidatesTags: ['Coach']
    }),
    
    // 更新教练标签
    updateCoachTags: builder.mutation({
      query: (tagIds) => ({
        url: '/coach/update/tags',
        method: 'POST',
        body: { tagIds }
      }),
      invalidatesTags: ['Coach']
    }),

    // 更新教练位置
    updateCoachLocations: builder.mutation({
      query: (locationIds) => ({
        url: '/coach/update/locations',
        method: 'POST',
        body: { locationIds }
      }),
      invalidatesTags: ['Coach']
    }),

    // 更新教练详情
    updateCoachDetails: builder.mutation({
      query: (details) => ({
        url: '/coach/details',
        method: 'POST',
        body: details
      }),
      invalidatesTags: ['Coach']
    }),

    // 获取教练列表
    getCoachList: builder.query({
      query: (params = {}) => {
        const { userName, tags, locations, pageNow = 1, pageSize = 10 } = params;
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        if (userName) queryParams.append('userName', userName);
        if (pageNow) queryParams.append('pageNow', pageNow);
        if (pageSize) queryParams.append('pageSize', pageSize);
        
        // Handle arrays - convert to tagIds and locationIds
        if (tags && tags.length > 0) {
          tags.forEach(tagId => queryParams.append('tagIds', tagId));
        }
        
        if (locations && locations.length > 0) {
          locations.forEach(locationId => queryParams.append('locationIds', locationId));
        }
        
        return {
          url: `/member/coachList?${queryParams.toString()}`,
          method: 'GET'
        };
      },
      providesTags: ['CoachList']
    }),

    // 获取教练过滤器选项
    getCoachFilterOptions: builder.query({
      query: () => ({
        url: '/member/coach/filter',
        method: 'GET'
      }),
      transformResponse: (response) => {
        if (response.code === 0 && response.data) {
          return {
            locations: Object.entries(response.data.locations).map(([value, label]) => ({
              value,
              label
            })),
            tags: Object.entries(response.data.tags).map(([value, label]) => ({
              value,
              label
            }))
          };
        }
        return {
          locations: [],
          tags: []
        };
      }
    }),

    // 发送订阅请求
    sendSubscriptionRequest: builder.mutation({
      query: (data) => ({
        url: '/member/subscription',
        method: 'POST',
        body: data
      })
    }),

    // 获取订阅请求列表
    getSubscriptionRequests: builder.query({
      query: (params = {}) => {
        const { pageNow = 1, pageSize = 10, statusList } = params;
        
        // Build query parameters
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
          url: `/coach/subscriptionRequest?${queryParams.toString()}`,
          method: 'GET'
        };
      },
      // 确保每次调用都是新的请求，不使用缓存
      keepUnusedDataFor: 0,
      providesTags: ['SubscriptionRequests']
    }),

    // 获取未读订阅请求计数
    getUnreadRequestsCount: builder.query({
      query: () => ({
        url: '/coach/unreadRequest/count',
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
      providesTags: (result) => ['UnreadCount', 'SubscriptionRequests']
    }),
    
    // 标记订阅请求为已读
    markRequestAsRead: builder.mutation({
      query: (requestId) => ({
        url: `/coach/subscription/${requestId}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['UnreadCount', 'SubscriptionRequests']
    }),
    
    // 处理订阅请求（接受或拒绝）
    handleSubscriptionRequest: builder.mutation({
      query: ({ requestId, status, reply }) => ({
        url: '/coach/subscriptionRequest/handle',
        method: 'POST',
        body: { requestId, status, reply }
      }),
      invalidatesTags: ['UnreadCount', 'SubscriptionRequests']
    }),
    
    // 接受订阅请求
    acceptSubscriptionRequest: builder.mutation({
      query: ({ requestId, reply }) => ({
        url: `/coach/subscription/${requestId}/accept`,
        method: 'PATCH',
        body: { reply }
      }),
      invalidatesTags: ['UnreadCount', 'SubscriptionRequests']
    }),
    
    // 拒绝订阅请求
    rejectSubscriptionRequest: builder.mutation({
      query: ({ requestId, reply }) => ({
        url: `/coach/subscription/${requestId}/reject`,
        method: 'PATCH',
        body: { reply }
      }),
      invalidatesTags: ['UnreadCount', 'SubscriptionRequests']
    }),

    // 添加教练空闲时间
    addAvailability: builder.mutation({
      query: (availability) => ({
        url: '/coach/availability',
        method: 'POST',
        body: availability
      }),
      invalidatesTags: ['Availability'] // 成功后使'Availability'标签失效，触发重新获取
    }),

    // 获取教练空闲时间
    getAvailability: builder.query({
      query: () => ({
        url: '/coach/availability',
        method: 'GET'
      }),
      providesTags: ['Availability']
    }),

    // 删除教练空闲时间
    deleteAvailability: builder.mutation({
      query: (id) => ({
        url: `/coach/availability/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Availability'] // 成功后使'Availability'标签失效，触发重新获取
    }),

    // 更新教练空闲时间
    updateAvailability: builder.mutation({
      query: ({ id, ...patch }) => ({ // 接受 id 和包含更新数据的对象
        url: `/coach/availability/${id}`,
        method: 'PATCH',
        body: patch // 发送包含 dayOfWeek, startTime, endTime 的对象
      }),
      invalidatesTags: ['Availability'] // 成功后刷新数据
    }),

    // 获取Session请求列表
    getSessionRequests: builder.query({
      query: (params = {}) => {
        const { pageNow = 1, pageSize = 10, statusList } = params;
        
        // Build query parameters
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
          url: `/coach/session-requests?${queryParams.toString()}`,
          method: 'GET'
        };
      },
      // 确保每次调用都是新的请求，不使用缓存
      keepUnusedDataFor: 0,
      providesTags: ['SessionRequests']
    }),
    
    // 标记Session请求为已读
    markSessionRequestAsRead: builder.mutation({
      query: (requestId) => ({
        url: `/coach/session/${requestId}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['UnreadCount', 'SessionRequests']
    })
  })
});

// 导出自动生成的hooks
export const {
  useCheckCoachDetailsQuery,
  useGetCoachDetailQuery,
  useUpdateCoachIntroMutation,
  useUploadCoachPhotoMutation,
  useUpdateCoachTagsMutation,
  useUpdateCoachLocationsMutation,
  useUpdateCoachDetailsMutation,
  useGetCoachListQuery,
  useGetCoachFilterOptionsQuery,
  useSendSubscriptionRequestMutation,
  useGetSubscriptionRequestsQuery,
  useGetUnreadRequestsCountQuery,
  useMarkRequestAsReadMutation,
  useHandleSubscriptionRequestMutation,
  useAcceptSubscriptionRequestMutation,
  useRejectSubscriptionRequestMutation,
  useAddAvailabilityMutation,
  useGetAvailabilityQuery,
  useDeleteAvailabilityMutation,
  useUpdateAvailabilityMutation,
  useGetSessionRequestsQuery,
  useMarkSessionRequestAsReadMutation
} = coachApi;