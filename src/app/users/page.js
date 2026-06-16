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

const ROLE_OPTIONS = ['employee', 'team_leader', 'manager', 'admin'];

export default function UsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isManager, isAdmin, loading: authLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [form, setForm] = useState({
    role: 'employee',
    department: 'General',
    title: 'Contributor',
    visibilityScore: 50,
    promotionScore: 50,
    isActive: true,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/users');
      const data = res.ok ? await res.json() : { users: [] };
      setUsers(data.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login?next=/users');
      return;
    }
    if (!isManager) {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [authLoading, isAuthenticated, isManager, fetchUsers, router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.title?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      role: u.role,
      department: u.department || 'General',
      title: u.title || 'Contributor',
      visibilityScore: u.visibilityScore ?? 50,
      promotionScore: u.promotionScore ?? 50,
      isActive: u.isActive !== false,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving || !editing) return;
    setSaving(true);
    try {
      const body = {
        department: form.department,
        title: form.title,
        visibilityScore: Number(form.visibilityScore),
        promotionScore: Number(form.promotionScore),
        isActive: !!form.isActive,
      };
      if (isAdmin) body.role = form.role;
      const res = await authFetch(`/api/users/${editing._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Update failed');
      toast.success('User updated');
      setEditing(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (u) => {
    if (!window.confirm(`Deactivate ${u.name}?`)) return;
    try {
      const res = await authFetch(`/api/users/${u._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed');
      }
      toast.success('User deactivated');
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (authLoading || !user) return null;

  return (
    <main className="app-bg min-h-screen pb-24 pt-24">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
              People
            </p>
            <h1 className="mt-1 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Team members
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" aria-label="Search people" className="surface-input text-sm" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="surface-input text-sm">
              <option value="all">All roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </header>

        {loading ? (
          <Skeleton className="h-80" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching people" description="Try a different filter." />
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead style={{ background: 'var(--surface)' }}>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">Department</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">Scores</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id} style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {u.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {u.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize">{u.role?.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{u.department || '—'}</td>
                    <td className="px-4 py-3">{u.title || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      V{u.visibilityScore ?? 50} · P{u.promotionScore ?? 50}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.isActive === false ? 'danger' : 'success'}>
                        {u.isActive === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(u)}>
                          Edit
                        </Button>
                        {u.isActive !== false && (
                          <Button variant="danger" size="sm" onClick={() => deactivate(u)}>
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <Card padding="p-6" className="w-full max-w-md">
            <CardHeader title={`Edit ${editing.name}`} subtitle={editing.email} />
            <form onSubmit={submit} className="space-y-3">
              {isAdmin && (
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="surface-input text-sm">
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              )}
              <input
                className="surface-input text-sm"
                placeholder="Department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
              <input
                className="surface-input text-sm"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Visibility
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.visibilityScore}
                    onChange={(e) => setForm({ ...form, visibilityScore: e.target.value })}
                    className="surface-input mt-1 text-sm"
                  />
                </label>
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Promotion
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.promotionScore}
                    onChange={(e) => setForm({ ...form, promotionScore: e.target.value })}
                    className="surface-input mt-1 text-sm"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active account
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}
