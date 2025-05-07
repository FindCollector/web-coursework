import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, lazy, Suspense } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { logout } from './store/authSlice';
import { message } from 'antd';
// 不再需要导入token验证服务
// import { startTokenValidation, stopTokenValidation } from './utils/authUtils';

// 懒加载页面组件
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyCode = lazy(() => import('./pages/VerifyCode'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const LinkGoogleAccount = lazy(() => import('./pages/LinkGoogleAccount'));

// 懒加载管理员页面组件
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
// 懒加载教练页面组件
const CoachDashboard = lazy(() => import('./pages/coach/Dashboard'));
const CoachDetails = lazy(() => import('./pages/coach/Details'));
// 懒加载会员页面组件
const MemberDashboard = lazy(() => import('./pages/member/Dashboard'));
// 懒加载调试页面组件
const DebugPage = lazy(() => import('./pages/Debug'));
// 导入DnD Provider
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// 加载中组件
const LoadingComponent = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div>页面加载中...</div>
  </div>
);

// 受保护路由组件
const ProtectedRoute = ({ children, requiredUserType = null }) => {
  const { isAuthenticated, userType } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  
  // 使用useEffect确保认证检查在组件挂载后立即执行
  useEffect(() => {
    console.log('Route protection check - Auth status:', isAuthenticated, 'User type:', userType);
    // 延迟极短时间以确保Redux状态已完全加载
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [isAuthenticated, userType]);

  // 检查用户是否已认证
  if (!isAuthenticated && !isChecking) {
    console.log('Not authenticated, redirecting to login page');
    return <Navigate to="/login" replace />;
  }

  // 如果指定了所需的用户类型，但用户类型不匹配，则重定向到适当的页面
  if (isAuthenticated && requiredUserType && userType !== requiredUserType && !isChecking) {
    console.log('User type mismatch, redirecting to corresponding panel');
    switch (userType) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'member':
        return <Navigate to="/member/dashboard" replace />;
      case 'coach':
        return <Navigate to="/coach/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // 如果仍在检查或认证通过，返回子组件
  if (isChecking) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>Verifying identity...</div>
    </div>;
  }

  return children;
};

function App() {
  const [count, setCount] = useState(0)
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // 添加全局fetch拦截器来捕获token过期
  useEffect(() => {
    // 只有在用户已登录时才添加拦截器
    if (isAuthenticated) {
      console.log('Setting up global fetch interceptor for token expiration detection');
      
      // 添加一个标记到sessionStorage，避免重复处理
      const tokenExpirationKey = 'tokenExpirationHandled';
      sessionStorage.removeItem(tokenExpirationKey);
      
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        // 已经处理过过期，不再检查新请求
        if (sessionStorage.getItem(tokenExpirationKey) === 'true') {
          return originalFetch.apply(this, args);
        }
        
        try {
          const response = await originalFetch.apply(this, args);
          
          // 已经处理过过期，不需要检查响应
          if (sessionStorage.getItem(tokenExpirationKey) === 'true') {
            return response;
          }
          
          // 克隆响应以便检查内容而不消耗原始响应
          const clonedResponse = response.clone();
          
          // 尝试解析JSON响应
          clonedResponse.json().then(data => {
            // 检查是否是token过期错误
            if (data && data.code === 3000 && data.msg === 'Not logged in or login expired') {
              console.log('Global interceptor caught token expiration:', data);
              
              // 检查是否已经处理过
              if (sessionStorage.getItem(tokenExpirationKey) === 'true') {
                console.log('Token expiration already handled, skipping');
                return;
              }
              
              // 设置处理标志防止重复处理
              sessionStorage.setItem(tokenExpirationKey, 'true');
              
              // 清除localStorage
              localStorage.removeItem('token');
              localStorage.removeItem('userType');
              localStorage.removeItem('userName');
              
              // 触发Redux登出action
              dispatch(logout());
              
              // 只使用一种提示方式，不创建自定义DOM元素
              console.log('Token expired, redirecting to login page');
              
              // 只有当前不在登录页面时才导航到登录页
              if (!window.location.pathname.includes('/login')) {
                console.log('Redirecting to login page due to token expiration');
                
                // 使用React Router导航，将过期消息传递给登录页面
                navigate('/login', { 
                  replace: true,
                  state: { 
                    expired: true
                  }
                });
              }
            }
          }).catch(err => {
            // 忽略非JSON响应解析错误
            console.log('Response is not JSON, ignoring');
          });
          
          return response;
        } catch (error) {
          return Promise.reject(error);
        }
      };
      
      // 组件卸载时清除拦截器
      return () => {
        window.fetch = originalFetch;
        console.log('Global fetch interceptor removed');
      };
    }
  }, [isAuthenticated, dispatch, navigate]);
  
  return (
    <DndProvider backend={HTML5Backend}>
      <Routes>
        {/* 公共路由 */}
        <Route path="/verify-code" element={
          <Suspense fallback={<LoadingComponent />}>
            <VerifyCode />
          </Suspense>
        } />
        <Route path="/login" element={
          <Suspense fallback={<LoadingComponent />}>
            <Login />
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<LoadingComponent />}>
            <Register />
          </Suspense>
        } />
        <Route path="/complete-profile" element={
          <Suspense fallback={<LoadingComponent />}>
            <CompleteProfile />
          </Suspense>
        } />
        <Route path="/link-google-account" element={
          <Suspense fallback={<LoadingComponent />}>
            <LinkGoogleAccount />
          </Suspense>
        } />
        <Route path="/" element={
          <Suspense fallback={<LoadingComponent />}>
            <LandingPage />
          </Suspense>
        } />
        
        {/* 调试页面 - 仅在开发环境中显示 */}
        {process.env.NODE_ENV !== 'production' && (
          <Route path="/debug" element={
            <Suspense fallback={<LoadingComponent />}>
              <DebugPage />
            </Suspense>
          } />
        )}

        {/* 管理员路由 */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredUserType="admin">
              <Suspense fallback={<LoadingComponent />}>
                <AdminDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* 会员路由 */}
        <Route
          path="/member/dashboard"
          element={
            <ProtectedRoute requiredUserType="member">
              <Suspense fallback={<LoadingComponent />}>
                <MemberDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/coaches"
          element={
            <ProtectedRoute requiredUserType="member">
              <Suspense fallback={<LoadingComponent />}>
                <MemberDashboard initialActiveMenu="coaches" />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/booking"
          element={
            <ProtectedRoute requiredUserType="member">
              <Suspense fallback={<LoadingComponent />}>
                <MemberDashboard initialActiveMenu="booking" />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/subscription-requests"
          element={
            <ProtectedRoute requiredUserType="member">
              <Suspense fallback={<LoadingComponent />}>
                <MemberDashboard initialActiveMenu="subscription-requests" />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/session-requests"
          element={
            <ProtectedRoute requiredUserType="member">
              <Suspense fallback={<LoadingComponent />}>
                <MemberDashboard initialActiveMenu="session-requests" />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/schedule"
          element={
            <ProtectedRoute requiredUserType="member">
              <Suspense fallback={<LoadingComponent />}>
                <MemberDashboard initialActiveMenu="schedule" />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/history"
          element={
            <ProtectedRoute requiredUserType="member">
              <Suspense fallback={<LoadingComponent />}>
                <MemberDashboard initialActiveMenu="history" />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* 教练路由 */}
        <Route
          path="/coach/dashboard"
          element={
            <ProtectedRoute requiredUserType="coach">
              <Suspense fallback={<LoadingComponent />}>
                <CoachDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach/details"
          element={
            <ProtectedRoute requiredUserType="coach">
              <Suspense fallback={<LoadingComponent />}>
                <CoachDetails />
              </Suspense>
            </ProtectedRoute>
          }
        />
        {/* 添加教练Session请求路由 */}
        <Route
          path="/coach/session-requests"
          element={
            <ProtectedRoute requiredUserType="coach">
              <Suspense fallback={<LoadingComponent />}>
                <CoachDashboard initialActiveMenu="session-requests" />
              </Suspense>
            </ProtectedRoute>
          }
        />
        {/* 添加教练Subscription请求路由 */}
        <Route
          path="/coach/subscription-requests"
          element={
            <ProtectedRoute requiredUserType="coach">
              <Suspense fallback={<LoadingComponent />}>
                <CoachDashboard initialActiveMenu="subscription-requests" />
              </Suspense>
            </ProtectedRoute>
          }
        />
        {/* 添加教练Requests总路由 */}
        <Route
          path="/coach/requests"
          element={
            <ProtectedRoute requiredUserType="coach">
              <Suspense fallback={<LoadingComponent />}>
                <CoachDashboard initialActiveMenu="requests" />
              </Suspense>
            </ProtectedRoute>
          }
        />
        
        {/* 添加教练Schedule路由 */}
        <Route
          path="/coach/schedule"
          element={
            <ProtectedRoute requiredUserType="coach">
              <Suspense fallback={<LoadingComponent />}>
                <CoachDashboard initialActiveMenu="schedule" />
              </Suspense>
            </ProtectedRoute>
          }
        />
        
        {/* 添加教练Availability路由 */}
        <Route
          path="/coach/availability"
          element={
            <ProtectedRoute requiredUserType="coach">
              <Suspense fallback={<LoadingComponent />}>
                <CoachDashboard initialActiveMenu="availability" />
              </Suspense>
            </ProtectedRoute>
          }
        />
        
        {/* 添加教练Unrecorded Sessions路由 */}
        <Route
          path="/coach/unrecorded-sessions"
          element={
            <ProtectedRoute requiredUserType="coach">
              <Suspense fallback={<LoadingComponent />}>
                <CoachDashboard initialActiveMenu="unrecorded-sessions" />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* 404页面 - 捕获所有未匹配的路由 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DndProvider>
  )
}

export default App
