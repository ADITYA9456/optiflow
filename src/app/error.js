'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[OptiFlow] runtime error', error);
  }, [error]);

  return (
    <main className="app-bg flex min-h-screen items-center justify-center p-6">
      <div className="card max-w-lg p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--danger)' }}>
          Something broke
        </p>
        <h1 className="mt-3 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          The workspace hit a snag
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          {error?.message?.slice(0, 200) || 'An unexpected error occurred while rendering this page.'}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()}>Retry</Button>
          <Link href="/dashboard" className="btn-secondary">Go to dashboard</Link>
        </div>
      </div>
    </main>
  );
}
