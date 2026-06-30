import { useState, useEffect, useRef } from 'react';
import { chatWithAI } from '../services/api';
import { Send, Brain, Zap, RotateCcw } from 'lucide-react';

const QUICK_PROMPTS = [
  'Show me the most critical issues',
  'How many issues were resolved this month?',
  'Which category has the most complaints?',
  'What areas have the most unresolved issues?',
  'How does the priority scoring work?',
  'How can I earn more reward points?',
];

const TypingIndicator = () => (
  <div className="chat-msg bot">
    <div className="chat-avatar" style={{ background: 'var(--gradient-primary)', fontSize: '1rem' }}>🤖</div>
    <div className="chat-bubble" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  </div>
);

const ChatAI = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      text: `👋 Hi! I'm **CivicMind AI**, your intelligent civic assistant.\n\nI can help you with:\n• Issue statistics and trends\n• How to report civic problems\n• Understanding priority scores\n• Finding hotspots in your city\n• Platform features and rewards\n\nWhat would you like to know?`,
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatWithAI(text);
      const botMsg = { id: Date.now() + 1, role: 'bot', text: res.data.message, time: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: '❌ Sorry, I had trouble connecting. Please try again!',
        time: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };

  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const clearChat = () => setMessages([{
    id: 1, role: 'bot',
    text: `👋 Chat cleared! I'm ready for your next question.`,
    time: new Date()
  }]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>
            <span className="text-gradient">AI</span> Chat Assistant
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Powered by Google Gemini Flash</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '0.8rem', color: 'var(--accent)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-glow 2s infinite' }} />
            AI Online
          </div>
          <button className="btn btn-outline btn-sm" onClick={clearChat}>
            <RotateCcw size={14} /> Clear
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden' }}>
        {/* Chat Panel */}
        <div className="chat-container" style={{ flex: 1 }}>
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chat-msg ${msg.role}`}>
                <div className="chat-avatar" style={msg.role === 'bot' ? { background: 'var(--gradient-primary)', fontSize: '1rem' } : { background: 'linear-gradient(135deg, #6C63FF, #00D4FF)' }}>
                  {msg.role === 'bot' ? '🤖' : '👤'}
                </div>
                <div className="chat-bubble">
                  <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    {msg.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-area">
            <input
              className="chat-input"
              placeholder="Ask about civic issues, statistics, hotspots..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button className="btn btn-primary" onClick={() => sendMessage(input)} disabled={!input.trim() || loading}>
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Quick Prompts Sidebar */}
        <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Quick Questions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p)} disabled={loading} style={{
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  fontFamily: 'Inter, sans-serif',
                }} onMouseEnter={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary-light)'; }}
                  onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)'; }}>
                  💬 {p}
                </button>
              ))}
            </div>
          </div>

          {/* AI Info */}
          <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,255,0.04))', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 'var(--radius-md)', padding: 16, marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Brain size={16} color="var(--primary-light)" />
              <span style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif' }}>CivicMind AI</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Powered by Gemini Flash with real-time access to all civic data on this platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAI;
