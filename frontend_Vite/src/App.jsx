import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyCode from './pages/VerifyCode';
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// 导入管理员页面组件
import AdminDashboard from './pages/admin/Dashboard';
// 导入调试页面组件
import DebugPage from './pages/Debug';

// 受保护路由组件
const ProtectedRoute = ({ children, requiredUserType = null }) => {
  const { isAuthenticated, userType } = useSelector((state) => state.auth);

  // 检查用户是否已认证及用户类型是否符合要求
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 如果指定了所需的用户类型，但用户类型不匹配，则重定向到适当的页面
  if (requiredUserType && userType !== requiredUserType) {
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

  return children;
};

// 占位页面组件
const MemberDashboard = () => <div className="p-6">Member Dashboard</div>;
const CoachDashboard = () => <div className="p-6">Coach Dashboard</div>;
const Home = () => <div className="p-6">Home</div>;

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      {/* 公共路由 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-code" element={<VerifyCode />} />
      <Route path="/" element={<Home />} />
      
      {/* 调试页面 - 仅在开发环境中显示 */}
      {process.env.NODE_ENV !== 'production' && (
        <Route path="/debug" element={<DebugPage />} />
      )}

      {/* 管理员路由 */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredUserType="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* 会员路由 */}
      <Route
        path="/member/dashboard"
        element={
          <ProtectedRoute requiredUserType="member">
            <MemberDashboard />
          </ProtectedRoute>
        }
      />

      {/* 教练路由 */}
      <Route
        path="/coach/dashboard"
        element={
          <ProtectedRoute requiredUserType="coach">
            <CoachDashboard />
          </ProtectedRoute>
        }
      />

      {/* 404页面 - 捕获所有未匹配的路由 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
