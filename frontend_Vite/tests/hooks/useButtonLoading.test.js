import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import useButtonLoading from '../../src/hooks/useButtonLoading';

describe('useButtonLoading Hook', () => {
  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useButtonLoading());
    
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.setLoading).toBe('function');
    expect(typeof result.current.withLoading).toBe('function');
  });
  
  it('should update loading state when setLoading is called', () => {
    const { result } = renderHook(() => useButtonLoading());
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.loading).toBe(true);
    
    act(() => {
      result.current.setLoading(false);
    });
    
    expect(result.current.loading).toBe(false);
  });
  
  it('should handle async function with withLoading', async () => {
    const { result } = renderHook(() => useButtonLoading());
    
    const mockAsyncFn = vi.fn().mockResolvedValue('success');
    
    // 使用withLoading包装异步函数
    const wrappedFn = result.current.withLoading(mockAsyncFn);
    
    // 初始状态应为非加载
    expect(result.current.loading).toBe(false);
    
    // 执行包装后的函数
    const promise = wrappedFn();
    
    // 函数执行期间应该设置loading为true
    expect(result.current.loading).toBe(true);
    
    // 等待异步操作完成
    await act(async () => {
      await promise;
    });
    
    // 完成后应该重置loading为false
    expect(result.current.loading).toBe(false);
    
    // 确保原始函数被调用
    expect(mockAsyncFn).toHaveBeenCalled();
  });
  
  it('should handle errors in async function', async () => {
    const { result } = renderHook(() => useButtonLoading());
    
    const error = new Error('Test error');
    const mockAsyncFn = vi.fn().mockRejectedValue(error);
    
    const wrappedFn = result.current.withLoading(mockAsyncFn);
    
    // 初始状态应为非加载
    expect(result.current.loading).toBe(false);
    
    // 执行包装后的函数，并捕获可能的错误
    let caughtError;
    await act(async () => {
      try {
        await wrappedFn();
      } catch (e) {
        caughtError = e;
      }
    });
    
    // 即使出错，完成后也应该重置loading为false
    expect(result.current.loading).toBe(false);
    
    // 确保错误被正确抛出
    expect(caughtError).toBe(error);
    
    // 确保原始函数被调用
    expect(mockAsyncFn).toHaveBeenCalled();
  });
}); 