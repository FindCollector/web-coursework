/**
 * 调试辅助工具
 * 用于调试API请求和响应
 */

// 获取存储键名，不再添加实例ID后缀
const getStorageKey = (key) => {
  // 使用简单的键名，不追加实例ID
  return key;
};

// 监听网络请求
export const setupNetworkMonitoring = () => {
  if (process.env.NODE_ENV !== 'production') {
    // 创建一个XHR监听器，记录所有的XHR请求
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function() {
      this.addEventListener('load', function() {
        const url = this._url;
        
        try {
          const response = JSON.parse(this.responseText);
          console.group(`🌐 XHR请求: ${this._method} ${url}`);
          console.log('状态: ', this.status);
          console.log('响应: ', response);
          console.groupEnd();
        } catch (e) {
          console.log(`非JSON响应: ${url}`);
        }
      });
      
      this._method = arguments[0];
      this._url = arguments[1];
      originalXHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
      console.group(`🚀 发送XHR请求: ${this._method} ${this._url}`);
      console.log('数据: ', arguments[0] || '无');
      
      if (this._method === 'POST' && arguments[0]) {
        try {
          console.log('请求体: ', JSON.parse(arguments[0]));
        } catch (e) {
          // ignore
        }
      }
      
      console.groupEnd();
      originalXHRSend.apply(this, arguments);
    };
    
    // 监听Fetch请求
    const originalFetch = window.fetch;
    
    window.fetch = function() {
      const url = arguments[0];
      const options = arguments[1] || {};
      
      console.group(`🌐 Fetch请求: ${options.method || 'GET'} ${url}`);
      
      if (options.body) {
        try {
          console.log('请求体: ', JSON.parse(options.body));
        } catch (e) {
          console.log('请求体: ', options.body);
        }
      }
      
      console.log('选项: ', options);
      console.groupEnd();
      
      return originalFetch.apply(this, arguments)
        .then(response => {
          // 克隆响应，因为response.json()只能调用一次
          const clone = response.clone();
          
          clone.json().then(data => {
            console.group(`🌐 Fetch响应: ${options.method || 'GET'} ${url}`);
            console.log('状态: ', response.status);
            console.log('响应: ', data);
            console.groupEnd();
          }).catch(() => {
            // 非JSON响应，忽略
          });
          
          return response;
        });
    };
    
    console.log('🔍 网络监控已启用');
  }
}

// 打印认证状态
export const logAuthState = () => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  const getStorageKey = (key) => {
    // 使用简单的键名，不追加实例ID
    return key;
  };
  
  // 打印认证状态
  try {
    console.group('🔐 认证状态');
    console.log('token: ', localStorage.getItem(getStorageKey('token')) ? '已设置' : '未设置');
    if (localStorage.getItem(getStorageKey('token'))) {
      console.log('token值: ', localStorage.getItem(getStorageKey('token')).substring(0, 15) + '...');
    }
    console.log('userType: ', localStorage.getItem(getStorageKey('userType')));
    console.log('userName: ', localStorage.getItem(getStorageKey('userName')));
    console.groupEnd();
  } catch (error) {
    console.error('打印认证状态时出错:', error);
  }
};

// 添加调试样式到页面
export const addDebugStyles = () => {
  if (process.env.NODE_ENV !== 'production') {
    const style = document.createElement('style');
    style.innerHTML = `
      /* 边框调试辅助 */
      .debug-borders * {
        outline: 1px solid rgba(255, 0, 0, 0.2);
      }
      
      /* API错误指示器 */
      .api-error-indicator {
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: red;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);
    
    console.log('🎨 调试样式已添加');
  }
}

// 暴露API测试函数
export const exposeApiTestFunctions = () => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  
  const getStorageKey = (key) => {
    // 使用简单的键名，不追加实例ID
    return key;
  };
  
  // 创建全局测试对象
  window.testAuth = {
    // 登录测试
    login: async (email = 'admin@example.com', password = 'password123') => {
      try {
        console.log('测试登录:', email, password);
        
        const response = await fetch('http://localhost:8080/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        });
        
        const data = await response.json();
        console.log('登录响应:', data);
        
        if (data.code === 0 && data.data?.userInfo?.token) {
          localStorage.setItem(getStorageKey('token'), data.data.userInfo.token);
          console.log('🔑 Token 已保存到 localStorage:', getStorageKey('token'));
          return { success: true, data };
        } else {
          console.error('登录失败:', data.msg || '未知错误');
          return { success: false, error: data.msg || '登录失败', data };
        }
      } catch (error) {
        console.error('登录请求错误:', error);
        return { success: false, error: error.message };
      }
    },
    
    // 检查认证状态
    checkAuth: () => {
      const token = localStorage.getItem(getStorageKey('token'));
      console.log('当前令牌状态:', token ? '已认证' : '未认证');
      return !!token;
    },
    
    // 注销
    logout: () => {
      localStorage.removeItem(getStorageKey('token'));
      console.log('已注销，删除令牌');
      return true;
    }
  };
  
  console.log('API测试函数已暴露。使用 window.testAuth 进行API测试');
}; 