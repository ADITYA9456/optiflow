'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { authFetch, useAuth } from '@/contexts/AuthContext';

const EMPTY_FORM = { name: '', description: '', memberIds: [], teamLead: '' };

export default function TeamsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isManager, loading: authLoading } = useAuth();

  const [teams, setTeams] = useState([]);
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState({ open: false, team: null });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tRes = await authFetch('/api/teams');
      const tJson = tRes.ok ? await tRes.json() : { teams: [] };
      setTeams(tJson.teams || []);
      if (isManager) {
        const uRes = await authFetch('/api/users');
        const uJson = uRes.ok ? await uRes.json() : { users: [] };
        setPool(uJson.users || []);
      }
    } catch {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?next=/teams');
      return;
    }
    fetchData();
  }, [authLoading, isAuthenticated, fetchData, router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) => t.name?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
    );
  }, [teams, search]);

  const openEditor = (team = null) => {
    setEditor({ open: true, team });
    setForm({
      name: team?.name || '',
      description: team?.description || '',
      memberIds: (team?.members || []).map((m) => m._id),
      teamLead: team?.teamLead?._id || '',
    });
  };
  const closeEditor = () => {
    setEditor({ open: false, team: null });
    setForm(EMPTY_FORM);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (form.name.trim().length < 2) return toast.error('Team name required');
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        memberIds: form.memberIds,
        teamLead: form.teamLead || null,
      };
      const url = editor.team ? `/api/teams/${editor.team._id}` : '/api/teams';
      const method = editor.team ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      toast.success(editor.team ? 'Team updated' : 'Team created');
      closeEditor();
      fetchData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (team) => {
    if (!window.confirm(`Deactivate team "${team.name}"?`)) return;
    try {
      const res = await authFetch(`/api/teams/${team._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Delete failed');
      }
      toast.success('Team deactivated');
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleMember = (id) => {
    setForm((p) => ({
      ...p,
      memberIds: p.memberIds.includes(id) ? p.memberIds.filter((x) => x !== id) : [...p.memberIds, id],
    }));
  };

  if (authLoading || !user) return null;

  return (
    <main className="app-bg min-h-screen pb-24 pt-24">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
              Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Teams
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams"
              aria-label="Search teams"
              className="surface-input text-sm"
            />
            {isManager && <Button onClick={() => openEditor(null)}>+ New team</Button>}
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No teams yet" description="Create your first team to start collaborating." />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => (
              <li key={t._id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {t.name}
                    </h3>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.description || 'No description'}
                    </p>
                  </div>
                  <Badge tone={t.isActive ? 'success' : 'neutral'}>{t.isActive ? 'Active' : 'Archived'}</Badge>
                </div>
                <div className="mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <p>Lead: {t.teamLead?.name || 'Unassigned'}</p>
                  <p>{(t.members || []).length} members</p>
                </div>
                {isManager && (
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEditor(t)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => remove(t)}>
                      Archive
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {editor.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeEditor()}
        >
          <Card padding="p-6" className="w-full max-w-2xl">
            <CardHeader title={editor.team ? 'Edit team' : 'Create team'} subtitle="Pick members and lead" />
            <form onSubmit={submit} className="space-y-3">
              <input
                className="surface-input text-sm"
                placeholder="Team name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={100}
              />
              <textarea
                rows={3}
                className="surface-input text-sm"
                placeholder="Team description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={500}
              />
              <select
                className="surface-input text-sm"
                value={form.teamLead}
                onChange={(e) => setForm({ ...form, teamLead: e.target.value })}
              >
                <option value="">Select team lead…</option>
                {pool.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} · {u.role}
                  </option>
                ))}
              </select>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Members
                </p>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border p-2" style={{ borderColor: 'var(--border)' }}>
                  {pool.map((u) => (
                    <label key={u._id} className="flex items-center gap-2 rounded px-2 py-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={form.memberIds.includes(u._id)}
                        onChange={() => toggleMember(u._id)}
                      />
                      {u.name} <span style={{ color: 'var(--text-muted)' }}>· {u.role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeEditor}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {editor.team ? 'Save' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}
