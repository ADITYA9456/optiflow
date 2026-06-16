'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

function timeAgo(input) {
  try {
    return formatDistanceToNow(new Date(input), { addSuffix: true });
  } catch {
    return '';
  }
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onClick(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
            style={{ background: 'var(--danger)', color: 'white' }}
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border shadow-xl"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border)',
            backdropFilter: 'blur(20px)',
          }}
          role="menu"
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Notifications
            </p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="btn-ghost text-xs">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                You&apos;re all caught up.
              </div>
            ) : (
              notifications.map((n) => {
                const Item = n.link ? Link : 'div';
                const props = n.link ? { href: n.link, onClick: () => markOneRead(n._id) } : {};
                return (
                  <Item
                    key={n._id}
                    {...props}
                    className="block px-4 py-3 text-left text-sm"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: n.isRead ? 'transparent' : 'color-mix(in srgb, var(--accent) 8%, transparent)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {n.title}
                      </p>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {n.body}
                      </p>
                    )}
                  </Item>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
