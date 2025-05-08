import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useCountdown from '../../src/hooks/useCountdown';

describe('useCountdown Hook', () => {
  beforeEach(() => {
    // 使用模拟计时器
    vi.useFakeTimers();
  });

  afterEach(() => {
    // 恢复真实计时器
    vi.useRealTimers();
  });

  it('should initialize with the correct initial values', () => {
    const initialSeconds = 60;
    const { result } = renderHook(() => useCountdown(initialSeconds));
    
    expect(result.current.seconds).toBe(initialSeconds);
    expect(result.current.isActive).toBe(false);
    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });
  
  it('should start the countdown when start is called', () => {
    const initialSeconds = 60;
    const { result } = renderHook(() => useCountdown(initialSeconds));
    
    act(() => {
      result.current.start();
    });
    
    expect(result.current.isActive).toBe(true);
    
    // 时间前进1秒
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.seconds).toBe(initialSeconds - 1);
  });
  
  it('should stop the countdown when stop is called', () => {
    const initialSeconds = 60;
    const { result } = renderHook(() => useCountdown(initialSeconds));
    
    act(() => {
      result.current.start();
    });
    
    expect(result.current.isActive).toBe(true);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.seconds).toBe(initialSeconds - 1);
    
    act(() => {
      result.current.stop();
    });
    
    expect(result.current.isActive).toBe(false);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // 停止后秒数不再减少
    expect(result.current.seconds).toBe(initialSeconds - 1);
  });
  
  it('should reset the countdown when reset is called', () => {
    const initialSeconds = 60;
    const { result } = renderHook(() => useCountdown(initialSeconds));
    
    act(() => {
      result.current.start();
    });
    
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(result.current.seconds).toBe(initialSeconds - 5);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.seconds).toBe(initialSeconds);
    expect(result.current.isActive).toBe(false);
  });
  
  it('should automatically stop when countdown reaches zero', () => {
    const initialSeconds = 3;
    const { result } = renderHook(() => useCountdown(initialSeconds));
    
    act(() => {
      result.current.start();
    });
    
    expect(result.current.isActive).toBe(true);
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(result.current.seconds).toBe(0);
    expect(result.current.isActive).toBe(false);
    
    // 确保不会继续减少到负数
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.seconds).toBe(0);
  });
  
  it('should call onComplete callback when countdown reaches zero', () => {
    const initialSeconds = 2;
    const onComplete = vi.fn();
    
    const { result } = renderHook(() => useCountdown(initialSeconds, onComplete));
    
    act(() => {
      result.current.start();
    });
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(result.current.seconds).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
}); 