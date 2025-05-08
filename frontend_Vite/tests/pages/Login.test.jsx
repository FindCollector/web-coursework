import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from '../../src/pages/Login';
import authReducer from '../../src/store/authSlice';
import { baseApi } from '../../src/store/api/baseApi';

// 模拟 @react-oauth/google 依赖
vi.mock('@react-oauth/google', async () => {
  const actual = await vi.importActual('@react-oauth/google');
  return {
    ...actual,
    GoogleLogin: vi.fn(() => <div data-testid="google-login-button">Google Login</div>),
    useGoogleLogin: vi.fn(() => ({ onClick: vi.fn() }))
  };
});

// Mock useReCaptcha hook to bypass script loading in tests
vi.mock('../../src/hooks/useReCaptcha', () => {
  return {
    default: () => ({
      isScriptLoaded: true,
      isInitialized: true,
      isLoading: false,
      error: null,
      executeReCaptcha: vi.fn().mockResolvedValue('test-recaptcha-token')
    })
  };
});

// 创建一个测试专用的 store
const createTestStore = () => {
  return configureStore({
    reducer: { 
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};

const renderLogin = () => {
  const store = createTestStore();
  
  return {
    user: userEvent.setup(),
    store,
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          <GoogleOAuthProvider clientId="mock-client-id">
            <Login />
          </GoogleOAuthProvider>
        </BrowserRouter>
      </Provider>
    )
  };
};

describe('Login Page', () => {
  it('renders login form correctly', () => {
    renderLogin();
    
    // 验证基本 UI 元素存在
    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });
  
  it('validates form fields and shows error messages', async () => {
    const { user } = renderLogin();
    
    // 点击提交按钮但不输入任何内容
    await user.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // 验证表单验证错误信息
    await waitFor(() => {
      expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
  });
  
  it('authenticates successfully with correct credentials', async () => {
    const { user, store } = renderLogin();
    
    // 填写表单 - 使用与 MSW handler 中匹配的测试凭据
    await user.type(screen.getByPlaceholderText(/Enter your email address/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/Enter your password/i), 'password123');
    
    // 提交表单
    await user.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // 等待并验证 Redux 状态更新
    await waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true));
    expect(store.getState().auth.token).toBe('mock-jwt-token-12345');
    expect(store.getState().auth.userType).toBe('member');
    
    // 确认 localStorage 中也存储了 token
    expect(localStorage.getItem('token')).toBe('mock-jwt-token-12345');
  });
}); 