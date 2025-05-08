import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import navReducer from './navSlice';
import { baseApi } from './api/baseApi';
import { setupListeners } from '@reduxjs/toolkit/query';

// Generate unique namespace to prevent sharing Redux state across multiple tabs
const getStoreNamespace = () => {
  if (typeof window !== 'undefined' && window.PAGE_INSTANCE_ID) {
    return `store_${window.PAGE_INSTANCE_ID}`;
  }
  return 'default_store';
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    navigation: navReducer,
    // Add RTK Query API Reducer
    [baseApi.reducerPath]: baseApi.reducer,
    // Add other reducers as needed
  },
  // Add RTK Query middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
  devTools: {
    name: getStoreNamespace()
  }
});

// Optional but strongly recommended for refetchOnFocus/refetchOnReconnect features
setupListeners(store.dispatch);

export default store; 