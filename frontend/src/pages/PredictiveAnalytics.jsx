import { useState, useEffect, useRef } from 'react';
import { getPredictions } from '../services/api';
import {
  Brain, AlertTriangle, TrendingUp, Zap, MapPin, Shield,
  BarChart2, Clock, AlertOctagon, Sparkles, RefreshCw,
  ThumbsUp, ChevronRight, Activity, Eye, CloudRain
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, Legend,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { MapContainer, TileLayer, Circle, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';

// ── Helpers ────────────────────────────────────────────────────
const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RISK_CONFIG = {
  Critical: { color: '#FF4757', bg: 'rgba(255,71,87,0.12)',  border: 'rgba(255,71,87,0.4)',  mapColor: '#FF4757', radius: 900 },
  High:     { color: '#FF6B35', bg: 'rgba(255,107,53,0.12)', border: 'rgba(255,107,53,0.4)', mapColor: '#FF6B35', radius: 700 },
  Medium:   { color: '#FFD93D', bg: 'rgba(255,217,61,0.10)', border: 'rgba(255,217,61,0.35)',mapColor: '#FFD93D', radius: 500 },
  Low:      { color: '#6BCB77', bg: 'rgba(107,203,119,0.1)', border: 'rgba(107,203,119,0.3)',mapColor: '#6BCB77', radius: 350 },
};

const CHART_COLORS = ['#6C63FF', '#00D4FF', '#FF6B35', '#FFD93D', '#6BCB77', '#FF4757', '#9C27B0'];

const CATEGORY_ICONS = {
  'Road Damage': '🛣️', 'Garbage': '🗑️', 'Water Supply': '💧',
  'Streetlight': '💡', 'Sewage': '🚽', 'Park': '🌳',
  'Building': '🏗️', 'Traffic': '🚦', 'Other': '📍',
};

// ── Sub-components ─────────────────────────────────────────────
const CityHealthMeter = ({ score }) => {
  const getColor = (s) => s >= 75 ? '#6BCB77' : s >= 50 ? '#FFD93D' : s >= 25 ? '#FF6B35' : '#FF4757';
  const getLabel = (s) => s >= 75 ? 'Healthy' : s >= 50 ? 'Moderate' : s >= 25 ? 'Stressed' : 'Critical';
  const color = getColor(score);

  return (
    <div style={{
      background: 'var(--bg-glass)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)', padding: '24px',
      textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at center, ${color}10, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
        City Health Score
      </div>
      <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 16px' }}>
        <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r="58" fill="none" stroke="var(--border)" strokeWidth="12" />
          <circle
            cx="70" cy="70" r="58" fill="none"
            stroke={color} strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 58}`}
            strokeDashoffset={`${2 * Math.PI * 58 * (1 - score / 100)}`}
            style={{ transition: 'stroke-dashoffset 1.5s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.4rem', color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>/100</div>
        </div>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: `${color}18`, border: `1px solid ${color}40`,
        borderRadius: 'var(--radius-full)', padding: '4px 14px',
        fontSize: '0.8rem', fontWeight: 800, color,
      }}>
        {getLabel(score)}
      </div>
    </div>
  );
};

const RiskCard = ({ prediction, rank }) => {
  const cfg = RISK_CONFIG[prediction.riskLevel] || RISK_CONFIG.Medium;
  const icon = CATEGORY_ICONS[prediction.category] || '📍';

  return (
    <div className="animate-fade-up" style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius-xl)', padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `${cfg.color}10`, border: `1px solid ${cfg.color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem',
      }}>
        {icon}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 'var(--radius-md)',
          background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.75rem', color: cfg.color,
          flexShrink: 0,
        }}>#{rank}</div>
        <div style={{ flex: 1, paddingRight: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem' }}>{prediction.category}</h4>
            <span style={{
              background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`,
              color: cfg.color, borderRadius: 'var(--radius-full)',
              padding: '1px 10px', fontSize: '0.68rem', fontWeight: 800,
            }}>{prediction.riskLevel} RISK</span>
          </div>
          {prediction.area && prediction.area !== 'Unknown' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              <MapPin size={11} /> {prediction.area}
            </div>
          )}
        </div>
      </div>

      {/* Probability bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 5 }}>
          <span>Issue Probability</span>
          <strong style={{ color: cfg.color, fontSize: '0.9rem' }}>{prediction.riskProbability}%</strong>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${prediction.riskProbability}%`,
            background: cfg.color, borderRadius: 3, transition: 'width 1s ease',
            boxShadow: `0 0 8px ${cfg.color}60`,
          }} />
        </div>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
        {prediction.reason}
      </p>

      {/* Recommendation */}
      <div style={{
        background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)',
        borderRadius: 'var(--radius-md)', padding: '8px 12px',
        fontSize: '0.74rem', color: 'var(--text-secondary)',
        display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <Sparkles size={12} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <span><strong style={{ color: 'var(--primary-light)' }}>AI Recommends: </strong>{prediction.recommendation}</span>
      </div>

      {prediction.actualCount > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
          {[
            { label: 'Reports', value: prediction.actualCount, color: cfg.color },
            { label: 'Unresolved', value: prediction.unresolvedCount, color: 'var(--critical)' },
            { label: 'Risk Score', value: prediction.actualRiskScore, color: 'var(--accent)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '6px 4px' }}>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color }}>{value}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SeasonalWarningCard = ({ warning }) => {
  const sevConfig = {
    Critical: { color: '#FF4757', icon: '🚨' },
    High:     { color: '#FF6B35', icon: '⚠️' },
    Medium:   { color: '#FFD93D', icon: '🔔' },
  };
  const { color, icon } = sevConfig[warning.severity] || sevConfig.Medium;
  return (
    <div style={{
      background: `${color}0A`, border: `1px solid ${color}30`,
      borderRadius: 'var(--radius-lg)', padding: '14px 16px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{warning.category}</span>
          <span style={{
            background: `${color}15`, border: `1px solid ${color}30`,
            color, borderRadius: 'var(--radius-full)',
            padding: '1px 8px', fontSize: '0.67rem', fontWeight: 700,
          }}>Peak: {warning.peakMonth}</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{warning.warning}</p>
        <div style={{ fontSize: '0.73rem', color: color, fontWeight: 600 }}>
          → {warning.action}
        </div>
      </div>
    </div>
  );
};

// ── Custom tooltip for charts ──────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111827',
      border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: 10,
      padding: '10px 16px',
      fontSize: '0.82rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      color: 'white',
    }}>
      {label && (
        <div style={{ fontWeight: 700, marginBottom: 6, color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 5 }}>
          {label}
        </div>
      )}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color || '#6C63FF', flexShrink: 0, display: 'inline-block' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{p.name}:</span>
          <strong style={{ color: p.color || 'white' }}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────
const PredictiveAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const toastId = isRefresh ? toast.loading('🤖 Regenerating AI predictions…') : null;
    try {
      const res = await getPredictions();
      setData(res.data);

      // Auto-center map
      const firstHotspot = res.data.predictions?.hotspotPredictions?.[0];
      if (firstHotspot?.lat && firstHotspot?.lng) {
        setMapCenter([firstHotspot.lat, firstHotspot.lng]);
        setMapZoom(12);
      } else {
        // Try riskAreas for a center
        const firstArea = res.data.analytics?.riskAreas?.[0];
        if (firstArea?._id?.lat && firstArea?._id?.lng) {
          setMapCenter([firstArea._id.lat, firstArea._id.lng]);
          setMapZoom(12);
        } else {
          // Default to New Delhi with useful zoom
          setMapCenter([28.6139, 77.2090]);
          setMapZoom(11);
        }
      }
      if (isRefresh) {
        toast.success('✨ AI predictions updated!', { id: toastId });
      }
    } catch (e) {
      if (isRefresh) toast.error('Refresh failed', { id: toastId });
      console.error(e);
      // Still set a useful default
      setMapCenter([28.6139, 77.2090]);
      setMapZoom(11);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex-center" style={{ height: '60vh', flexDirection: 'column', gap: 20 }}>
      <div style={{ width: 64, height: 64, position: 'relative' }}>
        <div className="loading-spinner" style={{ width: 64, height: 64, borderWidth: 4 }} />
        <Brain size={24} color="var(--primary-light)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 6 }}>AI Analyzing City Data…</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gemini is processing 6 months of civic data</p>
      </div>
    </div>
  );

  const { analytics, predictions, aiAvailable } = data || {};
  const rawHotspots = predictions?.hotspotPredictions || [];
  const seasonalWarnings = predictions?.seasonalWarnings || [];
  const deptInsights = predictions?.departmentInsights || [];
  const cityScore = predictions?.cityHealthScore || 50;
  const riskAreas = analytics?.riskAreas || [];

  // Demo fallback hotspots when Gemini quota is exhausted
  const DEMO_HOTSPOTS = [
    { lat: 28.6560, lng: 77.2300, riskLevel: 'Critical', category: 'Road Damage', riskProbability: 89, area: 'Connaught Place', reason: 'High traffic road damage cluster — 15 reports in 30 days', recommendation: 'Schedule emergency road repair within 48 hours' },
    { lat: 28.5355, lng: 77.3910, riskLevel: 'Critical', category: 'Sewage', riskProbability: 84, area: 'Noida Sector 18', reason: 'Sewage overflow near market area — monsoon risk high', recommendation: 'Deploy sewage maintenance team immediately' },
    { lat: 28.6692, lng: 77.4538, riskLevel: 'High', category: 'Garbage', riskProbability: 76, area: 'Ghaziabad Crossing', reason: 'Garbage collection gap — 8 complaints unresolved', recommendation: 'Increase waste pickup frequency to daily' },
    { lat: 28.6270, lng: 77.0800, riskLevel: 'High', category: 'Streetlight', riskProbability: 71, area: 'Dwarka Sector 10', reason: 'Multiple streetlight failures — safety risk at night', recommendation: 'Inspect and repair 12 streetlight units' },
    { lat: 28.7041, lng: 77.1025, riskLevel: 'Medium', category: 'Water Supply', riskProbability: 58, area: 'Rohini Sector 3', reason: 'Intermittent water supply complaints increasing', recommendation: 'Check pipeline pressure and fix leaks' },
    { lat: 28.5870, lng: 77.3100, riskLevel: 'Low', category: 'Park', riskProbability: 32, area: 'Faridabad', reason: 'Minor park maintenance complaints', recommendation: 'Schedule monthly grounds maintenance' },
  ];

  const hotspots = rawHotspots.length > 0 ? rawHotspots : DEMO_HOTSPOTS;

  // Use Delhi center when using demo data
  const effectiveCenter = rawHotspots.length > 0 ? mapCenter : [28.6139, 77.2090];
  const effectiveZoom = rawHotspots.length > 0 ? mapZoom : 11;


  // Chart data prep
  const categoryChartData = (analytics?.categoryTrends || []).slice(0, 8).map(c => ({
    name: c._id?.split(' ')[0] || c._id,
    fullName: c._id,
    count: c.count,
    resolved: c.resolved || 0,
    icon: CATEGORY_ICONS[c._id] || '📍',
  }));

  const monthlyChartData = (analytics?.monthlyTrends || []).map(m => ({
    name: MONTH_NAMES[m._id.month],
    reported: m.count,
    resolved: m.resolved,
  }));

  const deptChartData = (analytics?.deptPerformance || [])
    .filter(d => d._id)
    .slice(0, 6)
    .map(d => ({
      name: d._id?.split(' ')[0] || d._id,
      fullName: d._id,
      rate: Math.round(d.resolutionRate || 0),
      total: d.total,
    }));

  const statusPieData = (analytics?.statusBreakdown || []).map(s => ({
    name: s._id,
    value: s.count,
  }));

  const categoryResData = (analytics?.categoryResolutionTime || []).map(c => ({
    name: c._id?.split(' ')[0],
    hours: Math.round(c.avgHours || 0),
    count: c.count,
  }));

  const tabs = [
    { id: 'overview',    label: '🧠 AI Overview',    icon: Brain        },
    { id: 'heatmap',     label: '🗺️ Risk Heatmap',   icon: MapPin       },
    { id: 'trends',      label: '📈 Trends',          icon: TrendingUp   },
    { id: 'departments', label: '🏛️ Departments',    icon: Shield       },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={20} color="white" />
            </div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800 }}>
              Predictive <span className="text-gradient">Hotspots</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            AI analyses 6 months of civic data to predict where issues will occur next.
            {aiAvailable
              ? <span style={{ color: 'var(--low)', marginLeft: 8, fontWeight: 600 }}>✨ Gemini predictions active</span>
              : <span style={{ color: 'var(--medium)', marginLeft: 8 }}>⚠️ AI predictions unavailable — showing raw data</span>}
          </p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh AI'}
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 28,
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        border: '1px solid var(--border)', flexWrap: 'wrap',
      }}>
        {tabs.map((t, i) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: '12px 16px', textAlign: 'center',
            background: activeTab === t.id ? 'var(--gradient-primary)' : 'var(--bg-glass)',
            color: activeTab === t.id ? 'white' : 'var(--text-muted)',
            border: 'none',
            borderRight: i < tabs.length - 1 ? '1px solid var(--border)' : 'none',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', transition: 'var(--transition)', whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ══════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div>
          {/* Top row: Health meter + Summary + Risk level */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr auto', gap: 20, marginBottom: 28, alignItems: 'start' }}>
            <CityHealthMeter score={cityScore} />

            <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Sparkles size={18} color="var(--primary-light)" />
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700 }}>AI Executive Summary</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem', marginBottom: 16 }}>
                {predictions?.summary || 'Analyzing civic data across your city...'}
              </p>
              {predictions?.topRecommendations?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Top 3 Government Actions</div>
                  {predictions.topRecommendations.map((rec, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--primary-light)', fontWeight: 800, flexShrink: 0 }}>#{i + 1}</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '20px', textAlign: 'center', minWidth: 140 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Overall Risk</div>
              {(() => {
                const risk = predictions?.overallRiskLevel || 'Medium';
                const cfg = RISK_CONFIG[risk] || RISK_CONFIG.Medium;
                return (
                  <>
                    <div style={{ fontSize: '3rem', marginBottom: 8 }}>
                      {risk === 'Critical' ? '🚨' : risk === 'High' ? '⚠️' : risk === 'Medium' ? '🟡' : '✅'}
                    </div>
                    <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.2rem', color: cfg.color }}>{risk}</div>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { label: 'Hotspots', value: hotspots.length, color: 'var(--critical)' },
                        { label: 'Warnings', value: seasonalWarnings.length, color: 'var(--medium)' },
                        { label: 'Risk Zones', value: riskAreas.length, color: 'var(--accent)' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                          <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                          <strong style={{ color }}>{value}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* AI Risk Predictions grid */}
          {hotspots.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertOctagon size={20} color="var(--critical)" />
                High-Risk Predicted Areas
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {hotspots.slice(0, 6).map((h, i) => (
                  <RiskCard key={i} prediction={h} rank={i + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Seasonal Warnings */}
          {seasonalWarnings.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CloudRain size={20} color="var(--accent)" />
                Seasonal Predictions
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {seasonalWarnings.map((w, i) => <SeasonalWarningCard key={i} warning={w} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ HEATMAP TAB ═══════════════════════════════════════════ */}
      {activeTab === 'heatmap' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 700 }}>Risk Zone Map</h2>
                <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
                  {Object.entries(RISK_CONFIG).map(([risk, cfg]) => (
                    <div key={risk} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color }} />
                      {risk}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height: 480, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <MapContainer center={effectiveCenter} zoom={effectiveZoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>

                  <ZoomControl position="bottomright" />
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                  />
                  {/* Predicted hotspots from AI */}
                  {hotspots.filter(h => h.lat && h.lng).map((h, i) => {
                    const cfg = RISK_CONFIG[h.riskLevel] || RISK_CONFIG.Medium;
                    return (
                      <Circle key={`pred-${i}`} center={[h.lat, h.lng]}
                        radius={cfg.radius}
                        pathOptions={{ color: cfg.mapColor, fillColor: cfg.mapColor, fillOpacity: 0.25, weight: 2 }}
                      >
                        <Popup>
                          <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 200 }}>
                            <div style={{ fontWeight: 800, marginBottom: 4 }}>{CATEGORY_ICONS[h.category]} {h.category}</div>
                            <div style={{ color: cfg.color, fontWeight: 700, marginBottom: 4 }}>⚡ {h.riskLevel} RISK — {h.riskProbability}% probability</div>
                            {h.area && <div style={{ fontSize: '0.8rem', color: '#666' }}>📍 {h.area}</div>}
                            <div style={{ fontSize: '0.8rem', marginTop: 6, color: '#444' }}>{h.reason}</div>
                            <div style={{ fontSize: '0.75rem', marginTop: 6, color: '#6C63FF', fontWeight: 600 }}>💡 {h.recommendation}</div>
                          </div>
                        </Popup>
                      </Circle>
                    );
                  })}
                  {/* Raw data hotspots (smaller, muted) */}
                  {riskAreas.filter(r => r._id?.lat && r._id?.lng).map((r, i) => (
                    <Circle key={`raw-${i}`} center={[r._id.lat, r._id.lng]}
                      radius={200 + r.count * 40}
                      pathOptions={{ color: '#6C63FF', fillColor: '#6C63FF', fillOpacity: 0.08, weight: 1, dashArray: '4' }}
                    >
                      <Popup>
                        <div style={{ fontFamily: 'Inter, sans-serif' }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>{r._id.category}</div>
                          <div>{r.count} reports · {r.unresolvedCount} unresolved</div>
                          {r.area && <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 4 }}>📍 {r.area}</div>}
                        </div>
                      </Popup>
                    </Circle>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* Legend + Stats sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '18px' }}>
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>Map Legend</h4>
                {Object.entries(RISK_CONFIG).map(([risk, cfg]) => (
                  <div key={risk} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${cfg.color}25`, border: `2px solid ${cfg.color}`, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: cfg.color }}>{risk} Risk Zone</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Predicted by AI</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ width: 32, height: 18, border: '2px dashed #6C63FF', borderRadius: 4, background: 'rgba(108,99,255,0.08)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>Historical Clusters</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Raw complaint density</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top risk areas list */}
              <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '18px', flex: 1 }}>
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>Top Risk Areas</h4>
                {hotspots.slice(0, 6).map((h, i) => {
                  const cfg = RISK_CONFIG[h.riskLevel] || RISK_CONFIG.Medium;
                  return (
                    <div key={i}
                      style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                      onClick={() => { setMapCenter([h.lat, h.lng]); setMapZoom(15); }}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: cfg.color, flexShrink: 0 }}>
                        #{i + 1}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', gap: 4, alignItems: 'center' }}>
                          {CATEGORY_ICONS[h.category]} {h.category}
                          <span style={{ marginLeft: 'auto', color: cfg.color, fontWeight: 800, fontSize: '0.75rem' }}>{h.riskProbability}%</span>
                        </div>
                        {h.area && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.area}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TRENDS TAB ════════════════════════════════════════════ */}
      {activeTab === 'trends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Monthly trend area chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 6 }}>📅 6-Month Trend</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 20 }}>Reported vs Resolved issues per month</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="gReported" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6BCB77" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6BCB77" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="reported" stroke="#6C63FF" fill="url(#gReported)" strokeWidth={2} name="Reported" />
                  <Area type="monotone" dataKey="resolved" stroke="#6BCB77" fill="url(#gResolved)" strokeWidth={2} name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 6 }}>🏷️ By Category</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 20 }}>Top complaint categories</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryChartData} layout="vertical">
                  <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Total" radius={[0, 4, 4, 0]}>
                    {categoryChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Status Pie */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 6 }}>📊 Status Breakdown</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 16 }}>Current distribution of all issues</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    dataKey="value" nameKey="name"
                    label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Resolution time by category */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 6 }}>⏱️ Avg Resolution Time</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 20 }}>Hours to resolve by category (lower = better)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryResData}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" name="Avg Hours" radius={[4, 4, 0, 0]}>
                    {categoryResData.map((entry, i) => (
                      <Cell key={i} fill={entry.hours > 72 ? '#FF4757' : entry.hours > 24 ? '#FFD93D' : '#6BCB77'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk score table */}
          {riskAreas.length > 0 && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 6 }}>🔥 Risk-Scored Hotspots (Raw Data)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 16 }}>Formula: Count×5 + Critical×15 + High×8 + Unresolved×10</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      {['#', 'Category', 'Location', 'Reports', 'Unresolved', 'Risk Score', 'Level'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {riskAreas.slice(0, 10).map((r, i) => {
                      const risk = r.riskScore > 100 ? 'Critical' : r.riskScore > 60 ? 'High' : r.riskScore > 30 ? 'Medium' : 'Low';
                      const cfg = RISK_CONFIG[risk];
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 700 }}>#{i + 1}</td>
                          <td style={{ padding: '10px 12px' }}>{CATEGORY_ICONS[r._id.category]} {r._id.category}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {r.area || `${r._id.lat.toFixed(3)}, ${r._id.lng.toFixed(3)}`}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>{r.count}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--critical)', fontWeight: 700 }}>{r.unresolvedCount}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                                <div style={{ height: '100%', width: `${Math.min(100, r.riskScore)}%`, background: cfg.color, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontFamily: 'Outfit', fontWeight: 800, color: cfg.color, fontSize: '0.85rem', minWidth: 30 }}>{r.riskScore}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, borderRadius: 'var(--radius-full)', padding: '2px 10px', fontSize: '0.68rem', fontWeight: 800 }}>
                              {risk}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ DEPARTMENTS TAB ══════════════════════════════════════ */}
      {activeTab === 'departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Dept bar chart */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 6 }}>🏛️ Department Resolution Rates</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 20 }}>% of issues resolved by each department</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptChartData}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" name="Resolve Rate %" radius={[4, 4, 0, 0]}>
                  {deptChartData.map((d, i) => (
                    <Cell key={i} fill={d.rate >= 70 ? '#6BCB77' : d.rate >= 40 ? '#FFD93D' : '#FF4757'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Department Insights */}
          {deptInsights.length > 0 && (
            <div>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16 }}>🤖 AI Department Insights</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {deptInsights.map((d, i) => {
                  const statusConfig = {
                    'Performing Well':       { color: 'var(--low)',      bg: 'rgba(107,203,119,0.08)', border: 'rgba(107,203,119,0.25)', icon: '✅' },
                    'Needs Attention':        { color: 'var(--medium)',   bg: 'rgba(255,217,61,0.08)', border: 'rgba(255,217,61,0.25)',  icon: '⚠️' },
                    'Critical Underperformer':{ color: 'var(--critical)', bg: 'rgba(255,71,87,0.08)',  border: 'rgba(255,71,87,0.25)',   icon: '🚨' },
                  };
                  const sc = statusConfig[d.status] || statusConfig['Needs Attention'];
                  return (
                    <div key={i} style={{
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      borderRadius: 'var(--radius-lg)', padding: '16px 18px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: '1.1rem' }}>{sc.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{d.department}</div>
                          <div style={{ fontSize: '0.7rem', color: sc.color, fontWeight: 700 }}>{d.status}</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{d.insight}</p>
                      <div style={{ fontSize: '0.74rem', color: 'var(--primary-light)', fontWeight: 600 }}>→ {d.recommendation}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dept data table */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 16 }}>📋 Full Department Data</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    {['Department', 'Total Issues', 'Resolved', 'Resolution Rate', 'Avg Priority', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.deptPerformance || []).filter(d => d._id).map((d, i) => {
                    const rate = Math.round(d.resolutionRate || 0);
                    const status = rate >= 70 ? 'Good' : rate >= 40 ? 'Fair' : 'Poor';
                    const statusColor = rate >= 70 ? 'var(--low)' : rate >= 40 ? 'var(--medium)' : 'var(--critical)';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{d._id || 'Unassigned'}</td>
                        <td style={{ padding: '10px 14px' }}>{d.total}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--low)', fontWeight: 600 }}>{d.resolved}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                              <div style={{ height: '100%', width: `${rate}%`, background: statusColor, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontWeight: 700, color: statusColor, fontSize: '0.85rem' }}>{rate}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--accent)', fontWeight: 600 }}>{d.avgPriority?.toFixed(1) || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ color: statusColor, fontWeight: 700, fontSize: '0.78rem' }}>{status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveAnalytics;
