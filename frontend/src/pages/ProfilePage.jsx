import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Calendar, Shield, Save, Edit3, Zap, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    age: '',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
        age: user.age || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await API.put('/auth/profile', form);
      if (res.data.success) {
        toast.success('Profile updated!');
        setEditing(false);
        // Update local user state if setUser is available
        if (setUser) setUser(prev => ({ ...prev, ...form }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const LEVEL_CONFIG = {
    Diamond: { color: '#00D4FF', icon: '💎', min: 1000 },
    Platinum: { color: '#E5E4E2', icon: '⚡', min: 500 },
    Gold:     { color: '#FFD700', icon: '🥇', min: 200 },
    Silver:   { color: '#C0C0C0', icon: '🥈', min: 100 },
    Bronze:   { color: '#CD7F32', icon: '🥉', min: 0 },
  };
  const getLevel = (pts) => pts >= 1000 ? 'Diamond' : pts >= 500 ? 'Platinum' : pts >= 200 ? 'Gold' : pts >= 100 ? 'Silver' : 'Bronze';
  const points = user?.points || 0;
  const level = getLevel(points);
  const levelCfg = LEVEL_CONFIG[level];

  const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
          👤 <span className="text-gradient">My Profile</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your personal details and view your civic stats.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
        {/* Left: Avatar + Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar card */}
          <div className="glass-card" style={{ padding: 28, textAlign: 'center' }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '2.2rem', color: 'white',
              margin: '0 auto 16px',
              boxShadow: '0 0 30px rgba(108,99,255,0.4)',
              border: '3px solid rgba(108,99,255,0.5)',
            }}>{avatarLetter}</div>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem', marginBottom: 4 }}>{user?.name}</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{user?.email}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--primary-glow)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 'var(--radius-full)', padding: '4px 14px', fontSize: '0.78rem', color: 'var(--primary-light)', fontWeight: 700 }}>
              <Shield size={12} /> {user?.role?.toUpperCase()}
            </div>
          </div>

          {/* Level + Points */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ fontSize: '2.5rem' }}>{levelCfg.icon}</div>
              <div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: levelCfg.color }}>{level}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Level</div>
              </div>
            </div>
            {[
              { label: 'Civic Points', value: points, icon: <Zap size={14} fill="var(--medium)" color="var(--medium)" /> },
              { label: 'Reports Filed', value: user?.reportsCount || 0, icon: '📸' },
              { label: 'Verifications', value: user?.verificationsCount || 0, icon: '✅' },
              { label: 'Badges Earned', value: (user?.badges || []).length, icon: '🏅' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: label !== 'Badges Earned' ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '0.95rem' }}>{icon}</span> {label}
                </div>
                <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Badges display */}
          {(user?.badges || []).length > 0 && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 12 }}>🏅 My Badges</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(user?.badges || []).map((b, i) => (
                  <div key={i} title={b.name} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '8px 10px', width: 60,
                    background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <span style={{ fontSize: '1.3rem' }}>{b.icon}</span>
                    <span style={{ fontSize: '0.55rem', color: '#FFD700', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Edit Form */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>Personal Details</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Update your personal information</p>
            </div>
            {!editing ? (
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                <Edit3 size={14} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                  {saving ? <div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Save size={14} />}
                  Save
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {[
              { label: 'Full Name', key: 'name', icon: <User size={15} />, placeholder: 'Your full name', type: 'text', required: true },
              { label: 'Phone Number', key: 'phone', icon: <Phone size={15} />, placeholder: '+91 98765 43210', type: 'tel', required: false },
              { label: 'City', key: 'city', icon: <MapPin size={15} />, placeholder: 'e.g. New Delhi', type: 'text', required: false },
              { label: 'Age', key: 'age', icon: <Calendar size={15} />, placeholder: 'e.g. 28', type: 'number', required: false },
            ].map(field => (
              <div key={field.key} className="form-group">
                <label className="form-label">{field.label}{field.required && ' *'}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>{field.icon}</span>
                  <input
                    className="form-input"
                    style={{ paddingLeft: 36, background: editing ? 'var(--bg-glass-strong)' : 'var(--bg-glass)', cursor: editing ? 'text' : 'default' }}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    readOnly={!editing}
                  />
                </div>
              </div>
            ))}

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Bio / About</label>
              <textarea
                className="form-input"
                style={{ minHeight: 90, resize: 'vertical', background: editing ? 'var(--bg-glass-strong)' : 'var(--bg-glass)', cursor: editing ? 'text' : 'default', paddingTop: 10 }}
                placeholder="Tell us about yourself..."
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                readOnly={!editing}
              />
            </div>
          </div>

          {/* Non-editable info */}
          <div style={{ marginTop: 24, padding: '16px', background: 'rgba(108,99,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Account Info (Read-only)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Email', value: user?.email, icon: <Mail size={13} /> },
                { label: 'Role', value: user?.role, icon: <Shield size={13} /> },
                { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A', icon: <Calendar size={13} /> },
                { label: 'Department', value: user?.department || '—', icon: <Award size={13} /> },
              ].map(({ label, value, icon }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>{icon} {label}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
