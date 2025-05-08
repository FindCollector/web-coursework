import { baseApi } from './baseApi';

// Extend base API with member-related endpoints
export const memberApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get member subscription requests list
    getMemberSubscriptionRequests: builder.query({
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
          url: `/member/subscriptionRequest?${queryParams.toString()}`,
          method: 'GET'
        };
      },
      // Ensure each call is a new request, not using cache
      keepUnusedDataFor: 0,
      providesTags: ['MemberSubscriptionRequests']
    }),

    // Get member unread subscription requests count
    getMemberUnreadRequestsCount: builder.query({
      query: () => ({
        url: '/member/unreadRequest/count',
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
      providesTags: ['MemberUnreadCount', 'MemberSubscriptionRequests']
    }),
    
    // Get member unread session requests count
    getMemberUnreadSessionCount: builder.query({
      query: () => ({
        url: '/member/session/unreadRequest/count',
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
      providesTags: ['MemberUnreadSessionCount', 'MemberSessionRequests']
    }),
    
    // Mark member subscription request as read
    markMemberRequestAsRead: builder.mutation({
      query: (requestId) => ({
        url: `/member/subscription/${requestId}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['MemberUnreadCount', 'MemberSubscriptionRequests']
    }),

    // Get member session requests list
    getMemberSessionRequests: builder.query({
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
          url: `/member/session-requests?${queryParams.toString()}`,
          method: 'GET'
        };
      },
      // Ensure each call is a new request, not using cache
      keepUnusedDataFor: 0,
      providesTags: ['MemberSessionRequests']
    }),
    
    // Mark session request as read
    markSessionRequestAsRead: builder.mutation({
      query: (requestId) => ({
        url: `/member/session/request/${requestId}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['MemberUnreadCount', 'MemberSessionRequests', 'MemberUnreadSessionCount']
    }),

    // Get member's subscribed coach list (for booking sessions)
    getSubscriptionCoachList: builder.query({
      query: () => ({
        url: '/member/subscriptionCoachList',
        method: 'GET',
        // Add timestamp to ensure latest data
        params: { _t: Date.now() } 
      }),
      // Assuming the returned data structure is { code: number, msg: string, data: Coach[] }
      // Return data part directly or transform as needed
      transformResponse: (response) => {
        if (response.code === 0 && Array.isArray(response.data)) {
          return response.data;
        }
        // Return empty array or throw error, depending on error handling strategy
        return []; 
      },
      // Don't retain unused data, ensure each query is a fresh request
      keepUnusedDataFor: 0,
      // Can add tag for cache management, e.g., 'SubscriptionCoaches'
      providesTags: ['SubscriptionCoaches'] 
    }),
    
    // Member unsubscribe from coach
    unsubscribeCoach: builder.mutation({
      query: (coachId) => ({
        url: `/member/subscription/${coachId}`,
        method: 'PATCH'
      }),
      // When unsubscribe is successful, invalidate cached subscription coach list, force re-fetch
      invalidatesTags: ['SubscriptionCoaches']
    }),
    
    // Get coach's appropriate time slots for lessons
    getCoachAppropriateTimeList: builder.query({
      query: (coachId) => ({
        url: `/member/appropriateTimeList/${coachId}`,
        method: 'GET',
        // Add timestamp to ensure latest data
        params: { _t: Date.now() }
      }),
      transformResponse: (response) => {
        if (response.code === 0 && response.data) {
          return response.data;
        }
        // Handle error cases
        return {};
      },
      // Disable cache, ensure each query is a fresh request
      keepUnusedDataFor: 0, // Set to 0, don't keep unused data
      // Don't provide any tags to avoid cache management
    }),
    
    // Book session time
    bookSession: builder.mutation({
      query: (bookingData) => ({
        url: '/member/bookingSession',
        method: 'POST',
        body: bookingData
      }),
      // When booking is successful, invalidate cached time slot data and coach list data, force re-fetch
      invalidatesTags: ['SubscriptionCoaches']
    }),

    // Withdraw session request
    withdrawSessionRequest: builder.mutation({
      query: (requestId) => ({
        url: `/member/withdrawRequest/${requestId}`,
        method: 'DELETE'
      }),
      // After successful withdrawal, invalidate related caches, force re-fetch
      invalidatesTags: ['MemberSessionRequests', 'MemberUnreadSessionCount']
    }),

    // Get member's training schedule
    getMemberSessionSchedule: builder.query({
      query: () => ({
        url: '/member/sessionSchedule',
        method: 'GET',
        // Add timestamp to ensure latest data
        params: { _t: Date.now() }
      }),
      transformResponse: (response) => {
        if (response.code === 0 && response.data) {
          return response.data;
        }
        // Handle error cases
        return { calenderView: {}, listView: [] };
      },
      // Disable cache, ensure each query is a fresh request
      keepUnusedDataFor: 0,
      providesTags: ['MemberSessionSchedule']
    }),

    // Member cancel session
    cancelMemberSession: builder.mutation({
      query: (sessionId) => ({
        url: `/member/cancelSession/${sessionId}`,
        method: 'PATCH'
      }),
      invalidatesTags: ['MemberSessionSchedule']
    }),

    // Get member's training history
    getMemberTrainingHistory: builder.query({
      query: (params) => {
        const { pageNow = 1, pageSize = 10, startDate, endDate } = params;
        
        // Ensure startDate and endDate exist
        if (!startDate || !endDate) {
          throw new Error('startDate and endDate are required');
        }
        
        return {
          url: '/member/training/history',
          method: 'GET',
          params: {
            pageNow,
            pageSize,
            startDate, // Should be in format yyyy/MM/dd
            endDate    // Should be in format yyyy/MM/dd
          }
        };
      },
      providesTags: ['MemberTrainingHistory']
    }),

    // Mark training history as read
    markTrainingHistoryAsRead: builder.mutation({
      query: (id) => ({
        url: `/member/training/history/${id}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['MemberTrainingHistory']
    }),

    // Get member's unread training history count
    getMemberUnreadTrainingHistoryCount: builder.query({
      query: () => ({
        url: '/member/training/unreadHistory/count',
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
      providesTags: ['MemberTrainingHistory']
    }),

    // Get coach location information for map display
    getCoachLocationInfo: builder.query({
      query: () => ({
        url: '/member/location/info',
        method: 'GET',
        // Add timestamp to ensure latest data
        params: { _t: Date.now() }
      }),
      transformResponse: (response, meta, arg) => {
        if (response.code === 0 && response.data) {
          // Ensure data is in array format
          if (Array.isArray(response.data)) {
            return response.data;
          } else {
            // Try to adapt different data formats
            if (typeof response.data === 'object') {
              // May be in object format, try to convert to array
              const locations = Object.values(response.data);
              if (locations.length > 0) {
                return locations;
              }
            }
            // If unable to adapt, return empty array
            return [];
          }
        }
        return [];
      },
      // Add cache control, cache for 5 minutes
      keepUnusedDataFor: 300,
      // Add tags for easy refetching
      providesTags: ['LocationInfo']
    }),
  }),
});

// Export auto-generated hooks
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
  useGetMemberUnreadSessionCountQuery,
  useWithdrawSessionRequestMutation,
  useGetMemberSessionScheduleQuery,
  useCancelMemberSessionMutation,
  useGetMemberTrainingHistoryQuery,
  useMarkTrainingHistoryAsReadMutation,
  useGetMemberUnreadTrainingHistoryCountQuery,
  useGetCoachLocationInfoQuery
} = memberApi; 