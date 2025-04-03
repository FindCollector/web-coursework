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
        url: '/coach/upload/photo',
        method: 'POST',
        body: formData,
        // 不设置Content-Type，让浏览器自动设置为multipart/form-data
        formData: true,
      }),
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
    })
  })
});

// 导出自动生成的hooks
export const {
  useCheckCoachDetailsQuery,
  useGetCoachDetailQuery,
  useUpdateCoachIntroMutation,
  useUploadCoachPhotoMutation,
  useUpdateCoachTagsMutation
} = coachApi; 