import { useState, useCallback } from 'react';

/**
 * 管理模态框状态的 hook
 * @param {boolean} initialValue - 模态框初始显示状态
 * @returns {Array} - [visible, setVisible, show, hide, toggle]
 */
const useModalState = (initialValue = false) => {
  const [visible, setVisible] = useState(initialValue);
  
  /**
   * 显示模态框
   */
  const show = useCallback(() => {
    console.log("调用show函数，设置模态框显示");
    setVisible(true);
  }, []);
  
  /**
   * 隐藏模态框
   */
  const hide = useCallback(() => {
    console.log("调用hide函数，设置模态框隐藏");
    setVisible(false);
  }, []);
  
  /**
   * 切换模态框状态
   */
  const toggle = useCallback(() => {
    setVisible(prev => {
      const newState = !prev;
      console.log(`调用toggle函数，模态框状态从${prev}变为${newState}`);
      return newState;
    });
  }, []);
  
  return [visible, setVisible, show, hide, toggle];
};

export default useModalState; 