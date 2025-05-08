import { render, screen } from '@testing-library/react';
import App from '../src/App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '../src/store/index.js';

// 基础渲染测试：确保 App 可以正常挂载并渲染导航栏标题
// 这里仅验证页面渲染不抛出异常

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );

    // 根据延迟加载的占位符文本断言
    const loadingText = screen.getByText(/Loading page/i);
    expect(loadingText).toBeInTheDocument();
  });
}); 