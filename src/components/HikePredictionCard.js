'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';

const BAND_COLOR = {
  'fast-track': 'var(--success)',
  strong: 'var(--accent)',
  'on-track': 'var(--info)',
  developing: 'var(--warning)',
  baseline: 'var(--text-muted)',
};

function Donut({ value }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" aria-label={`Score ${value}`}>
      <circle cx="42" cy="42" r={radius} stroke="var(--border)" strokeWidth="8" fill="none" />
      <circle
        cx="42"
        cy="42"
        r={radius}
        stroke="var(--accent)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="42" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text-primary)">
        {value}
      </text>
    </svg>
  );
}

export default function HikePredictionCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await authFetch('/api/ai/hike-prediction');
        const json = await res.json();
        if (alive && res.ok) setData(json.prediction);
      } catch {
        // ignore
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="card p-5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-3 h-16 w-16 rounded-full" />
        <Skeleton className="mt-3 h-3 w-2/3" />
      </div>
    );
  }

  if (!data) return null;

  const { promotionReadiness, estimatedHikePercent, band, confidence, factors, nextActions, stats } = data;
  const safeBand = band || 'baseline';
  const bandColor = BAND_COLOR[safeBand] || 'var(--accent)';

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
            Hike & Promotion Forecast
          </p>
          <h3 className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            You are <span style={{ color: bandColor }}>{safeBand.replace('-', ' ')}</span>
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            Confidence: {confidence}
          </p>
        </div>
        <Donut value={promotionReadiness ?? 0} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Estimated hike
          </p>
          <p className="text-xl font-semibold" style={{ color: 'var(--success)' }}>
            {estimatedHikePercent}%
          </p>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            On-time rate
          </p>
          <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {stats?.onTimeRate ?? 0}%
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Drivers
        </p>
        <ul className="mt-2 space-y-1.5">
          {(factors || []).slice(0, 4).map((f, i) => (
            <li key={i} className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              · {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Next 3 moves
        </p>
        <ul className="mt-2 space-y-1.5">
          {(nextActions || []).map((n, i) => (
            <li
              key={i}
              className="rounded-lg px-2 py-1 text-xs"
              style={{
                background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                color: 'var(--text-primary)',
              }}
            >
              → {n}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
