import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getIssues } from '../services/api';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Zap, MapPin, Star, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const SeverityBadge = ({ s }) => {
  const map = { Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low' };
  return <span className={`badge badge-${map[s] || 'pending'}`}>{s}</span>;
};

const StatusBadge = ({ s }) => {
  const map = { Resolved: 'resolved', Pending: 'pending', 'In Progress': 'medium', Verified: 'primary' };
  return <span className={`badge badge-${map[s] || 'pending'}`}>{s}</span>;
};

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, critical: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getIssues({ limit: 50 });
        const all = res.data.issues || [];
        setIssues(all);
        const mine = all.filter(i => i.createdBy?._id === user?.id);
        setMyIssues(mine);
        setStats({
          total: all.length,
          resolved: all.filter(i => i.status === 'Resolved').length,
          pending: all.filter(i => i.status === 'Pending').length,
          critical: all.filter(i => i.severity === 'Critical').length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const level = user?.points >= 1000 ? 'Diamond' : user?.points >= 500 ? 'Platinum' : user?.points >= 200 ? 'Gold' : user?.points >= 100 ? 'Silver' : 'Bronze';
  const levelColors = { Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#FFD700', Platinum: '#E5E4E2', Diamond: '#00D4FF' };

  if (loading) return (
    <div className="flex-center" style={{ height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,255,0.08))',
        border: '1px solid rgba(108,99,255,0.2)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.1), transparent 70%)' }} />
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
            Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}!</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            You're making your city better. Keep it up!
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>LEVEL</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, color: levelColors[level], fontSize: '1.1rem' }}>
              {level} 🏅
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>POINTS</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.5rem', color: 'var(--medium)' }}>
              {user?.points || 0}
              <Zap size={16} fill="var(--medium)" color="var(--medium)" style={{ display: 'inline', marginLeft: 4 }} />
            </div>
          </div>
          <Link to="/report">
            <button className="btn btn-primary">
              <AlertTriangle size={16} />
              Report Issue
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 32 }}>
        {[
          { icon: '📋', label: 'Total Issues', value: stats.total, color: 'purple', sub: 'in your city', bgColor: 'rgba(108,99,255,0.15)' },
          { icon: '✅', label: 'Resolved', value: stats.resolved, color: 'green', sub: `${stats.total ? Math.round((stats.resolved/stats.total)*100) : 0}% resolution rate`, bgColor: 'rgba(107,203,119,0.15)' },
          { icon: '⏳', label: 'Pending', value: stats.pending, color: 'orange', sub: 'awaiting action', bgColor: 'rgba(255,107,53,0.15)' },
          { icon: '🔴', label: 'Critical', value: stats.critical, color: 'red', sub: 'urgent attention needed', bgColor: 'rgba(255,71,87,0.15)' },
          { icon: '⚡', label: 'My Reports', value: myIssues.length, color: 'cyan', sub: 'issues you reported', bgColor: 'rgba(0,212,255,0.15)' },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className="stat-card-icon" style={{ background: s.bgColor }}>
              <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
            </div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent Issues */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Community Issues */}
        <div>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700 }}>🔴 Recent Critical Issues</h3>
            <Link to="/community" style={{ color: 'var(--primary-light)', fontSize: '0.85rem', fontWeight: 600 }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {issues.filter(i => i.severity === 'Critical' || i.severity === 'High').slice(0, 5).map(issue => (
              <div key={issue._id} className="glass-card" style={{ padding: '16px 20px' }}>
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{issue.title}</span>
                  <SeverityBadge s={issue.severity} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                  <span>📍 {issue.location?.address || issue.location?.area || 'Location set'}</span>
                  <span>🏛️ {issue.assignedDept?.split(' ')[0]}</span>
                </div>
                <div className="flex-between" style={{ marginTop: 8 }}>
                  <StatusBadge s={issue.status} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Score: <strong style={{ color: 'var(--primary-light)' }}>{issue.priorityScore}</strong>
                  </span>
                </div>
              </div>
            ))}
            {issues.filter(i => i.severity === 'Critical' || i.severity === 'High').length === 0 && (
              <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                🎉 No critical issues right now!
              </div>
            )}
          </div>
        </div>

        {/* My Issues */}
        <div>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700 }}>📋 My Reports</h3>
            <Link to="/report" className="btn btn-primary btn-sm">+ New Report</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myIssues.slice(0, 5).map(issue => (
              <div key={issue._id} className="glass-card" style={{ padding: '16px 20px' }}>
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{issue.title}</span>
                  <StatusBadge s={issue.status} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{issue.category} · {issue.assignedDept?.split(' ')[0]}</div>
                <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {issue.verificationCount} verifications · {issue.upvotes?.length || 0} upvotes
                </div>
              </div>
            ))}
            {myIssues.length === 0 && (
              <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>🏙️</div>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No reports yet. Be the first to report!</p>
                <Link to="/report"><button className="btn btn-primary btn-sm">Report an Issue</button></Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
