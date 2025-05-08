# API 迁移完成说明

## 变更概述

我们已经完成了将项目中的所有 API 请求从 axios 迁移到 RTK Query 的工作。这项工作包括：

1. 将所有 API 调用替换为使用 RTK Query hooks
2. 移除旧的 axios 客户端实现
3. 简化 API 层结构
4. 提供更好的类型安全和缓存机制

## 主要变更

- 旧的 axios API 文件已移动到 `src/api-deprecated/` 目录
- 所有组件现在直接使用 RTK Query hooks
- `src/api/index.js` 现在仅提供迁移指导信息
- 文档 `docs/API_MIGRATION_PLAN.md` 记录了详细的迁移过程和结果

## 如何使用新的 API

在组件中导入并使用 RTK Query hooks：

```javascript
// 认证相关
import { 
  useLoginMutation, 
  useLogoutMutation,
  useGetCurrentUserQuery 
} from '../store/api/authApi';

// 用户管理相关
import { 
  useGetUserListQuery,
  useUpdateUserStatusMutation 
} from '../store/api/userApi';

// 教练相关
import { 
  useGetCoachDetailQuery,
  useUpdateCoachIntroMutation 
} from '../store/api/coachApi';
```

示例用法：

```javascript
const MyComponent = () => {
  // 登录
  const [login, { isLoading }] = useLoginMutation();
  
  // 查询用户列表
  const { data, error, isLoading: isLoadingUsers } = useGetUserListQuery({
    pageNow: 1,
    pageSize: 10,
    sortField: ['createTime'],
    sortOrder: ['desc']
  });
  
  const handleLogin = async (credentials) => {
    try {
      const result = await login(credentials).unwrap();
      // 处理成功登录
    } catch (error) {
      // 处理登录错误
    }
  };
  
  return (
    // 组件内容
  );
};
```

## 优势

1. **代码简化**：RTK Query 自动处理请求状态、加载状态和错误处理
2. **缓存机制**：自动缓存请求结果，减少不必要的网络请求
3. **保持状态同步**：自动使 Redux store 与服务器数据保持同步
4. **类型安全**：提供更好的 TypeScript 类型推断
5. **标准化**：统一的 API 定义方式，更易于维护

## 通知事项

如果您在尝试导入 `src/api/*` 路径时遇到错误，请改为直接从相应的 RTK Query 文件导入相关 hooks。

更多详细信息，请参考 [API 迁移计划文档](./docs/API_MIGRATION_PLAN.md)。 