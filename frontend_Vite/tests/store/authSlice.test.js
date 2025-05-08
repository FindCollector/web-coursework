import { describe, it, expect } from 'vitest';
import authReducer, {
  login,
  logout,
  updateUser,
  selectIsAuthenticated,
  selectUser,
  selectToken
} from '../../src/store/authSlice';

// Vitest 对 jsdom 提供的 localStorage 进行复位
beforeEach(() => {
  localStorage.clear();
});

describe('authSlice Reducer', () => {
  // 初始状态测试
  it('should return the initial state', () => {
    const initialState = {
      user: null,
      token: null,
      isAuthenticated: false
    };
    
    expect(authReducer(undefined, { type: undefined })).toEqual(initialState);
  });
  
  // 登录测试
  it('should handle login', () => {
    const previousState = {
      user: null,
      token: null,
      isAuthenticated: false
    };
    
    const userData = { id: 1, username: 'testuser', role: 'member' };
    const token = 'test-token-123';
    
    const action = login({ user: userData, token });
    const newState = authReducer(previousState, action);
    
    expect(newState.user).toEqual(userData);
    expect(newState.token).toEqual(token);
    expect(newState.isAuthenticated).toEqual(true);
  });
  
  // 登出测试
  it('should handle logout', () => {
    const previousState = {
      user: { id: 1, username: 'testuser', role: 'member' },
      token: 'test-token-123',
      isAuthenticated: true
    };
    
    const action = logout();
    const newState = authReducer(previousState, action);
    
    expect(newState.user).toBeNull();
    expect(newState.token).toBeNull();
    expect(newState.isAuthenticated).toBe(false);
  });
  
  // 更新用户信息测试
  it('should handle updateUser', () => {
    const previousState = {
      user: { id: 1, username: 'testuser', role: 'member', email: 'test@example.com' },
      token: 'test-token-123',
      isAuthenticated: true
    };
    
    const updatedUserData = { id: 1, username: 'updated-username', role: 'member', email: 'test@example.com' };
    
    const action = updateUser(updatedUserData);
    const newState = authReducer(previousState, action);
    
    expect(newState.user).toEqual(updatedUserData);
    expect(newState.token).toEqual(previousState.token);
    expect(newState.isAuthenticated).toBe(true);
  });
});

// 选择器测试
describe('authSlice Selectors', () => {
  const state = {
    auth: {
      user: { id: 1, name: 'Test User' },
      token: 'test-auth-token',
      isAuthenticated: true
    }
  };
  
  it('should select isAuthenticated state', () => {
    expect(selectIsAuthenticated(state)).toBe(true);
  });
  
  it('should select user state', () => {
    expect(selectUser(state)).toEqual({ id: 1, name: 'Test User' });
  });
  
  it('should select token state', () => {
    expect(selectToken(state)).toBe('test-auth-token');
  });
}); 