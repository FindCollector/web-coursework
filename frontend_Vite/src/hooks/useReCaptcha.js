import { useState, useEffect, useCallback } from 'react';

const useReCaptcha = (siteKey = '6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y') => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if grecaptcha object is available
  useEffect(() => {
    if (!isScriptLoaded) return;

    // Set a timer to check if grecaptcha is fully loaded
    const checkGrecaptchaInterval = setInterval(() => {
      if (window.grecaptcha && window.grecaptcha.enterprise) {
        clearInterval(checkGrecaptchaInterval);
        setIsInitialized(true);
        setIsLoading(false);
      }
    }, 100);

    // Set timeout to avoid infinite checking
    const timeoutId = setTimeout(() => {
      clearInterval(checkGrecaptchaInterval);
      if (!isInitialized) {
        setError('reCAPTCHA initialization failed, please refresh the page');
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      clearInterval(checkGrecaptchaInterval);
      clearTimeout(timeoutId);
    };
  }, [isScriptLoaded, isInitialized]);

  // Load reCAPTCHA script
  useEffect(() => {
    // Check if script is already loaded
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
      // Don't remove the script when unmounting, other components may be using it
      // In SPAs, we typically want the reCAPTCHA script to be loaded only once
    };
  }, [siteKey]);

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