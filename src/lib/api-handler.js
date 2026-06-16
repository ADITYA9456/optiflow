import { NextResponse } from 'next/server';
import logger from './logger';
import { consumeRateLimit } from './rate-limit';
import { parseInput } from './validation';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getOrigin(request) {
  return request.headers.get('origin') || request.headers.get('referer') || '';
}

function isSameOrigin(request) {
  const origin = getOrigin(request);
  if (!origin) return false;
  try {
    const host = request.headers.get('host');
    if (!host) return false;
    const url = new URL(origin);
    return url.host === host;
  } catch {
    return false;
  }
}

/**
 * Wraps a Next.js route handler with:
 *  - structured logging
 *  - rate limiting
 *  - body validation (zod)
 *  - same-origin enforcement on state-changing methods (CSRF mitigation)
 *  - normalized error -> JSON response
 *
 * Usage:
 *   export const POST = createHandler({
 *     schema: loginSchema,
 *     rateLimit: { bucket: 'auth-login', limit: 10 },
 *     handler: async ({ request, body }) => NextResponse.json({ ok: true })
 *   });
 */
export function createHandler({ schema, rateLimit, requireSameOrigin = true, handler }) {
  return async function wrappedHandler(request, context) {
    const requestId = logger.generateRequestId();
    const start = Date.now();
    const method = request.method;

    try {
      if (rateLimit) {
        const result = consumeRateLimit(request, rateLimit);
        if (!result.allowed) {
          return NextResponse.json(
            { error: 'Too many requests. Please try again shortly.' },
            {
              status: 429,
              headers: { 'Retry-After': String(result.retryAfterSeconds) },
            }
          );
        }
      }

      if (requireSameOrigin && !SAFE_METHODS.has(method)) {
        if (!isSameOrigin(request)) {
          logger.warn('Cross-origin state-changing request blocked', {
            requestId,
            method,
            origin: getOrigin(request),
          });
          return NextResponse.json({ error: 'Cross-origin requests are not allowed' }, { status: 403 });
        }
      }

      let body;
      if (schema && !SAFE_METHODS.has(method)) {
        let raw;
        try {
          raw = await request.json();
        } catch {
          return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
        }
        const parsed = parseInput(schema, raw);
        if (!parsed.ok) {
          return NextResponse.json(
            { error: parsed.error, issues: parsed.issues },
            { status: 400 }
          );
        }
        body = parsed.data;
      }

      const response = await handler({ request, context, body, requestId });
      return response;
    } catch (error) {
      const message = error?.message || 'Internal server error';
      const lowered = String(message).toLowerCase();

      let status = 500;
      if (
        lowered.includes('access required') ||
        lowered.includes('access denied') ||
        lowered.includes('permission')
      ) {
        status = 403;
      } else if (
        lowered.includes('unauthorized') ||
        lowered.includes('token') ||
        lowered.includes('no valid')
      ) {
        status = 401;
      } else if (lowered.includes('not found')) {
        status = 404;
      } else if (lowered.includes('already exists') || lowered.includes('duplicate')) {
        status = 409;
      } else if (lowered.includes('invalid') || lowered.includes('required')) {
        status = 400;
      }

      logger.error('API error', {
        requestId,
        method,
        url: request.url,
        status,
        error: message,
        durationMs: Date.now() - start,
      });

      return NextResponse.json({ error: message }, { status });
    }
  };
}

export function ok(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
