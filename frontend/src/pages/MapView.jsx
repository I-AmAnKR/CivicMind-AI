import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getIssues } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Filter, RefreshCw } from 'lucide-react';

// Custom colored marker icons
const createIcon = (color, emoji) => L.divIcon({
  html: `<div style="
    background: ${color};
    width: 36px; height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid white;
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
  "><div style="transform:rotate(45deg);font-size:14px;">${emoji}</div></div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const severityConfig = {
  Critical: { color: '#FF4757', emoji: '🔴' },
  High: { color: '#FF6B35', emoji: '🟠' },
  Medium: { color: '#FFD93D', emoji: '🟡' },
  Low: { color: '#6BCB77', emoji: '🟢' },
};

const statusConfig = {
  Resolved: { color: '#4CAF50', emoji: '✅' },
  Pending: { color: '#6C63FF', emoji: '⏳' },
  'In Progress': { color: '#FFD93D', emoji: '🔧' },
  Verified: { color: '#00D4FF', emoji: '✓' },
};

const MapView = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', severity: '', category: '' });
  const [selected, setSelected] = useState(null);
  const { joinAreaRoom, socket } = useSocket();

  useEffect(() => { fetchIssues(); }, [filter]);

  // Listen for real-time new issues on the map
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      // Refresh map when a new issue comes in
      fetchIssues();
    };
    socket.on('new-issue', handler);
    return () => socket.off('new-issue', handler);
  }, [socket]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.severity) params.severity = filter.severity;
      if (filter.category) params.category = filter.category;
      const res = await getIssues({ ...params, limit: 200 });
      setIssues(res.data.issues || []);
    } catch {}
    setLoading(false);
  };

  const getIcon = (issue) => {
    if (issue.status === 'Resolved') return createIcon('#4CAF50', '✅');
    const cfg = severityConfig[issue.severity] || severityConfig.Medium;
    return createIcon(cfg.color, cfg.emoji);
  };

  const categories = ['Road Damage', 'Streetlight', 'Garbage', 'Water Supply', 'Sewage', 'Park', 'Building', 'Traffic'];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>
            Live <span className="text-gradient">Issue Map</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{issues.length} issues plotted in real time</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select className="form-input" style={{ padding: '8px 12px', width: 'auto' }}
            value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})}>
            <option value="">All Status</option>
            <option>Pending</option>
            <option>Verified</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
          <select className="form-input" style={{ padding: '8px 12px', width: 'auto' }}
            value={filter.severity} onChange={e => setFilter({...filter, severity: e.target.value})}>
            <option value="">All Severity</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select className="form-input" style={{ padding: '8px 12px', width: 'auto' }}
            value={filter.category} onChange={e => setFilter({...filter, category: e.target.value})}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <button className="btn btn-outline btn-sm" onClick={fetchIssues}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div className="map-wrapper" style={{ height: 'calc(100vh - 240px)' }}>
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {issues.map(issue => {
              if (!issue.location?.lat || !issue.location?.lng) return null;
              return (
                <Marker
                  key={issue._id}
                  position={[issue.location.lat, issue.location.lng]}
                  icon={getIcon(issue)}
                  eventHandlers={{ click: () => setSelected(issue) }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 200, color: '#000' }}>
                      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.9rem' }}>{issue.title}</div>
                      <div style={{ fontSize: '0.78rem', marginBottom: 8, color: '#666' }}>{issue.description?.substring(0, 80)}...</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ background: '#eee', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>{issue.category}</span>
                        <span style={{ background: issue.severity === 'Critical' ? '#FFE5E7' : '#FFF3E0', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, color: issue.severity === 'Critical' ? '#FF4757' : '#FF6B35' }}>{issue.severity}</span>
                        <span style={{ background: '#E8F5E9', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, color: '#4CAF50' }}>{issue.status}</span>
                      </div>
                      <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#888' }}>
                        Score: {issue.priorityScore} · {issue.verificationCount} verifications
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Legend */}
          <div className="map-legend">
            <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Legend</div>
            {[
              { color: '#FF4757', label: 'Critical' },
              { color: '#FF6B35', label: 'High' },
              { color: '#FFD93D', label: 'Medium' },
              { color: '#6BCB77', label: 'Low' },
              { color: '#4CAF50', label: 'Resolved' },
            ].map(item => (
              <div key={item.label} className="legend-item">
                <div className="legend-dot" style={{ background: item.color }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>


          {/* Stats overlay */}
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', gap: 8, flexDirection: 'column' }}>
            {[
              { count: issues.filter(i => i.severity === 'Critical').length, label: 'Critical', color: '#FF4757' },
              { count: issues.filter(i => i.status === 'Resolved').length, label: 'Resolved', color: '#4CAF50' },
              { count: issues.length, label: 'Total', color: '#6C63FF' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-secondary)', backdropFilter: 'blur(12px)',
                border: '1px solid var(--border)', borderRadius: 8,
                padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: s.color, fontSize: '0.9rem' }}>{s.count}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default MapView;
