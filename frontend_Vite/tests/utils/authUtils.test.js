import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  isTokenValid,
  parseJwt,
  validateToken,
  handleTokenExpiration,
  startTokenValidation,
  stopTokenValidation
} from '../../src/utils/authUtils';

// 模拟依赖
vi.mock('antd', () => ({
  message: {
    error: vi.fn()
  }
}));

vi.mock('../../src/store/authSlice', () => ({
  logout: vi.fn()
}));

vi.mock('../../src/store', () => ({
  store: {
    dispatch: vi.fn()
  }
}));

describe('Auth Utilities', () => {
  beforeEach(() => {
    // 清空localStorage
    localStorage.clear();
    
    // 重置所有模拟
    vi.resetAllMocks();
    
    // 重置全局标志
    window.__handlingTokenExpiration = false;
    
    // 模拟fetch API
    global.fetch = vi.fn();
  });
  
  describe('Token Storage Functions', () => {
    it('should set auth token in localStorage', () => {
      const token = 'test-auth-token';
      setAuthToken(token);
      
      expect(localStorage.getItem('token')).toBe(token);
    });
    
    it('should get auth token from localStorage', () => {
      const token = 'test-auth-token';
      localStorage.setItem('token', token);
      
      expect(getAuthToken()).toBe(token);
    });
    
    it('should return null if token does not exist', () => {
      expect(getAuthToken()).toBeNull();
    });
    
    it('should remove auth token from localStorage', () => {
      localStorage.setItem('token', 'test-auth-token');
      
      removeAuthToken();
      
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
  
  describe('Token Validation Functions', () => {
    it('should return false for invalid token formats', () => {
      expect(isTokenValid('')).toBe(false);
      expect(isTokenValid(null)).toBe(false);
      expect(isTokenValid('invalid-format')).toBe(false);
    });
    
    it('should return false for expired token', () => {
      // 创建一个过期的JWT (exp设置为过去的时间)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      expect(isTokenValid(expiredToken)).toBe(false);
    });
    
    it('should successfully parse a valid JWT', () => {
      const payload = {
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022
      };
      
      // 创建一个包含给定payload的JWT
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const parsedPayload = parseJwt(token);
      
      expect(parsedPayload).toEqual(payload);
    });
    
    it('should return null when parsing fails', () => {
      expect(parseJwt('invalid-token')).toBeNull();
      expect(parseJwt('')).toBeNull();
      expect(parseJwt(null)).toBeNull();
    });
  });
  
  describe('Token Validation', () => {
    it('should return false if no token exists', async () => {
      const result = await validateToken();
      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('should validate token against API endpoint', async () => {
      // 设置token
      localStorage.setItem('token', 'test-token');
      
      // 模拟成功响应
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 2000, msg: 'success' })
      });
      
      const result = await validateToken();
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/auth/user', {
        method: 'GET',
        headers: {
          'token': 'test-token'
        }
      });
    });
    
    it('should handle expired token', async () => {
      // 设置token
      localStorage.setItem('token', 'expired-token');
      
      // 模拟过期响应
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ code: 3000, msg: 'Not logged in or login expired' })
      });
      
      // 模拟handleTokenExpiration函数
      const handleTokenExpirationSpy = vi.spyOn(window, 'handleTokenExpiration');
      
      const result = await validateToken();
      
      expect(result).toBe(false);
      expect(handleTokenExpirationSpy).toHaveBeenCalled();
    });
  });
  
  describe('Token Validation Intervals', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    
    afterEach(() => {
      vi.useRealTimers();
    });
    
    it('should start periodic token validation', () => {
      // 模拟validateToken
      vi.spyOn(window, 'validateToken').mockResolvedValue(true);
      
      const timer = startTokenValidation();
      
      expect(timer).toBeDefined();
      
      // 设置token以触发验证
      localStorage.setItem('token', 'test-token');
      
      // 前进一分钟
      vi.advanceTimersByTime(60 * 1000);
      
      expect(validateToken).toHaveBeenCalled();
    });
    
    it('should stop periodic token validation', () => {
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
      
      const timer = startTokenValidation();
      stopTokenValidation();
      
      expect(clearIntervalSpy).toHaveBeenCalledWith(timer);
    });
  });
}); 