import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from './context/ThemeContext';
import Landing from './pages/Landing';
import CitizenDashboard from './pages/CitizenDashboard';
import ReportIssue from './pages/ReportIssue';
import MapView from './pages/MapView';
import ChatAI from './pages/ChatAI';
import AuthorityDashboard from './pages/AuthorityDashboard';
import Leaderboard from './pages/Leaderboard';
import CommunityFeed from './pages/CommunityFeed';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import ProfilePage from './pages/ProfilePage';
import MyReports from './pages/MyReports';
import AppLayout from './components/AppLayout';
import './index.css';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to={user.role === 'authority' ? '/authority' : '/dashboard'} replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'authority' ? '/authority' : '/dashboard'} /> : <Landing />} />
      <Route element={<ProtectedRoute><SidebarProvider><AppLayout /></SidebarProvider></ProtectedRoute>}>
        <Route path="/dashboard" element={<CitizenDashboard />} />
        <Route path="/report" element={<ReportIssue />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/chat" element={<ChatAI />} />
        <Route path="/community" element={<CommunityFeed />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/predictions" element={<PredictiveAnalytics />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/authority" element={
          <ProtectedRoute requiredRole="authority"><AuthorityDashboard /></ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#0A0A1A',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontFamily: 'Inter, sans-serif',
                },
                success: { iconTheme: { primary: '#6BCB77', secondary: '#0A0A1A' } },
                error: { iconTheme: { primary: '#FF4757', secondary: '#0A0A1A' } },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
