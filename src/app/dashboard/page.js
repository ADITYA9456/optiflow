'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AdminTaskModal from '@/components/AdminTaskModal';
import AIChatPanel from '@/components/AIChatPanel';
import HikePredictionCard from '@/components/HikePredictionCard';
import KanbanBoard from '@/components/KanbanBoard';
import Navbar from '@/components/Navbar';
import SuggestionCard from '@/components/SuggestionCard';
import TaskModal from '@/components/TaskModal';
import Button from '@/components/ui/Button';
import { CardHeader, StatCard } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  GrowthLine,
  PriorityBreakdownBar,
  StatusBreakdownDonut,
  WeeklyPerformanceBar,
} from '@/components/charts/DashboardCharts';
import { authFetch, useAuth } from '@/contexts/AuthContext';

const MANAGER_ROLES = new Set(['owner', 'admin', 'manager', 'team_leader']);
const STATUS_TO_COLUMN = {
  pending: 'todo',
  'in-progress': 'in-progress',
  review: 'review',
  blocked: 'backlog',
  completed: 'done',
};
const COLUMN_TO_STATUS = {
  backlog: 'blocked',
  todo: 'pending',
  'in-progress': 'in-progress',
  review: 'review',
  done: 'completed',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [adminReason, setAdminReason] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const canManage = useMemo(() => MANAGER_ROLES.has(user?.role), [user]);
  const analyticsEndpoint = canManage ? '/api/analytics/manager' : '/api/analytics/employee';
  const ModalComponent = canManage ? AdminTaskModal : TaskModal;

  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [t, s, a, i] = await Promise.all([
        authFetch('/api/tasks'),
        authFetch('/api/suggestions'),
        authFetch(analyticsEndpoint),
        authFetch('/api/ai/insights'),
      ]);
      const tJson = t.ok ? await t.json() : { tasks: [] };
      const sJson = s.ok ? await s.json() : { suggestions: [] };
      const aJson = a.ok ? await a.json() : null;
      const iJson = i.ok ? await i.json() : null;
      setTasks(tJson.tasks || []);
      setSuggestions(sJson.suggestions || []);
      setAnalytics(aJson);
      setInsights(iJson);
    } catch {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [analyticsEndpoint, isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?next=/dashboard');
      return;
    }
    fetchAll();
  }, [authLoading, isAuthenticated, fetchAll, router]);

  const handleCreateOrUpdate = async (payload) => {
    try {
      if (editingTask) {
        const res = await authFetch(`/api/tasks/${editingTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Update failed');
        toast.success('Task updated');
      } else {
        const res = await authFetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Create failed');
        toast.success('Task created');
      }
      setTaskModalOpen(false);
      setEditingTask(null);
      fetchAll();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleMoveColumn = async (taskId, targetColumn) => {
    const status = COLUMN_TO_STATUS[targetColumn] || 'pending';
    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, boardColumn: targetColumn, status } : t))
    );
    try {
      const res = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, boardColumn: targetColumn }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Move failed');
      }
      toast.success(`Moved to ${targetColumn}`);
    } catch (error) {
      setTasks(previous);
      toast.error(error.message);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    try {
      const res = await authFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Delete failed');
      }
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleMarkSuggestion = async (id) => {
    try {
      const res = await authFetch('/api/suggestions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId: id, isImplemented: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Update failed');
      }
      setSuggestions((prev) => prev.map((s) => (s._id === id ? { ...s, isImplemented: true } : s)));
      toast.success('Marked as implemented');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const submitAdminRequest = async (e) => {
    e.preventDefault();
    if (adminSubmitting) return;
    if (adminReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }
    setAdminSubmitting(true);
    try {
      const res = await authFetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: adminReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Submit failed');
      toast.success('Admin request submitted');
      setAdminReason('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAdminSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    if (!analytics) return null;
    if (canManage) {
      const status = analytics.statusBreakdown || {};
      return {
        total: analytics.totalTasks ?? 0,
        completed: status.completed ?? 0,
        inProgress: (status['in-progress'] ?? 0) + (status.review ?? 0),
        teamPerformance: analytics.teamPerformance?.length ?? 0,
      };
    }
    return {
      total: analytics.taskCounts?.total ?? 0,
      completed: analytics.taskCounts?.completed ?? 0,
      inProgress: analytics.taskCounts?.inProgress ?? 0,
      growth: analytics.growth?.momentumScore ?? 0,
    };
  }, [analytics, canManage]);

  if (authLoading || !isAuthenticated || (!user && loading)) {
    return (
      <main className="app-bg min-h-screen pt-24">
        <Navbar />
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="app-bg min-h-screen pb-24 pt-24">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
              {canManage ? 'Manager workspace' : 'My workspace'}
            </p>
            <h1 className="mt-1 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Hey {user?.name?.split(' ')[0] || 'there'} — let&apos;s ship something great.
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={fetchAll}>
              Refresh
            </Button>
            {canManage && (
              <Button
                onClick={() => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                }}
              >
                + Assign task
              </Button>
            )}
            {!canManage && (
              <Button
                onClick={() => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                }}
              >
                + New task
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total tasks" value={stats?.total ?? 0} hint="All assigned and managed work" />
          <StatCard
            label="Completed"
            value={stats?.completed ?? 0}
            hint={`${stats?.total ? Math.round(((stats.completed || 0) / stats.total) * 100) : 0}% completion`}
            accent="var(--success)"
          />
          <StatCard label="In progress" value={stats?.inProgress ?? 0} hint="Active execution" accent="var(--accent)" />
          {canManage ? (
            <StatCard label="Teams tracked" value={stats?.teamPerformance ?? 0} hint="Aggregated performance" />
          ) : (
            <StatCard label="Momentum" value={`${stats?.growth ?? 0}/100`} hint="Last 30 days" accent="var(--info)" />
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="card p-5 xl:col-span-2">
            <CardHeader
              title="Kanban board"
              subtitle="Drag cards to update status. AI priority scores are shown per card."
            />
            {tasks.length === 0 ? (
              <EmptyState
                title="No tasks yet"
                description={canManage ? 'Assign your first task to your team to get started.' : 'Once tasks are assigned, they will appear here.'}
                action={
                  canManage && (
                    <Button onClick={() => setTaskModalOpen(true)}>+ Assign task</Button>
                  )
                }
              />
            ) : (
              <KanbanBoard
                tasks={tasks}
                onMoveColumn={handleMoveColumn}
                onEdit={(t) => {
                  setEditingTask(t);
                  setTaskModalOpen(true);
                }}
                onDelete={handleDelete}
                canManage
              />
            )}
          </div>

          <div className="space-y-4">
            <HikePredictionCard />

            <div className="card p-5">
              <CardHeader title="AI suggestions" subtitle="Tailored to your last 90 days of work" />
              {suggestions.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  No suggestions yet — finish a few tasks and check back.
                </p>
              ) : (
                <div className="grid gap-3">
                  {suggestions.slice(0, 3).map((s) => (
                    <SuggestionCard key={s._id} suggestion={s} onMarkImplemented={handleMarkSuggestion} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {canManage ? (
            <>
              <div className="card p-5">
                <CardHeader title="Status breakdown" subtitle="Live snapshot of your portfolio" />
                <StatusBreakdownDonut statusBreakdown={analytics?.statusBreakdown || {}} />
              </div>
              <div className="card p-5 xl:col-span-2">
                <CardHeader title="Weekly performance" subtitle="Throughput and average impact" />
                <WeeklyPerformanceBar weeklyPerformance={analytics?.weeklyPerformance || []} />
              </div>
            </>
          ) : (
            <>
              <div className="card p-5">
                <CardHeader title="Priority mix" subtitle="Your active task distribution" />
                <PriorityBreakdownBar priorityBreakdown={analytics?.priorityBreakdown} />
              </div>
              <div className="card p-5 xl:col-span-2">
                <CardHeader title="Growth trajectory" subtitle="Visibility & promotion scores" />
                <GrowthLine
                  history={
                    analytics?.scoreHistory && analytics.scoreHistory.length > 0
                      ? analytics.scoreHistory
                      : Array.from({ length: 6 }).map((_, i) => ({
                          date: `W${i + 1}`,
                          promotion: Math.max(20, (user?.promotionScore || 50) - 5 + i),
                          visibility: Math.max(20, (user?.visibilityScore || 50) - 3 + i),
                        }))
                  }
                />
              </div>
            </>
          )}
        </div>

        {!canManage && user?.role === 'employee' && (
          <div className="mt-6 card p-5">
            <CardHeader
              title="Request admin access"
              subtitle="Owner will review and decide. Provide a clear business reason."
            />
            <form onSubmit={submitAdminRequest} className="grid gap-3 md:grid-cols-[1fr_auto]">
              <textarea
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                rows={3}
                placeholder="Why do you need admin access? Be specific."
                className="surface-input text-sm"
                minLength={10}
              />
              <Button type="submit" loading={adminSubmitting}>
                Submit request
              </Button>
            </form>
          </div>
        )}

        {insights?.summary && (
          <div className="mt-6 card p-5">
            <CardHeader title="Weekly AI insights" subtitle="Updated continually as you ship" />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {insights.summary}
            </p>
            {Array.isArray(insights.recommendations) && insights.recommendations.length > 0 && (
              <ul className="mt-3 grid gap-2 md:grid-cols-2">
                {insights.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border px-3 py-2 text-xs"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    {rec}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <ModalComponent
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdate}
        task={editingTask}
      />

      <AIChatPanel />
    </main>
  );
}
