import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { baseApi } from './api/baseApi';
import { setupListeners } from '@reduxjs/toolkit/query';

// 生成唯一的命名空间，防止多标签页共享Redux状态
const getStoreNamespace = () => {
  if (typeof window !== 'undefined' && window.PAGE_INSTANCE_ID) {
    return `store_${window.PAGE_INSTANCE_ID}`;
  }
  return 'default_store';
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // 添加RTK Query的API Reducer
    [baseApi.reducerPath]: baseApi.reducer,
    // 可根据需要添加其他reducer
  },
  // 添加RTK Query的中间件
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
  devTools: {
    name: getStoreNamespace()
  }
});

// 可选: 但是强烈推荐添加这个，用于refetchOnFocus/refetchOnReconnect功能
setupListeners(store.dispatch);

export default store; 