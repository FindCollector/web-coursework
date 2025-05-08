import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, lazy, Suspense } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { logout } from './store/authSlice';
import { message } from 'antd';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyCode = lazy(() => import('./pages/VerifyCode'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const LinkGoogleAccount = lazy(() => import('./pages/LinkGoogleAccount'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const CoachDashboard = lazy(() => import('./pages/coach/Dashboard'));
const CoachDetails = lazy(() => import('./pages/coach/Details'));
const MemberDashboard = lazy(() => import('./pages/member/Dashboard'));
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const LoadingComponent = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div>Loading page...</div>
  </div>
);

const ProtectedRoute = ({ children, requiredUserType = null }) => {
  const { isAuthenticated, userType } = useSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [isAuthenticated, userType]);

  if (!isAuthenticated && !isChecking) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated && requiredUserType && userType !== requiredUserType && !isChecking) {
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
  
  useEffect(() => {
    if (isAuthenticated) {
      const tokenExpirationKey = 'tokenExpirationHandled';
      sessionStorage.removeItem(tokenExpirationKey);
      
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        if (sessionStorage.getItem(tokenExpirationKey) === 'true') {
          return originalFetch.apply(this, args);
        }
        
        try {
          const response = await originalFetch.apply(this, args);
          
          if (sessionStorage.getItem(tokenExpirationKey) === 'true') {
            return response;
          }
          
          const clonedResponse = response.clone();
          
          clonedResponse.json().then(data => {
            if (data && data.code === 3000 && data.msg === 'Not logged in or login expired') {
              if (sessionStorage.getItem(tokenExpirationKey) === 'true') {
                return;
              }
              
              sessionStorage.setItem(tokenExpirationKey, 'true');
              
              localStorage.removeItem('token');
              localStorage.removeItem('userType');
              localStorage.removeItem('userName');
              
              dispatch(logout());
              
              if (!window.location.pathname.includes('/login')) {
                navigate('/login', { 
                  replace: true,
                  state: { 
                    expired: true
                  }
                });
              }
            }
          }).catch(err => {
          });
          
          return response;
        } catch (error) {
          return Promise.reject(error);
        }
      };
      
      return () => {
        window.fetch = originalFetch;
      };
    }
  }, [isAuthenticated, dispatch, navigate]);
  
  return (
    <DndProvider backend={HTML5Backend}>
      <Routes>
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DndProvider>
  )
}

export default App
