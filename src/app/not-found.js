import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="app-bg flex min-h-screen items-center justify-center p-6">
      <div className="card max-w-lg px-8 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
          404 · Page not found
        </p>
        <h1 className="mt-3 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          The link may be broken or the resource has moved. Let&apos;s get you back on track.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn-primary">Back home</Link>
          <Link href="/dashboard" className="btn-secondary">Open dashboard</Link>
        </div>
      </div>
    </main>
  );
}
