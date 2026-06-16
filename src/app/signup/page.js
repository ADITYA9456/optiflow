'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

const ROLES = ['employee', 'team_leader', 'manager', 'admin'];
const ELEVATED = new Set(['team_leader', 'manager', 'admin']);

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    adminSecret: '',
    department: '',
    title: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          department: form.department || undefined,
          title: form.title || undefined,
          adminSecret: ELEVATED.has(form.role) ? form.adminSecret : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Registration failed');
        return;
      }
      toast.success('Account created. Welcome to OptiFlow AI!');
      await refresh();
      router.push('/dashboard');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-bg min-h-screen">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="card w-full max-w-lg p-8" style={{ background: 'var(--surface-elevated)' }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
            Create your account
          </p>
          <h1 className="mt-2 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Join OptiFlow AI
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            First user automatically becomes the workspace owner.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Full name
                </label>
                <input required name="name" value={form.name} onChange={onChange} className="surface-input text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Email
                </label>
                <input required type="email" name="email" value={form.email} onChange={onChange} className="surface-input text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    minLength={6}
                    value={form.password}
                    onChange={onChange}
                    className="surface-input pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Confirm
                </label>
                <input
                  required
                  type="password"
                  name="confirmPassword"
                  minLength={6}
                  value={form.confirmPassword}
                  onChange={onChange}
                  className="surface-input text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Role
                </label>
                <select name="role" value={form.role} onChange={onChange} className="surface-input text-sm">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Department
                </label>
                <input name="department" value={form.department} onChange={onChange} className="surface-input text-sm" placeholder="Engineering" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Title
                </label>
                <input name="title" value={form.title} onChange={onChange} className="surface-input text-sm" placeholder="SDE-II" />
              </div>
            </div>

            {ELEVATED.has(form.role) && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Verification code (required for elevated role)
                </label>
                <input
                  required={ELEVATED.has(form.role)}
                  name="adminSecret"
                  value={form.adminSecret}
                  onChange={onChange}
                  className="surface-input text-sm"
                  placeholder="Provided by your workspace owner"
                />
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>
          </form>

          <p className="mt-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
