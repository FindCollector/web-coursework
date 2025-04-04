import { useState, useEffect, useCallback } from 'react';

/**
 * 倒计时 hook
 * @param {number} initialValue - 初始倒计时值（秒）
 * @param {boolean} autoStart - 是否自动开始倒计时
 * @returns {Object} 倒计时状态和控制函数
 */
const useCountdown = (initialValue = 60, autoStart = false) => {
  const [seconds, setSeconds] = useState(autoStart ? initialValue : 0);
  const [isActive, setIsActive] = useState(autoStart);
  const [hasFinished, setHasFinished] = useState(false);
  
  // 开始倒计时
  const start = useCallback((value = initialValue) => {
    setSeconds(value);
    setIsActive(true);
    setHasFinished(false);
  }, [initialValue]);
  
  // 暂停倒计时
  const pause = useCallback(() => {
    setIsActive(false);
  }, []);
  
  // 恢复倒计时
  const resume = useCallback(() => {
    if (seconds > 0) {
      setIsActive(true);
    }
  }, [seconds]);
  
  // 重置倒计时
  const reset = useCallback((value = initialValue) => {
    setSeconds(value);
    setIsActive(false);
    setHasFinished(false);
  }, [initialValue]);
  
  // 倒计时逻辑
  useEffect(() => {
    let timerId;
    
    if (isActive && seconds > 0) {
      timerId = setTimeout(() => {
        setSeconds(seconds - 1);
      }, 1000);
    } else if (isActive && seconds === 0) {
      setIsActive(false);
      setHasFinished(true);
    }
    
    return () => clearTimeout(timerId);
  }, [isActive, seconds]);
  
  return {
    seconds,
    isActive,
    hasFinished,
    start,
    pause,
    resume,
    reset
  };
};

export default useCountdown; 