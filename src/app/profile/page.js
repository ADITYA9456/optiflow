'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HikePredictionCard from '@/components/HikePredictionCard';
import { Card, CardHeader, StatCard } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) router.push('/login?next=/profile');
  }, [loading, isAuthenticated, router]);

  if (loading || !user) return null;

  return (
    <main className="app-bg min-h-screen pb-24 pt-24">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Card padding="p-6" strong>
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold"
              style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
            >
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {user.name}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {user.title || 'Contributor'} · {user.department || 'General'} ·{' '}
                <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                  {user.role?.replace('_', ' ')}
                </span>
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Visibility score" value={`${user.visibilityScore ?? 50}/100`} hint="Outward impact signal" />
          <StatCard label="Promotion score" value={`${user.promotionScore ?? 50}/100`} hint="Promotion readiness" accent="var(--success)" />
          <StatCard label="Account" value={user.email} hint={`Role: ${user.role}`} accent="var(--info)" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <HikePredictionCard />
          <Card padding="p-5">
            <CardHeader
              title="How OptiFlow predicts your growth"
              subtitle="Transparent, explainable, never a black box"
            />
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>• Recent 90-day task completion rate</li>
              <li>• Visibility & promotion impact scores on closed work</li>
              <li>• On-time delivery streak</li>
              <li>• AI-weighted priority signal</li>
              <li>• Cross-functional / outward facing tasks</li>
            </ul>
            <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              Final hire/hike decisions still belong to humans — OptiFlow gives you the data and the
              talking points to advocate for yourself.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
