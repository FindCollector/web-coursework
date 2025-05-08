import { baseApi } from './baseApi';

// Extend base API with coach-related endpoints
export const coachApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Check coach details completeness
    checkCoachDetails: builder.query({
      query: () => '/coach/details/check',
      providesTags: ['Coach']
    }),
    
    // Get coach details
    getCoachDetail: builder.query({
      query: () => '/coach/details',
      providesTags: ['Coach']
    }),
    
    // Update coach introduction
    updateCoachIntro: builder.mutation({
      query: (intro) => ({
        url: '/coach/update/intro',
        method: 'POST',
        body: { intro }
      }),
      invalidatesTags: ['Coach']
    }),
    
    // Upload coach photo
    uploadCoachPhoto: builder.mutation({
      query: (formData) => ({
        url: '/coach/photo',
        method: 'POST',
        body: formData,
        // Don't set Content-Type, let browser automatically set it to multipart/form-data
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
    
    // Update coach tags
    updateCoachTags: builder.mutation({
      query: (tagIds) => ({
        url: '/coach/update/tags',
        method: 'POST',
        body: { tagIds }
      }),
      invalidatesTags: ['Coach']
    }),

    // Update coach locations
    updateCoachLocations: builder.mutation({
      query: (locationIds) => ({
        url: '/coach/update/locations',
        method: 'POST',
        body: { locationIds }
      }),
      invalidatesTags: ['Coach']
    }),

    // Update coach details
    updateCoachDetails: builder.mutation({
      query: (details) => ({
        url: '/coach/details',
        method: 'POST',
        body: details
      }),
      invalidatesTags: ['Coach']
    }),

    // Get coach list
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

    // Get coach filter options
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

    // Send subscription request
    sendSubscriptionRequest: builder.mutation({
      query: (data) => ({
        url: '/member/subscription',
        method: 'POST',
        body: data
      })
    }),

    // Get subscription requests list
    getSubscriptionRequests: builder.query({
      query: (params = {}) => {
        const { pageNow = 1, pageSize = 10, statusList } = params;
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('pageNow', pageNow);
        queryParams.append('pageSize', pageSize);
        // Add timestamp parameter to ensure cache is not used
        queryParams.append('_t', Date.now());
        
        // Handle status list
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
      // Ensure each call is a new request, not using cache
      keepUnusedDataFor: 0,
      providesTags: ['SubscriptionRequests']
    }),

    // Get unread subscription requests count
    getUnreadRequestsCount: builder.query({
      query: () => ({
        url: '/coach/subscription/unreadRequest/count',
        method: 'GET',
        // Add timestamp parameter to ensure cache is not used
        params: { _t: Date.now() }
      }),
      transformResponse: (response) => {
        if (response.code === 0 && response.data) {
          return response.data.count || 0;
        }
        return 0;
      },
      // Ensure each call is a new request, not using cache
      keepUnusedDataFor: 0,
      providesTags: (result) => ['UnreadCount', 'SubscriptionRequests']
    }),
    
    // Get unread session requests count
    getUnreadSessionCount: builder.query({
      query: () => ({
        url: '/coach/session/unreadRequest/count',
        method: 'GET',
        // Add timestamp parameter to ensure cache is not used
        params: { _t: Date.now() }
      }),
      transformResponse: (response) => {
        if (response.code === 0 && response.data) {
          return response.data.count || 0;
        }
        return 0;
      },
      // Ensure each call is a new request, not using cache
      keepUnusedDataFor: 0,
      providesTags: ['UnreadSessionCount', 'SessionRequests']
    }),
    
    // Mark subscription request as read
    markRequestAsRead: builder.mutation({
      query: (requestId) => ({
        url: `/coach/subscription/${requestId}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['UnreadCount', 'SubscriptionRequests']
    }),
    
    // Handle subscription request (accept or reject)
    handleSubscriptionRequest: builder.mutation({
      query: ({ requestId, status, reply }) => ({
        url: '/coach/subscriptionRequest/handle',
        method: 'POST',
        body: { requestId, status, reply }
      }),
      invalidatesTags: ['UnreadCount', 'SubscriptionRequests']
    }),
    
    // Accept subscription request
    acceptSubscriptionRequest: builder.mutation({
      query: ({ requestId, reply }) => ({
        url: `/coach/subscription/${requestId}/accept`,
        method: 'PATCH',
        body: { reply }
      }),
      invalidatesTags: ['UnreadCount', 'SubscriptionRequests']
    }),
    
    // Reject subscription request
    rejectSubscriptionRequest: builder.mutation({
      query: ({ requestId, reply }) => ({
        url: `/coach/subscription/${requestId}/reject`,
        method: 'PATCH',
        body: { reply }
      }),
      invalidatesTags: ['UnreadCount', 'SubscriptionRequests']
    }),

    // Get unrecorded sessions list
    getUnrecordedSessions: builder.query({
      query: (params = {}) => {
        const { pageNow = 1, pageSize = 10 } = params;
        const queryParams = new URLSearchParams();
        queryParams.append('pageNow', pageNow);
        queryParams.append('pageSize', pageSize);
        queryParams.append('_t', Date.now()); // Prevent caching
        
        return {
          url: `/coach/session/unrecord?${queryParams.toString()}`,
          method: 'GET'
        };
      },
      transformResponse: (response) => {
        if (response.code === 0 && response.data) {
          // Transform time format if needed
          // response.data.records = response.data.records.map(record => ({ ...record, startTime: dayjs(record.startTime), endTime: dayjs(record.endTime) }));
          return response.data; // Return data part, includes records, total, size, current, pages
        }
        return { records: [], total: 0, size: 10, current: 1, pages: 0 }; // Return default empty structure
      },
      providesTags: (result, error, arg) => 
        result
          ? [...result.records.map(({ id }) => ({ type: 'UnrecordedSession', id })), { type: 'UnrecordedSession', id: 'LIST' }]
          : [{ type: 'UnrecordedSession', id: 'LIST' }],
      keepUnusedDataFor: 5 // Cache for 5 seconds
    }),

    // Get unrecorded session count
    getUnrecordedSessionCountData: builder.query({
      query: () => ({
        url: '/coach/session/unrecord/count',
        method: 'GET',
        // Add timestamp parameter to ensure cache is not used
        params: { _t: Date.now() }
      }),
      transformResponse: (response) => {
        if (response.code === 0 && response.data) {
          return response.data.count || 0;
        }
        return 0;
      },
      // Ensure each call is a new request, not using cache
      keepUnusedDataFor: 0,
      providesTags: ['UnrecordedSessionCount'] // Add unique tag
    }),

    // Get all available coach tags
    getCoachTags: builder.query({
      query: () => '/coach/tags',
      transformResponse: (response) => {
        if (response.code === 0 && response.data) {
          // Convert { id: name } format to [{ value: id, label: name }] format
          return Object.entries(response.data).map(([id, name]) => ({
            value: id, // Use ID as value
            label: name, // Use name as label
          }));
        }
        return []; // Return empty array in case of error
      },
      providesTags: ['CoachTags'] // Add tag
    }),

    // Record session history feedback and tags
    recordSessionHistory: builder.mutation({
      query: ({ sessionId, feedback, tagList }) => ({
        url: '/coach/training/history',
        method: 'POST',
        body: {
          sessionId: String(sessionId), // Ensure sessionId is string or number, adjust according to backend needs
          feedback,
          tagList: tagList.map(tagId => Number(tagId)) // Ensure tagList contains number IDs
        }
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'UnrecordedSession', id: 'LIST' }, // Invalidate unrecorded sessions list
        { type: 'UnrecordedSession', id: arg.sessionId }, // Invalidate specific session (if provided)
        'UnrecordedSessionCount' // Invalidate unrecorded sessions count
      ] 
    }),

    // Add coach availability
    addAvailability: builder.mutation({
      query: (availability) => ({
        url: '/coach/availability',
        method: 'POST',
        body: availability
      }),
      invalidatesTags: ['Availability'] // Invalidate 'Availability' tag after success, trigger re-fetch
    }),

    // Get coach availability
    getAvailability: builder.query({
      query: () => ({
        url: '/coach/availability',
        method: 'GET'
      }),
      providesTags: ['Availability']
    }),

    // Delete coach availability
    deleteAvailability: builder.mutation({
      query: (id) => ({
        url: `/coach/availability/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Availability'] // Invalidate 'Availability' tag after success, trigger re-fetch
    }),

    // Update coach availability
    updateAvailability: builder.mutation({
      query: ({ id, ...patch }) => ({ // Accept id and object containing update data
        url: `/coach/availability/${id}`,
        method: 'PATCH',
        body: patch // Send object containing dayOfWeek, startTime, endTime
      }),
      invalidatesTags: ['Availability'] // Refresh data after success
    }),

    // Get session requests list
    getSessionRequests: builder.query({
      query: (params = {}) => {
        const { pageNow = 1, pageSize = 10, statusList } = params;
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('pageNow', pageNow);
        queryParams.append('pageSize', pageSize);
        // Add timestamp parameter to ensure cache is not used
        queryParams.append('_t', Date.now());
        
        // Handle status list
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
      // Ensure each call is a new request, not using cache
      keepUnusedDataFor: 0,
      providesTags: ['SessionRequests']
    }),
    
    // Mark session request as read
    markCoachSessionRequestAsRead: builder.mutation({
      query: (requestId) => ({
        url: `/coach/session/request/${requestId}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['UnreadCount', 'SessionRequests', 'UnreadSessionCount']
    }),
    
    // Handle session request (accept or reject)
    handleSessionRequest: builder.mutation({
      query: ({ requestId, status, reply }) => ({
        url: `/coach/session/request/${requestId}/handle`,
        method: 'PATCH',
        body: { status, reply }
      }),
      invalidatesTags: ['UnreadCount', 'SessionRequests', 'UnreadSessionCount']
    }),

    // Get coach training schedule
    getCoachSessionSchedule: builder.query({
      query: () => ({
        url: '/coach/sessionSchedule',
        method: 'GET',
        // Add timestamp to ensure latest data
        params: { _t: Date.now() }
      }),
      transformResponse: (response) => {
        if (response.code === 0 && response.data) {
          return response.data;
        }
        // Handle error cases
        return { calenderView: {}, listView: [] }; // Keep error handling consistent with memberApi
      },
      // Disable cache, ensure each query is a fresh request
      keepUnusedDataFor: 0,
      providesTags: ['CoachSessionSchedule'] // Provide tag
    }),
  })
});

// Export auto-generated hooks
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
  useGetUnrecordedSessionsQuery,
  useGetUnrecordedSessionCountDataQuery,
  useGetCoachTagsQuery,
  useRecordSessionHistoryMutation,
  useAddAvailabilityMutation,
  useGetAvailabilityQuery,
  useDeleteAvailabilityMutation,
  useUpdateAvailabilityMutation,
  useGetSessionRequestsQuery,
  useMarkCoachSessionRequestAsReadMutation,
  useHandleSessionRequestMutation,
  useGetUnreadSessionCountQuery,
  useGetCoachSessionScheduleQuery
} = coachApi;