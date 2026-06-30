import { useState, useEffect } from 'react';
import { getLeaderboard, getRecommendations } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Zap, Trophy, Star, Award, Shield, Target, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Config ─────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  Diamond: { color: '#00D4FF', bg: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.3)', icon: '💎', min: 1000, glow: '0 0 20px rgba(0,212,255,0.3)' },
  Platinum: { color: '#E5E4E2', bg: 'rgba(229,228,226,0.08)', border: 'rgba(229,228,226,0.2)', icon: '⚡', min: 500, glow: '0 0 15px rgba(229,228,226,0.2)' },
  Gold:     { color: '#FFD700', bg: 'rgba(255,215,0,0.12)',   border: 'rgba(255,215,0,0.3)',   icon: '🥇', min: 200, glow: '0 0 15px rgba(255,215,0,0.25)' },
  Silver:   { color: '#C0C0C0', bg: 'rgba(192,192,192,0.08)', border: 'rgba(192,192,192,0.2)', icon: '🥈', min: 100, glow: 'none' },
  Bronze:   { color: '#CD7F32', bg: 'rgba(205,127,50,0.08)',  border: 'rgba(205,127,50,0.2)',  icon: '🥉', min: 0,   glow: 'none' },
};

const getLevel = (pts) => {
  if (pts >= 1000) return 'Diamond';
  if (pts >= 500)  return 'Platinum';
  if (pts >= 200)  return 'Gold';
  if (pts >= 100)  return 'Silver';
  return 'Bronze';
};

const POINTS_GUIDE = [
  { action: 'Report an issue',            pts: '+25', icon: '📸' },
  { action: 'Verify a report',            pts: '+10', icon: '✅' },
  { action: 'Upvote an issue',            pts: '+5',  icon: '👍' },
  { action: 'Support duplicate issue',    pts: '+15', icon: '🤝' },
  { action: 'Resolution confirmed',       pts: '+50', icon: '🎉' },
  { action: 'Community vote cast',        pts: '+8',  icon: '🗳️' },
  { action: 'Weekly top contributor',     pts: '+100', icon: '🏆' },
];

const TYPE_COLOR = {
  preventive:     { color: '#6C63FF', bg: 'rgba(108,99,255,0.1)',  border: 'rgba(108,99,255,0.25)',  label: 'PREVENTIVE' },
  operational:    { color: '#00D4FF', bg: 'rgba(0,212,255,0.1)',   border: 'rgba(0,212,255,0.25)',   label: 'OPERATIONAL' },
  infrastructure: { color: '#FF6B35', bg: 'rgba(255,107,53,0.1)',  border: 'rgba(255,107,53,0.25)',  label: 'INFRASTRUCTURE' },
  policy:         { color: '#FFD93D', bg: 'rgba(255,217,61,0.1)',  border: 'rgba(255,217,61,0.25)',  label: 'POLICY' },
};

const TIMEFRAME_COLOR = {
  'Immediate':     { color: '#FF4757', bg: 'rgba(255,71,87,0.12)' },
  'This Week':     { color: '#FF6B35', bg: 'rgba(255,107,53,0.12)' },
  'This Month':    { color: '#FFD93D', bg: 'rgba(255,217,61,0.12)' },
  'This Quarter':  { color: '#6BCB77', bg: 'rgba(107,203,119,0.12)' },
};

// ── Badge grid component ────────────────────────────────────────
const BadgeGrid = ({ earned = [], allBadges = [] }) => {
  const earnedIds = new Set(earned.map(b => b.id || b.name));

  const categories = [...new Set(allBadges.map(b => b.category))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {categories.map(cat => (
        <div key={cat}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{cat}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allBadges.filter(b => b.category === cat).map(badge => {
              const isEarned = earnedIds.has(badge.id) || earnedIds.has(badge.name);
              return (
                <div key={badge.id} title={badge.desc} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '10px 12px', width: 72,
                  background: isEarned ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                  border: isEarned ? '1px solid rgba(255,215,0,0.4)' : '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: 'var(--radius-md)',
                  opacity: isEarned ? 1 : 0.4,
                  cursor: 'default',
                  transition: 'var(--transition)',
                  boxShadow: isEarned ? '0 0 12px rgba(255,215,0,0.15)' : 'none',
                }}>
                  <span style={{ fontSize: '1.4rem', filter: isEarned ? 'none' : 'grayscale(1)' }}>{badge.icon}</span>
                  <span style={{ fontSize: '0.58rem', fontWeight: 600, color: isEarned ? '#FFD700' : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
                    {badge.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Monthly Challenge Card ──────────────────────────────────────
const ChallengeCard = ({ challenge }) => {
  if (!challenge) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,255,0.08))',
      border: '1px solid rgba(108,99,255,0.35)',
      borderRadius: 'var(--radius-xl)', padding: '20px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120, borderRadius: '50%',
        background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.1)',
        fontSize: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {challenge.icon}
      </div>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>
        🗓️ Monthly Challenge
      </div>
      <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', marginBottom: 6 }}>{challenge.title}</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>{challenge.desc}</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#FFD700' }}>
          🎯 Goal: {challenge.goal} {challenge.target !== 'verify' && challenge.target !== 'support' ? challenge.target : 'actions'}
        </div>
        <div style={{ background: 'rgba(107,203,119,0.1)', border: '1px solid rgba(107,203,119,0.3)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--low)' }}>
          🏆 Top 100 earn digital certificate
        </div>
      </div>
    </div>
  );
};

// ── Recommendation Card ─────────────────────────────────────────
const RecommendationCard = ({ rec, idx }) => {
  const tc = TYPE_COLOR[rec.type] || TYPE_COLOR.operational;
  const tfc = TIMEFRAME_COLOR[rec.timeframe] || TIMEFRAME_COLOR['This Month'];
  return (
    <div className="animate-fade-up" style={{
      background: 'var(--bg-glass)', border: `1px solid ${tc.border}`,
      borderRadius: 'var(--radius-xl)', padding: '18px 20px',
      borderLeft: `3px solid ${tc.color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
        <div style={{ fontSize: '1.6rem', flexShrink: 0, marginTop: 2 }}>{rec.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem' }}>{rec.title}</h4>
            <span style={{
              background: tc.bg, border: `1px solid ${tc.border}`,
              color: tc.color, borderRadius: 'var(--radius-full)',
              padding: '1px 10px', fontSize: '0.62rem', fontWeight: 800,
            }}>{tc.label}</span>
            <span style={{
              background: tfc.bg, color: tfc.color,
              borderRadius: 'var(--radius-full)', padding: '1px 10px',
              fontSize: '0.62rem', fontWeight: 800,
            }}>{rec.timeframe?.toUpperCase()}</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{rec.description}</p>
          <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>Action: </span>
            <span style={{ color: 'var(--text-secondary)' }}>{rec.action}</span>
          </div>
          {rec.impact && (
            <div style={{ marginTop: 6, fontSize: '0.74rem', color: 'var(--low)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <TrendingUp size={11} /> Expected: {rec.impact}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────
const Leaderboard = () => {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);
  const [tab, setTab] = useState('leaderboard');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getLeaderboard();
        setLeaders(res.data.leaders || []);
        setAllBadges(res.data.allBadges || []);
        setChallenge(res.data.challenge);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (tab !== 'recommendations') return;
    const fetchRecs = async () => {
      setRecLoading(true);
      try {
        const res = await getRecommendations();
        setRecommendations(res.data.recommendations || []);
      } catch (e) { console.error(e); }
      setRecLoading(false);
    };
    fetchRecs();
  }, [tab]);

  const myRank = leaders.findIndex(l => l._id === user?.id || l._id?.toString() === user?.id) + 1;
  const myData = leaders.find(l => l._id === user?.id || l._id?.toString() === user?.id);
  const userPoints = myData?.points || user?.points || 0;
  const userLevel = getLevel(userPoints);
  const levelCfg = LEVEL_CONFIG[userLevel];

  const tabs = [
    { id: 'leaderboard',      label: '🏆 Leaderboard'     },
    { id: 'badges',           label: '🏅 Badges'           },
    { id: 'how-to-earn',      label: '💰 Earn Points'      },
    { id: 'recommendations',  label: '🤖 AI Recommendations'},
  ];

  // Determine next level
  const levels = Object.entries(LEVEL_CONFIG).sort((a, b) => a[1].min - b[1].min);
  const currentLevelIdx = levels.findIndex(([name]) => name === userLevel);
  const nextLevel = levels[currentLevelIdx + 1];
  const progressToNext = nextLevel
    ? Math.min(100, Math.round(((userPoints - levelCfg.min) / (nextLevel[1].min - levelCfg.min)) * 100))
    : 100;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
          🏆 <span className="text-gradient">Civic Leaderboard</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Report issues, verify reports, vote on resolutions — every action earns rewards.
        </p>
      </div>

      {/* MY STANDING card — always visible */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
        {/* Level card */}
        <div style={{
          background: `linear-gradient(135deg, ${levelCfg.bg}, rgba(0,0,0,0.2))`,
          border: `1px solid ${levelCfg.border}`,
          borderRadius: 'var(--radius-xl)', padding: '20px',
          textAlign: 'center',
          boxShadow: levelCfg.glow,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${levelCfg.color}08, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ fontSize: '2.8rem', marginBottom: 6 }}>{levelCfg.icon}</div>
          <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.3rem', color: levelCfg.color }}>{userLevel}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 10 }}>Current Level</div>
          {nextLevel && (
            <>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>Progress to {nextLevel[0]}</span><span style={{ color: levelCfg.color }}>{progressToNext}%</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressToNext}%`, background: levelCfg.color, borderRadius: 3, transition: 'width 1s ease', boxShadow: `0 0 6px ${levelCfg.color}` }} />
              </div>
            </>
          )}
        </div>

        {/* Points card */}
        <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Your Points</div>
          <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.8rem', color: 'var(--medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Zap size={26} fill="var(--medium)" />{userPoints}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 6 }}>Civic Points Earned</div>
          {myRank > 0 && (
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--primary-glow)', borderRadius: 'var(--radius-full)', padding: '4px 14px', fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 700 }}>
              🏅 Rank #{myRank} of {leaders.length}
            </div>
          )}
        </div>

        {/* Badges earned card */}
        <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Badges Earned</div>
          <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.8rem', color: '#FFD700' }}>
            {myData?.badges?.length || user?.badges?.length || 0}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 6 }}>of {allBadges.length} total</div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            {(myData?.badges || user?.badges || []).slice(0, 5).map((b, i) => (
              <span key={i} title={b.name} style={{ fontSize: '1.2rem' }}>{b.icon}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Challenge */}
      {challenge && <div style={{ marginBottom: 24 }}><ChallengeCard challenge={challenge} /></div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {tabs.map((t, i) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '11px 12px', textAlign: 'center',
            background: tab === t.id ? 'var(--gradient-primary)' : 'var(--bg-glass)',
            color: tab === t.id ? 'white' : 'var(--text-muted)',
            border: 'none', borderRight: i < tabs.length - 1 ? '1px solid var(--border)' : 'none',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', transition: 'var(--transition)', whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ LEADERBOARD TAB ════════════════════════════════════ */}
      {tab === 'leaderboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          {/* Rankings */}
          <div>
            {/* Header row */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,255,0.04))',
              border: '1px solid rgba(108,99,255,0.2)',
              borderRadius: 'var(--radius-lg)', padding: '12px 20px',
              marginBottom: 12, display: 'flex', justifyContent: 'space-between',
              fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
            }}>
              <span>Rank · Citizen</span>
              <span>Reports · Verifications · Points</span>
            </div>

            {loading ? (
              <div className="flex-center" style={{ height: '40vh' }}><div className="loading-spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leaders.map((leader, i) => {
                  const rank = i + 1;
                  const lvl = getLevel(leader.points || 0);
                  const lvlCfg = LEVEL_CONFIG[lvl];
                  const isMe = leader._id === user?.id || leader._id?.toString() === user?.id;
                  const isTop3 = rank <= 3;

                  return (
                    <div key={leader._id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 18px',
                      background: isMe ? 'rgba(108,99,255,0.1)' : isTop3 ? 'rgba(255,215,0,0.04)' : 'var(--bg-glass)',
                      border: isMe ? '1px solid rgba(108,99,255,0.4)' : isTop3 ? '1px solid rgba(255,215,0,0.2)' : '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: isTop3 ? '0 0 15px rgba(255,215,0,0.08)' : 'none',
                      transition: 'var(--transition)',
                    }}>
                      {/* Rank */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Outfit', fontWeight: 900,
                        background: rank === 1 ? 'rgba(255,215,0,0.15)' : rank === 2 ? 'rgba(192,192,192,0.12)' : rank === 3 ? 'rgba(205,127,50,0.12)' : 'rgba(255,255,255,0.04)',
                        border: rank <= 3 ? '1px solid rgba(255,215,0,0.3)' : '1px solid var(--border)',
                        fontSize: rank <= 3 ? '1.2rem' : '0.85rem',
                        color: 'var(--text-muted)',
                      }}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </div>

                      {/* Avatar */}
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                        background: isTop3 ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1rem',
                        border: `2px solid ${isTop3 ? 'rgba(255,215,0,0.4)' : 'var(--border)'}`,
                        boxShadow: isTop3 ? '0 0 12px rgba(255,215,0,0.2)' : 'none',
                      }}>
                        {leader.name?.charAt(0)?.toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{leader.name}</span>
                          {isMe && <span style={{ fontSize: '0.65rem', background: 'var(--primary-glow)', color: 'var(--primary-light)', borderRadius: 20, padding: '1px 8px', fontWeight: 700 }}>YOU</span>}
                          {/* Badges (first 3) */}
                          {(leader.badges || []).slice(0, 3).map((b, bi) => (
                            <span key={bi} title={b.name} style={{ fontSize: '0.9rem' }}>{b.icon}</span>
                          ))}
                          {leader.badges?.length > 3 && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{leader.badges.length - 3}</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: lvlCfg.color, fontWeight: 700 }}>
                          {lvlCfg.icon} {lvl}
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem' }}>{leader.reportsCount || 0}</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reports</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: 'var(--low)' }}>{leader.verificationsCount || 0}</div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,168,0,0.1)', border: '1px solid rgba(255,168,0,0.2)', borderRadius: 'var(--radius-full)', padding: '4px 12px' }}>
                          <Zap size={13} fill="var(--medium)" color="var(--medium)" />
                          <span style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1rem', color: 'var(--medium)' }}>{leader.points || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {leaders.length === 0 && (
                  <div className="flex-center" style={{ height: 200, flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: '3rem' }}>🏆</div>
                    <p style={{ color: 'var(--text-muted)' }}>No rankings yet. Start reporting!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Levels + Guide */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 14 }}>🏅 Level System</h4>
              {Object.entries(LEVEL_CONFIG).sort((a, b) => b[1].min - a[1].min).map(([lvl, cfg]) => (
                <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: lvl !== 'Bronze' ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '1.2rem' }}>{cfg.icon}</span>
                  <span style={{ fontWeight: 700, color: cfg.color, flex: 1, fontSize: '0.9rem' }}>{lvl}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cfg.min.toLocaleString()}+ pts</span>
                </div>
              ))}
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 14 }}>💰 Quick Points Guide</h4>
              {POINTS_GUIDE.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < POINTS_GUIDE.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '0.82rem' }}>{r.icon} {r.action}</span>
                  <span style={{ fontWeight: 800, color: 'var(--low)', fontFamily: 'Outfit', fontSize: '0.88rem' }}>{r.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ BADGES TAB ═════════════════════════════════════════ */}
      {tab === 'badges' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 6 }}>All Badges</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 20 }}>
              Earn badges by completing civic actions. Locked badges appear dimmed.
            </p>
            {loading ? <div className="loading-spinner" /> : (
              <BadgeGrid
                earned={myData?.badges || user?.badges || []}
                allBadges={allBadges}
              />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 14 }}>🎯 Badge Tips</h4>
              {[
                { icon: '📸', tip: 'Report 10 issues to earn Local Reporter' },
                { icon: '✅', tip: 'Verify 25 reports to unlock Eagle Eye' },
                { icon: '🛣️', tip: 'Report 50 road issues for Road Warrior' },
                { icon: '💎', tip: 'Reach 1000 points for Diamond Legend' },
                { icon: '🦸', tip: '5 AI-confirmed resolutions for Civic Hero' },
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '6px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                  <span>{t.icon}</span><span>{t.tip}</span>
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: 20 }}>
              <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 12 }}>📊 Your Stats</h4>
              {[
                { label: 'Reports', value: myData?.reportsCount || 0, icon: '📸', color: 'var(--primary-light)' },
                { label: 'Verifications', value: myData?.verificationsCount || 0, icon: '✅', color: 'var(--low)' },
                { label: 'Resolutions', value: myData?.resolvedCount || 0, icon: '🎉', color: 'var(--accent)' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: label !== 'Resolutions' ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '0.85rem' }}>{icon} {label}</span>
                  <span style={{ fontFamily: 'Outfit', fontWeight: 800, color, fontSize: '1.1rem' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ HOW TO EARN TAB ════════════════════════════════════ */}
      {tab === 'how-to-earn' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Actions guide */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 18 }}>💰 Ways to Earn Points</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { action: 'Report a new civic issue', pts: '+25', icon: '📸', desc: 'AI validates and classifies your report' },
                { action: 'Support a duplicate issue', pts: '+15', icon: '🤝', desc: 'AI detects you reported the same issue — adds you as supporter' },
                { action: 'Verify a report (confirm)', pts: '+10', icon: '✅', desc: 'Confirm another citizen\'s report is real' },
                { action: 'Upvote an issue', pts: '+5', icon: '👍', desc: 'Show importance of an issue' },
                { action: 'Community vote on resolution', pts: '+8', icon: '🗳️', desc: 'Vote YES/NO on disputed authority fix' },
                { action: 'Your issue gets resolved', pts: '+50', icon: '🎉', desc: 'Authority resolves your reported issue' },
                { action: 'Weekly top contributor', pts: '+100', icon: '🏆', desc: 'Top reporter of the week bonus' },
                { action: 'Sign-up bonus', pts: '+50', icon: '🚀', desc: 'One-time welcome reward' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{r.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.action}</span>
                      <span style={{ fontFamily: 'Outfit', fontWeight: 900, color: 'var(--low)', fontSize: '0.95rem', flexShrink: 0 }}>{r.pts}</span>
                    </div>
                    <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{r.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Engine explainer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={18} color="white" />
                </div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700 }}>⚡ AI Priority Engine</h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                Every issue is automatically scored by AI — no manual sorting needed. Authorities see the most critical issues first.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { factor: 'Severity', weight: 'Up to +100', icon: '🔴', desc: 'Critical=100, High=60, Medium=30, Low=10' },
                  { factor: 'Community Votes', weight: '+5 per verify', icon: '👥', desc: 'More confirmations = higher priority' },
                  { factor: 'Time Open', weight: 'Up to +60', icon: '⏳', desc: 'Older unresolved issues get boosted' },
                  { factor: 'Location Context', weight: 'Up to ×2', icon: '🏥', desc: 'Near schools, hospitals, highways = multiplied' },
                  { factor: 'Monsoon Season', weight: '+25', icon: '🌧️', desc: 'Water/road issues boosted Jun–Sept' },
                  { factor: 'Supporter Count', weight: '+4 per', icon: '🤝', desc: 'Duplicate supporters prove issue is real' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{f.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{f.factor}</span>
                        <span style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--accent)', fontSize: '0.78rem' }}>{f.weight}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Routing explainer */}
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #00D4FF, #6C63FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} color="white" />
                </div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700 }}>🧭 Smart Routing AI</h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                Gemini reads your issue description and automatically routes to the correct government department — even for ambiguous categories.
              </p>
              {[
                ['Water leak near school', '→', 'Delhi Jal Board', '🚨 Critical escalation'],
                ['Pothole on NH-48', '→', 'PWD', '⚡ High priority (highway)'],
                ['Garbage every Sunday', '→', 'Municipal Corp', '🔔 Operational pattern'],
                ['Broken streetlight', '→', 'Electricity Dept', '📍 Standard routing'],
              ].map(([from, arrow, to, note], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-muted)', flex: 1 }}>"{from}"</span>
                  <span style={{ color: 'var(--text-muted)' }}>{arrow}</span>
                  <span style={{ color: 'var(--primary-light)', fontWeight: 700, whiteSpace: 'nowrap' }}>{to}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ AI RECOMMENDATIONS TAB ═════════════════════════════ */}
      {tab === 'recommendations' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'Outfit', fontWeight: 800 }}>🤖 AI Action Recommendations</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Gemini analyzes complaint patterns and suggests systemic government actions — not one-time fixes.</p>
            </div>
          </div>

          {recLoading ? (
            <div className="flex-center" style={{ height: '30vh', flexDirection: 'column', gap: 16 }}>
              <div style={{ position: 'relative', width: 56, height: 56 }}>
                <div className="loading-spinner" style={{ width: 56, height: 56, borderWidth: 3 }} />
                <TrendingUp size={20} color="var(--primary-light)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>AI analyzing complaint patterns…</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {recommendations.map((rec, i) => <RecommendationCard key={i} rec={rec} idx={i} />)}
              {recommendations.length === 0 && (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
                  <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 8 }}>Need More Data</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Report more issues to enable AI pattern detection and recommendations.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
