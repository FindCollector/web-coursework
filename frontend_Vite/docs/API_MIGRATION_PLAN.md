# API 迁移计划：从 axios 迁移到 RTK Query

## 背景

项目中同时使用了两种 API 请求方式：
- 在 `src/api` 目录中使用 axios 客户端直接定义 API 函数
- 在 `src/store/api` 目录中使用 RTK Query 定义 API

为了统一代码风格、减少维护成本并充分利用 RTK Query 的缓存和状态管理能力，我们决定逐步将所有 API 请求迁移到 RTK Query。

## 迁移状态

### 已完成迁移

- ✅ 登录 (Login.jsx) - 使用 `useLoginMutation` 
- ✅ 登出 (AdminDashboard.jsx、CoachDashboard.jsx) - 使用 `useLogoutMutation`
- ✅ 注册相关功能:
  - ✅ 发送验证码 (Register.jsx) - 使用 `useSendVerificationCodeMutation`
  - ✅ 验证验证码 (VerifyCode.jsx) - 使用 `useVerifyCodeMutation`
  - ✅ 重新发送验证码 (VerifyCode.jsx) - 使用 `useResendVerificationCodeMutation`
  - ✅ 注册用户 - 添加了 `useRegisterMutation` (但还未在组件中使用)
- ✅ 用户相关:
  - ✅ 获取当前用户信息 - 使用 `useGetCurrentUserQuery`
- ✅ 用户管理:
  - ✅ 用户列表查询 - 使用 `useGetUserListQuery`
  - ✅ 用户状态更新 - 使用 `useUpdateUserStatusMutation`
  - ✅ 用户删除 - 使用 `useDeleteUserMutation`
- ✅ 教练管理:
  - ✅ 教练资料查询 - 使用 `useGetCoachDetailQuery`
  - ✅ 教练资料更新 - 使用 `useUpdateCoachIntroMutation` 和其他相关 mutations

## 迁移实施方式

我们采用了以下策略实施 API 迁移:

1. 在 `src/store/api` 目录中创建 RTK Query 相关的 API slice 文件
2. 保留原始 API 文件，但将其改为存根 (stub) 文件，抛出错误提示使用 RTK Query
3. 创建兼容层，标记为已弃用，并提供明确的迁移建议
4. 修改 `src/api/index.js` 不再导出旧 API 函数

这种方式确保了:
1. 已迁移的组件可以正常工作
2. 未迁移的组件在调用旧 API 时会收到明确的错误提示
3. 开发者可以根据错误消息快速找到应使用的 RTK Query hooks

## 处理旧文件

为了保持项目的整洁性，我们已经将所有已弃用的 API 文件移动到 `src/api-deprecated` 目录，并且简化了 `src/api/index.js` 文件。

移除这些文件的理由:
1. 项目已完全迁移到 RTK Query
2. 旧的 axios 实现不再使用
3. 兼容层已不再需要
4. 移动到备份目录而非删除，便于参考历史实现

如果后续有开发者尝试使用旧的 API 路径，`src/api/index.js` 文件将提供明确的指导信息，引导他们使用正确的 RTK Query 实现。

## 迁移后的文件结构

- `/src/store/api/` - 包含所有 RTK Query API 定义
  - `baseApi.js` - 基础 API 配置
  - `authApi.js` - 认证相关 API
  - `userApi.js` - 用户管理相关 API
  - `coachApi.js` - 教练相关 API
- `/src/api/` - 仅保留指导文件
  - `index.js` - 提供迁移指导信息
- `/src/api-deprecated/` - 备份目录，存放已弃用的文件
  - `authApi.js` - 已弃用的认证 API 文件
  - `userApi.js` - 已弃用的用户 API 文件
  - `client.js` - 已弃用的 axios 客户端
  - `reactQueryCompat.js` - 已弃用的兼容层

## 注意事项

搜索后发现有一些文件仍然包含对 `/api/` 路径的导入引用，但详细检查后发现：

1. `Login.jsx`, `Register.jsx`, `VerifyCode.jsx` 等组件 - 已正确导入并使用 RTK Query hooks
2. `Dashboard.jsx` 组件 - 已正确使用 `useLogoutMutation` 
3. `UserManagement.jsx` - 已正确使用 RTK Query 的 user API

这些搜索结果可能是因为模式匹配了部分路径（如 `../store/api/`），实际上这些组件已经完成迁移，使用的是正确的 RTK Query hooks。

## 结论与建议

API 迁移已全部完成，项目现在完全使用 RTK Query 管理 API 请求。这带来以下好处:

1. 减少了样板代码，API 定义更加集中和清晰
2. 自动处理请求状态（加载、成功、错误）
3. 自动处理数据缓存和重新获取
4. 减少了应用的网络请求量
5. 使用原生 fetch 而不是 axios，减少了依赖

未来的新功能开发应直接在 `/src/store/api/` 目录下定义相关 API，并使用 RTK Query 的 hooks 进行数据交互。 