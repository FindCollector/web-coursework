import { baseApi } from './baseApi';

// 扩展基础API，添加认证相关的端点
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 登录
    login: builder.mutation({
      query: (data) => {
        const { headers, ...requestData } = data;
        console.log('登录请求数据:', requestData, '请求头:', headers);
        
        // 检查是否是Google登录请求
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
            'Content-Type': 'application/json' // 确保设置内容类型
          }
        };
      },
      // 添加响应转换和错误处理
      transformResponse: (response, meta, arg) => {
        console.log('登录响应数据:', response);
        return response;
      },
      transformErrorResponse: (response, meta, arg) => {
        console.error('登录错误响应:', response);
        return response;
      },
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          console.log('登录成功，处理结果中:', data);
        } catch (error) {
          console.error('登录失败详情:', error);
        }
      },
      invalidatesTags: ['Auth']
    }),

    // 完成个人资料
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

    // 退出登录
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST'
      }),
      invalidatesTags: ['Auth', 'User']
    }),

    // 获取当前用户信息
    getCurrentUser: builder.query({
      query: () => '/auth/user',
      providesTags: ['Auth']
    }),

    // 注册新用户
    register: builder.mutation({
      query: (data) => {
        const { headers, ...requestData } = data;
        console.log('注册请求数据:', requestData, '请求头:', headers);
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
        console.log('注册响应数据:', response);
        return response;
      },
      transformErrorResponse: (response, meta, arg) => {
        console.error('注册错误响应:', response);
        return response;
      }
    }),

    // 发送验证码
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

    // 验证验证码
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

    // 重新发送验证码
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
      // 防止重复请求的自定义处理逻辑
      onQueryStarted: async (arg, { dispatch, queryFulfilled, getCacheEntry }) => {
        try {
          // 防止重复请求的逻辑将由RTK Query自动处理
          await queryFulfilled;
        } catch (error) {
          console.error('resendCode API error:', error);
        }
      }
    })
  })
});

// 导出自动生成的hooks
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