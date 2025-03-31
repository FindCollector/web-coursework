import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';

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

// 开发环境启用调试辅助
if (process.env.NODE_ENV !== 'production') {
  setupNetworkMonitoring();
  addDebugStyles();
  exposeApiTestFunctions();
  logAuthState();
  
  console.log('🚀 应用以开发模式启动');
  console.log('🛠️ 开发调试工具已启用');
  console.log('💡 提示: 在控制台使用 window.testAuth 进行快速API测试');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  </React.StrictMode>,
);
