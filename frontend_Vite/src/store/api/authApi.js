import { baseApi } from './baseApi';

// Extend base API with authentication related endpoints
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login
    login: builder.mutation({
      query: (data) => {
        const { headers, ...requestData } = data;
        
        // Check if this is a Google login request
        if (requestData.googleToken) {
          return {
            url: '/auth/google-login',
            method: 'POST',
            body: { token: requestData.googleToken },
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            }
          };
        }
        
        return {
          url: '/auth/login',
          method: 'POST',
          body: requestData,
          headers: {
            ...headers,
            'Content-Type': 'application/json' // Ensure content type is set
          }
        };
      },
      // Add response transformation and error handling
      transformResponse: (response, meta, arg) => {
        return response;
      },
      transformErrorResponse: (response, meta, arg) => {
        return response;
      },
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        } catch (error) {
          // Error handling is automatic
        }
      },
      invalidatesTags: ['Auth']
    }),

    // Complete profile
    completeProfile: builder.mutation({
      query: (data) => ({
        url: '/auth/google-login/complete-profile',
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json'
        }
      }),
      invalidatesTags: ['Auth', 'User']
    }),

    // Logout
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST'
      }),
      invalidatesTags: ['Auth', 'User']
    }),

    // Get current user information
    getCurrentUser: builder.query({
      query: () => '/auth/user',
      providesTags: ['Auth']
    }),

    // Register new user
    register: builder.mutation({
      query: (data) => {
        const { headers, ...requestData } = data;
        return {
          url: '/auth/register',
          method: 'POST',
          body: requestData,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        };
      },
      transformResponse: (response, meta, arg) => {
        return response;
      },
      transformErrorResponse: (response, meta, arg) => {
        return response;
      }
    }),

    // Send verification code
    sendVerificationCode: builder.mutation({
      query: (data) => {
        const { headers, ...requestData } = data;
        return {
          url: '/auth/sendCode',
          method: 'POST',
          body: requestData,
          headers
        };
      }
    }),

    // Verify code
    verifyCode: builder.mutation({
      query: (data) => {
        const { headers, ...requestData } = data;
        return {
          url: '/auth/verifyCode',
          method: 'POST',
          body: requestData,
          headers
        };
      }
    }),

    // Resend verification code
    resendVerificationCode: builder.mutation({
      query: (data) => {
        const { headers, ...requestData } = data;
        return {
          url: '/auth/resendCode',
          method: 'POST',
          body: requestData,
          headers
        };
      },
      // Custom handling logic to prevent duplicate requests
      onQueryStarted: async (arg, { dispatch, queryFulfilled, getCacheEntry }) => {
        try {
          // Duplicate request prevention logic will be automatically handled by RTK Query
          await queryFulfilled;
        } catch (error) {
          // Error handling is automatic
        }
      }
    })
  })
});

// Export auto-generated hooks
export const {
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useRegisterMutation,
  useSendVerificationCodeMutation,
  useVerifyCodeMutation,
  useResendVerificationCodeMutation,
  useCompleteProfileMutation
} = authApi; 