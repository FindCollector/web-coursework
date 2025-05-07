import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import enUS from 'antd/lib/locale/en_US';
import { GoogleOAuthProvider } from '@react-oauth/google';

import App from './App.jsx';
import store from './store';
import './index.css';

import { 
  setupNetworkMonitoring, 
  logAuthState, 
  addDebugStyles,
  exposeApiTestFunctions 
} from './utils/debugTools';

if (!window.PAGE_INSTANCE_ID) {
  const storedId = localStorage.getItem('PAGE_INSTANCE_ID');
  if (storedId) {
    window.PAGE_INSTANCE_ID = storedId;
  } else {
    window.PAGE_INSTANCE_ID = Date.now().toString() + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('PAGE_INSTANCE_ID', window.PAGE_INSTANCE_ID);
  }
}

if (process.env.NODE_ENV !== 'production') {
  setupNetworkMonitoring();
  addDebugStyles();
  exposeApiTestFunctions();
  logAuthState();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider locale={enUS}>
        <GoogleOAuthProvider clientId="677140921578-1b18j9s2739ki5klh7hfg6mjc5guvtt8.apps.googleusercontent.com">
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GoogleOAuthProvider>
      </ConfigProvider>
    </Provider>
  </React.StrictMode>,
);
