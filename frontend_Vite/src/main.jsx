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
