import { useState, useEffect } from 'react';
import { getIssues, verifyIssue, upvoteIssue, confirmResolution } from '../services/api';
import { ThumbsUp, CheckCircle, MessageCircle, MapPin, Clock, Zap, Filter, Brain, AlertOctagon, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const SeverityBar = ({ severity }) => {
  const map = { Low: { w: 25, color: 'var(--low)' }, Medium: { w: 50, color: 'var(--medium)' }, High: { w: 75, color: 'var(--high)' }, Critical: { w: 100, color: 'var(--critical)' } };
  const { w, color } = map[severity] || map.Medium;
  return (
    <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
    </div>
  );
};

const CommunityFeed = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [verifying, setVerifying] = useState({});
  const [upvoting, setUpvoting] = useState({});
  const [confirming, setConfirming] = useState({});
  const [page, setPage] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    fetchIssues();
  }, [filter]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
    const params = { limit: 30 };
      if (filter === 'critical')  params.severity = 'Critical';
      if (filter === 'pending')   params.status = 'Pending';
      if (filter === 'resolved')  params.status = 'Resolved';
      if (filter === 'needs-fix') params.status = 'Needs Further Action';
      const res = await getIssues(params);
      setIssues(res.data.issues || []);
    } catch {}
    setLoading(false);
  };

  const handleVerify = async (issueId, vote) => {
    setVerifying(prev => ({ ...prev, [issueId]: true }));
    try {
      await verifyIssue(issueId, { vote, comment: `Community ${vote}` });
      toast.success(vote === 'confirm' ? '✅ Confirmed! +10 points earned' : '❌ Disputed');
      setIssues(prev => prev.map(i => i._id === issueId ? { ...i, verificationCount: i.verificationCount + 1 } : i));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not verify');
    }
    setVerifying(prev => ({ ...prev, [issueId]: false }));
  };

  const handleConfirm = async (issueId, vote) => {
    setConfirming(prev => ({ ...prev, [issueId]: vote }));
    try {
      const res = await confirmResolution(issueId, vote);
      const { yesVotes, noVotes, autoResolved, message } = res.data;
      if (autoResolved) {
        toast.success(`🎉 Community resolved it! Issue closed.`);
      } else {
        toast(vote === 'yes'
          ? `✅ Voted: Fixed! (${yesVotes} yes / ${noVotes} no) +8 pts`
          : `❌ Voted: Not fixed! (${yesVotes} yes / ${noVotes} no) +8 pts`,
          { icon: vote === 'yes' ? '✅' : '❌', duration: 4000 }
        );
      }
      fetchIssues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vote failed');
    }
    setConfirming(prev => ({ ...prev, [issueId]: null }));
  };

  const handleUpvote = async (issueId) => {
    setUpvoting(prev => ({ ...prev, [issueId]: true }));
    try {
      const res = await upvoteIssue(issueId);
      setIssues(prev => prev.map(i => i._id === issueId ? { ...i, upvotes: Array(res.data.upvotes).fill(null) } : i));
    } catch {}
    setUpvoting(prev => ({ ...prev, [issueId]: false }));
  };

  const severityBadgeStyle = (s) => {
    const map = { Critical: { bg: 'rgba(255,71,87,0.15)', color: '#FF4757' }, High: { bg: 'rgba(255,107,53,0.15)', color: '#FF6B35' }, Medium: { bg: 'rgba(255,217,61,0.15)', color: '#FFD93D' }, Low: { bg: 'rgba(107,203,119,0.15)', color: '#6BCB77' } };
    return map[s] || map.Medium;
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
          Community <span className="text-gradient">Feed</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Verify issues reported by your community. +10 points per verification!</p>
      </div>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { id: 'all',       label: '🌐 All Issues' },
          { id: 'critical',   label: '🔴 Critical' },
          { id: 'pending',    label: '⏳ Pending Verification' },
          { id: 'resolved',   label: '✅ Resolved' },
          { id: 'needs-fix',  label: '🔎 Needs Community Vote' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '8px 20px',
            borderRadius: 'var(--radius-full)',
            border: filter === f.id ? 'none' : '1px solid var(--border)',
            background: filter === f.id ? 'var(--gradient-primary)' : 'var(--bg-glass)',
            color: filter === f.id ? 'white' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            transition: 'var(--transition)', fontFamily: 'Outfit, sans-serif'
          }}>
            {f.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem', alignSelf: 'center' }}>
          {issues.length} issues
        </span>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: '40vh' }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {issues.map((issue, idx) => {
            const badgeStyle = severityBadgeStyle(issue.severity);
            const isResolved = issue.status === 'Resolved';
            return (
              <div key={issue._id} className="issue-card"
                style={{ animationDelay: `${idx * 0.05}s`, animation: 'fade-up 0.4s ease both', cursor: 'pointer' }}
                onClick={() => setSelectedIssue(issue)}
              >
                {/* Header */}
                <div className="issue-card-header">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                        {issue.createdBy?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{issue.createdBy?.name || 'Anonymous Citizen'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {timeAgo(issue.createdAt)}
                        </div>
                      </div>
                    </div>
                    <h3 className="issue-card-title">{issue.title}</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span style={{ background: badgeStyle.bg, color: badgeStyle.color, padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      {issue.severity}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--primary-glow)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 700 }}>
                      <Zap size={10} fill="currentColor" /> {issue.priorityScore}
                    </div>
                  </div>
                </div>

                {/* Priority bar */}
                <SeverityBar severity={issue.severity} />

                {/* Image */}
                {issue.images?.[0] && (
                  <img
                    src={`http://localhost:5000/${issue.images[0]}`}
                    alt={issue.title}
                    className="issue-card-img"
                    style={{ marginTop: 12 }}
                    onError={e => e.target.style.display = 'none'}
                  />
                )}

                <div className="issue-card-desc" style={{ marginTop: 12 }}>{issue.description}</div>

                {/* Meta */}
                <div className="issue-card-meta">
                  <span style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: '0.75rem' }}>
                    🏷️ {issue.category}
                  </span>
                  <span style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: '0.75rem' }}>
                    🏢 {issue.assignedDept?.split(' ')[0]}
                  </span>
                  {issue.location?.address && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <MapPin size={11} /> {issue.location.address}
                    </span>
                  )}
                  {isResolved && <span style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 'var(--radius-full)', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>✅ Resolved</span>}
                </div>

                {/* Actions */}
                {!isResolved && (
                  <div className="issue-card-actions" style={{ marginTop: 12 }}>
                    <button
                      className="action-btn"
                      onClick={() => handleUpvote(issue._id)}
                      disabled={upvoting[issue._id]}
                    >
                      <ThumbsUp size={14} /> {issue.upvotes?.length || 0} Upvote
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => handleVerify(issue._id, 'confirm')}
                      disabled={verifying[issue._id]}
                      style={{ color: 'var(--low)', borderColor: 'rgba(107,203,119,0.3)' }}
                    >
                      <CheckCircle size={14} /> Verify ({issue.verificationCount})
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => handleVerify(issue._id, 'dispute')}
                      disabled={verifying[issue._id]}
                      style={{ color: 'var(--critical)', borderColor: 'rgba(255,71,87,0.3)' }}
                    >
                      ❌ Dispute
                    </button>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Zap size={11} color="var(--medium)" /> +10 pts for verifying
                    </div>
                  </div>
                )}

                {/* Community confirmation vote — shown for Needs Further Action issues */}
                {issue.status === 'Needs Further Action' && (
                  <div style={{
                    marginTop: 14, padding: '16px 18px',
                    background: 'linear-gradient(135deg, rgba(255,217,61,0.08), rgba(255,107,53,0.06))',
                    border: '1px solid rgba(255,217,61,0.35)',
                    borderRadius: 'var(--radius-lg)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Brain size={15} color="var(--medium)" />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--medium)' }}>AI Inspector says NOT fully resolved</span>
                      {issue.resolutionVerification?.isFakePhoto && (
                        <span style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.3)', color: 'var(--critical)', borderRadius: 'var(--radius-full)', padding: '1px 10px', fontSize: '0.7rem', fontWeight: 700 }}>⚠️ Fake photo suspected</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
                      {issue.resolutionVerification?.summary || 'Authority submitted a resolution that AI could not confirm. Your vote helps determine if this issue is truly fixed.'}
                    </p>
                    {/* Vote tally */}
                    {(() => {
                      const yes = issue.communityConfirms?.filter(c => c.vote === 'yes').length || 0;
                      const no  = issue.communityConfirms?.filter(c => c.vote === 'no').length || 0;
                      const total = yes + no;
                      return total > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: 5 }}>
                            <span>Community vote ({total} total)</span>
                            <span style={{ color: yes > no ? 'var(--low)' : 'var(--critical)', fontWeight: 700 }}>{yes} yes / {no} no</span>
                          </div>
                          <div style={{ height: 5, background: 'var(--bg-glass-strong)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                            {yes > 0 && <div style={{ width: `${(yes/total)*100}%`, background: 'var(--low)', transition: 'width 0.5s' }} />}
                            {no  > 0 && <div style={{ width: `${(no/total)*100}%`,  background: 'var(--critical)', transition: 'width 0.5s' }} />}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>3 yes votes = auto-resolve · 3 no votes = flag authority</div>
                        </div>
                      );
                    })()}
                    {/* Vote buttons */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        className="action-btn"
                        style={{ flex: 1, justifyContent: 'center', color: 'var(--low)', borderColor: 'rgba(107,203,119,0.4)', background: 'rgba(107,203,119,0.06)', fontWeight: 700 }}
                        onClick={() => handleConfirm(issue._id, 'yes')}
                        disabled={!!confirming[issue._id]}
                      >
                        {confirming[issue._id] === 'yes' ? <div className="loading-spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <CheckCircle size={13} />}
                        ✅ Yes, It's Fixed
                      </button>
                      <button
                        className="action-btn"
                        style={{ flex: 1, justifyContent: 'center', color: 'var(--critical)', borderColor: 'rgba(255,71,87,0.4)', background: 'rgba(255,71,87,0.06)', fontWeight: 700 }}
                        onClick={() => handleConfirm(issue._id, 'no')}
                        disabled={!!confirming[issue._id]}
                      >
                        {confirming[issue._id] === 'no' ? <div className="loading-spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <AlertOctagon size={13} />}
                        ❌ No, Still Broken
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        <Zap size={11} color="var(--medium)" /> +8 pts
                      </div>
                    </div>
                  </div>
                )}

                {/* Resolution verdict (resolved issues) */}
                {isResolved && issue.resolutionVerification?.verdict && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px',
                    background: 'rgba(107,203,119,0.08)', border: '1px solid rgba(107,203,119,0.25)',
                    borderRadius: 'var(--radius-md)', fontSize: '0.82rem',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <Brain size={13} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>AI Inspector: {issue.resolutionVerification.verdict}</strong>
                      {issue.resolutionVerification.confidence && ` · ${issue.resolutionVerification.confidence}% confidence`}
                      {issue.resolutionVerification.summary && (
                        <div style={{ color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>{issue.resolutionVerification.summary}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {issues.length === 0 && (
            <div className="flex-center" style={{ height: '40vh', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: '3rem' }}>🌟</div>
              <p style={{ color: 'var(--text-muted)' }}>No issues found. Your city is clean!</p>
            </div>
          )}
        </div>
      )}

      {/* ——— Issue Detail Modal (Compact) ——— */}
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
            {/* ——— Compact Header ——— */}
            <div style={{
              padding: '14px 18px 12px',
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,255,0.04))',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, color: 'white', fontSize: '0.85rem', marginTop: 2,
              }}>
                {selectedIssue.createdBy?.name?.charAt(0) || 'U'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.05rem', margin: 0, flex: 1, minWidth: 0 }}>
                    {selectedIssue.title}
                  </h2>
                  {/* Status */}
                  <span style={{
                    padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                    background: selectedIssue.status === 'Resolved' ? 'rgba(107,203,119,0.15)' : selectedIssue.status === 'In Progress' ? 'rgba(255,217,61,0.12)' : 'rgba(108,99,255,0.12)',
                    color: selectedIssue.status === 'Resolved' ? 'var(--low)' : selectedIssue.status === 'In Progress' ? 'var(--medium)' : 'var(--primary-light)',
                    border: `1px solid ${selectedIssue.status === 'Resolved' ? 'rgba(107,203,119,0.3)' : 'rgba(108,99,255,0.25)'}`,
                  }}>
                    {selectedIssue.status === 'Resolved' ? '✅' : selectedIssue.status === 'In Progress' ? '🔧' : '⏳'} {selectedIssue.status}
                  </span>
                </div>

                {/* Reporter + time */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Reported by <strong style={{ color: 'var(--text-secondary)' }}>{selectedIssue.createdBy?.name || 'Anonymous'}</strong> · {timeAgo(selectedIssue.createdAt)}
                </div>

                {/* Tag row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.72rem' }}>
                    🏷️ {selectedIssue.category}
                  </span>
                  <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, background: severityBadgeStyle(selectedIssue.severity).bg, color: severityBadgeStyle(selectedIssue.severity).color }}>
                    ⚠️ {selectedIssue.severity}
                  </span>
                  <span style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.72rem' }}>
                    🏦 {selectedIssue.assignedDept || 'Unassigned'}
                  </span>
                  <span style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--primary-light)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                    ⚡ {selectedIssue.priorityScore} pts
                  </span>
                </div>
              </div>

              {/* Close */}
              <button onClick={() => setSelectedIssue(null)} style={{
                flexShrink: 0, background: 'var(--bg-glass)', border: '1px solid var(--border)',
                borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
                fontSize: '0.85rem', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            {/* ——— Body: 2-column ——— */}
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
                  {/* Mini stat cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { icon: '👍', val: selectedIssue.upvotes?.length || 0, label: 'Upvotes' },
                      { icon: '✅', val: selectedIssue.verificationCount || 0, label: 'Verifications' },
                      { icon: '📋', val: selectedIssue.duplicateCount || 1, label: 'Reports' },
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
                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>AI: {selectedIssue.resolutionVerification.verdict}</span>
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
    </div>
  );
};

export default CommunityFeed;
