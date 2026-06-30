import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, X, Mail, Lock, User, Shield, Eye, EyeOff, Zap, Phone, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO = {
  citizen: { email: 'arvind@civicmind.com', password: 'demo123', name: 'Arvind Kumar', role: 'citizen' },
  authority: { email: 'pwd@civicmind.gov', password: 'auth123', name: 'Delhi PWD Officer', role: 'authority' },
};

const AuthModal = ({ onClose, defaultRole = 'citizen' }) => {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState(defaultRole);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', phone: '', city: '', age: '' });

  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();

  const fillDemo = (demoRole) => {
    setRole(demoRole);
    const d = DEMO[demoRole];
    setForm(prev => ({ ...prev, email: d.email, password: d.password, name: d.name }));
    toast.success(`Demo credentials filled for ${demoRole}!`);
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const dbUser = await loginWithGoogle(role);
      onClose();
      navigate(dbUser?.role === 'authority' ? '/authority' : '/dashboard');
    } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let dbUser;
      if (mode === 'login') {
        dbUser = await loginWithEmail(form.email, form.password);
      } else {
        dbUser = await registerWithEmail({ ...form, role });
      }
      onClose();
      navigate(dbUser?.role === 'authority' ? '/authority' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <div className="logo-icon" style={{ width: 48, height: 48 }}>
              <Brain size={24} color="white" />
            </div>
          </div>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem' }}>
            {mode === 'login' ? 'Welcome Back' : 'Join CivicMind'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account to get started'}
          </p>
        </div>

        {/* Role Toggle */}
        <div style={{
          display: 'flex', gap: 8, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
          padding: 4, border: '1px solid var(--border)', marginBottom: 16
        }}>
          {[
            { id: 'citizen', label: '👤 Citizen', icon: <User size={13} /> },
            { id: 'authority', label: '🏛️ Authority', icon: <Shield size={13} /> },
          ].map(r => (
            <button key={r.id} onClick={() => setRole(r.id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
              background: role === r.id ? 'var(--gradient-primary)' : 'transparent',
              color: role === r.id ? 'white' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer', transition: 'var(--transition)',
              fontFamily: 'Outfit, sans-serif'
            }}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Demo Credentials Box — only on login */}
        {mode === 'login' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,255,0.04))',
            border: '1px solid rgba(108,99,255,0.2)',
            borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 16,
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              🎯 Quick Demo Access
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['citizen', 'authority'].map(r => (
                <button key={r} onClick={() => fillDemo(r)} style={{
                  flex: 1, padding: '7px 10px', borderRadius: 'var(--radius-sm)',
                  background: role === r ? 'rgba(108,99,255,0.15)' : 'var(--bg-glass)',
                  border: `1px solid ${role === r ? 'rgba(108,99,255,0.4)' : 'var(--border)'}`,
                  cursor: 'pointer', transition: 'var(--transition)',
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: role === r ? 'var(--primary-light)' : 'var(--text-secondary)' }}>
                    {r === 'citizen' ? '👤' : '🏛️'} {r === 'citizen' ? 'Citizen Demo' : 'Authority Demo'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {DEMO[r].email}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Google Login */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
          background: 'var(--bg-glass)', color: 'var(--text-primary)', fontWeight: 600,
          fontSize: '0.9rem', cursor: 'pointer', transition: 'var(--transition)', marginBottom: 14,
          fontFamily: 'Outfit, sans-serif'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Basic fields */}
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Your full name"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: 36 }} type="email" placeholder="your@email.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: 36, paddingRight: 40 }} type={showPass ? 'text' : 'password'}
                placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0
              }}>{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </div>

          {/* Extended sign-up fields */}
          {mode === 'register' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ paddingLeft: 36 }} placeholder="+91 98765 43210" type="tel"
                      value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ paddingLeft: 36 }} placeholder="25" type="number" min="10" max="100"
                      value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-input" style={{ paddingLeft: 36 }} placeholder="New Delhi, Mumbai, Bangalore..."
                    value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                </div>
              </div>
              {role === 'authority' && (
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                    <option value="">Select Department</option>
                    <option>PWD (Public Works Department)</option>
                    <option>Electricity Department</option>
                    <option>Municipal Corporation</option>
                    <option>Water Supply Department</option>
                    <option>Sewage & Sanitation Department</option>
                    <option>Parks & Recreation Department</option>
                    <option>Traffic Police / Municipal</option>
                    <option>Urban Development Authority</option>
                  </select>
                </div>
              )}
            </>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ padding: '13px', fontSize: '0.95rem', borderRadius: 'var(--radius-md)', marginTop: 4 }}>
            {loading ? <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (
              <>{mode === 'login' ? 'Sign In' : 'Create Account'} <Zap size={15} /></>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{
            background: 'none', border: 'none', color: 'var(--primary-light)',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.83rem'
          }}>
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
