import { describe, it, expect } from 'vitest';
import navReducer, {
  toggleSidebar,
  setSidebarOpen,
  setSidebarClosed,
  selectSidebarOpen
} from '../../src/store/navSlice';

describe('navSlice Reducer', () => {
  // 初始状态测试
  it('should return the initial state', () => {
    const initialState = {
      sidebarOpen: false
    };
    
    expect(navReducer(undefined, { type: undefined })).toEqual(initialState);
  });
  
  // 切换侧边栏状态测试
  it('should handle toggleSidebar', () => {
    // 从关闭到打开
    const closedState = {
      sidebarOpen: false
    };
    
    let action = toggleSidebar();
    let newState = navReducer(closedState, action);
    
    expect(newState.sidebarOpen).toBe(true);
    
    // 从打开到关闭
    const openState = {
      sidebarOpen: true
    };
    
    action = toggleSidebar();
    newState = navReducer(openState, action);
    
    expect(newState.sidebarOpen).toBe(false);
  });
  
  // 设置侧边栏打开测试
  it('should handle setSidebarOpen', () => {
    const previousState = {
      sidebarOpen: false
    };
    
    const action = setSidebarOpen();
    const newState = navReducer(previousState, action);
    
    expect(newState.sidebarOpen).toBe(true);
    
    // 测试从已打开状态设置为打开
    const alreadyOpenState = {
      sidebarOpen: true
    };
    
    const newStateFromOpen = navReducer(alreadyOpenState, action);
    expect(newStateFromOpen.sidebarOpen).toBe(true); // 应该保持为true
  });
  
  // 设置侧边栏关闭测试
  it('should handle setSidebarClosed', () => {
    const previousState = {
      sidebarOpen: true
    };
    
    const action = setSidebarClosed();
    const newState = navReducer(previousState, action);
    
    expect(newState.sidebarOpen).toBe(false);
    
    // 测试从已关闭状态设置为关闭
    const alreadyClosedState = {
      sidebarOpen: false
    };
    
    const newStateFromClosed = navReducer(alreadyClosedState, action);
    expect(newStateFromClosed.sidebarOpen).toBe(false); // 应该保持为false
  });
});

// 选择器测试
describe('navSlice Selectors', () => {
  it('should select sidebarOpen state when true', () => {
    const state = {
      nav: {
        sidebarOpen: true
      }
    };
    
    expect(selectSidebarOpen(state)).toBe(true);
  });
  
  it('should select sidebarOpen state when false', () => {
    const state = {
      nav: {
        sidebarOpen: false
      }
    };
    
    expect(selectSidebarOpen(state)).toBe(false);
  });
}); 