import { useState, useEffect, useCallback } from 'react';

/**
 * Countdown hook
 * @param {number} initialValue - Initial countdown value (seconds)
 * @param {boolean} autoStart - Whether to start countdown automatically
 * @returns {Object} Countdown state and control functions
 */
const useCountdown = (initialValue = 60, autoStart = false) => {
  const [seconds, setSeconds] = useState(autoStart ? initialValue : 0);
  const [isActive, setIsActive] = useState(autoStart);
  const [hasFinished, setHasFinished] = useState(false);
  
  // Start countdown
  const start = useCallback((value = initialValue) => {
    setSeconds(value);
    setIsActive(true);
    setHasFinished(false);
  }, [initialValue]);
  
  // Pause countdown
  const pause = useCallback(() => {
    setIsActive(false);
  }, []);
  
  // Resume countdown
  const resume = useCallback(() => {
    if (seconds > 0) {
      setIsActive(true);
    }
  }, [seconds]);
  
  // Reset countdown
  const reset = useCallback((value = initialValue) => {
    setSeconds(value);
    setIsActive(false);
    setHasFinished(false);
  }, [initialValue]);
  
  // Countdown logic
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