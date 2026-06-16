import logger from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { COOKIE_NAMES, verifyAccessToken } from '@/lib/jwt';
import User from '@/models/User';

const ROLE_PRIORITY = {
  employee: 1,
  team_leader: 2,
  manager: 3,
  admin: 4,
  owner: 5,
};

const normalizeRole = (role) => (role === 'user' ? 'employee' : role);

const hasMinimumRole = (userRole, minimumRole) => {
  const u = normalizeRole(userRole);
  const m = normalizeRole(minimumRole);
  return (ROLE_PRIORITY[u] || 0) >= (ROLE_PRIORITY[m] || 0);
};

export const verifyToken = (request) => {
  const cookieToken = request.cookies?.get?.(COOKIE_NAMES.access)?.value;
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = cookieToken || headerToken;

  if (!token) throw new Error('No valid token provided');

  try {
    return verifyAccessToken(token);
  } catch (error) {
    logger.warn('Token verification failed', { error: error.message });
    throw new Error('Invalid or expired token');
  }
};

export const getUserFromToken = async (request) => {
  await dbConnect();
  const decoded = verifyToken(request);
  const user = await User.findById(decoded.userId).select('-password');
  if (!user) throw new Error('User not found');
  if (user.isActive === false) throw new Error('Account is disabled');

  const normalized = normalizeRole(user.role);
  if (normalized !== user.role) user.role = normalized;
  return user;
};

export const requireAuth = async (request) => getUserFromToken(request);

export const requireRole = async (request, requiredRole) => {
  const user = await getUserFromToken(request);
  if (normalizeRole(user.role) !== normalizeRole(requiredRole)) {
    throw new Error(`${requiredRole} access required`);
  }
  return user;
};

export const requireOwner = async (request) => {
  const user = await getUserFromToken(request);
  if (!user.isOwner || user.role !== 'owner') {
    throw new Error('Owner access required');
  }
  return user;
};

export const requireAdmin = async (request) => {
  const user = await getUserFromToken(request);
  if (!hasMinimumRole(user.role, 'admin')) throw new Error('Admin access required');
  return user;
};

export const requireManager = async (request) => {
  const user = await getUserFromToken(request);
  if (!hasMinimumRole(user.role, 'manager')) throw new Error('Manager access required');
  return user;
};

export const requireTeamLeader = async (request) => {
  const user = await getUserFromToken(request);
  if (!hasMinimumRole(user.role, 'team_leader')) throw new Error('Team leader access required');
  return user;
};

export const requireAnyRole = async (request, roles) => {
  const user = await getUserFromToken(request);
  const normalized = roles.map(normalizeRole);
  if (!normalized.includes(normalizeRole(user.role))) {
    throw new Error('Insufficient role permissions');
  }
  return user;
};

export { hasMinimumRole, normalizeRole, ROLE_PRIORITY };
