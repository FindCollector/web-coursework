/**
 * API层导出文件
 * 导出所有API和兼容层，方便应用使用
 */

// 导出原始API函数（旧版本）
export * from './authApi';
export * from './userApi';

// 导出React Query兼容层
export * from './reactQueryCompat';

// 注释:
// 未来可以逐步移除对旧API的依赖，全部使用RTK Query
// 迁移顺序：
// 1. 先创建RTK Query的API slice
// 2. 在此导出兼容层
// 3. 逐步修改组件使用RTK Query而非旧API
// 4. 完全迁移后，移除旧API和兼容层 