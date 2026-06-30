import { useState, useEffect, useRef } from 'react';
import { getAuthorityIssues, resolveIssue, getAnalytics } from '../services/api';
import {
  CheckCircle, Clock, AlertTriangle, TrendingUp, Upload,
  X, Shield, Eye, Zap, Brain, Camera, BarChart2,
  ThumbsUp, ThumbsDown, AlertOctagon, Sparkles, FileCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#FF4757', '#FF6B35', '#FFD93D', '#6BCB77', '#6C63FF'];

// ─── Verdict config ───────────────────────────────────────────
const VERDICT = {
  'Resolved': {
    color: 'var(--low)', bg: 'rgba(107,203,119,0.12)',
    border: 'rgba(107,203,119,0.35)', icon: '✅', label: 'RESOLVED',
    statusText: 'Issue marked RESOLVED', glow: '0 0 20px rgba(107,203,119,0.25)',
  },
  'Partial Fix': {
    color: 'var(--accent)', bg: 'rgba(0,212,255,0.10)',
    border: 'rgba(0,212,255,0.30)', icon: '🔧', label: 'PARTIAL FIX',
    statusText: 'Issue set to IN PROGRESS', glow: '0 0 20px rgba(0,212,255,0.2)',
  },
  'Not Resolved': {
    color: 'var(--critical)', bg: 'rgba(255,71,87,0.10)',
    border: 'rgba(255,71,87,0.35)', icon: '❌', label: 'NOT RESOLVED',
    statusText: 'Needs Further Action — community notified', glow: '0 0 20px rgba(255,71,87,0.2)',
  },
};

// ─── AI Verdict Card ─────────────────────────────────────────
const VerdictCard = ({ verification, onClose }) => {
  const v = VERDICT[verification.verdict] || VERDICT['Partial Fix'];
  const pct = verification.confidence;

  return (
    <div className="animate-fade-up" style={{
      marginTop: 20,
      background: v.bg, border: `1px solid ${v.border}`,
      borderRadius: 'var(--radius-xl)', padding: '24px',
      boxShadow: v.glow,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-lg)',
            background: v.bg, border: `1px solid ${v.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
          }}>
            {v.icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem' }}>AI Inspector Verdict</h3>
              <span style={{
                background: v.bg, border: `1px solid ${v.border}`,
                color: v.color, borderRadius: 'var(--radius-full)',
                padding: '2px 12px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.5px',
              }}>{v.label}</span>
              {verification.isFakePhoto && (
                <span style={{
                  background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.4)',
                  color: 'var(--critical)', borderRadius: 'var(--radius-full)',
                  padding: '2px 12px', fontSize: '0.72rem', fontWeight: 800,
                }}>⚠️ POSSIBLE FAKE PHOTO</span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v.statusText}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* AI Summary */}
      <div style={{
        background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)',
        borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 18,
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <Brain size={15} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--primary-light)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Summary</div>
          <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{verification.summary}</p>
        </div>
      </div>

      {/* Confidence bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={11} /> Confidence</span>
          <strong style={{ color: v.color, fontSize: '0.9rem' }}>{pct}%</strong>
        </div>
        <div style={{ height: 8, background: 'var(--bg-glass-strong)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: pct >= 80 ? 'var(--low)' : pct >= 50 ? 'var(--medium)' : 'var(--critical)',
            borderRadius: 4, transition: 'width 1.2s ease',
            boxShadow: `0 0 8px ${v.color}50`,
          }} />
        </div>
      </div>

      {/* Improvements + Concerns grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <div style={{ background: 'rgba(107,203,119,0.06)', border: '1px solid rgba(107,203,119,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--low)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ThumbsUp size={11} /> IMPROVEMENTS OBSERVED
          </div>
          {verification.improvements?.length > 0
            ? verification.improvements.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 5, alignItems: 'flex-start' }}>
                <CheckCircle size={11} color="var(--low)" style={{ flexShrink: 0, marginTop: 2 }} /> {item}
              </div>
            ))
            : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None detected</div>
          }
        </div>
        <div style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--critical)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={11} /> REMAINING CONCERNS
          </div>
          {verification.concerns?.length > 0
            ? verification.concerns.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 5, alignItems: 'flex-start' }}>
                <AlertTriangle size={11} color="var(--critical)" style={{ flexShrink: 0, marginTop: 2 }} /> {item}
              </div>
            ))
            : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None remaining</div>
          }
        </div>
      </div>

      {/* Inspector note */}
      {verification.inspectorNote && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
          fontSize: '0.78rem', color: 'var(--text-muted)',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <FileCheck size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span><strong style={{ color: 'var(--text-secondary)' }}>Inspector Note: </strong>{verification.inspectorNote}</span>
        </div>
      )}
    </div>
  );
};

// ─── Resolve Panel ────────────────────────────────────────────
const ResolvePanel = ({ issue, onClose, onDone }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) { toast.error('Upload resolution proof image first'); return; }
    setLoading(true);
    const processingToast = toast.loading('🔬 AI Inspector is comparing before/after images…', { duration: 40000 });
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await resolveIssue(issue._id, formData);
      toast.dismiss(processingToast);
      setVerdict(res.data.verification);
      const v = res.data.verification.verdict;
      if (v === 'Resolved') toast.success(`✅ AI confirmed: RESOLVED (${res.data.verification.confidence}% confidence)`);
      else if (v === 'Partial Fix') toast(`🔧 Partial fix — issue set to In Progress`, { icon: '🔧', duration: 5000 });
      else toast.error(`❌ AI says NOT resolved${res.data.verification.isFakePhoto ? ' — fake photo suspected!' : ''}`, { duration: 6000 });
      onDone();
    } catch (err) {
      toast.dismiss(processingToast);
      toast.error(err.response?.data?.message || 'Submission failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 16, padding: 20, background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={18} color="var(--primary-light)" />
          <h4 style={{ fontFamily: 'Outfit', fontWeight: 700 }}>AI Resolution Inspector</h4>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
      </div>

      {/* Before / After preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📸 BEFORE (Original)</div>
          {issue.images?.[0] ? (
            <img src={`http://localhost:5000/${issue.images[0]}`} alt="Before"
              style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid rgba(255,71,87,0.3)' }}
              onError={e => e.target.style.display = 'none'} />
          ) : (
            <div style={{ height: 140, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No image
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>✅ AFTER (Your Proof)</div>
          {preview ? (
            <div style={{ position: 'relative' }}>
              <img src={preview} alt="After"
                style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid rgba(107,203,119,0.4)' }} />
              <button onClick={() => { setFile(null); setPreview(null); setVerdict(null); }}
                style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontSize: '0.7rem' }}>
                <X size={11} />
              </button>
            </div>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 140, border: '2px dashed rgba(107,203,119,0.35)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'rgba(107,203,119,0.04)', transition: 'var(--transition)' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(107,203,119,0.08)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(107,203,119,0.04)'}>
              <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileRef} onChange={e => handleFile(e.target.files[0])} />
              <Upload size={22} color="var(--low)" style={{ marginBottom: 8 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--low)', fontWeight: 600 }}>Upload After Photo</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Gemini will compare both</span>
            </label>
          )}
        </div>
      </div>

      {/* Hint */}
      <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 14, fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
        <Sparkles size={13} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>Gemini AI will inspect both images as a strict civic inspector — checking if the fix is genuine, partial, or possibly fake.</span>
      </div>

      {/* Submit */}
      {preview && !verdict && (
        <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={loading}>
          {loading
            ? <><div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> AI Inspector is working…</>
            : <><Eye size={16} /> Submit for AI Inspection</>}
        </button>
      )}

      {/* AI Verdict rendered here */}
      {verdict && <VerdictCard verification={verdict} onClose={null} />}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────
const AuthorityDashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const [tab, setTab] = useState('issues');
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [issuesRes, analyticsRes] = await Promise.all([getAuthorityIssues(), getAnalytics()]);
      setIssues(issuesRes.data.issues || []);
      setStats(issuesRes.data.stats || {});
      setAnalytics(analyticsRes.data.analytics);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><div className="loading-spinner" /></div>;

  const categoryData = analytics?.categoryTrends?.map(c => ({ name: c._id?.split(' ')[0] || c._id, value: c.count })) || [];
  const statusData   = analytics?.statusBreakdown?.map(s => ({ name: s._id, value: s.count })) || [];

  const getStatusBadgeStyle = (status) => {
    const map = {
      'Resolved':             { bg: 'rgba(107,203,119,0.15)', color: 'var(--low)',      border: 'rgba(107,203,119,0.3)' },
      'Pending':              { bg: 'rgba(255,107,53,0.15)',   color: 'var(--medium)',   border: 'rgba(255,107,53,0.3)'  },
      'In Progress':          { bg: 'rgba(0,212,255,0.12)',    color: 'var(--accent)',   border: 'rgba(0,212,255,0.3)'   },
      'Needs Further Action': { bg: 'rgba(255,71,87,0.15)',    color: 'var(--critical)', border: 'rgba(255,71,87,0.3)'   },
      'Verified':             { bg: 'rgba(108,99,255,0.15)',   color: 'var(--primary-light)', border: 'rgba(108,99,255,0.3)' },
    };
    return map[status] || map['Pending'];
  };

  return (
    <>
      <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>
            <Shield size={24} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            Authority <span className="text-gradient">Dashboard</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>{user?.department || 'All Departments'} · {stats.total || 0} issues assigned</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['issues', 'analytics'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'} btn-sm`}>
              {t === 'issues' ? '📋 Issues' : '📊 Analytics'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Assigned', value: stats.total || 0,      icon: '📋', color: 'purple', bg: 'rgba(108,99,255,0.15)' },
          { label: 'Pending',        value: stats.pending || 0,     icon: '⏳', color: 'orange', bg: 'rgba(255,107,53,0.15)' },
          { label: 'In Progress',    value: stats.inProgress || 0,  icon: '🔧', color: 'cyan',   bg: 'rgba(0,212,255,0.15)'  },
          { label: 'Resolved',       value: stats.resolved || 0,    icon: '✅', color: 'green',  bg: 'rgba(76,175,80,0.15)'  },
          { label: 'Critical',       value: stats.critical || 0,    icon: '🔴', color: 'red',    bg: 'rgba(255,71,87,0.15)'  },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className="stat-card-icon" style={{ background: s.bg }}><span style={{ fontSize: '1.4rem' }}>{s.icon}</span></div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Issues tab */}
      {tab === 'issues' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 700 }}>📋 Assigned Issues</h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Brain size={13} color="var(--primary-light)" />
              AI Inspector ready · Sorted by priority score
            </div>
          </div>

          {issues.map(issue => {
            const sStyle = getStatusBadgeStyle(issue.status);
            const rv = issue.resolutionVerification;
            const verdictCfg = rv?.verdict ? VERDICT[rv.verdict] : null;
            const isNeedsAction = issue.status === 'Needs Further Action';

            return (
              <div key={issue._id} className="glass-card" style={{ padding: 20 }}>
                {/* Issue header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <h3
                        style={{ fontWeight: 700, fontSize: '1rem', cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}
                        onClick={() => setSelectedIssue(issue)}
                        title="Click to view details"
                      >{issue.title}</h3>
                      <span className={`badge badge-${issue.severity?.toLowerCase()}`}>{issue.severity}</span>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700, borderRadius: 'var(--radius-full)',
                        padding: '2px 10px', background: sStyle.bg, color: sStyle.color,
                        border: `1px solid ${sStyle.border}`,
                      }}>{issue.status}</span>
                      {isNeedsAction && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, borderRadius: 'var(--radius-full)', padding: '2px 10px', background: 'rgba(255,217,61,0.12)', color: 'var(--medium)', border: '1px solid rgba(255,217,61,0.3)' }}>
                          🔎 Community Vote Active
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 10, lineHeight: 1.5 }}>
                      {issue.description?.substring(0, 160)}{issue.description?.length > 160 ? '…' : ''}
                    </p>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>📍 {issue.location?.address || `${issue.location?.lat?.toFixed(3)}, ${issue.location?.lng?.toFixed(3)}`}</span>
                      <span>👥 {issue.verificationCount} verifications</span>
                      <span>🙌 {issue.supporters?.length || 0} supporters</span>
                      <span>⚡ Priority: <strong style={{ color: 'var(--primary-light)' }}>{issue.priorityScore}</strong></span>
                      <span>📅 {new Date(issue.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                    {issue.images?.[0] && (
                      <img src={`http://localhost:5000/${issue.images[0]}`} alt="Before"
                        style={{ width: 110, height: 75, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                        onError={e => e.target.style.display = 'none'} />
                    )}
                    {issue.status !== 'Resolved' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => setResolving(resolving === issue._id ? null : issue._id)}
                        style={{ minWidth: 130 }}
                      >
                        {resolving === issue._id
                          ? <><X size={13} /> Cancel</>
                          : <><Camera size={13} /> Upload Fix Proof</>}
                      </button>
                    )}
                    {issue.status === 'Resolved' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--low)', fontSize: '0.85rem', fontWeight: 600 }}>
                        <CheckCircle size={14} /> Resolved
                      </div>
                    )}
                  </div>
                </div>

                {/* Previous AI verdict (collapsed summary) */}
                {rv?.verdict && resolving !== issue._id && (
                  <div style={{
                    marginTop: 14, padding: '10px 14px',
                    background: verdictCfg?.bg, border: `1px solid ${verdictCfg?.border}`,
                    borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <span style={{ fontSize: '1rem' }}>{verdictCfg?.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: verdictCfg?.color, marginBottom: 3 }}>
                        AI Inspector: {rv.verdict} · {rv.confidence}% confidence
                        {rv.isFakePhoto && <span style={{ marginLeft: 8, color: 'var(--critical)' }}>⚠️ Fake photo suspected</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{rv.summary}</div>
                      {isNeedsAction && (
                        <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--medium)' }}>
                          Community vote: {(issue.communityConfirms?.filter(c => c.vote === 'yes').length || 0)} ✅ yes / {(issue.communityConfirms?.filter(c => c.vote === 'no').length || 0)} ❌ no
                        </div>
                      )}
                    </div>
                    {rv.inspectorNote && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 200, textAlign: 'right', lineHeight: 1.4 }}>
                        "{rv.inspectorNote}"
                      </div>
                    )}
                  </div>
                )}

                {/* Resolve panel */}
                {resolving === issue._id && (
                  <ResolvePanel
                    issue={issue}
                    onClose={() => setResolving(null)}
                    onDone={() => { setResolving(null); fetchData(); }}
                  />
                )}
              </div>
            );
          })}

          {issues.length === 0 && (
            <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 8 }}>All Clear!</h3>
              <p style={{ color: 'var(--text-muted)' }}>No issues assigned to your department right now.</p>
            </div>
          )}
        </div>
      )}

      {/* Analytics tab */}
      {tab === 'analytics' && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 20 }}>📊 Issues by Category</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0A0A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }} />
                  <Bar dataKey="value" fill="url(#gradient)" radius={[4,4,0,0]} />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6C63FF" />
                      <stop offset="100%" stopColor="#00D4FF" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 20 }}>🥧 Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0A0A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {analytics.hotspots?.length > 0 && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16 }}>🔥 Issue Hotspots</h3>
              {analytics.hotspots.slice(0, 5).map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 8 }}>
                  <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: i < 3 ? 'var(--critical)' : 'var(--text-muted)', width: 28 }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Lat: {h._id?.lat?.toFixed(3)}, Lng: {h._id?.lng?.toFixed(3)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.categories?.join(', ')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--critical)', fontSize: '1.1rem' }}>{h.count}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>active issues</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Avg Resolution Time', value: `${analytics.avgResolutionHours || 0}h`, icon: '⏱️', color: 'var(--accent)' },
              { label: 'Total Hotspots', value: analytics.hotspots?.length || 0, icon: '🔥', color: 'var(--critical)' },
              { label: 'Category Types', value: analytics.categoryTrends?.length || 0, icon: '🏷️', color: 'var(--primary-light)' },
            ].map((s, i) => (
              <div key={i} className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* ── Issue Detail Modal ── */}
      {selectedIssue && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setSelectedIssue(null)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 760,
              maxHeight: '82vh', overflowY: 'auto',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '14px 18px 12px',
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,255,0.04))',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              {/* Severity icon */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: selectedIssue.severity === 'Critical' ? 'rgba(255,71,87,0.2)' : selectedIssue.severity === 'High' ? 'rgba(255,107,53,0.2)' : 'rgba(108,99,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', marginTop: 2,
              }}>
                {selectedIssue.severity === 'Critical' ? '🔴' : selectedIssue.severity === 'High' ? '🟠' : selectedIssue.severity === 'Medium' ? '🟡' : '🟢'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.05rem', margin: 0, flex: 1, minWidth: 0 }}>
                    {selectedIssue.title}
                  </h2>
                  <span style={{
                    padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                    background: selectedIssue.status === 'Resolved' ? 'rgba(107,203,119,0.15)' : selectedIssue.status === 'In Progress' ? 'rgba(255,217,61,0.12)' : 'rgba(108,99,255,0.12)',
                    color: selectedIssue.status === 'Resolved' ? 'var(--low)' : selectedIssue.status === 'In Progress' ? 'var(--medium)' : 'var(--primary-light)',
                    border: `1px solid ${selectedIssue.status === 'Resolved' ? 'rgba(107,203,119,0.3)' : 'rgba(108,99,255,0.25)'}`,
                  }}>
                    {selectedIssue.status === 'Resolved' ? '✅' : selectedIssue.status === 'In Progress' ? '🔧' : '⏳'} {selectedIssue.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Reported by <strong style={{ color: 'var(--text-secondary)' }}>{selectedIssue.createdBy?.name || 'Citizen'}</strong>
                  {selectedIssue.createdAt && ` · ${new Date(selectedIssue.createdAt).toLocaleDateString('en-IN')}`}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.72rem' }}>
                    🏷️ {selectedIssue.category}
                  </span>
                  <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700,
                    background: selectedIssue.severity === 'Critical' ? 'rgba(255,71,87,0.15)' : selectedIssue.severity === 'High' ? 'rgba(255,107,53,0.15)' : 'rgba(255,217,61,0.15)',
                    color: selectedIssue.severity === 'Critical' ? '#FF4757' : selectedIssue.severity === 'High' ? '#FF6B35' : '#FFD93D',
                  }}>
                    ⚠️ {selectedIssue.severity}
                  </span>
                  <span style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.72rem' }}>
                    🏛️ {selectedIssue.assignedDept || selectedIssue.department || 'Your Dept'}
                  </span>
                  <span style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--primary-light)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                    ⚡ {selectedIssue.priorityScore} pts
                  </span>
                </div>
              </div>

              <button onClick={() => setSelectedIssue(null)} style={{
                flexShrink: 0, background: 'var(--bg-glass)', border: '1px solid var(--border)',
                borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
                fontSize: '0.85rem', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            {/* Body: 2-column */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedIssue.images?.[0] ? '180px 1fr' : '1fr', gap: 0 }}>

              {/* Left: Image + stats */}
              {selectedIssue.images?.[0] && (
                <div style={{ borderRight: '1px solid var(--border)', padding: '14px' }}>
                  <img
                    src={`http://localhost:5000/${selectedIssue.images[0]}`}
                    alt={selectedIssue.title}
                    style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 10 }}
                    onError={e => e.target.style.display = 'none'}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { icon: '👍', val: selectedIssue.upvotes?.length || 0, label: 'Upvotes' },
                      { icon: '✅', val: selectedIssue.verificationCount || 0, label: 'Verifications' },
                      { icon: '👥', val: selectedIssue.supporters?.length || 0, label: 'Supporters' },
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

              {/* Right: Details */}
              <div style={{ padding: '14px 18px' }}>
                {/* Description */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Description</div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {selectedIssue.description || 'No description provided.'}
                  </p>
                </div>

                {/* Location */}
                {(selectedIssue.location?.address || selectedIssue.location?.lat) && (
                  <div style={{ marginBottom: 12, background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 2 }}>📍 Location</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {selectedIssue.location.address || `${selectedIssue.location.lat?.toFixed(4)}, ${selectedIssue.location.lng?.toFixed(4)}`}
                    </div>
                    {selectedIssue.location.area && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedIssue.location.area}</div>}
                  </div>
                )}

                {/* Resolution proof */}
                {selectedIssue.status === 'Resolved' && selectedIssue.resolutionImages?.[0] && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>🔧 Resolution Proof</div>
                    <img
                      src={`http://localhost:5000/${selectedIssue.resolutionImages[0]}`}
                      alt="Resolution"
                      style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(107,203,119,0.3)' }}
                      onError={e => e.target.style.display = 'none'}
                    />
                  </div>
                )}

                {/* AI Verdict */}
                {selectedIssue.resolutionVerification?.verdict && (
                  <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span>🤖</span>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>AI Inspector: {selectedIssue.resolutionVerification.verdict}</span>
                      {selectedIssue.resolutionVerification.confidence && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{selectedIssue.resolutionVerification.confidence}%</span>
                      )}
                    </div>
                    {selectedIssue.resolutionVerification.summary && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{selectedIssue.resolutionVerification.summary}</p>
                    )}
                  </div>
                )}

                <button onClick={() => setSelectedIssue(null)} style={{
                  width: '100%', padding: '9px', borderRadius: 'var(--radius-full)',
                  background: 'var(--gradient-primary)', border: 'none',
                  color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  fontSize: '0.85rem',
                }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthorityDashboard;
