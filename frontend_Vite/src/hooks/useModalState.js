import { useState, useCallback } from 'react';

/**
 * Hook for managing modal state
 * @param {boolean} initialValue - Initial visibility state of the modal
 * @returns {Array} - [visible, setVisible, show, hide, toggle]
 */
const useModalState = (initialValue = false) => {
  const [visible, setVisible] = useState(initialValue);
  
  /**
   * Show the modal
   */
  const show = useCallback(() => {
    setVisible(true);
  }, []);
  
  /**
   * Hide the modal
   */
  const hide = useCallback(() => {
    setVisible(false);
  }, []);
  
  /**
   * Toggle the modal state
   */
  const toggle = useCallback(() => {
    setVisible(prev => !prev);
  }, []);
  
  return [visible, setVisible, show, hide, toggle];
};

export default useModalState; 