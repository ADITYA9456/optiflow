'use client';

import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { authFetch, useAuth } from '@/contexts/AuthContext';

function timeAgo(input) {
  try {
    return formatDistanceToNow(new Date(input), { addSuffix: true });
  } catch {
    return '';
  }
}

function parseMentions(content, users) {
  if (!content) return [];
  const found = new Set();
  const regex = /@([\w._-]{2,40})/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const handle = m[1].toLowerCase();
    const match = users.find(
      (u) =>
        u.email?.toLowerCase().startsWith(handle) ||
        u.name?.toLowerCase().replace(/\s+/g, '').startsWith(handle)
    );
    if (match) found.add(match._id);
  }
  return Array.from(found);
}

function renderWithMentions(content) {
  if (!content) return null;
  const parts = content.split(/(@[\w._-]{2,40})/g);
  return parts.map((part, idx) =>
    part.startsWith('@') ? (
      <span
        key={idx}
        className="rounded-md px-1 font-semibold"
        style={{
          background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
          color: 'var(--accent)',
        }}
      >
        {part}
      </span>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [channels, setChannels] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [dmTarget, setDmTarget] = useState('');
  const listEndRef = useRef(null);

  const activeChannel = useMemo(
    () => channels.find((c) => c._id === activeId) || null,
    [channels, activeId]
  );

  const channelGroups = useMemo(() => {
    const teamChannels = channels.filter((c) => c.type !== 'direct');
    const dms = channels.filter((c) => c.type === 'direct');
    return { teamChannels, dms };
  }, [channels]);

  const fetchChannels = useCallback(async () => {
    setLoadingChannels(true);
    try {
      const res = await authFetch('/api/chat/channels');
      const data = await res.json();
      if (res.ok) {
        const list = data.channels || [];
        setChannels(list);
        if (!activeId && list.length > 0) setActiveId(list[0]._id);
      }
    } catch {
      toast.error('Could not load chat channels');
    } finally {
      setLoadingChannels(false);
    }
  }, [activeId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch('/api/users');
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch {
      // not all users have access — that's ok
    }
  }, []);

  const fetchMessages = useCallback(async (channelId) => {
    if (!channelId) return;
    setLoadingMessages(true);
    try {
      const res = await authFetch(`/api/chat/messages?channelId=${channelId}`);
      const data = await res.json();
      if (res.ok) setMessages(data.messages || []);
    } catch {
      toast.error('Could not load messages');
    } finally {
      setLoadingMessages(false);
      setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?next=/chat');
      return;
    }
    fetchChannels();
    fetchUsers();
  }, [authLoading, isAuthenticated, fetchChannels, fetchUsers, router]);

  useEffect(() => {
    if (activeId) fetchMessages(activeId);
  }, [activeId, fetchMessages]);

  useEffect(() => {
    if (!activeId) return undefined;
    const interval = setInterval(() => fetchMessages(activeId), 10_000);
    return () => clearInterval(interval);
  }, [activeId, fetchMessages]);

  const send = async (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || !activeId || sending) return;
    setSending(true);

    const mentions = parseMentions(text, users);
    const optimistic = {
      _id: `tmp-${Date.now()}`,
      channelId: activeId,
      senderId: { _id: user.id, name: user.name, email: user.email, role: user.role },
      content: text,
      mentions,
      createdAt: new Date().toISOString(),
      __optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');

    try {
      const res = await authFetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: activeId, content: text, mentions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Send failed');
      setMessages((prev) =>
        prev.map((m) => (m._id === optimistic._id ? data.message : m))
      );
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      toast.error(error.message);
    } finally {
      setSending(false);
      setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  };

  const startDm = async (e) => {
    e.preventDefault();
    if (!dmTarget) return;
    try {
      const res = await authFetch('/api/chat/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: dmTarget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not start DM');
      toast.success('Direct message ready');
      setDmTarget('');
      await fetchChannels();
      setActiveId(data.channel._id);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <main className="app-bg min-h-screen pt-24">
        <Navbar />
      </main>
    );
  }

  return (
    <main className="app-bg min-h-screen pb-6 pt-24">
      <Navbar />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 sm:px-6 lg:grid-cols-[300px_1fr]">
        <aside className="card p-4">
          <CardHeader title="Channels" subtitle="Team rooms & direct messages" />
          {loadingChannels ? (
            <div className="space-y-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : channels.length === 0 ? (
            <EmptyState title="No channels yet" description="Create a team to get a channel, or start a DM below." />
          ) : (
            <>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Team channels
              </p>
              <ul className="space-y-1">
                {channelGroups.teamChannels.map((c) => (
                  <li key={c._id}>
                    <button
                      onClick={() => setActiveId(c._id)}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm"
                      style={{
                        background:
                          c._id === activeId
                            ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                            : 'transparent',
                        color: c._id === activeId ? 'var(--accent)' : 'var(--text-secondary)',
                      }}
                    >
                      # {c.name}
                    </button>
                  </li>
                ))}
              </ul>

              {channelGroups.dms.length > 0 && (
                <>
                  <p className="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Direct messages
                  </p>
                  <ul className="space-y-1">
                    {channelGroups.dms.map((c) => (
                      <li key={c._id}>
                        <button
                          onClick={() => setActiveId(c._id)}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm"
                          style={{
                            background:
                              c._id === activeId
                                ? 'color-mix(in srgb, var(--accent) 14%, transparent)'
                                : 'transparent',
                            color: c._id === activeId ? 'var(--accent)' : 'var(--text-secondary)',
                          }}
                        >
                          • {c.name?.replace(/^DM:\s*/, '') || 'Direct message'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {users.length > 0 && (
            <form onSubmit={startDm} className="mt-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Start direct message
              </p>
              <select value={dmTarget} onChange={(e) => setDmTarget(e.target.value)} className="surface-input text-xs">
                <option value="">Select a person…</option>
                {users
                  .filter((u) => u._id !== user?.id)
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} · {u.role?.replace('_', ' ')}
                    </option>
                  ))}
              </select>
              <Button type="submit" size="sm" disabled={!dmTarget} className="w-full">
                Open DM
              </Button>
            </form>
          )}
        </aside>

        <Card padding="p-0" className="flex h-[78vh] flex-col">
          <header
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {activeChannel?.type === 'direct' ? 'Direct message' : 'Channel'}
              </p>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {activeChannel?.name || 'Select a channel'}
              </h2>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {loadingMessages ? (
              <>
                <Skeleton className="h-12 w-2/3" />
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-12 w-3/4" />
              </>
            ) : messages.length === 0 ? (
              <EmptyState title="No messages yet" description="Say hi 👋" />
            ) : (
              messages.map((m) => {
                const isMe = (m.senderId?._id || m.senderId) === user?.id;
                return (
                  <div
                    key={m._id}
                    className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'items-start'}`}
                  >
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {m.senderId?.name || 'User'} · {timeAgo(m.createdAt)}
                    </div>
                    <div
                      className="mt-1 rounded-2xl px-3 py-2 text-sm"
                      style={{
                        background: isMe
                          ? 'color-mix(in srgb, var(--accent) 22%, transparent)'
                          : 'var(--surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {renderWithMentions(m.content)}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={listEndRef} />
          </div>

          <form
            onSubmit={send}
            className="flex gap-2 border-t p-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeChannel ? `Message ${activeChannel.name}` : 'Pick a channel to start chatting'}
              className="surface-input text-sm"
              disabled={!activeChannel}
              maxLength={4000}
            />
            <Button type="submit" loading={sending} disabled={!activeChannel || !input.trim()}>
              Send
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
