'use client';

import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import { Card, CardHeader, StatCard } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { AdminTaskTrendLine } from '@/components/charts/DashboardCharts';
import { authFetch, useAuth } from '@/contexts/AuthContext';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'requests', label: 'Admin requests' },
  { key: 'audit', label: 'Audit log' },
];

function timeAgo(input) {
  try {
    return formatDistanceToNow(new Date(input), { addSuffix: true });
  } catch {
    return '';
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, isOwner, isAdmin } = useAuth();

  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await authFetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!isOwner) {
      setRequests([]);
      setRequestsLoading(false);
      return;
    }
    setRequestsLoading(true);
    try {
      const res = await authFetch('/api/admin/requests');
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } catch {
      // ignore
    } finally {
      setRequestsLoading(false);
    }
  }, [isOwner]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await authFetch('/api/admin/audit-logs?limit=80');
      const data = await res.json();
      if (res.ok) setLogs(data.logs || []);
    } catch {
      // ignore
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchStats();
    fetchLogs();
    if (isOwner) fetchRequests();
  }, [isAdmin, isOwner, fetchStats, fetchLogs, fetchRequests]);

  const decide = async (requestIdDb, action) => {
    setActionLoading(`${requestIdDb}:${action}`);
    try {
      const res = await authFetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestIdDb,
          action,
          notes: reviewNotes[requestIdDb] || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}`);
      fetchRequests();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || !user) return null;
  if (!isAdmin) return null;

  return (
    <main className="app-bg min-h-screen pb-24 pt-24">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
            Admin console
          </p>
          <h1 className="mt-1 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            System control center
          </h1>
        </header>

        <nav className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => {
            if (t.key === 'requests' && !isOwner) return null;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={active ? 'btn-primary text-xs' : 'btn-secondary text-xs'}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {statsLoading ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)
              ) : (
                <>
                  <StatCard label="Total users" value={stats?.stats?.totalUsers ?? 0} hint={`${stats?.stats?.activeUsers ?? 0} active`} />
                  <StatCard label="Teams" value={stats?.stats?.totalTeams ?? 0} />
                  <StatCard label="Tasks" value={stats?.stats?.totalTasks ?? 0} hint={`${stats?.stats?.completionRate ?? 0}% completion`} accent="var(--success)" />
                  <StatCard label="Blocked" value={stats?.stats?.blockedTasks ?? 0} accent="var(--danger)" />
                  <StatCard label="Admin requests" value={stats?.stats?.pendingAdminRequests ?? 0} hint="Pending" accent="var(--warning)" />
                  <StatCard label="Logins (7d)" value={stats?.stats?.recentLogins ?? 0} hint={`${stats?.stats?.criticalEvents ?? 0} critical events`} accent="var(--info)" />
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="card p-5 xl:col-span-2">
                <CardHeader title="Task throughput (7d)" subtitle="Created vs completed" />
                {statsLoading ? <Skeleton className="h-60" /> : <AdminTaskTrendLine tasksByDay={stats?.tasksByDay || []} />}
              </div>
              <div className="card p-5">
                <CardHeader title="Role distribution" subtitle="Workspace breakdown" />
                <ul className="space-y-2">
                  {Object.entries(stats?.roleBreakdown || {}).map(([role, count]) => (
                    <li
                      key={role}
                      className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}
                    >
                      <span className="capitalize">{role.replace('_', ' ')}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{count}</strong>
                    </li>
                  ))}
                  {Object.keys(stats?.roleBreakdown || {}).length === 0 && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      No data yet.
                    </p>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === 'requests' && isOwner && (
          <div>
            <Card padding="p-5">
              <CardHeader title="Admin elevation requests" subtitle="Approve or reject with notes" />
              {requestsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : requests.length === 0 ? (
                <EmptyState title="No admin requests" description="When employees request admin access, they will appear here." />
              ) : (
                <ul className="space-y-3">
                  {requests.map((r) => {
                    const isPending = r.status === 'pending';
                    return (
                      <li
                        key={r._id}
                        className="rounded-xl border p-4"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {r.userId?.name || r.requestedBy?.name || 'Unknown user'}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {r.userId?.email || r.requestedBy?.email} · {timeAgo(r.createdAt)}
                            </p>
                            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {r.reason}
                            </p>
                          </div>
                          <Badge tone={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>
                            {r.status}
                          </Badge>
                        </div>

                        {isPending && (
                          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
                            <input
                              value={reviewNotes[r._id] || ''}
                              onChange={(e) => setReviewNotes((p) => ({ ...p, [r._id]: e.target.value }))}
                              placeholder="Optional review notes"
                              className="surface-input text-sm md:flex-1"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => decide(r._id, 'approve')}
                                loading={actionLoading === `${r._id}:approve`}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => decide(r._id, 'reject')}
                                loading={actionLoading === `${r._id}:reject`}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        )}

        {tab === 'audit' && (
          <Card padding="p-5">
            <CardHeader title="Audit log" subtitle="Recent system events" />
            {logsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <EmptyState title="No audit events" description="Audit events will appear here as users interact with the system." />
            ) : (
              <div
                className="max-h-[600px] overflow-auto rounded-xl border"
                style={{ borderColor: 'var(--border)' }}
              >
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead className="sticky top-0" style={{ background: 'var(--surface-elevated)' }}>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Actor</th>
                      <th className="px-3 py-2">Target</th>
                      <th className="px-3 py-2">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr
                        key={l._id}
                        style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                      >
                        <td className="whitespace-nowrap px-3 py-2">{timeAgo(l.createdAt)}</td>
                        <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-primary)' }}>
                          {l.action}
                        </td>
                        <td className="px-3 py-2">
                          {l.actorName || '—'} {l.actorRole && <span style={{ color: 'var(--text-muted)' }}> · {l.actorRole}</span>}
                        </td>
                        <td className="px-3 py-2">
                          {l.targetType ? `${l.targetType}/${(l.targetId || '').toString().slice(-6) || '—'}` : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <Badge tone={l.severity === 'critical' ? 'danger' : l.severity === 'warn' ? 'warning' : 'neutral'}>
                            {l.severity}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}
