import { createSlice } from '@reduxjs/toolkit';

/**
 * Navigation state management slice
 * Used to manage the active state of the sidebar menu
 */
const navSlice = createSlice({
  name: 'navigation',
  initialState: {
    activeMenu: 'dashboard' // Default active menu is 'dashboard'
  },
  reducers: {
    // Set current active menu
    setActiveMenu: (state, action) => {
      state.activeMenu = action.payload;
    }
  }
});

export const { setActiveMenu } = navSlice.actions;
export default navSlice.reducer; 