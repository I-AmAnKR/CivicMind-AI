import { useState, useRef, useEffect } from 'react';
import { X, Send, Brain, MessageCircle, Minimize2 } from 'lucide-react';
import { chatWithAI } from '../services/api';

const QUICK = [
  'Critical issues today?',
  'How to report an issue?',
  'How do I earn points?',
  'Most complained areas?',
];

const FloatingChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: '👋 Hi! I\'m **CivicMind AI**. Ask me anything about civic issues, your reports, or how to earn points!', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef();

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, messages]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await chatWithAI(text);
      const botMsg = { id: Date.now() + 1, role: 'bot', text: res.data.message, time: new Date() };
      setMessages(prev => [...prev, botMsg]);
      if (!open) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: '❌ Connection error. Please try again.', time: new Date() }]);
    }
    setLoading(false);
  };

  const formatText = (text) => text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, width: 360, height: 500,
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', zIndex: 9998,
          animation: 'fadeInUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,255,0.08))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🤖</div>
              <div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem' }}>CivicMind AI</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: 'var(--low)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--low)', display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
                  Online · Gemini Flash
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
              <Minimize2 size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 8, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem',
                  background: msg.role === 'bot' ? 'var(--gradient-primary)' : 'linear-gradient(135deg, #6C63FF, #00D4FF)',
                }}>{msg.role === 'bot' ? '🤖' : '👤'}</div>
                <div style={{
                  maxWidth: '78%', padding: '10px 13px', borderRadius: msg.role === 'bot' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                  background: msg.role === 'bot' ? 'var(--bg-glass-strong)' : 'var(--gradient-primary)',
                  fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-primary)',
                  border: msg.role === 'bot' ? '1px solid var(--border)' : 'none',
                }}>
                  <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                  <div style={{ fontSize: '0.65rem', color: msg.role === 'bot' ? 'var(--text-muted)' : 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                    {msg.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>🤖</div>
                <div style={{ padding: '10px 14px', background: 'var(--bg-glass-strong)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 5 }}>
                  {[0.1, 0.2, 0.3].map((d, i) => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', animation: `bounce 1.2s ease-in-out ${d}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6, overflowX: 'auto' }}>
            {QUICK.map((q, i) => (
              <button key={i} onClick={() => send(q)} disabled={loading} style={{
                padding: '4px 10px', borderRadius: 'var(--radius-full)',
                background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)',
                color: 'var(--primary-light)', fontSize: '0.68rem', cursor: 'pointer',
                whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0,
              }}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 'var(--radius-full)',
                background: 'var(--bg-glass)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none',
                fontFamily: 'inherit',
              }}
              placeholder="Ask about civic issues..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              disabled={loading}
            />
            <button onClick={() => send(input)} disabled={!input.trim() || loading} style={{
              width: 38, height: 38, borderRadius: '50%',
              background: input.trim() ? 'var(--gradient-primary)' : 'var(--bg-glass)',
              border: '1px solid var(--border)', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'var(--transition)',
            }}><Send size={15} /></button>
          </div>
        </div>
      )}

      {/* Floating Bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        title="AI Chat Assistant"
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 58, height: 58, borderRadius: '50%',
          background: open ? 'linear-gradient(135deg, #FF4757, #FF6B35)' : 'var(--gradient-primary)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? '0 8px 32px rgba(255,71,87,0.5)' : '0 8px 32px rgba(108,99,255,0.5)',
          zIndex: 9999, transition: 'var(--transition)',
          animation: open ? 'none' : 'pulse-glow 3s infinite',
        }}
      >
        {open ? <X size={22} color="white" /> : <MessageCircle size={24} color="white" fill="white" />}
        {!open && unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--critical)', color: 'white',
            borderRadius: '50%', width: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 800, border: '2px solid var(--bg-secondary)',
          }}>{unread}</span>
        )}
      </button>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default FloatingChat;
