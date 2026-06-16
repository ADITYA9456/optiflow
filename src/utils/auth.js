// Backwards-compatible helpers. New code should prefer the AuthContext hook.
//
// `authFetch` simply preserves credentials so the httpOnly cookie is sent.
// `getCurrentUser` is retained for non-React modules; React code should use useAuth().

export const authFetch = async (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.headers || {}),
    },
  });
};

export const getCurrentUser = async () => {
  try {
    const response = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user || null;
  } catch {
    return null;
  }
};

export const removeToken = async () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('token');
    } catch {
      // ignore
    }
  }
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // best-effort
  }
};
