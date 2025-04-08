import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState, useEffect, lazy, Suspense } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// 懒加载页面组件
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyCode = lazy(() => import('./pages/VerifyCode'));

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
    console.log('路由保护检查 - 认证状态:', isAuthenticated, '用户类型:', userType);
    // 延迟极短时间以确保Redux状态已完全加载
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [isAuthenticated, userType]);

  // 检查用户是否已认证
  if (!isAuthenticated && !isChecking) {
    console.log('未认证，重定向到登录页面');
    return <Navigate to="/login" replace />;
  }

  // 如果指定了所需的用户类型，但用户类型不匹配，则重定向到适当的页面
  if (isAuthenticated && requiredUserType && userType !== requiredUserType && !isChecking) {
    console.log('用户类型不匹配，重定向到对应面板');
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
      <div>正在验证身份...</div>
    </div>;
  }

  return children;
};

// 占位页面组件
const Home = () => <div className="p-6">Home</div>;

function App() {
  const [count, setCount] = useState(0)

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
        <Route path="/" element={<Home />} />
        
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

        {/* 404页面 - 捕获所有未匹配的路由 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DndProvider>
  )
}

export default App
