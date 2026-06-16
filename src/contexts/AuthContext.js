'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const MANAGER_ROLES = new Set(['owner', 'admin', 'manager', 'team_leader']);
const ADMIN_ROLES = new Set(['owner', 'admin']);
const OWNER_ROLES = new Set(['owner']);

async function fetchMe() {
  try {
    const response = await fetch('/api/me', { credentials: 'include' });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  const refresh = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
    return me;
  }, []);

  useEffect(() => {
    if (initialUser) return;
    let alive = true;
    (async () => {
      const me = await fetchMe();
      if (alive) {
        setUser(me);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [initialUser]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // best-effort
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('token');
      } catch {
        // ignore
      }
    }
    setUser(null);
  }, []);

  const value = useMemo(() => {
    const role = user?.role || null;
    return {
      user,
      loading,
      isAuthenticated: !!user,
      role,
      isOwner: OWNER_ROLES.has(role),
      isAdmin: ADMIN_ROLES.has(role),
      isManager: MANAGER_ROLES.has(role),
      refresh,
      setUser,
      logout,
    };
  }, [user, loading, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}

export async function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.headers || {}),
    },
  });
}
