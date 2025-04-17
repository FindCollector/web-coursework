/**
 * 提示: API 访问已迁移
 * 
 * 项目中的所有 API 请求现在都通过 RTK Query 实现。
 * 请直接从相应的 store/api 目录导入需要的 hooks。
 * 
 * 例如:
 * - import { useLoginMutation } from '../store/api/authApi';
 * - import { useGetUserListQuery } from '../store/api/userApi';
 * - import { useGetCoachDetailQuery } from '../store/api/coachApi';
 * 
 * 请参考 /docs/API_MIGRATION_PLAN.md 获取更多信息。
 */

// 仅导出一个函数，显示警告信息
export const apiMigrationNotice = () => {
  console.warn(
    '注意: 项目 API 层已迁移到 RTK Query。' +
    '请直接从 store/api/ 目录导入相关 hooks。' +
    '参见 /docs/API_MIGRATION_PLAN.md 文件获取详情。'
  );
  return false;
};

// 不再导出旧版 API 函数，完全使用 RTK Query
// export * from './authApi';
// export * from './userApi';

// 不再需要兼容层
// export * from './reactQueryCompat';

// 注释:
// API迁移已完成，完全使用RTK Query
// 旧API函数和兼容层已移除
// 所有组件现在都直接从 src/store/api/ 目录导入 RTK Query hooks 