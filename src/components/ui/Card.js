'use client';

export function Card({ as: Tag = 'div', className = '', children, padding = 'p-5', strong = false, ...rest }) {
  const base = strong ? 'card-strong' : 'card';
  return (
    <Tag className={`${base} ${padding} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        <h3 className="text-base font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, accent = 'var(--accent)' }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs" style={{ color: accent }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default Card;
