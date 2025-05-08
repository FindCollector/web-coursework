import { baseApi } from './baseApi';

// Extend base API with user-related endpoints
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get user list
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
      
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        // Only add parameters with values
        if (role) queryParams.append('role', role);
        if (status !== undefined && status !== null) queryParams.append('status', status);
        if (userName) queryParams.append('userName', userName);
        if (email) queryParams.append('email', email);
        
        // Handle sorting parameters
        if (Array.isArray(sortField) && Array.isArray(sortOrder) && sortField.length > 0) {
          sortField.forEach(field => queryParams.append('sortField', field));
          sortOrder.forEach(order => queryParams.append('sortOrder', order));
        }
        
        // Pagination parameters are always added
        queryParams.append('pageNow', pageNow);  
        queryParams.append('pageSize', pageSize);   
        
        // Add timestamp to prevent caching
        queryParams.append('_t', Date.now());
        
        return {
          url: `/user/list?${queryParams.toString()}`,
          method: 'GET'
        };
      },
      // Disable caching
      keepUnusedDataFor: 0,
      // Ensure data is fetched every time
      forceRefetch: () => true,
      // Response transformation handling
      transformResponse: (response) => {
        // Ensure normal display even if backend returns incomplete data format
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
      // To ensure cache invalidation and refetching works properly
      providesTags: ['User'],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          // Error handled automatically
        }
      },
    }),

    // Update user status
    updateUserStatus: builder.mutation({
      query: ({ userId, status }) => ({
        url: `/user/${userId}`,
        method: 'PATCH',
        body: { status }
      }),
      // Invalidate cache to trigger refetch
      invalidatesTags: ['User'],
      // Maintain error handling consistent with old API
      onQueryStarted: async (arg, { dispatch, queryFulfilled, getCacheEntry }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          // Error handled automatically
        }
      },
    }),

    // Delete user
    deleteUser: builder.mutation({
      query: (userId) => {
        // Verify ID exists
        if (!userId) {
          throw new Error('Internal error: Missing user ID');
        }
        
        return {
          url: `/user/${userId}`,
          method: 'DELETE'
        };
      },
      // Invalidate cache to trigger refetch
      invalidatesTags: ['User'],
    }),

    // Get user configuration (roles and statuses)
    getUserConfig: builder.query({
      query: () => ({
        url: '/user/filter',
        method: 'GET'
      }),
      transformResponse: (response) => {
        if (response.code === 0 && response.data) {
          // Transform role data
          const roles = Object.entries(response.data.role).map(([value, label]) => ({
            value,
            label,
            // Set different colors for different roles
            color: value === 'admin' ? 'purple' : value === 'coach' ? 'green' : 'blue'
          }));

          // Transform status data
          const statuses = Object.entries(response.data.status).map(([value, label]) => ({
            value: parseInt(value),
            label,
            // Set different colors for different statuses
            color: value === '0' ? 'success' : value === '1' ? 'warning' : 'error'
          }));

          return {
            roles,
            statuses
          };
        }
        return {
          roles: [],
          statuses: []
        };
      },
      providesTags: ['UserConfig']
    }),
  }),
});

// Export auto-generated hooks
export const {
  useGetUserListQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useGetUserConfigQuery
} = userApi; 