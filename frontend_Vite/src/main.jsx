import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import enUS from 'antd/lib/locale/en_US';

import App from './App.jsx';
import store from './store';
import './index.css';

// 导入并执行调试工具
import { 
  setupNetworkMonitoring, 
  logAuthState, 
  addDebugStyles,
  exposeApiTestFunctions 
} from './utils/debugTools';

// 在多个页面刷新之间保持一致的PAGE_INSTANCE_ID，从localStorage获取或生成
if (!window.PAGE_INSTANCE_ID) {
  // 尝试从localStorage获取现有ID
  const storedId = localStorage.getItem('PAGE_INSTANCE_ID');
  if (storedId) {
    window.PAGE_INSTANCE_ID = storedId;
    console.log('使用已存在的页面实例ID:', window.PAGE_INSTANCE_ID);
  } else {
    // 如果没有，生成新ID并保存到localStorage
    window.PAGE_INSTANCE_ID = Date.now().toString() + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('PAGE_INSTANCE_ID', window.PAGE_INSTANCE_ID);
    console.log('生成并保存新的页面实例ID:', window.PAGE_INSTANCE_ID);
  }
}

// 开发环境启用调试辅助
if (process.env.NODE_ENV !== 'production') {
  setupNetworkMonitoring();
  addDebugStyles();
  exposeApiTestFunctions();
  logAuthState();
  
  console.log('🚀 Application started in development mode');
  console.log('🛠️ Development debugging tools enabled');
  console.log('💡 Tip: Use window.testAuth in console for quick API testing');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider locale={enUS}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  </React.StrictMode>,
);
