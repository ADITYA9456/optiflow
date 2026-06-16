'use client';

import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import { Card, CardHeader, StatCard } from '@/components/ui/Card';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { authFetch, useAuth } from '@/contexts/AuthContext';

const STATUS_OPTIONS = ['pending', 'in-progress', 'review', 'blocked', 'completed'];

export default function TaskDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await authFetch(`/api/tasks/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load task');
      setTask(data.task);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?next=/tasks/${id}`);
      return;
    }
    fetchTask();
  }, [authLoading, isAuthenticated, fetchTask, router, id]);

  const updateStatus = async (status) => {
    try {
      const res = await authFetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Update failed');
      setTask(data.task);
      toast.success(`Status set to ${status}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const res = await authFetch(`/api/tasks/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to post comment');
      setTask((prev) => ({ ...prev, comments: [...(prev?.comments || []), data.comment] }));
      setComment('');
      toast.success('Comment posted');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPosting(false);
    }
  };

  const canEditStatus = useMemo(() => {
    if (!task || !user) return false;
    if (['owner', 'admin', 'manager', 'team_leader'].includes(user.role)) return true;
    return (
      task.assignedTo?._id === user.id ||
      task.assignedTo?.toString?.() === user.id ||
      task.createdBy?._id === user.id
    );
  }, [task, user]);

  if (loading || !task) {
    return (
      <main className="app-bg min-h-screen pt-24">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="mt-3 h-3 w-2/3" />
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-bg min-h-screen pb-24 pt-24">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link href="/dashboard" className="btn-ghost text-xs">
          ← Back to dashboard
        </Link>

        <Card className="mt-3" padding="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
                {task.taskType || 'feature'}
              </p>
              <h1 className="mt-1 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {task.title}
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {task.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
                {Array.isArray(task.labels) &&
                  task.labels.map((l) => (
                    <span
                      key={l}
                      className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    >
                      {l}
                    </span>
                  ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className="rounded-md px-2 py-1 text-xs font-bold"
                style={{
                  background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
                  color: 'var(--accent)',
                }}
                title="AI priority score"
              >
                AI Priority {task.aiPriorityScore || 50}
              </span>
              {canEditStatus && (
                <select
                  value={task.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="surface-input text-xs"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Visibility impact" value={`${task.visibilityImpactScore || 50}/100`} hint="Outward visibility weight" />
          <StatCard label="Promotion impact" value={`${task.promotionImpactScore || 50}/100`} hint="Promotion case contribution" accent="var(--success)" />
          <StatCard label="Effort" value={`${task.effortPoints || 3} pts`} hint={`Deadline ${task.deadline ? format(new Date(task.deadline), 'd MMM yyyy') : '—'}`} accent="var(--warning)" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="card p-5 md:col-span-2">
            <CardHeader title="Comments" subtitle="Drop updates, blockers, or links here" />
            {(task.comments || []).length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Be the first to comment.
              </p>
            ) : (
              <ul className="space-y-3">
                {task.comments.map((c) => (
                  <li
                    key={c._id || c.createdAt}
                    className="rounded-xl border px-3 py-2"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  >
                    <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <span>
                        <strong style={{ color: 'var(--text-primary)' }}>{c.userId?.name || 'User'}</strong>
                        {c.userId?.role && <> · {c.userId.role.replace('_', ' ')}</>}
                      </span>
                      <span>{c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}</span>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {c.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={postComment} className="mt-4 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="surface-input text-sm"
                placeholder="Write an update..."
                maxLength={1000}
              />
              <Button type="submit" loading={posting} disabled={!comment.trim()}>
                Post
              </Button>
            </form>
          </div>

          <div className="card p-5">
            <CardHeader title="Activity" subtitle="Audit trail" />
            {(task.activity || []).length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No activity yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {task.activity
                  .slice()
                  .reverse()
                  .map((a) => (
                    <li key={a._id || a.createdAt} className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {a.actorId?.name || 'System'}
                      </span>{' '}
                      · {a.message}
                      <br />
                      <span>{a.createdAt ? formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) : ''}</span>
                    </li>
                  ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
