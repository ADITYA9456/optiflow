'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

const SUGGESTED_PROMPTS = [
  'What should I focus on today?',
  'Summarize my open tasks by priority',
  'Give me 3 actions to improve visibility',
  'Help me draft a status update',
];

export default function AIChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const send = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const res = await authFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.slice(-10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'AI request failed');

      setMessages([...history, { role: 'assistant', content: data.reply || '...' }]);
      if (data.fallback) toast.info('AI fallback used — verify GEMINI_API_KEY.');
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 50);
    } catch (error) {
      toast.error(error.message || 'AI chat failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI assistant"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl"
        style={{
          background: 'linear-gradient(120deg, var(--accent), var(--accent-3))',
          color: 'var(--accent-foreground)',
        }}
      >
        ✨
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <aside
            className="flex h-full w-full max-w-md flex-col border-l"
            style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border)' }}
            role="dialog"
            aria-label="AI assistant"
          >
            <header
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
                  OptiFlow Copilot
                </p>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Your productivity AI
                </h3>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost px-3 py-1" aria-label="Close AI panel">
                ✕
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Ask anything about your work, priorities, or growth. The AI knows your latest tasks.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="card text-left text-xs hover:translate-y-[-1px]"
                      >
                        <span style={{ color: 'var(--accent)' }}>✨</span>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>{p}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user' ? 'ml-auto' : ''
                    }`}
                    style={{
                      background:
                        m.role === 'user'
                          ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
                          : 'var(--surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.content}
                  </div>
                ))
              )}
              {loading && (
                <div className="rounded-2xl border px-4 py-2.5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--accent)' }} />
                    <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--accent)', animationDelay: '0.2s' }} />
                    <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--accent)', animationDelay: '0.4s' }} />
                  </span>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2 border-t p-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the AI..."
                className="surface-input flex-1 text-sm"
                disabled={loading}
              />
              <Button type="submit" loading={loading} disabled={!input.trim()}>
                Send
              </Button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
