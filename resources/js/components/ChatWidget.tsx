import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CloseOutlined, SendOutlined, RobotOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

interface Source {
  source_type: string;
  source_title: string;
  module_title: string;
  slug: string;
}

interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  text: string;
  sources?: Source[];
  suggestions?: string[];
  answer_found?: boolean;
  timestamp: Date;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ── Markdown renderer ─────────────────────────────────────────────────
function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{
        background: 'rgba(107,47,160,0.12)', color: '#4a1080',
        padding: '1px 5px', borderRadius: 4, fontSize: '0.88em',
        fontFamily: 'monospace',
      }}>{part.slice(1, -1)}</code>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // Header
    if (/^#{1,3}\s+/.test(line)) {
      const t = line.replace(/^#{1,3}\s+/, '');
      elements.push(
        <div key={i} style={{ fontWeight: 800, fontSize: 13, color: '#1a1a2e', margin: '8px 0 3px' }}>
          {inlineFormat(t)}
        </div>
      );
      i++; continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom: 3, lineHeight: 1.65 }}>{inlineFormat(lines[i].replace(/^\d+\.\s+/, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol${i}`} style={{ paddingLeft: 20, margin: '4px 0 4px' }}>{items}</ol>);
      continue;
    }

    // Unordered list
    if (/^[-*•]\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i])) {
        items.push(<li key={i} style={{ marginBottom: 3, lineHeight: 1.65 }}>{inlineFormat(lines[i].replace(/^[-*•]\s+/, ''))}</li>);
        i++;
      }
      elements.push(<ul key={`ul${i}`} style={{ paddingLeft: 18, margin: '4px 0 4px', listStyleType: 'disc' }}>{items}</ul>);
      continue;
    }

    elements.push(
      <p key={i} style={{ margin: '0 0 5px', lineHeight: 1.75 }}>
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

// ── Loading stages ─────────────────────────────────────────────────────
const LOADING_STAGES = [
  'Searching training content...',
  'Ela is thinking...',
  'Composing the answer...',
  'Almost there...',
];

function TypingIndicator({ stage }: { stage: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, animation: 'elaFadeIn 0.3s ease' }}>
      <ElaAvatar />
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: '4px 14px 14px 14px',
          background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
        }}>
          {[0, 1, 2].map(j => (
            <span key={j} style={{
              width: 7, height: 7, borderRadius: '50%', background: '#6B2FA0',
              display: 'inline-block',
              animation: `elaDotPulse 1.2s ease-in-out ${j * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#bbb', marginTop: 4, paddingLeft: 4 }}>
          {LOADING_STAGES[stage]}
        </div>
      </div>
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────
function ElaAvatar({ size = 28 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #4B0082, #6B2FA0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: size * 0.55, lineHeight: 1 }}>E</span>
    </div>
  );
}

// ── Suggestion chips ───────────────────────────────────────────────────
function SuggestionChips({ suggestions, onSelect }: { suggestions: string[]; onSelect: (q: string) => void }) {
  if (!suggestions?.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {suggestions.map((s, i) => (
        <button key={i} onClick={() => onSelect(s)} style={{
          padding: '5px 12px', borderRadius: 16,
          border: '1.5px solid #c7a8e8', background: '#faf5ff',
          color: '#6B2FA0', fontSize: 11.5, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#6B2FA0'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#faf5ff'; e.currentTarget.style.color = '#6B2FA0'; }}
        >{s}</button>
      ))}
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────
function MessageBubble({ msg, onSelect, navigate }: { msg: ChatMessage; onSelect: (q: string) => void; navigate: (path: string) => void }) {
  if (msg.type === 'user') return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'elaFadeIn 0.25s ease' }}>
      <div style={{
        maxWidth: '78%', padding: '10px 14px',
        borderRadius: '14px 14px 4px 14px',
        background: 'linear-gradient(135deg, #4B0082, #6B2FA0)',
        color: '#fff', fontSize: 13, lineHeight: 1.65,
        boxShadow: '0 2px 8px rgba(75,0,130,0.25)',
        wordBreak: 'break-word',
      }}>
        {msg.text}
      </div>
    </div>
  );

  const notFound = msg.answer_found === false;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', animation: 'elaFadeIn 0.3s ease' }}>
      <ElaAvatar />
      <div style={{ maxWidth: '82%', flex: 1 }}>
        <div style={{
          padding: '11px 14px', fontSize: 13, lineHeight: 1.7,
          borderRadius: '4px 14px 14px 14px', wordBreak: 'break-word',
          background: notFound ? '#fff7e6' : '#fff',
          border: notFound ? '1.5px solid #ffe58f' : 'none',
          color: notFound ? '#ad6800' : '#1a1a2e',
          boxShadow: notFound ? 'none' : '0 1px 8px rgba(0,0,0,0.07)',
        }}>
          {renderMarkdown(msg.text)}
        </div>

        {/* Source chips */}
        {msg.sources && msg.sources.length > 0 && msg.answer_found !== false && (
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {msg.sources.slice(0, 4).map((src, j) => (
              <button key={j}
                onClick={() => { if (src.slug) { navigate(`/learning-hub/${src.slug}`); } }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, color: '#6B2FA0', fontWeight: 600,
                  background: '#f3ebfc', border: '1px solid #d4b8ff',
                  borderRadius: 8, padding: '3px 9px',
                  cursor: src.slug ? 'pointer' : 'default',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (src.slug) e.currentTarget.style.background = '#e8d5ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f3ebfc'; }}
              >
                <span style={{ fontSize: 9 }}>📖</span>
                {src.source_title !== src.module_title
                  ? `${src.module_title} › ${src.source_title}`
                  : src.source_title}
              </button>
            ))}
          </div>
        )}

        {/* Follow-up suggestions */}
        {msg.suggestions && msg.suggestions.length > 0 && (
          <SuggestionChips suggestions={msg.suggestions} onSelect={onSelect} />
        )}

        <div style={{ fontSize: 10, color: '#c0b0d4', marginTop: 5, paddingLeft: 2 }}>
          {timeAgo(msg.timestamp)}
        </div>
      </div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// ── Default suggestions ────────────────────────────────────────────────
const DEFAULT_SUGGESTIONS = [
  'How does eWards Instant Pass work?',
  'How do I create a campaign?',
  'What is customer upload?',
];

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════
export default function ChatWidget() {
  const [open, setOpen]                   = useState(false);
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [history, setHistory]             = useState<HistoryItem[]>([]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [loadingStage, setLoadingStage]   = useState(0);
  const [showGreeting, setShowGreeting]   = useState(false);
  const [greetingDone, setGreetingDone]   = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const navigate    = useNavigate();
  const stageTimer  = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Greeting popup
  useEffect(() => {
    const shown = sessionStorage.getItem('ela_greeted');
    if (shown) return;
    const t1 = setTimeout(() => { setShowGreeting(true); sessionStorage.setItem('ela_greeted', '1'); }, 2000);
    const t2 = setTimeout(() => setShowGreeting(false), 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setShowGreeting(false);
      setGreetingDone(true);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Loading stage progression
  useEffect(() => {
    stageTimer.current.forEach(clearTimeout);
    if (!loading) { setLoadingStage(0); return; }
    stageTimer.current = [
      setTimeout(() => setLoadingStage(1), 4000),
      setTimeout(() => setLoadingStage(2), 12000),
      setTimeout(() => setLoadingStage(3), 25000),
    ];
    return () => stageTimer.current.forEach(clearTimeout);
  }, [loading]);

  const sendMessage = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = { id: uid(), type: 'user', text: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setLoadingStage(0);

    try {
      const res = await api.post('/chatbot/ask', {
        question: q,
        history:  history.slice(-6),
      });
      const { answer, sources, suggestions, answer_found } = res.data;

      const botMsg: ChatMessage = {
        id: uid(), type: 'bot',
        text: answer || "I couldn't process that — please try again.",
        sources: sources || [],
        suggestions: suggestions || [],
        answer_found: answer_found !== false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);

      // Update conversation history
      setHistory(prev => [
        ...prev.slice(-8),
        { role: 'user', content: q },
        { role: 'assistant', content: answer || '' },
      ]);

    } catch (err: any) {
      const serverMsg = err?.response?.data?.answer;
      setMessages(prev => [...prev, {
        id: uid(), type: 'bot',
        text: serverMsg || "I'm having trouble connecting right now. Please try again.",
        answer_found: false,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, history]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      {/* Greeting popup */}
      {!open && showGreeting && !greetingDone && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 1001,
          width: 300, borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(75,0,130,0.25)',
          animation: 'elaSlideUp 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          cursor: 'pointer',
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        }}
          onClick={() => { setShowGreeting(false); setGreetingDone(true); setOpen(true); }}
        >
          <div style={{
            background: 'linear-gradient(135deg,#4B0082,#6B2FA0,#8B5CF6)',
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>E</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Ela</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                Online now
              </div>
            </div>
            <CloseOutlined
              onClick={e => { e.stopPropagation(); setShowGreeting(false); setGreetingDone(true); }}
              style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, padding: 4 }}
            />
          </div>
          <div style={{ background: '#fff', padding: '14px 18px 18px' }}>
            <p style={{ color: '#333', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 12px' }}>
              Hi there! 👋 I'm <strong style={{ color: '#4B0082' }}>Ela</strong>, your eWards learning assistant.
              Ask me anything about the platform!
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg,#4B0082,#6B2FA0)',
              color: '#fff', padding: '7px 16px', borderRadius: 20,
              fontSize: 12, fontWeight: 600,
            }}>
              💬 Start chatting
            </div>
          </div>
          <div style={{
            position: 'absolute', bottom: -7, right: 32,
            width: 14, height: 14, background: '#fff',
            transform: 'rotate(45deg)', boxShadow: '2px 2px 6px rgba(0,0,0,0.06)',
          }} />
        </div>
      )}

      {/* FAB — Circle that expands to pill on hover */}
      {!open && (
        <div
          onClick={() => setOpen(true)}
          className="ela-fab"
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
            display: 'flex', alignItems: 'center',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #4B0082 0%, #6B2FA0 50%, #8B5CF6 100%)',
            borderRadius: 28,
            height: 56, width: 56,
            padding: 0,
            boxShadow: '0 4px 24px rgba(75,0,130,0.4), 0 0 0 4px rgba(75,0,130,0.08)',
            transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1), padding 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.2s ease, box-shadow 0.2s ease',
            animation: 'elaFabPulse 3s ease-in-out infinite',
            fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
            overflow: 'hidden',
            justifyContent: 'center',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget;
            el.style.width = '148px';
            el.style.padding = '0 20px 0 14px';
            el.style.justifyContent = 'flex-start';
            el.style.transform = 'scale(1.04)';
            el.style.boxShadow = '0 6px 32px rgba(75,0,130,0.5), 0 0 0 6px rgba(75,0,130,0.06)';
            const label = el.querySelector('.ela-label') as HTMLElement;
            if (label) { label.style.opacity = '1'; label.style.maxWidth = '80px'; label.style.marginLeft = '10px'; }
          }}
          onMouseLeave={e => {
            const el = e.currentTarget;
            el.style.width = '56px';
            el.style.padding = '0';
            el.style.justifyContent = 'center';
            el.style.transform = 'scale(1)';
            el.style.boxShadow = '0 4px 24px rgba(75,0,130,0.4), 0 0 0 4px rgba(75,0,130,0.08)';
            const label = el.querySelector('.ela-label') as HTMLElement;
            if (label) { label.style.opacity = '0'; label.style.maxWidth = '0'; label.style.marginLeft = '0'; }
          }}
        >
          {/* Circle avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.18)',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1 }}>E</span>
            <span style={{
              position: 'absolute', top: -1, right: -1,
              width: 10, height: 10, borderRadius: '50%',
              background: '#4ade80', border: '2px solid #6B2FA0',
              animation: 'elaPulse 2s ease infinite',
            }} />
          </div>
          {/* Label — hidden by default, slides in on hover */}
          <span className="ela-label" style={{
            color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: 0.3,
            whiteSpace: 'nowrap', overflow: 'hidden',
            opacity: 0, maxWidth: 0, marginLeft: 0,
            transition: 'opacity 0.25s ease 0.08s, max-width 0.35s cubic-bezier(0.4,0,0.2,1), margin-left 0.35s cubic-bezier(0.4,0,0.2,1)',
          }}>
            Ask Ela
          </span>
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 390, maxWidth: 'calc(100vw - 16px)',
          height: 570, maxHeight: 'calc(100vh - 80px)',
          borderRadius: 20, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 16px 64px rgba(0,0,0,0.18)',
          background: '#fff',
          animation: 'elaSlideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg,#4B0082,#6B2FA0,#8B5CF6)',
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
            flexShrink: 0,
          }}>
            <ElaAvatar size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Ela</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'elaPulse 2s ease infinite' }} />
                {loading ? LOADING_STAGES[loadingStage] : 'Your eWards Learning Assistant'}
              </div>
            </div>
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setHistory([]); }} style={{
                padding: '4px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)',
                background: 'transparent', color: 'rgba(255,255,255,0.7)',
                fontSize: 10, fontWeight: 600, cursor: 'pointer', marginRight: 4,
                fontFamily: 'inherit',
              }}>
                Clear
              </button>
            )}
            <button onClick={() => setOpen(false)} style={{
              width: 30, height: 30, borderRadius: 8, border: 'none', flexShrink: 0,
              background: 'rgba(255,255,255,0.12)', color: '#fff',
              cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: 14,
            background: '#f7f4fc',
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 12px', animation: 'elaFadeIn 0.4s ease' }}>
                <ElaAvatar size={56} />
                <div style={{ marginTop: 14, fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>
                  Hi, I'm Ela! 👋
                </div>
                <div style={{ fontSize: 12.5, color: '#888', lineHeight: 1.7, margin: '8px 0 16px', maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>
                  I know the eWards platform inside out. Ask me anything!
                </div>
                <SuggestionChips suggestions={DEFAULT_SUGGESTIONS} onSelect={sendMessage} />
              </div>
            )}

            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} onSelect={sendMessage} navigate={navigate} />
            ))}

            {loading && <TypingIndicator stage={loadingStage} />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 14px 16px', borderTop: '1px solid #ede8f5',
            flexShrink: 0, background: '#fff',
          }}>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: '#f7f4fc', borderRadius: 16,
              border: '1.5px solid #ddd3f0', padding: '8px 10px 8px 14px',
              transition: 'border-color 0.15s',
            }}
              onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6B2FA0'; }}
              onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ddd3f0'; }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Ela about eWards..."
                disabled={loading}
                maxLength={600}
                style={{
                  flex: 1, border: 'none', background: 'transparent', outline: 'none',
                  fontSize: 13, color: '#1a1a2e', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 34, height: 34, borderRadius: 10, border: 'none', flexShrink: 0,
                  background: (!input.trim() || loading) ? '#e8e0f0' : 'linear-gradient(135deg,#4a1080,#7B35B8)',
                  color: (!input.trim() || loading) ? '#bbb' : '#fff',
                  cursor: (!input.trim() || loading) ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, transition: 'all 0.15s',
                }}
              >
                <SendOutlined />
              </button>
            </div>
            <div style={{ fontSize: 10, color: '#c4b8d8', textAlign: 'center', marginTop: 5 }}>
              Answers are from eWards training content
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes elaSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes elaFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes elaDotPulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30%           { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes elaPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
        @keyframes elaFabPulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(75,0,130,0.4), 0 0 0 4px rgba(75,0,130,0.08); }
          50%      { box-shadow: 0 4px 24px rgba(75,0,130,0.4), 0 0 0 10px rgba(75,0,130,0.04); }
        }
        @media (max-width: 480px) {
          [data-ela-panel] {
            width: calc(100vw - 16px) !important;
            height: calc(100vh - 80px) !important;
            bottom: 8px !important;
            right: 8px !important;
          }
        }
      `}</style>
    </>
  );
}
