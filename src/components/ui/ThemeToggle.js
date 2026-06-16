'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle, mounted } = useTheme();
  if (!mounted) {
    return <div className={`h-9 w-16 shimmer ${className}`.trim()} />;
  }
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      className={`btn-secondary ${className}`.trim()}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span aria-hidden="true" className="text-base">
        {isDark ? '☀️' : '🌙'}
      </span>
      <span className="text-xs">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
