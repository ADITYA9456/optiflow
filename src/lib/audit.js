import logger from './logger';
import AuditLog from '@/models/AuditLog';

const SENSITIVE_KEYS = ['password', 'token', 'adminSecret', 'jwtSecret', 'secret'];

function safeMeta(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.includes(key)) continue;
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

function getIp(request) {
  if (!request) return null;
  const forwarded = request.headers?.get?.('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers?.get?.('x-real-ip') || null;
}

/**
 * Records an audit entry. Best-effort; never throws.
 * @param {Object} params
 * @param {string} params.action      e.g. "user.login", "task.create"
 * @param {Object} [params.actor]     mongoose user doc (or id+role)
 * @param {string} [params.targetType] e.g. "task", "user"
 * @param {string} [params.targetId]   target document id
 * @param {Object} [params.meta]       arbitrary safe metadata
 * @param {Request} [params.request]   for ip extraction
 * @param {"info"|"warn"|"critical"} [params.severity]
 */
export async function recordAudit({
  action,
  actor,
  targetType,
  targetId,
  meta,
  request,
  severity = 'info',
} = {}) {
  if (!action) return;
  try {
    await AuditLog.create({
      action,
      actorId: actor?._id || actor?.id || null,
      actorRole: actor?.role || null,
      actorName: actor?.name || null,
      targetType: targetType || null,
      targetId: targetId || null,
      meta: safeMeta(meta),
      ip: getIp(request),
      severity,
    });
  } catch (error) {
    logger.warn('Audit log failed', { action, error: error.message });
  }
}
