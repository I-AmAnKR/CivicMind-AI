import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getIssues } from '../services/api';
import { FileText, MapPin, Clock, ThumbsUp, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const STATUS_STYLE = {
  'Resolved':             { bg: 'rgba(107,203,119,0.15)', color: '#6BCB77',  border: 'rgba(107,203,119,0.3)',  icon: '✅' },
  'In Progress':          { bg: 'rgba(0,212,255,0.12)',   color: '#00D4FF',  border: 'rgba(0,212,255,0.3)',   icon: '🔧' },
  'Pending':              { bg: 'rgba(255,107,53,0.15)',  color: '#FF6B35',  border: 'rgba(255,107,53,0.3)',  icon: '⏳' },
  'Needs Further Action': { bg: 'rgba(255,71,87,0.15)',   color: '#FF4757',  border: 'rgba(255,71,87,0.3)',   icon: '⚠️' },
};

const SEV_STYLE = {
  Critical: { bg: 'rgba(255,71,87,0.15)',   color: '#FF4757' },
  High:     { bg: 'rgba(255,107,53,0.15)',  color: '#FF6B35' },
  Medium:   { bg: 'rgba(255,217,61,0.15)',  color: '#FFD93D' },
  Low:      { bg: 'rgba(107,203,119,0.15)', color: '#6BCB77' },
};

const DetailModal = ({ issue, onClose }) => {
  if (!issue) return null;
  const st = STATUS_STYLE[issue.status] || STATUS_STYLE['Pending'];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn 0.2s ease' }}
      onClick={onClose}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 720, maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,255,0.04))', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: SEV_STYLE[issue.severity]?.bg || 'rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, marginTop: 2 }}>
            {issue.severity === 'Critical' ? '🔴' : issue.severity === 'High' ? '🟠' : issue.severity === 'Medium' ? '🟡' : '🟢'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.05rem', margin: 0, flex: 1 }}>{issue.title}</h2>
              <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}`, flexShrink: 0 }}>
                {st.icon} {issue.status}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Submitted on {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown date'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.72rem' }}>🏷️ {issue.category}</span>
              <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, background: SEV_STYLE[issue.severity]?.bg, color: SEV_STYLE[issue.severity]?.color }}>⚠️ {issue.severity}</span>
              <span style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--primary-light)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>⚡ {issue.priorityScore} pts</span>
              {issue.assignedDept && <span style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.72rem' }}>🏛️ {issue.assignedDept}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ flexShrink: 0, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ display: 'grid', gridTemplateColumns: issue.images?.[0] ? '180px 1fr' : '1fr', gap: 0 }}>
          {issue.images?.[0] && (
            <div style={{ borderRight: '1px solid var(--border)', padding: 14 }}>
              <img src={`http://localhost:5000/${issue.images[0]}`} alt={issue.title}
                style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 10 }}
                onError={e => e.target.style.display = 'none'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: '👍', val: issue.upvotes?.length || 0, label: 'Upvotes' },
                  { icon: '✅', val: issue.verificationCount || 0, label: 'Verified by' },
                  { icon: '👥', val: issue.supporters?.length || 0, label: 'Supporters' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px' }}>
                    <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: '14px 18px' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Description</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{issue.description || 'No description provided.'}</p>
            </div>

            {(issue.location?.address || issue.location?.lat) && (
              <div style={{ marginBottom: 12, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 2 }}>📍 Location</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {issue.location.address || `${issue.location.lat?.toFixed(4)}, ${issue.location.lng?.toFixed(4)}`}
                </div>
                {issue.location.area && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{issue.location.area}</div>}
              </div>
            )}

            {issue.status === 'Resolved' && issue.resolutionNote && (
              <div style={{ marginBottom: 12, background: 'rgba(107,203,119,0.06)', border: '1px solid rgba(107,203,119,0.25)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6BCB77', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>✅ Resolution Note</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{issue.resolutionNote}</p>
              </div>
            )}

            {issue.resolutionImages?.[0] && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>🔧 Resolution Proof</div>
                <img src={`http://localhost:5000/${issue.resolutionImages[0]}`} alt="Resolution"
                  style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(107,203,119,0.3)' }}
                  onError={e => e.target.style.display = 'none'} />
              </div>
            )}

            <button onClick={onClose} style={{ width: '100%', padding: 9, borderRadius: 'var(--radius-full)', background: 'var(--gradient-primary)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyReports = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchMyIssues = async () => {
      setLoading(true);
      try {
        const res = await getIssues({ limit: 200 });
        const all = res.data.issues || [];
        // Filter to only issues created by current user
        const mine = all.filter(issue =>
          issue.createdBy?._id === user?._id ||
          issue.createdBy === user?._id
        );
        setIssues(mine);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    if (user) fetchMyIssues();
  }, [user]);

  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter);

  const counts = {
    all: issues.length,
    Pending: issues.filter(i => i.status === 'Pending').length,
    'In Progress': issues.filter(i => i.status === 'In Progress').length,
    Resolved: issues.filter(i => i.status === 'Resolved').length,
  };

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><div className="loading-spinner" /></div>;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
          <FileText size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
          My <span className="text-gradient">Reports</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>All civic issues you have submitted · {issues.length} total</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total', count: counts.all, color: 'var(--primary-light)', icon: '📋' },
          { label: 'Pending', count: counts.Pending, color: '#FF6B35', icon: '⏳' },
          { label: 'In Progress', count: counts['In Progress'], color: '#00D4FF', icon: '🔧' },
          { label: 'Resolved', count: counts.Resolved, color: '#6BCB77', icon: '✅' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: filter === (s.label === 'Total' ? 'all' : s.label) ? `1px solid ${s.color}` : undefined }}
            onClick={() => setFilter(s.label === 'Total' ? 'all' : s.label)}>
            <span style={{ fontSize: '1.6rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.6rem', color: s.color, lineHeight: 1 }}>{s.count}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'Pending', 'In Progress', 'Resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}>
            {f === 'all' ? '🗂️ All' : f === 'Pending' ? '⏳ Pending' : f === 'In Progress' ? '🔧 In Progress' : '✅ Resolved'}
          </button>
        ))}
      </div>

      {/* Issues grid */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 56, textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📭</div>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 8 }}>
            {issues.length === 0 ? 'No reports yet' : `No ${filter} issues`}
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            {issues.length === 0
              ? 'You haven\'t reported any civic issues yet. Head to Report Issue to get started!'
              : `None of your reports have "${filter}" status.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(issue => {
            const st = STATUS_STYLE[issue.status] || STATUS_STYLE['Pending'];
            const sv = SEV_STYLE[issue.severity] || SEV_STYLE['Low'];
            return (
              <div key={issue._id} className="glass-card" style={{ padding: '18px 22px', cursor: 'pointer', transition: 'var(--transition)' }}
                onClick={() => setSelected(issue)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* Thumbnail */}
                  {issue.images?.[0] ? (
                    <img src={`http://localhost:5000/${issue.images[0]}`} alt=""
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)', flexShrink: 0 }}
                      onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: 10, background: 'var(--bg-glass)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
                      {issue.category === 'Road' ? '🛣️' : issue.category === 'Water' ? '💧' : issue.category === 'Electricity' ? '⚡' : issue.category === 'Garbage' ? '🗑️' : '📋'}
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{issue.title}</h3>
                      <span style={{ padding: '2px 9px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}`, flexShrink: 0 }}>
                        {st.icon} {issue.status}
                      </span>
                      <span style={{ padding: '2px 9px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700, background: sv.bg, color: sv.color, flexShrink: 0 }}>
                        {issue.severity}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                      {issue.description?.substring(0, 120)}{issue.description?.length > 120 ? '…' : ''}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString('en-IN') : '—'}
                      </span>
                      {issue.location?.address && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} /> {issue.location.address.substring(0, 40)}{issue.location.address.length > 40 ? '…' : ''}
                        </span>
                      )}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ThumbsUp size={11} /> {issue.upvotes?.length || 0}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={11} /> {issue.verificationCount || 0} verified
                      </span>
                      {issue.category && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '1px 8px' }}>
                          {issue.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: 'var(--primary-light)', fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    View details →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && <DetailModal issue={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default MyReports;
