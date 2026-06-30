import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthModal from '../components/AuthModal';
import { Brain, ArrowRight, Shield, Zap, Map, Users, TrendingUp, CheckCircle, ChevronDown, Star, Globe, Award, Sun, Moon } from 'lucide-react';

// ── Animated Counter ──────────────────────────────────
const Counter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = Date.now();
        const tick = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * end));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// ── Floating Particle ──────────────────────────────────
const Particle = ({ style }) => (
  <div style={{
    position: 'absolute', borderRadius: '50%',
    background: 'var(--gradient-primary)',
    opacity: 0.08, pointerEvents: 'none',
    animation: 'floatParticle 8s ease-in-out infinite',
    ...style,
  }} />
);

const FEATURES = [
  { icon: '🔍', label: 'Smart Detection', desc: 'Gemini Vision classifies any civic issue in seconds — no form filling', color: '#6C63FF' },
  { icon: '🔄', label: 'Duplicate AI', desc: 'Prevents 50 duplicate reports of the same pothole. Clean database, clear data', color: '#00D4FF' },
  { icon: '⚡', label: 'Priority Engine', desc: '7-factor AI scoring weighs severity, location, weather, and public impact', color: '#FFD93D' },
  { icon: '🧭', label: 'Smart Routing', desc: 'Issues auto-routed to the correct department with confidence scores', color: '#6BCB77' },
  { icon: '✅', label: 'AI Verification', desc: 'Before/after image comparison catches fake resolutions instantly', color: '#FF6B35' },
  { icon: '📊', label: 'Predictive AI', desc: 'Forecasts hotspots before they become crises using 6 months of data', color: '#FF4757' },
  { icon: '🏆', label: 'Gamification', desc: '15 badges, leaderboards, and monthly challenges keep citizens engaged', color: '#9C27B0' },
  { icon: '💬', label: 'AI Chat', desc: 'Ask anything in plain language — city stats, issue status, reports', color: '#00BCD4' },
];

const WORKFLOW = [
  { step: '01', icon: '📸', title: 'Citizen Uploads', desc: 'Photo + GPS pin on map' },
  { step: '02', icon: '🤖', title: 'AI Classifies', desc: 'Category, severity, risk in 3s' },
  { step: '03', icon: '🔄', title: 'Duplicate Check', desc: 'Scans 50m radius for matches' },
  { step: '04', icon: '⚡', title: 'Priority Scored', desc: 'AI calculates urgency 0–100' },
  { step: '05', icon: '🏛️', title: 'Auto-Routed', desc: 'Correct department assigned' },
  { step: '06', icon: '✅', title: 'AI Verifies Fix', desc: 'Before/after comparison done' },
];

const STATS = [
  { value: 10000, suffix: '+', label: 'Issues Tracked', icon: '📋' },
  { value: 94, suffix: '%', label: 'AI Accuracy', icon: '🎯' },
  { value: 48, suffix: 'h', label: 'Avg Resolution', icon: '⚡' },
  { value: 8, suffix: '', label: 'AI Agents Active', icon: '🤖' },
];

const Landing = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalRole, setModalRole] = useState('citizen');
  const [scrollY, setScrollY] = useState(0);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openModal = (role) => { setModalRole(role); setShowModal(true); };

  return (
    <div className="landing-page" style={{ minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── CSS Keyframes ── */}
      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.1); }
        }
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes scanLine {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes featureHover {
          from { transform: translateY(0) scale(1); }
          to { transform: translateY(-6px) scale(1.02); }
        }
        .feature-card:hover {
          transform: translateY(-6px) scale(1.02) !important;
          border-color: var(--primary) !important;
          box-shadow: 0 20px 60px rgba(108,99,255,0.2) !important;
        }
        .workflow-card:hover .workflow-icon {
          transform: scale(1.15) rotate(5deg);
        }
        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(108,99,255,0.45) !important;
        }
        .ghost-btn:hover {
          background: rgba(255,255,255,0.08) !important;
          transform: translateY(-2px);
        }
        .landing-nav { color: white !important; }
        .landing-nav a, .landing-nav span { color: rgba(255,255,255,0.8) !important; }
        .landing-nav a:hover { color: #A78BFA !important; }
        .landing-nav button { color: white !important; }
        [data-theme="light"] .landing-nav a, [data-theme="light"] .landing-nav span { color: rgba(255,255,255,0.9) !important; }
        [data-theme="light"] .hero-bg {
          background: linear-gradient(160deg, #eef2ff 0%, #e0e7ff 40%, #f0f9ff 100%) !important;
        }
        [data-theme="light"] .scan-line { display: none; }

        /* ── Landing Page Base (Dark) ── */
        .landing-page {
          background: #080418;
          color: white;
        }

        /* ── Landing Page Light Theme ── */
        [data-theme="light"] .landing-page {
          background: linear-gradient(160deg, #f0f4ff 0%, #e8eef9 50%, #f5f0ff 100%);
          color: #1A1A2E;
        }
        [data-theme="light"] .landing-page .landing-section-bg {
          background: linear-gradient(135deg, rgba(108,99,255,0.06), rgba(0,212,255,0.04)) !important;
        }
        [data-theme="light"] .landing-page .landing-stat-card {
          background: rgba(255,255,255,0.85) !important;
          border-color: rgba(108,99,255,0.2) !important;
          color: #1A1A2E !important;
          box-shadow: 0 4px 24px rgba(108,99,255,0.12) !important;
        }
        [data-theme="light"] .landing-page .feature-card {
          background: rgba(255,255,255,0.8) !important;
          border-color: rgba(108,99,255,0.15) !important;
          color: #1A1A2E !important;
        }
        [data-theme="light"] .landing-page .workflow-card {
          background: rgba(255,255,255,0.85) !important;
          border-color: rgba(108,99,255,0.18) !important;
          color: #1A1A2E !important;
        }
        [data-theme="light"] .landing-page .landing-text-muted {
          color: rgba(26,26,46,0.55) !important;
        }
        [data-theme="light"] .landing-page .landing-text-secondary {
          color: rgba(26,26,46,0.72) !important;
        }
        [data-theme="light"] .landing-page h1,
        [data-theme="light"] .landing-page h2,
        [data-theme="light"] .landing-page h3,
        [data-theme="light"] .landing-page h4,
        [data-theme="light"] .landing-page p {
          color: inherit;
        }
        [data-theme="light"] .landing-nav {
          background: rgba(255,255,255,0.92) !important;
          border-bottom-color: rgba(108,99,255,0.12) !important;
          backdrop-filter: blur(20px) !important;
        }
        [data-theme="light"] .landing-nav a,
        [data-theme="light"] .landing-nav span,
        [data-theme="light"] .landing-nav button {
          color: #1A1A2E !important;
        }
        [data-theme="light"] .landing-nav a:hover { color: #6C63FF !important; }
        [data-theme="light"] .landing-page .landing-footer {
          background: rgba(255,255,255,0.6) !important;
          border-top-color: rgba(108,99,255,0.15) !important;
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav className="landing-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '0 40px', height: 70,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: isLight
          ? (scrollY > 40 ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.8)')
          : (scrollY > 40 ? 'rgba(8,4,24,0.95)' : 'rgba(8,4,24,0.3)'),
        backdropFilter: 'blur(16px)',
        borderBottom: isLight ? '1px solid rgba(108,99,255,0.12)' : '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
          }}>
            <Brain size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.1rem', color: isLight ? '#1A1A2E' : 'white' }}>CivicMind <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span></div>
            <div style={{ fontSize: '0.6rem', color: isLight ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.5)', marginTop: -2, letterSpacing: 1 }}>SMART GOVERNANCE · POWERED BY GEMINI 2.0</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {['Features', 'How It Works', 'Stats'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`} style={{
              fontSize: '0.85rem', color: isLight ? 'rgba(26,26,46,0.75)' : 'rgba(255,255,255,0.75)', fontWeight: 500,
              textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer',
            }}
            onMouseEnter={e => e.target.style.color = '#A78BFA'}
            onMouseLeave={e => e.target.style.color = isLight ? 'rgba(26,26,46,0.75)' : 'rgba(255,255,255,0.75)'}>{link}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme} title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'} style={{
            width: 38, height: 38, borderRadius: '50%',
            background: isLight ? 'rgba(255,215,0,0.15)' : 'rgba(255,215,0,0.12)',
            border: '1px solid rgba(255,215,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#FFD700', flexShrink: 0,
            transition: 'all 0.2s',
          }}>
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button onClick={() => openModal('citizen')} style={{
            padding: '9px 20px', borderRadius: 'var(--radius-full)',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: 'Outfit, sans-serif',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
            Sign In
          </button>
          <button onClick={() => openModal('citizen')} style={{
            padding: '9px 22px', borderRadius: 'var(--radius-full)',
            background: 'var(--gradient-primary)', border: 'none',
            color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: 'Outfit, sans-serif',
            boxShadow: '0 8px 24px rgba(108,99,255,0.35)',
          }}>Get Started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-bg" style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        background: isLight
          ? 'radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.10) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(0,212,255,0.07) 0%, transparent 50%), linear-gradient(160deg, #eef2ff 0%, #e0e7ff 40%, #f0f9ff 100%)'
          : 'radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(0,212,255,0.1) 0%, transparent 50%), var(--bg-primary)',
      }}>
        {/* Scan line effect */}
        <div className="scan-line" style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.4), transparent)',
          animation: 'scanLine 6s linear infinite', zIndex: 0, pointerEvents: 'none',
        }} />

        {/* Particles */}
        {[
          { width: 300, height: 300, top: '10%', left: '-5%', animationDelay: '0s' },
          { width: 200, height: 200, top: '60%', right: '-3%', animationDelay: '2s' },
          { width: 150, height: 150, top: '30%', right: '15%', animationDelay: '4s' },
          { width: 100, height: 100, bottom: '20%', left: '20%', animationDelay: '1s' },
        ].map((p, i) => <Particle key={i} style={p} />)}

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
          backgroundImage: `linear-gradient(rgba(108,99,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        <div style={{ textAlign: 'center', maxWidth: 900, padding: '0 24px', position: 'relative', zIndex: 2 }}>
          {/* Gov badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
            background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: 'var(--radius-full)', padding: '7px 18px',
            animation: 'heroFadeIn 0.6s ease forwards',
          }}>
            <Globe size={14} color="var(--primary-light)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-light)', letterSpacing: 0.5 }}>
              SMART GOVERNANCE · POWERED BY GEMINI 2.0
            </span>
          </div>

          <h1 style={{
            fontFamily: 'Outfit', fontWeight: 900, lineHeight: 1.08,
            marginBottom: 24, animation: 'heroFadeIn 0.8s ease 0.1s both',
          }}>
            <span style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)', display: 'block', color: isLight ? '#1A1A2E' : 'white' }}>
              Not a Complaint
            </span>
            <span style={{
              fontSize: 'clamp(2.8rem, 7vw, 5rem)', display: 'block',
              background: 'linear-gradient(135deg, #A78BFA 0%, #00D4FF 50%, #6BCB77 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradientShift 4s ease infinite',
            }}>
              Portal. It’s AI.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: isLight ? 'rgba(26,26,46,0.72)' : 'rgba(255,255,255,0.72)',
            maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.7,
            animation: 'heroFadeIn 0.8s ease 0.2s both',
          }}>
            An autonomous civic management platform powered by{' '}
            <strong style={{ color: isLight ? '#1A1A2E' : 'white', fontWeight: 800 }}>8 AI agents</strong>.
            Citizens report. AI classifies, deduplicates, prioritizes, routes, and verifies.
            Government acts on <strong style={{ color: isLight ? '#1A1A2E' : 'white', fontWeight: 800 }}>real data</strong>.
          </p>

          <div style={{
            display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap',
            animation: 'heroFadeIn 0.8s ease 0.3s both',
          }}>
            <button onClick={() => openModal('citizen')} className="cta-btn" style={{
              padding: '16px 36px', borderRadius: 'var(--radius-full)',
              background: 'var(--gradient-primary)', border: 'none',
              color: 'white', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 12px 40px rgba(108,99,255,0.5)', transition: 'var(--transition)',
              fontFamily: 'Outfit, sans-serif',
            }}>
              👤 Citizen Portal <ArrowRight size={18} />
            </button>
            <button onClick={() => openModal('authority')} className="ghost-btn" style={{
              padding: '16px 36px', borderRadius: 'var(--radius-full)',
              background: isLight ? 'rgba(108,99,255,0.08)' : 'rgba(255,255,255,0.06)',
              border: isLight ? '1px solid rgba(108,99,255,0.3)' : '1px solid rgba(255,255,255,0.2)',
              color: isLight ? '#1A1A2E' : 'white', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'var(--transition)', fontFamily: 'Outfit, sans-serif',
            }}>
              🏛️ Authority Login <Shield size={18} />
            </button>
          </div>

          {/* Demo credentials hint */}
          <div style={{
            marginTop: 20, display: 'flex', justifyContent: 'center', gap: 20,
            animation: 'heroFadeIn 0.8s ease 0.4s both',
          }}>
            {[
              { role: 'citizen', email: 'arvind@civicmind.com', pass: 'demo123' },
              { role: 'authority', email: 'pwd@civicmind.gov', pass: 'auth123' },
            ].map(d => (
              <div key={d.role} onClick={() => openModal(d.role)} style={{
                padding: '8px 16px', borderRadius: 'var(--radius-md)',
                background: isLight ? 'rgba(108,99,255,0.06)' : 'rgba(255,255,255,0.04)',
                border: isLight ? '1px solid rgba(108,99,255,0.15)' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', transition: 'var(--transition)',
              }}>
                <div style={{ fontSize: '0.68rem', color: isLight ? 'rgba(26,26,46,0.5)' : 'var(--text-muted)', marginBottom: 2 }}>
                  {d.role === 'citizen' ? '👤' : '🏛️'} Demo {d.role}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--primary-light)', fontWeight: 600 }}>{d.email}</div>
                <div style={{ fontSize: '0.65rem', color: isLight ? 'rgba(26,26,46,0.5)' : 'var(--text-muted)' }}>Password: {d.pass}</div>
              </div>
            ))}
          </div>

          {/* Scroll hint */}
          <div style={{ marginTop: 60, animation: 'heroFadeIn 1s ease 0.5s both' }}>
            <ChevronDown size={28} color="var(--text-muted)" style={{ animation: 'floatParticle 2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ── STATS TICKER ── */}
      <section id="stats" style={{ padding: '60px 40px', background: isLight ? 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,255,0.05))' : 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(0,212,255,0.06))', borderTop: isLight ? '1px solid rgba(108,99,255,0.12)' : '1px solid rgba(255,255,255,0.08)', borderBottom: isLight ? '1px solid rgba(108,99,255,0.12)' : '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{
                fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.8rem',
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', lineHeight: 1,
              }}>
                <Counter end={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: '0.82rem', color: isLight ? 'rgba(26,26,46,0.55)' : 'rgba(255,255,255,0.5)', marginTop: 6, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '100px 40px', background: isLight ? 'rgba(108,99,255,0.03)' : 'rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 'var(--radius-full)', padding: '6px 16px' }}>
              <Zap size={13} color="#A78BFA" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A78BFA', letterSpacing: 0.5 }}>8 AI AGENTS WORKING 24/7</span>
            </div>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 16, color: isLight ? '#1A1A2E' : 'white' }}>
              Every Feature Powered by <span style={{ background: 'linear-gradient(135deg,#A78BFA,#00D4FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Real AI</span>
            </h2>
            <p style={{ color: isLight ? 'rgba(26,26,46,0.65)' : 'rgba(255,255,255,0.6)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto' }}>
              Not just a CRUD app with buttons. Every action triggers an AI pipeline that thinks, decides, and acts.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{
                background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.04)',
                border: isLight ? '1px solid rgba(108,99,255,0.15)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-xl)', padding: '24px 20px',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                cursor: 'default', position: 'relative', overflow: 'hidden',
                boxShadow: isLight ? '0 4px 20px rgba(108,99,255,0.08)' : 'none',
              }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${f.color}15`, pointerEvents: 'none' }} />
                <div style={{ fontSize: '2rem', marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', marginBottom: 8, color: f.color }}>{f.label}</h3>
                <p style={{ fontSize: '0.8rem', color: isLight ? 'rgba(26,26,46,0.65)' : 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '100px 40px', background: isLight ? 'rgba(108,99,255,0.04)' : 'rgba(108,99,255,0.04)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 'var(--radius-full)', padding: '6px 16px' }}>
              <Zap size={13} color="#00D4FF" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00D4FF', letterSpacing: 0.5 }}>FULLY AUTONOMOUS AI PIPELINE</span>
            </div>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 12, color: isLight ? '#1A1A2E' : 'white' }}>
              From Photo to{' '}
              <span style={{ background: 'linear-gradient(135deg,#A78BFA,#00D4FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Resolution</span>
            </h2>
            <p style={{ color: isLight ? 'rgba(26,26,46,0.65)' : 'rgba(255,255,255,0.55)', fontSize: '1rem' }}>6 autonomous AI steps — citizen involvement needed only at step 1</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {WORKFLOW.map((w, i) => (
              <div key={i} className="workflow-card" style={{
                background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.04)',
                border: isLight ? '1px solid rgba(108,99,255,0.18)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-xl)', padding: '28px 24px',
                position: 'relative', overflow: 'hidden',
                boxShadow: isLight ? '0 4px 20px rgba(108,99,255,0.08)' : 'none',
              }}>
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Outfit', fontWeight: 900, fontSize: '0.85rem', color: 'white',
                  boxShadow: '0 4px 12px rgba(108,99,255,0.4)',
                }}>{w.step}</div>
                <div className="workflow-icon" style={{ fontSize: '2.2rem', marginBottom: 16, display: 'inline-block', transition: 'transform 0.3s ease' }}>{w.icon}</div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.05rem', marginBottom: 8, color: isLight ? '#1A1A2E' : 'white' }}>{w.title}</h3>
                <p style={{ fontSize: '0.82rem', color: isLight ? 'rgba(26,26,46,0.65)' : 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{w.desc}</p>
                {i < 5 && (
                  <div style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', zIndex: 2, display: i % 3 === 2 ? 'none' : 'block' }}>
                    <ArrowRight size={20} color="#A78BFA" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── ROLE CTA ── */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Citizen Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.18), rgba(108,99,255,0.08))',
            border: '1px solid rgba(108,99,255,0.45)', borderRadius: 'var(--radius-xl)',
            padding: '40px 36px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(108,99,255,0.08)' }} />
            <div style={{ fontSize: '3rem', marginBottom: 20 }}>👤</div>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.6rem', marginBottom: 12, color: isLight ? '#111' : 'white' }}>For Citizens</h3>
            <p style={{ color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.75)', marginBottom: 24, lineHeight: 1.6 }}>
              Report issues in seconds. Track progress. Verify fixes. Earn points and badges for every civic action.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {['Snap & upload any civic issue', 'Earn 25 pts per report', 'Track real-time status', 'Level up with 15 badges'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: isLight ? '#111' : 'rgba(255,255,255,0.88)', fontWeight: 500 }}>
                  <CheckCircle size={15} color="#6BCB77" /> {f}
                </div>
              ))}
            </div>
            <button onClick={() => openModal('citizen')} className="cta-btn" style={{
              width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-primary)', border: 'none',
              color: 'white', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              transition: 'var(--transition)', fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 8px 28px rgba(108,99,255,0.4)',
            }}>
              Join as Citizen →
            </button>
            <div style={{ marginTop: 12, textAlign: 'center', fontSize: '0.75rem', color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)' }}>
              Demo: arvind@civicmind.com / demo123
            </div>
          </div>

          {/* Authority Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.06))',
            border: '1px solid rgba(0,212,255,0.4)', borderRadius: 'var(--radius-xl)',
            padding: '40px 36px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(0,212,255,0.07)' }} />
            <div style={{ fontSize: '3rem', marginBottom: 20 }}>🏛️</div>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.6rem', marginBottom: 12, color: isLight ? '#111' : 'white' }}>For Authorities</h3>
            <p style={{ color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.75)', marginBottom: 24, lineHeight: 1.6 }}>
              Issues arrive pre-classified, prioritized, and routed. AI verification protects against fake resolutions.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {['Priority-sorted issue queue', 'AI routing to your dept only', 'Before/after fix verification', 'Predictive hotspot analytics'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: isLight ? '#111' : 'rgba(255,255,255,0.88)', fontWeight: 500 }}>
                  <CheckCircle size={15} color="#00D4FF" /> {f}
                </div>
              ))}
            </div>
            <button onClick={() => openModal('authority')} className="cta-btn" style={{
              width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #00D4FF, #0099BB)', border: 'none',
              color: 'white', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              transition: 'var(--transition)', fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 8px 28px rgba(0,212,255,0.35)',
            }}>
              Authority Login →
            </button>
            <div style={{ marginTop: 12, textAlign: 'center', fontSize: '0.75rem', color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)' }}>
              Demo: pwd@civicmind.gov / auth123
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer" style={{ padding: '60px 40px 40px', borderTop: '1px solid var(--border)', textAlign: 'center', background: isLight ? 'rgba(240,244,255,0.8)' : 'rgba(8,4,24,0.6)' }}>
        {/* Gemini badge — prominent */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(66,133,244,0.15), rgba(15,157,88,0.15))',
          border: '1px solid rgba(66,133,244,0.3)', borderRadius: 'var(--radius-full)',
          padding: '12px 28px',
        }}>
          <span style={{ fontSize: '1.4rem' }}>🧠</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.95rem', color: isLight ? '#1A1A2E' : 'white' }}>Smart Governance · Powered by Gemini 2.0 Flash</div>
            <div style={{ fontSize: '0.72rem', color: isLight ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.5)', marginTop: 2 }}>Google DeepMind · Real-time AI civic management</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={14} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: isLight ? '#1A1A2E' : 'white' }}>CivicMind AI</span>
        </div>
        <p style={{ color: isLight ? 'rgba(26,26,46,0.45)' : 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>
          © 2026 CivicMind AI · Not just a complaint portal — An AI-powered civic management platform.
        </p>
      </footer>

      {/* ── Auth Modal ── */}
      {showModal && <AuthModal onClose={() => setShowModal(false)} defaultRole={modalRole} />}
    </div>
  );
};

export default Landing;
