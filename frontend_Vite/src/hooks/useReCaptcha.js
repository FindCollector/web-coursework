import { useState, useEffect, useCallback } from 'react';

/**
 * 加载并获取 reCAPTCHA token
 * @param {string} siteKey - reCAPTCHA site key
 * @returns {Object} - reCAPTCHA 相关的状态和函数
 */
const useReCaptcha = (siteKey = '6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y') => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 检测 grecaptcha 对象是否可用
  useEffect(() => {
    if (!isScriptLoaded) return;

    // 设置一个定时器来检查 grecaptcha 是否完全加载
    const checkGrecaptchaInterval = setInterval(() => {
      if (window.grecaptcha && window.grecaptcha.enterprise) {
        clearInterval(checkGrecaptchaInterval);
        setIsInitialized(true);
        setIsLoading(false);
      }
    }, 100);

    // 设置超时，避免无限检查
    const timeoutId = setTimeout(() => {
      clearInterval(checkGrecaptchaInterval);
      if (!isInitialized) {
        setError('reCAPTCHA 初始化失败，请刷新页面');
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      clearInterval(checkGrecaptchaInterval);
      clearTimeout(timeoutId);
    };
  }, [isScriptLoaded, isInitialized]);

  // 加载 reCAPTCHA 脚本
  useEffect(() => {
    // 检查是否已经加载了脚本
    if (document.querySelector('script[src*="recaptcha/enterprise.js"]')) {
      setIsScriptLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
    script.async = true;
    script.id = 'recaptcha-script';
    
    script.onload = () => {
      setIsScriptLoaded(true);
    };
    
    script.onerror = (e) => {
      setError('Failed to load reCAPTCHA');
      setIsLoading(false);
    };
    
    document.body.appendChild(script);
    
    return () => {
      // 不在卸载时删除脚本，因为其他组件可能正在使用
      // 在 SPA 中，我们通常希望 reCAPTCHA 脚本只加载一次
    };
  }, [siteKey]);

  /**
   * 获取 reCAPTCHA token
   * @param {string} action - reCAPTCHA 操作类型
   * @returns {Promise<string>} reCAPTCHA token
   */
  const getToken = useCallback(async (action) => {
    if (!window.grecaptcha?.enterprise) {
      throw new Error('reCAPTCHA is not ready');
    }
    
    try {
      const token = await window.grecaptcha.enterprise.execute(
        siteKey,
        { action }
      );
      return token;
    } catch (error) {
      throw error;
    }
  }, [siteKey]);

  /**
   * 执行 reCAPTCHA 验证并获取 token
   * 更友好的函数名，功能与 getToken 相同
   * @param {string} action - reCAPTCHA 操作类型
   * @returns {Promise<string>} reCAPTCHA token
   */
  const executeReCaptcha = useCallback(async (action) => {
    return getToken(action);
  }, [getToken]);

  return {
    isScriptLoaded,
    isInitialized,
    isLoading,
    error,
    getToken,
    executeReCaptcha
  };
};

export default useReCaptcha; 