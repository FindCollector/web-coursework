/**
 * 兼容层 - 过渡使用
 * 
 * 此文件已弃用，请直接从 src/store/api 导入相关 hooks
 * 例如: 
 * import { useGetUserListQuery } from '../store/api/userApi';
 * import { useGetCoachDetailQuery } from '../store/api/coachApi';
 */

import { 
  useGetUserListQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation
} from '../store/api/userApi';

import {
  useGetCoachDetailQuery
} from '../store/api/coachApi';

// 导出旧函数名的存根函数，但实际使用新API
export const getUserList = async (params) => {
  console.warn('使用已弃用的 getUserList() 函数，请迁移到 useGetUserListQuery hook');
  throw new Error('此函数已弃用，请使用 useGetUserListQuery hook');
};

export const updateUserStatus = async (userId, status) => {
  console.warn('使用已弃用的 updateUserStatus() 函数，请迁移到 useUpdateUserStatusMutation hook');
  throw new Error('此函数已弃用，请使用 useUpdateUserStatusMutation hook');
};

export const deleteUser = async (userId) => {
  console.warn('使用已弃用的 deleteUser() 函数，请迁移到 useDeleteUserMutation hook');
  throw new Error('此函数已弃用，请使用 useDeleteUserMutation hook');
};

export const getCoachDetails = async () => {
  console.warn('使用已弃用的 getCoachDetails() 函数，请迁移到 useGetCoachDetailQuery hook');
  throw new Error('此函数已弃用，请使用 useGetCoachDetailQuery hook');
}; 