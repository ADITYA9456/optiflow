'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ui/ThemeToggle';

const PUBLIC_NAV = [
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
];

function buildNav(user) {
  if (!user) return PUBLIC_NAV;
  const nav = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/chat', label: 'Chat' },
    { href: '/profile', label: 'Profile' },
  ];
  if (['owner', 'admin', 'manager', 'team_leader'].includes(user.role)) {
    nav.push({ href: '/teams', label: 'Teams' });
    nav.push({ href: '/users', label: 'People' });
  }
  if (['owner', 'admin'].includes(user.role)) {
    nav.push({ href: '/admin', label: 'Admin' });
  }
  return nav;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = buildNav(user);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isActive = (href) => {
    if (href.startsWith('/#')) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className="fixed inset-x-0 top-0 z-40 border-b backdrop-blur-xl"
      style={{ background: 'color-mix(in srgb, var(--bg-app) 78%, transparent)', borderColor: 'var(--border)' }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl font-bold"
            style={{
              background: 'linear-gradient(120deg, var(--accent), var(--accent-3))',
              color: 'var(--accent-foreground)',
            }}
          >
            O
          </div>
          <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            OptiFlow AI
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition"
                style={{
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: active ? 'var(--surface)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          {user ? (
            <>
              <NotificationBell />
              <div
                className="hidden items-center gap-2 rounded-xl border px-2.5 py-1.5 sm:flex"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                  aria-hidden="true"
                >
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {user.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    {user.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-danger text-xs hidden sm:inline-flex">
                Logout
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="btn-ghost text-sm">Login</Link>
              <Link href="/signup" className="btn-primary text-sm">Get Started</Link>
            </div>
          )}

          <button
            type="button"
            className="btn-secondary px-3 py-2 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-nav"
          className="border-t md:hidden"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-elevated)' }}
        >
          <div className="flex flex-col gap-1 px-4 py-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 divider" />
            <ThemeToggle />
            {user ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="btn-danger mt-2 text-sm"
              >
                Logout
              </button>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link href="/login" className="btn-secondary flex-1 text-sm" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/signup" className="btn-primary flex-1 text-sm" onClick={() => setMenuOpen(false)}>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
