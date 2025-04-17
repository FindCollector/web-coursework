# React Query 迁移到 RTK Query 指南

## 背景

我们的项目已经从React Query逐步迁移到RTK Query。两者都是用于数据获取和缓存的优秀库，但RTK Query与Redux集成更好，且能减少应用的状态管理复杂度。

## 当前状态

- 已创建RTK Query的基础配置
- 已创建用户管理和认证相关的API
- 已完成部分组件的迁移（UserManagement.jsx, Login.jsx）
- 创建了兼容层以支持渐进式迁移

## 迁移步骤

对于需要迁移的组件，按照以下步骤操作：

### 1. 修改导入语句
```jsx
// 旧代码
import { useQuery, useMutation } from '@tanstack/react-query';
import { getUserList, updateUserStatus } from '../../api/userApi';

// 新代码
import { 
  useGetUserListQuery, 
  useUpdateUserStatusMutation 
} from '../../store/api/userApi';
```

### 2. 修改查询（Query）

#### 旧代码
```jsx
const { data, isLoading, refetch } = useQuery({
  queryKey: ['users', pagination.current, pagination.pageSize, filters, sorter],
  queryFn: () => getUserList({
    pageNow: pagination.current,
    pageSize: pagination.pageSize,
    ...filters,
    sortField: sorter.field ? [sorter.field] : [],
    sortOrder: sorter.order ? [sorter.order === 'ascend' ? 'asc' : 'desc'] : []
  }),
  keepPreviousData: true,
});
```

#### 新代码
```jsx
const { data, isLoading, refetch } = useGetUserListQuery({
  pageNow: pagination.current,
  pageSize: pagination.pageSize,
  ...filters,
  sortField: sorter.field ? [sorter.field] : [],
  sortOrder: sorter.order ? [sorter.order === 'ascend' ? 'asc' : 'desc'] : []
});
```

### 3. 修改变更（Mutation）

#### 旧代码
```jsx
const updateStatusMutation = useMutation({
  mutationFn: ({ userId, status }) => updateUserStatus(userId, status),
  onMutate: () => {
    console.log('Starting to update user status...');
  },
  onSuccess: (data) => {
    // 处理成功
  },
  onError: (error) => {
    // 处理错误
  }
});

// 调用
updateStatusMutation.mutate({ userId, status: 0 });
```

#### 新代码
```jsx
const [updateUserStatus, updateStatusResult] = useUpdateUserStatusMutation();

// 调用 - 方式1（推荐）
updateUserStatus({ userId, status: 0 })
  .unwrap()
  .then(data => {
    // 处理成功
  })
  .catch(error => {
    // 处理错误
  });

// 调用 - 方式2（async/await）
try {
  const result = await updateUserStatus({ userId, status: 0 }).unwrap();
  // 处理成功
} catch (error) {
  // 处理错误
}
```

### 4. 监听状态

#### 旧代码
```jsx
const isDeleting = useIsMutating({ mutationKey: deleteUserMutation.mutationKey }) > 0;
```

#### 新代码
```jsx
const [deleteUser, deleteUserResult] = useDeleteUserMutation();
const isDeleting = deleteUserResult.isLoading;
```

## 常见问题

### 1. 如何处理缓存失效？

RTK Query会通过`invalidatesTags`自动处理缓存失效，不需要手动调用`queryClient.invalidateQueries()`

### 2. 如何处理数据转换？

RTK Query提供了`transformResponse`选项，可以在API slice中定义：

```js
transformResponse: (response) => {
  // 转换响应数据
  return transformedData;
}
```

### 3. 如何处理乐观更新？

RTK Query提供了`onQueryStarted`来处理乐观更新：

```js
onQueryStarted: async (arg, { dispatch, queryFulfilled, getCacheEntry }) => {
  // 执行乐观更新
  const patchResult = dispatch(
    api.util.updateQueryData('getUsers', arg, draft => {
      // 修改draft以实现乐观更新
    })
  );
  
  try {
    await queryFulfilled;
  } catch {
    // 出错时回滚更新
    patchResult.undo();
  }
}
```

## 迁移检查清单

- [ ] 从API层移除React Query导入
- [ ] 使用RTK Query的hook代替React Query
- [ ] 更新所有API调用
- [ ] 测试功能是否正常
- [ ] 移除不必要的状态管理代码

## 完成迁移后的清理

迁移完成后，要执行以下清理操作：

1. 移除React Query相关依赖
2. 移除兼容层代码
3. 移除旧版API文件
4. 确保package.json中不再有React Query依赖

## 帮助

如果遇到迁移问题，请参考：

- [RTK Query文档](https://redux-toolkit.js.org/rtk-query/overview)
- 项目已迁移的文件作为样例
- 兼容层`src/api/reactQueryCompat.js`查看转换逻辑 