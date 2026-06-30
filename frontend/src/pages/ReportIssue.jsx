import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIssue } from '../services/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Upload, MapPin, AlertTriangle, CheckCircle, X,
  Zap, Camera, Users, TrendingUp, Shield, Copy, ArrowRight,
  Brain, Sparkles, Navigation, GitMerge
} from 'lucide-react';
import toast from 'react-hot-toast';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LocationPicker = ({ onLocation }) => {
  useMapEvents({ click(e) { onLocation(e.latlng.lat, e.latlng.lng); } });
  return null;
};

const SeverityColor = { Low: 'var(--low)', Medium: 'var(--medium)', High: 'var(--high)', Critical: 'var(--critical)' };
const StatusColor = {
  Pending: 'var(--medium)', Verified: 'var(--low)',
  'In Progress': 'var(--accent)', Resolved: 'var(--resolved)',
};

// ─────────────────────────────────────────────
// DUPLICATE RESULT UI
// ─────────────────────────────────────────────
const DuplicateResult = ({ data, onViewIssue, onReset }) => {
  const { existingIssue, aiConfidence, aiReason, matchFactors, distanceMeters, newSupporterCount, alreadySupporting, pointsEarned } = data;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(existingIssue.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-up" style={{ marginTop: 32 }}>
      {/* ── Header Banner ── */}
      <div style={{
        background: alreadySupporting
          ? 'linear-gradient(135deg, rgba(107,203,119,0.12), rgba(107,203,119,0.04))'
          : 'linear-gradient(135deg, rgba(255,107,53,0.14), rgba(255,71,87,0.06))',
        border: `1px solid ${alreadySupporting ? 'rgba(107,203,119,0.35)' : 'rgba(255,107,53,0.4)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          {/* Big icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-lg)', flexShrink: 0,
            background: alreadySupporting ? 'rgba(107,203,119,0.15)' : 'rgba(255,107,53,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
            border: `1px solid ${alreadySupporting ? 'rgba(107,203,119,0.3)' : 'rgba(255,107,53,0.3)'}`,
          }}>
            {alreadySupporting ? '🙌' : '🔍'}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem' }}>
                {alreadySupporting ? 'Already Supporting!' : '🔥 Duplicate Detected by AI!'}
              </h2>
              {/* AI Confidence Badge */}
              <div style={{
                background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.4)',
                borderRadius: 'var(--radius-full)', padding: '3px 12px',
                fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Brain size={12} />
                AI Confidence: {aiConfidence}%
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 12 }}>
              {alreadySupporting
                ? 'You are already supporting this issue. Thank you for your civic engagement!'
                : 'This issue was already reported nearby. Instead of a duplicate entry, you\'ve been added as a supporter — making the original report stronger.'}
            </p>

            {/* AI Reason */}
            <div style={{
              background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px',
              fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <Sparkles size={14} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span><strong style={{ color: 'var(--primary-light)' }}>AI says: </strong>{aiReason}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ── Existing Issue Card ── */}
        <div style={{
          background: 'var(--bg-glass)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <GitMerge size={18} color="var(--accent)" />
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem' }}>Original Issue</h3>
          </div>

          <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', marginBottom: 8, lineHeight: 1.3 }}>
            {existingIssue.title}
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: 16 }}>
            {existingIssue.description?.substring(0, 120)}...
          </p>

          {/* Status + Severity */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: `${StatusColor[existingIssue.status]}20`, color: StatusColor[existingIssue.status], border: `1px solid ${StatusColor[existingIssue.status]}40` }}>
              {existingIssue.status}
            </span>
            <span className="badge" style={{ background: `${SeverityColor[existingIssue.severity]}20`, color: SeverityColor[existingIssue.severity], border: `1px solid ${SeverityColor[existingIssue.severity]}40` }}>
              {existingIssue.severity}
            </span>
            <span className="badge badge-outline">{existingIssue.category}</span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { icon: Users, label: 'Supporters', value: existingIssue.supporterCount || 0, color: 'var(--accent)' },
              { icon: Shield, label: 'Verified', value: existingIssue.verificationCount || 0, color: 'var(--low)' },
              { icon: TrendingUp, label: 'Priority', value: existingIssue.priorityScore || '—', color: 'var(--primary-light)' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '10px 6px', border: '1px solid var(--border)' }}>
                <Icon size={16} color={color} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color, fontFamily: 'Outfit' }}>{value}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Meta */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>📅 Reported: {new Date(existingIssue.createdAt).toLocaleDateString('en-IN')}</span>
            <span>👤 By: {existingIssue.reportedBy}</span>
            {distanceMeters && <span><Navigation size={10} style={{ display: 'inline' }} /> {distanceMeters}m from your location</span>}
          </div>

          {/* Issue ID with copy */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ID: {existingIssue.id}
            </code>
            <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--low)' : 'var(--text-muted)', padding: 4 }}>
              {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        {/* ── AI Match Analysis + Your Status ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* You are now a supporter! */}
          {!alreadySupporting && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(107,203,119,0.1), rgba(0,212,255,0.05))',
              border: '1px solid rgba(107,203,119,0.35)',
              borderRadius: 'var(--radius-xl)', padding: '20px 22px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎉</div>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', color: 'var(--low)', marginBottom: 6 }}>
                You're now a Supporter!
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: 14 }}>
                {newSupporterCount} citizen{newSupporterCount !== 1 ? 's' : ''} have confirmed this issue.
                Your voice strengthens the case for faster resolution.
              </p>
              {/* Points earned */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)',
                borderRadius: 'var(--radius-full)', padding: '8px 18px',
              }}>
                <Zap size={16} color="var(--medium)" fill="var(--medium)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>+{pointsEarned} Points Earned</span>
              </div>
            </div>
          )}

          {/* Match Factor Analysis */}
          {matchFactors && (
            <div style={{
              background: 'var(--bg-glass)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Brain size={16} color="var(--primary-light)" />
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem' }}>AI Match Analysis</h4>
              </div>

              {[
                { label: 'Visual Similarity', value: matchFactors.visualSimilarity, icon: Camera },
                { label: 'GPS Location', value: matchFactors.locationLikely === 'Yes' ? 'Confirmed' : 'Uncertain', icon: MapPin },
                { label: 'Description Match', value: matchFactors.descriptionMatch, icon: Copy },
              ].map(({ label, value, icon: Icon }) => {
                const isGood = ['High', 'Strong', 'Confirmed'].includes(value);
                const isMed = ['Medium', 'Weak'].includes(value);
                const color = isGood ? 'var(--low)' : isMed ? 'var(--medium)' : 'var(--critical)';
                return (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <Icon size={13} />
                      {label}
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color, background: `${color}18`, borderRadius: 6, padding: '2px 10px' }}>
                      {value || '—'}
                    </span>
                  </div>
                );
              })}

              {/* Confidence bar */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  <span>Overall Confidence</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{aiConfidence}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-glass-strong)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${aiConfidence}%`,
                    background: 'var(--gradient-primary)', borderRadius: 3,
                    transition: 'width 1s ease',
                    boxShadow: '0 0 8px var(--primary-glow)',
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* What happens next */}
          <div style={{
            background: 'var(--bg-glass)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 18px',
          }}>
            <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.85rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
              WHAT HAPPENS NEXT
            </h4>
            {[
              `Original issue now has ${newSupporterCount || existingIssue.supporterCount} supporter${(newSupporterCount || existingIssue.supporterCount) !== 1 ? 's' : ''}`,
              'Priority score increased automatically',
              'Government sees stronger demand for resolution',
              'No duplicate clutter in the database',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, alignItems: 'flex-start' }}>
                <CheckCircle size={13} color="var(--low)" style={{ flexShrink: 0, marginTop: 2 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={onViewIssue} style={{ flex: 1 }}>
          <ArrowRight size={16} />
          View Original Issue in Community Feed
        </button>
        <button className="btn btn-outline" onClick={onReset}>
          <Upload size={16} />
          Report a Different Issue
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// NEW ISSUE RESULT UI
// ─────────────────────────────────────────────
const NewIssueResult = ({ aiResult, priorityLabel, onNavigate, onReset }) => {
  const priorityColors = { Critical: 'var(--critical)', High: '#FF6B35', Medium: 'var(--medium)', Low: 'var(--low)' };
  const pColor = priorityColors[priorityLabel] || 'var(--medium)';

  return (
    <div className="ai-result-card animate-fade-up" style={{ marginTop: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={20} color="var(--primary-light)" />
        </div>
        <div>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem' }}>🤖 AI Analysis Complete</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Issue registered as new · Unique location confirmed</p>
        </div>
        <div style={{ marginLeft: 'auto', background: 'rgba(107,203,119,0.1)', border: '1px solid rgba(107,203,119,0.3)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--low)' }}>
          ✅ UNIQUE ISSUE
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 18, lineHeight: 1.6 }}>{aiResult.description}</p>

      {/* Core analysis grid */}
      <div className="ai-result-grid" style={{ marginBottom: 18 }}>
        {[
          { label: 'Category',   value: aiResult.category,                   color: 'var(--accent)' },
          { label: 'Severity',   value: aiResult.severity,                   color: SeverityColor[aiResult.severity] },
          { label: 'Risk',       value: aiResult.risk,                       color: 'var(--critical)' },
          { label: 'Confidence', value: aiResult.confidence,                 color: 'var(--low)' },
          { label: 'AI Priority',value: priorityLabel || aiResult.severity,  color: pColor },
        ].map((item, i) => (
          <div key={i} className="ai-result-item">
            <div className="ai-result-label">{item.label}</div>
            <div className="ai-result-value" style={{ color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Smart Routing Trace — new premium section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(108,99,255,0.06))',
        border: '1px solid rgba(0,212,255,0.2)',
        borderRadius: 'var(--radius-lg)', padding: '16px 18px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Shield size={15} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🧭 Smart Routing AI
          </span>
          {aiResult.routingConfidence && (
            <span style={{ marginLeft: 'auto', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 'var(--radius-full)', padding: '1px 10px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)' }}>
              {aiResult.routingConfidence}% confident
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Routed to:</div>
          <div style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--primary-light)', fontSize: '0.95rem' }}>
            🏛️ {aiResult.department}
          </div>
          {aiResult.escalationNeeded && (
            <span style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.35)', color: 'var(--critical)', borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.68rem', fontWeight: 800 }}>
              🚨 ESCALATION NEEDED
            </span>
          )}
        </div>

        {aiResult.routingReason && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-muted)' }}>Why: </strong>{aiResult.routingReason}
          </div>
        )}

        {aiResult.suggestedActions?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Suggested Actions for Dept</div>
            {aiResult.suggestedActions.map((action, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4, alignItems: 'flex-start' }}>
                <CheckCircle size={11} color="var(--low)" style={{ flexShrink: 0, marginTop: 2 }} />
                {action}
              </div>
            ))}
          </div>
        )}

        {aiResult.escalationNeeded && aiResult.escalationReason && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--critical)' }}>
            ⚠️ {aiResult.escalationReason}
          </div>
        )}
      </div>

      {/* Points earned callout */}
      <div style={{ background: 'rgba(107,203,119,0.06)', border: '1px solid rgba(107,203,119,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Zap size={14} color="var(--low)" fill="var(--low)" />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>You earned <strong style={{ color: 'var(--low)' }}>+25 points</strong> for reporting this issue!</span>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => onNavigate('/community')}>View in Community Feed →</button>
        <button className="btn btn-outline" onClick={() => onNavigate('/map')}>View on Map 🗺️</button>
        <button className="btn btn-ghost" onClick={onReset}>+ Report Another</button>
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
const ReportIssue = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [location, setLocation] = useState({ lat: 20.5937, lng: 78.9629, address: '', area: '' });
  const [markerPos, setMarkerPos] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [priorityLabel, setPriorityLabel] = useState(null);
  const [duplicateData, setDuplicateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const handleImage = (file) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Please upload a valid image'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image too large (max 10MB)'); return; }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setStep(2);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleImage(e.dataTransfer.files[0]);
  };

  const handleLocationMap = (lat, lng) => {
    setMarkerPos([lat, lng]);
    setLocation(prev => ({ ...prev, lat, lng }));
  };

  const handleGPS = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setMarkerPos([lat, lng]);
        setLocation(prev => ({ ...prev, lat, lng }));
        toast.success('📍 Location captured!');
      },
      () => toast.error('Could not get location. Please select on map.')
    );
  };

  const handleSubmit = async () => {
    if (!image) { toast.error('Please upload an image'); return; }
    if (!markerPos) { toast.error('Please select location on map or use GPS'); return; }

    setLoading(true);
    setStep(3);
    const processingToast = toast.loading('🤖 AI is analyzing your report...', { duration: 30000 });

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('lat', location.lat);
      formData.append('lng', location.lng);
      formData.append('address', location.address);
      formData.append('area', location.area);

      const res = await createIssue(formData);
      toast.dismiss(processingToast);

      if (res.data.isDuplicateCase) {
        // ── DUPLICATE PATH
        setDuplicateData(res.data);
        if (res.data.alreadySupporting) {
          toast('🙌 You are already a supporter of this issue!', {
            icon: '🔄', duration: 4000,
            style: { background: '#0A0A1A', color: '#fff', border: '1px solid rgba(107,203,119,0.3)' }
          });
        } else {
          toast.success(`🎉 You've been added as a supporter! +${res.data.pointsEarned} points`);
        }
      } else {
        // ── NEW ISSUE PATH
        setAiResult(res.data.aiAnalysis);
        setPriorityLabel(res.data.priorityLabel);
        toast.success(`🎉 New issue reported! +${res.data.pointsEarned} points earned`);
      }
    } catch (err) {
      toast.dismiss(processingToast);
      toast.error(err.response?.data?.message || 'Failed to submit. Please try again.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null); setImagePreview(null);
    setAiResult(null); setDuplicateData(null);
    setMarkerPos(null); setStep(1);
  };

  const STEP_LABELS = [
    { num: 1, icon: '📸', label: 'Upload Photo' },
    { num: 2, icon: '📍', label: 'Set Location' },
    { num: 3, icon: '🤖', label: 'AI Analysis' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
          Report a <span className="text-gradient">Civic Issue</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          3 simple steps — photo, location, done. AI does the rest automatically.
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, gap: 0 }}>
        {STEP_LABELS.map((s, i) => {
          const done = step > s.num;
          const active = step === s.num;
          return (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: done ? 'var(--gradient-primary)' : active ? 'rgba(108,99,255,0.15)' : 'var(--bg-glass)',
                  border: `2px solid ${done ? 'transparent' : active ? 'rgba(108,99,255,0.6)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: done ? '1rem' : '1.1rem', fontWeight: 800,
                  color: done ? 'white' : active ? 'var(--primary-light)' : 'var(--text-muted)',
                  transition: 'var(--transition)', boxShadow: active ? '0 0 16px rgba(108,99,255,0.3)' : 'none',
                }}>
                  {done ? '✓' : s.icon}
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: active ? 'var(--primary-light)' : done ? 'var(--low)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div style={{ flex: 1, height: 2, margin: '0 8px', marginBottom: 22, background: done ? 'var(--gradient-primary)' : 'var(--border)', transition: 'var(--transition)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Upload Photo ── */}
      {step === 1 && !aiResult && !duplicateData && (
        <div className="animate-fade-up" style={{ maxWidth: 580, margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📷</div>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>Upload Issue Photo</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 24 }}>
              Take a photo of the civic problem. Our AI will instantly classify it — no form filling needed.
            </p>

            {!imagePreview ? (
              <div
                className={`upload-area ${dragging ? 'dragging' : ''}`}
                style={{ marginBottom: 20, cursor: 'pointer' }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
              >
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImage(e.target.files[0])} />
                <div className="upload-icon">📷</div>
                <div className="upload-text">Drop your photo here or click to browse</div>
                <div className="upload-sub">JPG, PNG, WebP up to 10MB</div>
                <div style={{ marginTop: 16 }}>
                  <button className="btn btn-primary btn-sm" type="button">
                    <Camera size={14} /> Choose Photo
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 'var(--radius-lg)', border: '2px solid rgba(107,203,119,0.4)' }} />
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                  <div style={{ background: 'rgba(107,203,119,0.9)', color: 'white', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700 }}>
                    ✅ Photo Ready
                  </div>
                  <button onClick={handleReset} style={{ background: 'rgba(0,0,0,0.75)', border: 'none', color: 'white', padding: '4px 10px', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <X size={12} /> Change
                  </button>
                </div>
              </div>
            )}

            {imagePreview && (
              <button
                className="btn btn-primary w-full"
                style={{ padding: '14px', fontSize: '1rem', borderRadius: 'var(--radius-md)' }}
                onClick={() => setStep(2)}
              >
                Next: Set Location →
              </button>
            )}

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 24, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {['AI Auto-classifies', 'Duplicate Detection', 'Smart Routing'].map(f => (
                <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: 'var(--low)' }}>✓</span> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Set Location ── */}
      {step === 2 && !aiResult && !duplicateData && (
        <div className="animate-fade-up">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Left: Photo preview + fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Photo thumbnail */}
              <div style={{ position: 'relative' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 600 }}>
                  📸 Photo Uploaded
                </div>
              </div>

              {/* Address fields */}
              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 14, fontSize: '0.95rem' }}>📋 Location Details</h3>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Address (optional)</label>
                  <input className="form-input" placeholder="e.g. MG Road, near bus stop"
                    value={location.address} onChange={e => setLocation({ ...location, address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Area / Locality (optional)</label>
                  <input className="form-input" placeholder="e.g. Koramangala, Ward 5"
                    value={location.area} onChange={e => setLocation({ ...location, area: e.target.value })} />
                </div>
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>
                  ← Back
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '13px' }}
                  onClick={handleSubmit}
                  disabled={loading || !markerPos}
                >
                  {loading ? (
                    <><div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> AI Analyzing...</>
                  ) : (
                    <><Zap size={16} /> Submit & Analyze with AI</>
                  )}
                </button>
              </div>
              {!markerPos && (
                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--medium)', background: 'rgba(255,217,61,0.08)', border: '1px solid rgba(255,217,61,0.3)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
                  ⚠️ Click the map or press "Use My GPS" to pin your location
                </p>
              )}
            </div>

            {/* Right: Map */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem' }}>📍 Pin on Map</h3>
                <button className="btn btn-outline btn-sm" onClick={handleGPS}>
                  <MapPin size={13} /> Use My GPS
                </button>
              </div>
              <div style={{ height: 380, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: `2px solid ${markerPos ? 'rgba(107,203,119,0.5)' : 'var(--border)'}`, transition: 'border-color 0.3s' }}>
                <MapContainer center={[location.lat, location.lng]} zoom={5} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker onLocation={handleLocationMap} />
                  {markerPos && <Marker position={markerPos} />}
                </MapContainer>
              </div>
              {markerPos ? (
                <div style={{ background: 'rgba(107,203,119,0.1)', border: '1px solid rgba(107,203,119,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                  <CheckCircle size={15} color="var(--low)" />
                  Location set: {markerPos[0].toFixed(4)}, {markerPos[1].toFixed(4)}
                </div>
              ) : (
                <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Click anywhere on the map to drop a pin
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT SECTION ── */}
      {duplicateData && (
        <DuplicateResult
          data={duplicateData}
          onViewIssue={() => navigate('/community')}
          onReset={handleReset}
        />
      )}

      {aiResult && !duplicateData && (
        <NewIssueResult
          aiResult={aiResult}
          priorityLabel={priorityLabel}
          onNavigate={navigate}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default ReportIssue;

