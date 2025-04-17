import { createSlice } from '@reduxjs/toolkit';

/**
 * 导航状态管理slice
 * 用于管理侧边栏菜单的活动状态
 */
const navSlice = createSlice({
  name: 'navigation',
  initialState: {
    activeMenu: 'dashboard' // 默认活动菜单为'dashboard'
  },
  reducers: {
    // 设置当前活动菜单
    setActiveMenu: (state, action) => {
      state.activeMenu = action.payload;
    }
  }
});

export const { setActiveMenu } = navSlice.actions;
export default navSlice.reducer; 