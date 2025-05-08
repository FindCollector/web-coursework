import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useModalState from '../../src/hooks/useModalState';

describe('useModalState Hook', () => {
  it('should initialize with isOpen as false', () => {
    const { result } = renderHook(() => useModalState());
    
    expect(result.current.isOpen).toBe(false);
    expect(typeof result.current.openModal).toBe('function');
    expect(typeof result.current.closeModal).toBe('function');
    expect(typeof result.current.toggleModal).toBe('function');
  });
  
  it('should open modal when openModal is called', () => {
    const { result } = renderHook(() => useModalState());
    
    act(() => {
      result.current.openModal();
    });
    
    expect(result.current.isOpen).toBe(true);
  });
  
  it('should close modal when closeModal is called', () => {
    const { result } = renderHook(() => useModalState(true)); // 初始状态为打开
    
    expect(result.current.isOpen).toBe(true);
    
    act(() => {
      result.current.closeModal();
    });
    
    expect(result.current.isOpen).toBe(false);
  });
  
  it('should toggle modal state when toggleModal is called', () => {
    const { result } = renderHook(() => useModalState());
    
    // 初始状态为关闭，切换后应该为打开
    act(() => {
      result.current.toggleModal();
    });
    
    expect(result.current.isOpen).toBe(true);
    
    // 再次切换，应该为关闭
    act(() => {
      result.current.toggleModal();
    });
    
    expect(result.current.isOpen).toBe(false);
  });
  
  it('should initialize with custom initial state', () => {
    const { result } = renderHook(() => useModalState(true));
    
    expect(result.current.isOpen).toBe(true);
  });
  
  it('should keep modal open when openModal is called on an open modal', () => {
    const { result } = renderHook(() => useModalState(true));
    
    expect(result.current.isOpen).toBe(true);
    
    act(() => {
      result.current.openModal();
    });
    
    expect(result.current.isOpen).toBe(true); // 应该保持打开状态
  });
  
  it('should keep modal closed when closeModal is called on a closed modal', () => {
    const { result } = renderHook(() => useModalState(false));
    
    expect(result.current.isOpen).toBe(false);
    
    act(() => {
      result.current.closeModal();
    });
    
    expect(result.current.isOpen).toBe(false); // 应该保持关闭状态
  });
}); 