import { useState, useCallback } from 'react';

/**
 * 管理按钮加载状态的 hook
 * @param {boolean} initialState - 初始加载状态
 * @returns {Array} - [isLoading, setLoading, withLoading]
 */
const useButtonLoading = (initialState = false) => {
  const [isLoading, setLoading] = useState(initialState);
  
  /**
   * 包装异步操作，自动管理加载状态
   * @param {Function} asyncFn - 异步函数
   * @returns {Function} - 包装后的函数
   */
  const withLoading = useCallback((asyncFn) => async (...args) => {
    if (isLoading) {
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await asyncFn(...args);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isLoading]);
  
  return [isLoading, setLoading, withLoading];
};

export default useButtonLoading; 