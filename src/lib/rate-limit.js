// Lightweight in-memory rate limiter. Suitable for single-instance dev or
// small Vercel deployments. For multi-region production, swap with Upstash:
//   https://github.com/upstash/ratelimit

const STORE = new Map();
const WINDOW_MS = 60_000;
const SWEEP_EVERY = 30_000;

let lastSweep = Date.now();

function sweep() {
  const now = Date.now();
  if (now - lastSweep < SWEEP_EVERY) return;
  lastSweep = now;
  for (const [key, value] of STORE) {
    if (value.resetAt <= now) STORE.delete(key);
  }
}

function getClientIp(request) {
  if (!request) return 'unknown';
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

/**
 * @param {Request} request
 * @param {{ bucket: string, limit?: number, windowMs?: number }} opts
 * @returns {{ allowed: boolean, remaining: number, retryAfterSeconds: number }}
 */
export function consumeRateLimit(request, { bucket, limit = 60, windowMs = WINDOW_MS } = {}) {
  sweep();
  const ip = getClientIp(request);
  const key = `${bucket}:${ip}`;
  const now = Date.now();

  const existing = STORE.get(key);
  if (!existing || existing.resetAt <= now) {
    STORE.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - existing.count), retryAfterSeconds: 0 };
}

export const LIMITS = {
  auth: Number(process.env.RATE_LIMIT_AUTH_PER_MIN || 10),
  api: Number(process.env.RATE_LIMIT_API_PER_MIN || 120),
  ai: Number(process.env.RATE_LIMIT_AI_PER_MIN || 20),
};
