/**
 * React Query兼容层
 * 这个文件提供与React Query相同签名的函数和hooks，但内部使用RTK Query
 * 这样可以让旧代码暂时继续工作，避免同时迁移所有组件导致的风险
 */

import { useEffect, useState } from 'react';
import { 
  useGetUserListQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
} from '../store/api/userApi';

import {
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useSendVerificationCodeMutation,
  useVerifyCodeMutation,
  useResendVerificationCodeMutation
} from '../store/api/authApi';

// ===== React Query 兼容层 hooks =====

/**
 * 兼容React Query的useQuery hook
 */
export function useQuery(options) {
  const { queryKey, queryFn, keepPreviousData = false } = options;
  
  // 根据queryKey判断要使用哪个RTK Query的hook
  if (queryKey[0] === 'users') {
    const [,pageNow, pageSize, filters, sorter] = queryKey;
    
    // 构建RTK Query的参数
    const params = {
      pageNow,
      pageSize,
      ...filters,
      sortField: sorter?.field ? [sorter.field] : [],
      sortOrder: sorter?.order ? [sorter.order === 'ascend' ? 'asc' : 'desc'] : []
    };
    
    // 使用RTK Query的hook
    const result = useGetUserListQuery(params);
    
    // 将RTK Query的结果转换回React Query的格式
    return {
      data: result.data,
      isLoading: result.isLoading,
      isError: result.isError,
      error: result.error,
      refetch: result.refetch
    };
  }
  
  // 如果不是已知的查询，则调用原始函数
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  
  const refetch = async () => {
    setIsLoading(true);
    try {
      const result = await queryFn();
      setData(result);
      setIsError(false);
      setError(null);
      return result;
    } catch (err) {
      setIsError(true);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    refetch();
  }, [...queryKey]);
  
  return { data, isLoading, isError, error, refetch };
}

/**
 * 兼容React Query的useMutation hook
 */
export function useMutation(options) {
  const { mutationFn, onMutate, onSuccess, onError, onSettled } = options;
  
  // 根据mutationFn判断要使用哪个RTK Query的mutation
  if (mutationFn.name === 'updateUserStatus') {
    const [updateStatus, result] = useUpdateUserStatusMutation();
    
    return {
      mutate: (args, options = {}) => {
        if (onMutate) onMutate(args);
        
        updateStatus(args)
          .unwrap()
          .then(data => {
            if (options.onSuccess) options.onSuccess(data, args);
            if (onSuccess) onSuccess(data, args);
          })
          .catch(error => {
            if (options.onError) options.onError(error, args);
            if (onError) onError(error, args);
          })
          .finally(() => {
            if (options.onSettled) options.onSettled();
            if (onSettled) onSettled();
          });
      },
      mutateAsync: async (args, options = {}) => {
        if (onMutate) onMutate(args);
        
        try {
          const data = await updateStatus(args).unwrap();
          if (options.onSuccess) options.onSuccess(data, args);
          if (onSuccess) onSuccess(data, args);
          return data;
        } catch (error) {
          if (options.onError) options.onError(error, args);
          if (onError) onError(error, args);
          throw error;
        } finally {
          if (options.onSettled) options.onSettled();
          if (onSettled) onSettled();
        }
      },
      status: result.status === 'pending' ? 'loading' : result.status,
      reset: () => {},
      error: result.error,
      data: result.data
    };
  }
  
  if (mutationFn.name === 'deleteUser') {
    const [deleteUser, result] = useDeleteUserMutation();
    
    return {
      mutate: (args, options = {}) => {
        if (onMutate) onMutate(args);
        
        deleteUser(args)
          .unwrap()
          .then(data => {
            if (options.onSuccess) options.onSuccess(data, args);
            if (onSuccess) onSuccess(data, args);
          })
          .catch(error => {
            if (options.onError) options.onError(error, args);
            if (onError) onError(error, args);
          })
          .finally(() => {
            if (options.onSettled) options.onSettled();
            if (onSettled) onSettled();
          });
      },
      mutateAsync: async (args, options = {}) => {
        if (onMutate) onMutate(args);
        
        try {
          const data = await deleteUser(args).unwrap();
          if (options.onSuccess) options.onSuccess(data, args);
          if (onSuccess) onSuccess(data, args);
          return data;
        } catch (error) {
          if (options.onError) options.onError(error, args);
          if (onError) onError(error, args);
          throw error;
        } finally {
          if (options.onSettled) options.onSettled();
          if (onSettled) onSettled();
        }
      },
      status: result.status === 'pending' ? 'loading' : result.status,
      reset: () => {},
      error: result.error,
      data: result.data,
      mutationKey: ['deleteUser']
    };
  }

  if (mutationFn.name === 'login') {
    const [login, result] = useLoginMutation();
    
    return {
      mutate: (args, options = {}) => {
        if (onMutate) onMutate(args);
        
        login(args)
          .unwrap()
          .then(data => {
            if (options.onSuccess) options.onSuccess(data, args);
            if (onSuccess) onSuccess(data, args);
          })
          .catch(error => {
            if (options.onError) options.onError(error, args);
            if (onError) onError(error, args);
          });
      }
    };
  }
  
  // 如果不是已知的mutation，返回模拟对象
  return {
    mutate: async (args, options = {}) => {
      if (onMutate) onMutate(args);
      
      try {
        const data = await mutationFn(args);
        if (options.onSuccess) options.onSuccess(data, args);
        if (onSuccess) onSuccess(data, args);
        return data;
      } catch (error) {
        if (options.onError) options.onError(error, args);
        if (onError) onError(error, args);
        throw error;
      } finally {
        if (options.onSettled) options.onSettled();
        if (onSettled) onSettled();
      }
    },
    mutateAsync: async (args, options = {}) => {
      if (onMutate) onMutate(args);
      
      try {
        const data = await mutationFn(args);
        if (options.onSuccess) options.onSuccess(data, args);
        if (onSuccess) onSuccess(data, args);
        return data;
      } catch (error) {
        if (options.onError) options.onError(error, args);
        if (onError) onError(error, args);
        throw error;
      } finally {
        if (options.onSettled) options.onSettled();
        if (onSettled) onSettled();
      }
    },
    status: 'idle',
    reset: () => {},
    error: null,
    data: null
  };
}

// useQueryClient的简单模拟
export function useQueryClient() {
  return {
    invalidateQueries: () => Promise.resolve(),
    setQueryData: () => {},
    getQueryData: () => null
  };
}

// useIsMutating的简单模拟
export function useIsMutating() {
  return 0;
} 