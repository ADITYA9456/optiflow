'use client';

import { motion } from 'framer-motion';
import Badge from '@/components/ui/Badge';

const IMPACT_TONE = { high: 'danger', medium: 'warning', low: 'success' };

export default function SuggestionCard({ suggestion, onMarkImplemented }) {
  const implemented = !!suggestion.isImplemented;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative p-4"
      style={{
        borderColor: implemented ? 'color-mix(in srgb, var(--success) 35%, var(--border))' : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {suggestion.category}
          </p>
          <h4 className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {suggestion.title}
          </h4>
        </div>
        <Badge tone={IMPACT_TONE[suggestion.impact] || 'info'}>
          {suggestion.impact || 'medium'} impact
        </Badge>
      </div>

      <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {suggestion.description}
      </p>

      <div className="mt-3 flex items-center justify-between">
        {implemented ? (
          <span className="text-[11px] font-semibold" style={{ color: 'var(--success)' }}>
            ✓ Implemented
          </span>
        ) : (
          <button onClick={() => onMarkImplemented?.(suggestion._id)} className="btn-secondary text-xs">
            Mark implemented
          </button>
        )}
      </div>
    </motion.div>
  );
}
