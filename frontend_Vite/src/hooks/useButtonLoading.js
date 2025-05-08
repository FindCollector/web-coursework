import { useState, useCallback } from 'react';

/**
 * Custom hook for managing button loading state
 * @param {boolean} initialState - Initial loading state
 * @returns {Array} - Loading state and control functions [isLoading, setLoading, withLoading]
 */
const useButtonLoading = (initialState = false) => {
  const [isLoading, setLoading] = useState(initialState);
  
  /**
   * Higher-order function to handle loading state during async operations
   * @param {Function} asyncFn - Async function to wrap with loading state
   * @returns {Function} - Wrapped function that manages loading state
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