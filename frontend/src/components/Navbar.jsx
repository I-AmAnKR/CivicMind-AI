import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, X, WifiOff, Sun, Moon, User, LayoutDashboard, FileText, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';
import { getNotifications, markAllNotificationsRead } from '../services/api';

const pageTitles = {
  '/dashboard': 'Citizen Dashboard',
  '/report': 'Report an Issue',
  '/map': 'Live Issue Map',
  '/community': 'Community Feed',
  '/chat': 'AI Chat Assistant',
  '/leaderboard': 'Leaderboard',
  '/authority': 'Authority Dashboard',
  '/predictions': 'Predictive Hotspots',
  '/profile': 'My Profile',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { connected, liveNotifications } = useSocket();
  const { isOpen, toggle } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const profileRef = useRef();

  const title = pageTitles[location.pathname] || 'CivicMind AI';

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await getNotifications();
        setNotifs(res.data.notifications || []);
        setUnread(res.data.unreadCount || 0);
      } catch {}
    };
    if (user) fetchNotifs();
  }, [user, location.pathname]);

  useEffect(() => {
    if (liveNotifications.length > 0) {
      setUnread(prev => prev + 1);
      setNotifs(prev => [{
        _id: liveNotifications[0].id,
        title: liveNotifications[0].title,
        message: liveNotifications[0].message,
        isRead: false,
        createdAt: liveNotifications[0].time,
        isLive: true,
      }, ...prev]);
    }
  }, [liveNotifications]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAll = async () => {
    try { await markAllNotificationsRead(); } catch {}
    setUnread(0);
    setNotifs(n => n.map(x => ({ ...x, isRead: true })));
  };

  const handleLogout = () => {
    setShowProfile(false);
    logout();
    navigate('/');
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || 'U';
  const isLight = theme === 'light';

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="hamburger-btn" onClick={toggle} aria-label="Toggle sidebar">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>{title}</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }} className="navbar-date">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Live status — hide on tiny screens */}
        <div className="live-status-pill" title={connected ? 'Live updates active' : 'Reconnecting...'} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 'var(--radius-full)',
          background: connected ? 'rgba(107,203,119,0.1)' : 'rgba(255,71,87,0.1)',
          border: `1px solid ${connected ? 'rgba(107,203,119,0.3)' : 'rgba(255,71,87,0.2)'}`,
          fontSize: '0.72rem', fontWeight: 600,
          color: connected ? 'var(--low)' : 'var(--critical)',
        }}>
          {connected ? (
            <><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--low)', animation: 'pulse-glow 2s infinite', display: 'inline-block' }} />Live</>
          ) : (<><WifiOff size={12} />Offline</>)}
        </div>

        {/* Theme toggle */}
        <button onClick={toggleTheme} title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'} style={{
          width: 38, height: 38, borderRadius: '50%',
          background: isLight ? 'rgba(108,99,255,0.1)' : 'rgba(255,215,0,0.1)',
          border: `1px solid ${isLight ? 'rgba(108,99,255,0.3)' : 'rgba(255,215,0,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'var(--transition)',
          color: isLight ? 'var(--primary)' : '#FFD700',
        }}>
          {isLight ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button className="notif-btn" onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }} aria-label="Notifications">
            <Bell size={18} />
            {unread > 0 && (
              <span className="notif-badge" style={{ animation: 'pulse-glow 1.5s infinite' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="notif-panel">
              <div className="notif-panel-header">
                <div>
                  <span style={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Notifications</span>
                  {unread > 0 && (
                    <span style={{ marginLeft: 8, background: 'var(--primary-glow)', color: 'var(--primary-light)', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                      {unread} new
                    </span>
                  )}
                </div>
                <button className="btn-ghost btn-sm" onClick={handleMarkAll} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mark all read</button>
              </div>
              <div className="notif-list">
                {notifs.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔔</div>
                    <div style={{ fontSize: '0.85rem' }}>No notifications yet</div>
                  </div>
                ) : notifs.slice(0, 12).map((n, i) => (
                  <div key={n._id || i} className={`notif-item ${!n.isRead ? 'unread' : ''} ${n.isLive ? 'live' : ''}`}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 3 }}>{n.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {n.message?.substring(0, 90)}{n.message?.length > 90 ? '...' : ''}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {timeAgo(n.createdAt)}
                      {n.isLive && <span style={{ marginLeft: 6, color: 'var(--low)', fontWeight: 600 }}>● LIVE</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-glass)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)', padding: '5px 12px 5px 5px',
            cursor: 'pointer', transition: 'var(--transition)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.9rem', color: 'white', flexShrink: 0,
            }}>{avatarLetter}</div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" style={{ transform: showProfile ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>

          {showProfile && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 220, background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)', zIndex: 9999, overflow: 'hidden',
              animation: 'fadeIn 0.15s ease',
            }}>
              {/* User info header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,255,0.04))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: 'white' }}>
                    {avatarLetter}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                    <div style={{ fontSize: '0.65rem', background: 'var(--primary-glow)', color: 'var(--primary-light)', borderRadius: 20, padding: '1px 7px', marginTop: 3, display: 'inline-block', fontWeight: 700 }}>
                      {user?.role?.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu items — role-aware */}
              {(user?.role === 'authority'
                ? [
                    { icon: <Shield size={15} />, label: 'Authority Panel', path: '/authority' },
                    { icon: <User size={15} />, label: 'My Profile', path: '/profile' },
                    { icon: <FileText size={15} />, label: 'Assigned Issues', path: '/authority' },
                  ]
                : [
                    { icon: <LayoutDashboard size={15} />, label: 'Dashboard', path: '/dashboard' },
                    { icon: <User size={15} />, label: 'My Profile', path: '/profile' },
                    { icon: <FileText size={15} />, label: 'My Reports', path: '/my-reports' },
                  ]
              ).map(item => (
                <button key={item.path} onClick={() => { navigate(item.path); setShowProfile(false); }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 16px', background: 'none', border: 'none',
                  color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'var(--transition)', fontFamily: 'inherit', textAlign: 'left',
                }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.08)'; e.currentTarget.style.color = 'var(--primary-light)'; }}
                   onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  <span style={{ color: 'var(--primary-light)' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}

              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

              <button onClick={handleLogout} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 16px', background: 'none', border: 'none',
                color: 'var(--critical)', fontSize: '0.85rem', cursor: 'pointer',
                transition: 'var(--transition)', fontFamily: 'inherit',
              }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.08)'}
                 onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
