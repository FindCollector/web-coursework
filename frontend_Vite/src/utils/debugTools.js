/**
 * 调试辅助工具
 * 用于调试API请求和响应
 */

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

// 显示当前的登录状态
export const logAuthState = () => {
  console.group('🔐 认证状态');
  console.log('token: ', sessionStorage.getItem('token') ? '已设置' : '未设置');
  if (sessionStorage.getItem('token')) {
    console.log('token值: ', sessionStorage.getItem('token').substring(0, 15) + '...');
  }
  console.log('userType: ', sessionStorage.getItem('userType'));
  console.log('userName: ', sessionStorage.getItem('userName'));
  console.groupEnd();
}

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

// 添加便捷的API测试函数到window对象
export const exposeApiTestFunctions = () => {
  if (process.env.NODE_ENV !== 'production') {
    window.testAuth = {
      login: (email, password) => {
        console.log(`测试登录: ${email}`);
        fetch('http://localhost:8080/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
          console.log('登录测试结果:', data);
          if (data.code === 0 && data.data?.userInfo?.token) {
            sessionStorage.setItem('token', data.data.userInfo.token);
            console.log('Token已保存到sessionStorage');
          }
        })
        .catch(err => console.error('登录测试错误:', err));
      },
      checkToken: () => {
        const token = sessionStorage.getItem('token');
        console.log('当前token:', token);
      },
      clearToken: () => {
        sessionStorage.removeItem('token');
        console.log('Token已清除');
      }
    };
    
    console.log('🧪 API测试函数已添加到window.testAuth');
  }
} 