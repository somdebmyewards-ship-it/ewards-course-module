import React, { useEffect, useRef, useState } from 'react';
import { assistantApi, ChatMessage, AssistantStatus } from '@/lib/assistantApi';
import {
  RobotOutlined, SendOutlined, CloseOutlined,
  FileTextOutlined, UnorderedListOutlined, FormOutlined,
  FilePdfOutlined, BookOutlined, LoadingOutlined,
  LockOutlined, ToolOutlined,
} from '@ant-design/icons';

interface Props {
  moduleId: number;
  moduleTitle: string;
  open: boolean;
  onClose: () => void;
  status: AssistantStatus | null;
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

const SOURCE_ICON: Record<string, React.ReactNode> = {
  section:   <FileTextOutlined style={{ fontSize: 10 }} />,
  checklist: <UnorderedListOutlined style={{ fontSize: 10 }} />,
  quiz:      <FormOutlined style={{ fontSize: 10 }} />,
  pdf:       <FilePdfOutlined style={{ fontSize: 10 }} />,
};

export default function AssistantDrawer({ moduleId, moduleTitle, open, onClose, status }: Props) {
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [input, setInput]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [suggestions, setSuggestions]     = useState<string[]>([]);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const isReady    = status?.enabled && status?.index_status === 'ready';
  const isIndexing = status?.index_status === 'indexing';

  useEffect(() => {
    if (open && isReady && !suggestionsLoaded) {
      assistantApi.getSuggestions(moduleId)
        .then(r => setSuggestions(r.data.suggestions || []))
        .catch(() => {})
        .finally(() => setSuggestionsLoaded(true));
    }
  }, [open, isReady, moduleId, suggestionsLoaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && isReady) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open, isReady]);

  const sendMessage = async (text: string) => {
    const question = text.trim();
    if (!question || sending) return;

    setInput('');
    setSuggestions([]);
    setMessages(prev => [
      ...prev,
      { role: 'user',      content: question },
      { role: 'assistant', content: '', isLoading: true },
    ]);
    setSending(true);

    try {
      const res = await assistantApi.chat(moduleId, question);
      const { answer, sources, answer_found } = res.data;
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: answer, sources, answer_found, isLoading: false };
        return next;
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error;
      const msg = status === 429
        ? serverMsg || 'Too many questions. Please wait a moment.'
        : serverMsg || 'Something went wrong. Please try again.';
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: msg, answer_found: false, isLoading: false };
        return next;
      });
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,0,25,0.35)',
        zIndex: 1050, backdropFilter: 'blur(2px)',
      }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, maxWidth: '95vw',
        background: '#fff', zIndex: 1051,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 48px rgba(107,47,160,0.22)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        animation: 'aiDrawerIn 0.26s cubic-bezier(0.4,0,0.2,1) both',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#2d0066,#6B2FA0)',
          padding: '16px 20px', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RobotOutlined style={{ fontSize: 20, color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              Learning Assistant
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
              {moduleTitle}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.12)', color: '#fff',
            cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          >
            <CloseOutlined />
          </button>
        </div>

        {/* ── Not enabled state ─────────────────────────────────── */}
        {!status?.enabled && (
          <NotReadyState
            icon={<LockOutlined style={{ fontSize: 32, color: '#9B59B6' }} />}
            title="Assistant Not Enabled"
            message="The Learning Assistant hasn't been enabled for this module yet. Ask your admin to turn it on."
          />
        )}

        {/* ── Indexing state ────────────────────────────────────── */}
        {status?.enabled && isIndexing && (
          <NotReadyState
            icon={<LoadingOutlined style={{ fontSize: 32, color: '#6B2FA0' }} spin />}
            title="Setting Up Assistant"
            message="The assistant is indexing this module's content. This usually takes a minute. Refresh the page to check again."
          />
        )}

        {/* ── Index failed state ────────────────────────────────── */}
        {status?.enabled && status?.index_status === 'failed' && (
          <NotReadyState
            icon={<ToolOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />}
            title="Setup Failed"
            message="Indexing failed for this module. Please ask your admin to re-index from the Content Manager."
            color="#fff2f0"
            borderColor="#ffccc7"
          />
        )}

        {/* ── Not indexed yet ───────────────────────────────────── */}
        {status?.enabled && status?.index_status === 'not_indexed' && (
          <NotReadyState
            icon={<ToolOutlined style={{ fontSize: 32, color: '#d48806' }} />}
            title="Not Indexed Yet"
            message="The assistant content hasn't been indexed yet. Ask your admin to trigger indexing from the Content Manager."
            color="#fffbe6"
            borderColor="#ffe58f"
          />
        )}

        {/* ── Ready: full chat UI ───────────────────────────────── */}
        {isReady && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }} className="hide-scrollbar">

              {/* Empty state */}
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 16px 16px' }}>
                  <div style={{
                    width: 68, height: 68, borderRadius: 20, margin: '0 auto 16px',
                    background: 'linear-gradient(135deg,#f3ebfc,#e8d5ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <RobotOutlined style={{ fontSize: 30, color: '#6B2FA0' }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
                    Ask me anything
                  </div>
                  <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.8 }}>
                    I answer questions using only this module's training content — sections, documents, and quizzes.
                  </div>
                </div>
              )}

              {/* Suggestion chips */}
              {messages.length === 0 && suggestions.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
                    Try asking
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s)} style={{
                        padding: '6px 13px', borderRadius: 20,
                        border: '1.5px solid #c7a8e8', background: '#faf5ff',
                        color: '#6B2FA0', fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                        transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f3ebfc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#faf5ff'; }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
              <div ref={bottomRef} style={{ height: 16 }} />
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 16px 18px', borderTop: '1px solid #f0e8ff',
              flexShrink: 0, background: '#fff',
            }}>
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center',
                background: '#f9f5ff', borderRadius: 14,
                border: '1.5px solid #e0d0f8', padding: '8px 10px 8px 14px',
                transition: 'border-color 0.15s',
              }}
                onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#9B59B6'; }}
                onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e0d0f8'; }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about this module..."
                  disabled={sending}
                  maxLength={500}
                  style={{
                    flex: 1, border: 'none', background: 'transparent', outline: 'none',
                    fontSize: 13, color: '#1a1a2e',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || sending}
                  style={{
                    width: 34, height: 34, borderRadius: 10, border: 'none', flexShrink: 0,
                    background: (!input.trim() || sending) ? '#e8e8e8' : 'linear-gradient(135deg,#4a1080,#7B35B8)',
                    color: (!input.trim() || sending) ? '#bbb' : '#fff',
                    cursor: (!input.trim() || sending) ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, transition: 'all 0.15s',
                  }}
                >
                  <SendOutlined />
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#ccc', textAlign: 'center', marginTop: 6 }}>
                Answers are based only on this module's training content
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes aiDrawerIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes aiBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function NotReadyState({ icon, title, message, color = '#f9f5ff', borderColor = '#e8d5ff' }: {
  icon: React.ReactNode;
  title: string;
  message: string;
  color?: string;
  borderColor?: string;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{
        textAlign: 'center', background: color,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 20, padding: '32px 28px',
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: 20, margin: '0 auto 16px',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          {icon}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#888', lineHeight: 1.8 }}>{message}</div>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === 'user') return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
      <div style={{
        maxWidth: '80%', background: 'linear-gradient(135deg,#4a1080,#7B35B8)',
        color: '#fff', borderRadius: '14px 14px 4px 14px',
        padding: '10px 14px', fontSize: 13, lineHeight: 1.6, fontWeight: 500,
      }}>
        {msg.content}
      </div>
    </div>
  );

  if (msg.isLoading) return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
      <Avatar />
      <div style={{
        background: '#f3ebfc', borderRadius: '4px 14px 14px 14px',
        padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 0.18, 0.36].map((d, i) => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#9B59B6',
            animation: `aiBounce 1.1s ${d}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  );

  const notFound = !msg.answer_found;
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
      <Avatar />
      <div style={{ maxWidth: '82%' }}>
        <div style={{
          background: notFound ? '#fff7e6' : '#f9f5ff',
          border: `1.5px solid ${notFound ? '#ffe58f' : '#e8d5ff'}`,
          borderRadius: '4px 14px 14px 14px',
          padding: '12px 14px', fontSize: 13, lineHeight: 1.75,
          color: notFound ? '#ad6800' : '#1a1a2e',
          wordBreak: 'break-word',
        }}>
          {renderMarkdown(msg.content)}
        </div>
        {msg.sources && msg.sources.length > 0 && msg.answer_found && (
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {msg.sources.map((s, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, color: '#6B2FA0', fontWeight: 600,
                background: '#f3ebfc', border: '1px solid #d4b8ff',
                borderRadius: 6, padding: '2px 8px',
              }}>
                {SOURCE_ICON[s.source_type] ?? <BookOutlined style={{ fontSize: 10 }} />}
                {s.source_title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
      background: 'linear-gradient(135deg,#2d0066,#6B2FA0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <RobotOutlined style={{ fontSize: 14, color: '#fff' }} />
    </div>
  );
}
