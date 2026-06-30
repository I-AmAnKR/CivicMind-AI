import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useSocket } from '../context/SocketContext';
import {
  LayoutDashboard, AlertTriangle, Map, MessageSquare,
  Users, Trophy, Shield, LogOut, Brain, Zap, Wifi, TrendingUp
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',          roles: ['citizen', 'admin'] },
  { to: '/report',      icon: AlertTriangle,   label: 'Report Issue',        roles: ['citizen', 'admin'] },
  { to: '/map',         icon: Map,             label: 'Map View',            roles: ['citizen', 'authority', 'admin'] },
  { to: '/community',   icon: Users,           label: 'Community Feed',      roles: ['citizen', 'authority', 'admin'] },
  { to: '/predictions', icon: TrendingUp,      label: 'Predictive Hotspots', roles: ['citizen', 'authority', 'admin'] },
  { to: '/chat',        icon: MessageSquare,   label: 'AI Assistant',        roles: ['citizen', 'authority', 'admin'] },
  { to: '/leaderboard', icon: Trophy,          label: 'Leaderboard',         roles: ['citizen', 'admin'] },
  { to: '/authority',   icon: Shield,          label: 'Authority Panel',     roles: ['authority', 'admin'] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { isOpen, close } = useSidebar();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    close();
    navigate('/');
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) close();
  };

  const filtered = navItems.filter(item => item.roles.includes(user?.role || 'citizen'));

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={close}
          aria-label="Close sidebar"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Brain size={22} color="white" />
          </div>
          <div className="logo-text">
            <h3 className="text-gradient">CivicMind</h3>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              AI Platform
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                color: connected ? 'var(--low)' : 'var(--critical)',
                fontSize: '0.6rem', fontWeight: 700
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: connected ? 'var(--low)' : 'var(--critical)',
                  animation: connected ? 'pulse-glow 2s infinite' : 'none',
                  display: 'inline-block'
                }} />
                {connected ? 'LIVE' : 'OFF'}
              </span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {filtered.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <Icon size={18} />
              {label}
              {/* Active indicator dot */}
              {location.pathname === to && (
                <span style={{
                  marginLeft: 'auto', width: 6, height: 6,
                  borderRadius: '50%', background: 'white',
                  flexShrink: 0
                }} />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* User info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', marginBottom: 8,
            background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <div className="user-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem', flexShrink: 0 }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontSize: '0.85rem', fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={10} color="var(--medium)" fill="var(--medium)" />
                {user?.points || 0} pts
                <span style={{ marginLeft: 4, color: 'var(--primary-light)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="nav-item w-full"
            style={{ color: 'var(--critical)', borderColor: 'rgba(255,71,87,0.2)', marginTop: 4, background: 'rgba(255,71,87,0.05)' }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
