import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Modal, message } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import confetti from 'canvas-confetti';
import { useReCaptcha, useModalState, useButtonLoading, useCountdown } from '../hooks';
import { CheckCircleOutlined } from '@ant-design/icons';

import { 
  useVerifyCodeMutation, 
  useResendVerificationCodeMutation 
} from '../store/api/authApi';

const { Title } = Typography;

// 表单验证规则
const schema = yup.object({
  code: yup.string()
    .required('Please enter the verification code')
    .matches(/^\d{6}$/, 'The verification code must be 6 digits')
}).required();

const VerifyCode = () => {
  // 使用自定义 hooks
  const { executeReCaptcha, isScriptLoaded } = useReCaptcha('6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y');
  const [isErrorModalVisible, showErrorModal, hideErrorModal] = useModalState(false);
  const [isTimeoutModalVisible, showTimeoutModal, hideTimeoutModal] = useModalState(false);
  const [isSuccessModalVisible, showSuccessModal, hideSuccessModal] = useModalState(false);
  
  // 添加一个标志，表示页面已完全初始化
  const [isPageInitialized, setIsPageInitialized] = useState(false);
  
  const [isVerifying, setVerifying, withVerifying] = useButtonLoading(false);
  const [isResending, setResending, withResending] = useButtonLoading(false);
  const { seconds: countdown, start: startCountdown, isActive: isCountdownActive } = useCountdown(60, false);
  
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // 使用RTK Query hooks
  const [verifyCode, verifyCodeResult] = useVerifyCodeMutation();
  const [resendCode, resendCodeResult] = useResendVerificationCodeMutation();
  
  // 获取从注册页面传递的邮箱和用户名
  const userEmail = location.state?.email;
  const userName = location.state?.userName;
  const userRole = location.state?.role;
  
  // Log location.state on every render
  console.log("VerifyCode Render - location.state:", location.state);
  
  // 添加一个状态来跟踪是否已经验证成功
  const [isVerified, setIsVerified] = useState(false);
  
  // 添加错误处理状态
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  // 添加一个状态来跟踪页面是否准备好渲染
  const [isReady, setIsReady] = useState(false);
  
  // 添加ref跟踪是否尝试显示过成功弹窗
  const successModalDisplayed = useRef(false);
  
  // 添加一个标志，表示是否已经手动验证过
  const [hasManuallyVerified, setHasManuallyVerified] = useState(false);
  
  // 添加一个ref来跟踪弹窗是否应该强制显示
  const forceShowSuccess = useRef(false);
  
  // 页面初始化完成
  useEffect(() => {
    // 设置页面初始化标志 - 添加一个更长的延迟
    const timer = setTimeout(() => {
      setIsPageInitialized(true);
      console.log("页面初始化完成，可以开始计时器");
    }, 2000); // 延长到2秒钟，给页面充分加载时间
    
    return () => clearTimeout(timer);
  }, []);
  
  // 添加调试日志
  useEffect(() => {
    console.log("VerifyCode页面状态:", { 
      userEmail, 
      userName, 
      userRole,
      locationState: location.state,
      countdown,
      isCountdownActive,
      isScriptLoaded
    });
  }, [userEmail, userName, userRole, location.state, countdown, isCountdownActive, isScriptLoaded]);
  
  // 监控reCAPTCHA状态
  useEffect(() => {
    console.log("reCAPTCHA状态变化:", { 
      isScriptLoaded,
      grecaptchaLoaded: window.grecaptcha !== undefined,
      grecaptchaEnterpriseLoaded: window.grecaptcha?.enterprise !== undefined
    });
  }, [isScriptLoaded]);
  
  // 页面第一次加载时倒计时检查
  useEffect(() => {
    // 只在页面首次加载时启动倒计时
    if (userEmail && userRole && !isCountdownActive) {
      console.log("页面首次加载，启动倒计时");
      startCountdown(60);
    }
  }, [userEmail, userRole]);
  
  // 移除自动重启倒计时的效果
  useEffect(() => {
    if (countdown === 0) {
      console.log("倒计时结束");
    } else if (countdown % 10 === 0 && countdown > 0) {
      console.log(`倒计时: ${countdown}秒`);
    }
  }, [countdown]);
  
  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("页面重新变为可见，检查倒计时状态...");
        // 只在倒计时进行中但不活跃时重新启动
        if (!isCountdownActive && countdown > 0 && userEmail && userRole) {
          console.log("恢复倒计时，剩余:", countdown);
          startCountdown(countdown);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCountdownActive, countdown, userEmail, userRole, startCountdown]);
  
  // 如果没有邮箱信息，重定向回注册页面
  useEffect(() => {
    // 添加一个小延迟以确保state已完全加载
    const timer = setTimeout(() => {
      if (!userEmail || !userRole) {
        console.log("未找到必要信息，重定向回注册页面");
        navigate('/register');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [userEmail, userRole, navigate]);
  
  // 加载reCAPTCHA Enterprise脚本
  useEffect(() => {
    // 检查是否已经加载了脚本
    if (document.querySelector('script[src*="recaptcha/enterprise.js"]')) {
      console.log('reCAPTCHA script already loaded, skipping...');
      return;
    }
    
    console.log('Loading reCAPTCHA script...');
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/enterprise.js?render=6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y';
    script.async = true;
    script.id = 'recaptcha-script';
    script.onload = () => {
      console.log('reCAPTCHA script loaded successfully.');
    };
    script.onerror = (error) => {
      console.error('Error loading reCAPTCHA script:', error);
    };
    document.body.appendChild(script);
    
    return () => {
      // 不要在卸载组件时移除脚本，因为其他页面可能需要使用
      // 改为只在开发环境中输出日志
      if (process.env.NODE_ENV !== 'production') {
        console.log('VerifyCode component unmounted, reCAPTCHA script remains for other components');
      }
    };
  }, []);

  // 45分钟超时检查 - 完全重写这部分
  useEffect(() => {
    let timeoutId;
    console.log("[Timeout Effect] Triggered. isPageInitialized:", isPageInitialized, "isVerified:", isVerified, "userEmail:", userEmail, "userRole:", userRole);
    
    // 只有当页面初始化完成、没有验证成功且有邮箱和角色信息时才设置超时
    // 增加更严格的条件判断，确保不会在刚加载页面时就显示超时弹窗
    if (isPageInitialized && !isVerified && userEmail && userRole && countdown > 0) {
      console.log(`[Timeout Effect] Conditions met. Setting ${2700000 / 60000} minute timeout.`);
      
      // 设置45分钟超时 (45 * 60 * 1000 = 2700000 毫秒)
      timeoutId = setTimeout(() => {
        console.log("[Timeout Callback] Timeout reached. Checking conditions...");
        console.log("[Timeout Callback] State: isVerified:", isVerified);
        
        // 再次检查条件，确保不会错误显示
        // 增加额外条件：确保其他弹窗未显示
        if (!isVerified && !isSuccessModalVisible && !isErrorModalVisible) {
          console.log("[Timeout Callback] Conditions met (not verified). Showing Timeout Modal!");
          // 清理其他可能存在的弹窗，确保只显示超时弹窗
          hideErrorModal();
          hideSuccessModal();
          showTimeoutModal(); 
        } else {
          console.log("[Timeout Callback] Conditions NOT met. Ignoring timeout.");
        }
      }, 2700000); // 45分钟超时
      
      console.log("[Timeout Effect] Timeout ID set:", timeoutId);

    } else {
      console.log("[Timeout Effect] Conditions not met. Timer not set.");
    }
    
    // 清理函数
    return () => {
      if (timeoutId) {
        console.log("[Timeout Cleanup] Clearing timeout ID:", timeoutId);
        clearTimeout(timeoutId);
      } else {
         console.log("[Timeout Cleanup] No timeout ID to clear.");
      }
    };
  // 减少依赖项，只保留必要的状态
  }, [isPageInitialized, userEmail, userRole, isVerified, isSuccessModalVisible, isErrorModalVisible, countdown, showTimeoutModal, hideErrorModal, hideSuccessModal]);
  
  // 表单控制
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      code: ''
    }
  });

  // 监控验证结果状态
  useEffect(() => {
    // 检查验证是否成功 - 这个 effect 可能不再需要，因为成功处理在 onSubmit 中
    if (verifyCodeResult.data && verifyCodeResult.data.code === 0 /* && !successModalOpen */) {
      console.log("检测到验证成功 (via effect)，但不在这里显示弹窗");
    }
  }, [verifyCodeResult.data /*, successModalOpen */]); // 更新依赖项

  // 创建一个函数来清除所有模态框
  const clearAllModals = () => {
    console.log("Clearing all modals");
    // 移除对不存在的状态变量的引用
    // setIsModalVisible(false); // 这行导致错误，因为这个组件中没有setIsModalVisible
    hideErrorModal();
    hideTimeoutModal();
    hideSuccessModal();
  };

  // 验证码校验函数
  const validateCode = (code) => {
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      setErrorMessage('Please enter a valid 6-digit verification code');
      // 确保其他弹窗关闭
      hideSuccessModal();
      hideTimeoutModal();
      showErrorModal();
      return false;
    }
    return true;
  };

  // 使用useEffect在组件挂载时强制隐藏所有弹窗
  useEffect(() => {
    console.log("组件挂载，确保所有弹窗都是关闭的");
    // 强制关闭所有弹窗
    hideErrorModal();
    hideSuccessModal();
    hideTimeoutModal();
    // 重置验证状态
    setIsVerified(false);
    setHasManuallyVerified(false);
  }, []);

  // 成功验证后的处理函数
  const handleSuccessVerification = useCallback(() => {
    console.log("执行成功验证处理函数");
    
    // 设置所有必要的状态
    setIsVerified(true);
    setHasManuallyVerified(true);
    successModalDisplayed.current = true;
    forceShowSuccess.current = true;
    
    // 关闭其他弹窗
    hideErrorModal();
    hideTimeoutModal();
    
    // 触发彩带动画
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      zIndex: 10000, 
      colors: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'],
      startVelocity: 30,
      scalar: 1.2,
      ticks: 150
    });
    
    // 延迟显示成功弹窗
    setTimeout(() => {
      console.log("准备显示成功弹窗 (通用处理函数)");
      showSuccessModal();
      
      // 添加额外检查
      setTimeout(() => {
        console.log("成功弹窗状态检查:", {
          isSuccessModalVisible,
          isVerified,
          hasManuallyVerified,
          forceShow: forceShowSuccess.current
        });
        
        if (!isSuccessModalVisible) {
          console.log("弹窗未显示，强制设置为显示状态");
          showSuccessModal();
        }
      }, 300);
    }, 500);
  }, [hideErrorModal, hideTimeoutModal, isSuccessModalVisible, isVerified, hasManuallyVerified, showSuccessModal]);

  // 处理表单提交
  const onSubmit = async (formData) => {
    // 添加详细调试日志
    console.log("点击了验证按钮，状态:", {
      code: formData.code,
      email: userEmail,
      isVerifying,
      isPending: verifyCodeResult.isPending,
      isScriptLoaded
    });
    
    // 设置已手动验证标志
    setHasManuallyVerified(true);
    
    // 检查验证码是否为空
    if (!validateCode(formData.code)) {
      return;
    }
    
    // 检查邮箱是否存在
    if (!userEmail) {
      setErrorMessage('Email address is missing. Please go back to registration.');
      // 确保其他弹窗关闭
      hideSuccessModal();
      hideTimeoutModal();
      showErrorModal();
      return;
    }
    
    // 设置验证中状态
    setVerifying(true);
    
    try {
      console.log("开始验证流程...");
      
      // 设置请求头
      let headers = {};
      
      // 尝试获取reCAPTCHA token
      if (window.grecaptcha && window.grecaptcha.enterprise) {
        try {
          console.log("尝试获取reCAPTCHA token...");
          const token = await window.grecaptcha.enterprise.execute(
            '6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y',
            { action: 'verifyCode' }
          );
          console.log("获取token成功:", token.substring(0, 10) + "...");
          headers = {
            'X-Recaptcha-Token': token,
            'X-Action': 'verifyCode'
          };
        } catch (err) {
          console.error("获取reCAPTCHA token失败:", err);
        }
      } else {
        console.log("reCAPTCHA还未加载");
      }
      
      // 创建请求数据
      const requestData = {
        email: userEmail,
        code: formData.code,
        headers: headers
      };
      
      console.log("发送验证请求:", requestData);
      
      // 发送请求验证验证码
      const result = await verifyCode(requestData).unwrap();
      console.log("收到验证响应:", result);
      
      if (result.code === 0) {
        // 使用通用处理函数
        handleSuccessVerification();
      } else {
        setErrorMessage(result.msg || 'Verification failed');
        // 确保其他弹窗关闭
        hideSuccessModal();
        hideTimeoutModal();
        showErrorModal();
      }
    } catch (error) {
      console.error('验证请求失败:', error);
      
      // 检查错误是否实际上是成功的响应，但API格式可能不一致
      if (error.data && error.data.code === 0) {
        // 使用通用处理函数
        handleSuccessVerification();
        return;
      }
      
      let errorMsg = 'Verification failed';
      
      if (error.data) {
        errorMsg = error.data.msg || errorMsg;
      } else if (error.response && error.response.data) {
        errorMsg = error.response.data.msg || errorMsg;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      // 确保其他弹窗关闭
      hideSuccessModal();
      hideTimeoutModal();
      showErrorModal();
    } finally {
      // 无论成功失败都重置验证状态
      setVerifying(false);
    }
  };

  // 重新发送验证码
  const handleResendCode = async () => {
    // 添加调试日志
    console.log("点击了重发按钮，状态:", {
      countdown,
      isResending,
      isVerifying,
      isPendingVerify: verifyCodeResult.isPending,
      isPendingResend: resendCodeResult.isPending,
      isDisabled: countdown > 0 || isResending,
      isScriptLoaded
    });
    
    // 防止重复点击或在倒计时期间点击
    if (countdown > 0 || isResending) {
      console.log("重发被阻止: 正在倒计时或已在发送中");
      return;
    }
    
    // 确保没有弹窗在显示
    hideErrorModal();
    hideSuccessModal();
    hideTimeoutModal();
    
    try {
      console.log("开始重发流程");
      
      // 检查邮箱是否存在
      if (!userEmail) {
        console.error("邮箱为空，无法发送重发请求");
        message.error("Email address is missing. Please go back to registration.");
        return;
      }
      
      // 准备发送请求
      console.log(`准备重发验证码到: ${userEmail}`);
      
      // 设置请求头
      let headers = {};
      
      // 尝试获取reCAPTCHA token
      if (window.grecaptcha && window.grecaptcha.enterprise) {
        try {
          console.log("尝试获取reCAPTCHA token...");
          const token = await window.grecaptcha.enterprise.execute(
            '6Lcq_e4qAAAAAEJYKkGw-zQ6CN74yjbiWByLBo6Y',
            { action: 'resendCode' }
          );
          console.log("获取token成功:", token.substring(0, 10) + "...");
          headers = {
            'X-Recaptcha-Token': token,
            'X-Action': 'resendCode'
          };
        } catch (err) {
          console.error("获取reCAPTCHA token失败:", err);
        }
      } else {
        console.log("reCAPTCHA还未加载，继续不使用token");
      }
      
      // 设置加载状态
      setResending(true);
      
      // 纯粹使用RTK Query发送请求
      console.log("使用RTK Query发送请求...");
      
      // 创建请求数据
      const requestData = {
        email: userEmail,
        headers: headers
      };
      
      console.log("RTK Query请求数据:", requestData);
      
      // 发送请求
      const result = await resendCode(requestData).unwrap();
      console.log("收到重发验证码响应:", result);
      
      // 处理响应
      if (result.code === 0) {
        message.success('A new verification code has been sent to your email!');
        // 请求成功后再开始倒计时
        startCountdown(60);
      } else {
        message.error(result.msg || 'Failed to resend code, please try again later');
      }
    } catch (error) {
      console.error("重发验证码请求失败:", error);
      message.error('Failed to send request. Please try again later.');
    } finally {
      // 无论成功失败都重置loading状态
      setResending(false);
    }
  };

  // 处理超时 - 更新这个函数
  const handleTimeout = () => {
    // 先确保其他弹窗都关闭
    hideErrorModal();
    hideSuccessModal();
    
    // 隐藏超时弹窗
    hideTimeoutModal();
    
    // 如果已经验证成功，则不要重定向
    if (isVerified) {
      console.log("已经验证成功，忽略超时重定向");
      return;
    }
    
    // 否则重定向到注册页面
    console.log("验证超时，重定向到注册页面");
    navigate('/register');
  };

  // 返回登录
  const handleBackToLogin = () => {
    navigate('/login');
  };

  // 添加调试函数以检查 URL 参数
  useEffect(() => {
    // 清理 URL 以移除可能的重复参数
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    
    // 检查是否有重复的参数
    if (searchParams.getAll('clrk').length > 1 || searchParams.getAll('reload').length > 1) {
      console.log('发现重复的 URL 参数，尝试清理...');
      
      // 创建新的参数集合
      const newParams = new URLSearchParams();
      
      // 只保留每个参数的第一个值
      for (const [key, value] of Array.from(searchParams.entries())) {
        if (!newParams.has(key)) {
          newParams.set(key, value);
        }
      }
      
      // 替换当前 URL
      url.search = newParams.toString();
      window.history.replaceState({}, '', url.toString());
      console.log('URL 已清理');
    }
  }, []);

  // 检查路径是否为验证码页面
  useEffect(() => {
    console.log('当前页面路径:', location.pathname);
  }, [location.pathname]);

  const isVerifyCodePage = location.pathname === '/verify-code';

  // 添加倒计时变化的日志
  useEffect(() => {
    if (countdown === 0 && isCountdownActive === false) {
      console.log("倒计时结束");
    } else if (countdown % 10 === 0 && countdown > 0) {
      console.log(`倒计时: ${countdown}秒`);
    }
  }, [countdown, isCountdownActive]);

  // 组件卸载时清理所有状态和定时器
  useEffect(() => {
    // 返回清理函数
    return () => {
      console.log("组件卸载，清理所有状态和定时器");
      // 清理所有弹窗状态
      clearAllModals();
      // 重置验证状态
      setVerifying(false);
      setResending(false);
      forceShowSuccess.current = false;
    };
  }, []);

  // 添加错误边界效果
  useEffect(() => {
    try {
      setIsReady(true);
      console.log("页面准备好渲染");
    } catch (error) {
      console.error("初始化页面时出错:", error);
      setHasError(true);
      setErrorInfo(error);
    }
  }, []);

  // 修改shouldShowSuccessModal逻辑，加入强制显示选项
  const shouldShowSuccessModal = forceShowSuccess.current || (isSuccessModalVisible && isVerified && hasManuallyVerified);

  // 如果有错误，显示错误信息而不是白屏
  if (hasError) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: 'red', 
        background: 'white' 
      }}>
        <h2>页面加载出错</h2>
        <p>请尝试刷新页面或返回注册页面</p>
        <Button 
          type="primary" 
          onClick={() => navigate('/register')}
          style={{ marginTop: '20px' }}
        >
          返回注册
        </Button>
        {process.env.NODE_ENV !== 'production' && errorInfo && (
          <pre style={{ 
            marginTop: '20px', 
            textAlign: 'left', 
            background: '#f0f0f0', 
            padding: '10px', 
            borderRadius: '4px', 
            color: 'black',
            overflow: 'auto'
          }}>
            {errorInfo.toString()}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen" style={styles.container}>
      <Card className="w-full max-w-md shadow-md" style={styles.box}>
        <div className="text-center mb-6">
          <Title level={2} style={styles.title}>Verify Your Email</Title>
          <p>We have sent a verification email containing a 6-digit code to <strong>{userEmail}</strong></p>
        </div>
        
        <Form 
          layout="vertical" 
          onFinish={handleSubmit(onSubmit)}
          onSubmitCapture={(e) => {
            console.log("表单提交被捕获:", e);
          }}
        >
          <Form.Item
            label="Verification Code"
            validateStatus={errors.code ? 'error' : ''}
            help={errors.code?.message}
          >
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  size="large"
                  style={styles.codeInput}
                />
              )}
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                ...styles.verifyButton,
                width: '80%',
                margin: '0 auto',
              }}
              loading={isVerifying || verifyCodeResult.isPending}
              disabled={isVerifying || verifyCodeResult.isPending}
              onClick={() => {
                console.log("验证按钮被点击");
                // 这里只是记录点击，实际提交由Form的onFinish处理
              }}
            >
              Verify
            </Button>
          </Form.Item>
        </Form>
        
        <div style={styles.resendContainer}>
          <span>Didn't receive the code?</span>
          <Button
            type="link"
            onClick={() => {
              console.log("按钮被点击");
              handleResendCode();
            }}
            disabled={countdown > 0}
            style={{
              ...styles.resendLink,
              color: countdown > 0 ? '#aaa' : '#1976D2',
            }}
          >
            {isResending ? 'Sending...' : countdown > 0 ? `Resend (${countdown}s)` : 'Resend'}
          </Button>
        </div>
        
        <div style={styles.footerText}>
          <Button 
            type="link" 
            onClick={() => navigate('/register')} 
            style={styles.backLink}
            disabled={isVerifying || verifyCodeResult.isPending}
          >
            Back to Registration
          </Button>
        </div>
      </Card>
      
      {/* Error Modal */}
      <Modal
        title="Verification Failed"
        open={isErrorModalVisible && !isSuccessModalVisible && !isTimeoutModalVisible}
        onOk={() => {
          // 先关闭当前弹窗
          hideErrorModal();
          // 确保其他弹窗也是关闭的
          hideSuccessModal();
          hideTimeoutModal();
        }}
        onCancel={() => {
          // 先关闭当前弹窗
          hideErrorModal();
          // 确保其他弹窗也是关闭的
          hideSuccessModal();
          hideTimeoutModal();
        }}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="OK"
      >
        <p style={{ fontSize: '16px' }}>{errorMessage}</p>
      </Modal>
      
      {/* Success Modal - 只在验证成功且手动验证过后才显示 */}
      <Modal
        title={<div style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold' }}>Success!</div>}
        open={shouldShowSuccessModal}
        destroyOnClose={false}
        maskClosable={false}
        closable={false}
        keyboard={false}
        onOk={() => {
          console.log("点击了成功弹窗的OK按钮");
          hideSuccessModal();
          navigate('/login');
        }}
        onCancel={() => {
          console.log("触发了成功弹窗的Cancel事件");
          hideSuccessModal();
          navigate('/login');
        }}
        afterClose={() => {
          console.log("成功弹窗关闭后的回调");
          navigate('/login');
        }}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="Back To Login"
        centered
        zIndex={9999}
        afterOpen={() => {
          console.log("成功弹窗已打开，状态:", {
            isSuccessModalVisible,
            isVerified,
            hasManuallyVerified,
            shouldShowSuccessModal
          });
        }}
        style={{ textAlign: 'center' }}
        width={window.innerWidth < 480 ? '90%' : 400}
        bodyStyle={{ padding: '24px' }}
        maskStyle={{ background: 'rgba(0, 0, 0, 0.75)' }}
        okButtonProps={{ 
          style: { 
            backgroundColor: '#1976D2', 
            borderColor: '#1976D2',
            width: '80%',
            height: '40px',
            fontSize: '16px',
            fontWeight: 'bold',
            margin: '0 auto'
          }
        }}
        wrapClassName="success-modal"
      >
        <div style={{ textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 80, color: '#52c41a', marginBottom: 16 }} />
          <p style={{ fontSize: '16px', padding: '10px', fontWeight: 'bold' }}>
            Congratulations! Your account has been successfully verified!
          </p>
          <p style={{ fontSize: '14px', padding: '5px' }}>
             You also need to wait for the administrator's review.
          </p>
          <style>
            {`
              .success-modal .ant-modal-footer {
                text-align: center;
                display: flex;
                justify-content: center;
                padding: 20px 16px;
              }
              .success-modal .ant-modal-content {
                text-align: center;
              }
              .success-modal .ant-modal-body {
                padding-bottom: 0;
              }
              .success-modal .ant-btn {
                display: block;
                margin: 0 auto;
              }
            `}
          </style>
        </div>
      </Modal>
      
      {/* Timeout Modal */}
      <Modal
        title="Session Expired"
        open={isTimeoutModalVisible && !isVerified && isPageInitialized && !isSuccessModalVisible && !isErrorModalVisible}
        onOk={() => {
          // 先处理超时
          handleTimeout();
          // 确保所有弹窗关闭
          hideErrorModal();
          hideSuccessModal();
          hideTimeoutModal();
        }}
        onCancel={() => {
          // 先处理超时
          handleTimeout();
          // 确保所有弹窗关闭
          hideErrorModal();
          hideSuccessModal();
          hideTimeoutModal();
        }}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="Register Again"
        zIndex={9999}
        centered
      >
        <p style={{ fontSize: '16px' }}>
          Your verification session has expired. Please register again to receive a new verification code.
        </p>
      </Modal>
    </div>
  );
};

// 样式
const styles = {
  container: {
    textAlign: 'center',
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(to right, #1a3a6e, #3f78d1, #67a8ff)',
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  box: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '40px 50px',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25), 0 15px 35px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(10px)',
    width: '100%',
    maxWidth: '450px',
    textAlign: 'left',
    transition: 'all 0.3s ease',
    margin: '20px',
    zIndex: 10,
  },
  title: {
    fontSize: '30px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '600',
    textAlign: 'center',
    color: '#003366',
    marginBottom: '10px',
  },
  codeInput: {
    fontSize: '18px',
    textAlign: 'center',
    letterSpacing: '4px',
    padding: '10px 8px',
    fontFamily: 'monospace'
  },
  verifyButton: {
    fontSize: '18px',
    fontWeight: 'bold',
    height: '45px',
    backgroundColor: '#1976D2',
    border: 'none',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    marginTop: '10px',
  },
  resendContainer: {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: '14px',
    color: '#555',
  },
  resendLink: {
    fontWeight: 'bold',
    fontSize: '14px',
    marginLeft: '5px',
  },
  footerText: {
    textAlign: 'center',
    marginTop: '30px',
    fontSize: '14px',
    color: '#555',
  },
  backLink: {
    fontWeight: 'bold',
    fontSize: '14px',
  },
};

export default VerifyCode; 