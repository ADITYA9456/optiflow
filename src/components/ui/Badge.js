'use client';

const TONES = {
  neutral: { bg: 'color-mix(in srgb, var(--surface-strong) 85%, transparent)', text: 'var(--text-secondary)', border: 'var(--border)' },
  info: { bg: 'color-mix(in srgb, var(--info) 16%, transparent)', text: 'var(--info)', border: 'color-mix(in srgb, var(--info) 35%, transparent)' },
  success: { bg: 'color-mix(in srgb, var(--success) 16%, transparent)', text: 'var(--success)', border: 'color-mix(in srgb, var(--success) 35%, transparent)' },
  warning: { bg: 'color-mix(in srgb, var(--warning) 18%, transparent)', text: 'var(--warning)', border: 'color-mix(in srgb, var(--warning) 35%, transparent)' },
  danger: { bg: 'color-mix(in srgb, var(--danger) 16%, transparent)', text: 'var(--danger)', border: 'color-mix(in srgb, var(--danger) 35%, transparent)' },
  accent: { bg: 'color-mix(in srgb, var(--accent) 16%, transparent)', text: 'var(--accent)', border: 'color-mix(in srgb, var(--accent) 35%, transparent)' },
};

export default function Badge({ tone = 'neutral', children, className = '' }) {
  const style = TONES[tone] || TONES.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${className}`.trim()}
      style={{ background: style.bg, color: style.text, borderColor: style.border }}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' };
  return <Badge tone={map[priority] || 'neutral'}>{priority || 'medium'}</Badge>;
}

export function StatusBadge({ status }) {
  const map = {
    completed: 'success',
    'in-progress': 'info',
    review: 'accent',
    blocked: 'danger',
    pending: 'neutral',
  };
  const label = (status || 'pending').replace('-', ' ');
  return <Badge tone={map[status] || 'neutral'}>{label}</Badge>;
}
