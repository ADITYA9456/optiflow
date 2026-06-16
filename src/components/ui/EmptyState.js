'use client';

export default function EmptyState({ title, description, action, icon = '✨' }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-10 text-center">
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{
          background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
          color: 'var(--accent)',
          fontSize: '1.4rem',
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-md text-sm" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
