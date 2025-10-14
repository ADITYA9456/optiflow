import logger from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

// Validate JWT_SECRET on module load
if (!process.env.JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET is not configured. Application cannot start securely.');
  throw new Error('JWT_SECRET environment variable is required');
}

// Verify JWT token and extract user info
export const verifyToken = (request) => {
  // Try cookie first (httpOnly)
  const cookieToken = request.cookies?.get('auth-token')?.value;
  
  // Fall back to Authorization header for backwards compatibility
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  const token = cookieToken || headerToken;
  
  if (!token) {
    throw new Error('No valid token provided');
  }
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.warn('Token verification failed', { error: error.message });
    throw new Error('Invalid or expired token');
  }
};

// Get user from database with role
export const getUserFromToken = async (request) => {
  try {
    await dbConnect();
    
    const decoded = verifyToken(request);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    logger.warn('getUserFromToken failed', { error: error.message });
    throw new Error('Invalid token or user not found');
  }
};

// Check if user has owner role
export const requireOwner = async (request) => {
  const user = await getUserFromToken(request);
  
  if (!user.isOwner || user.role !== 'owner') {
    logger.warn('Owner access denied', { userId: user._id, role: user.role });
    throw new Error('Owner access required');
  }
  
  return user;
};

// Check if user has admin role (or owner)
export const requireAdmin = async (request) => {
  const user = await getUserFromToken(request);
  
  if (user.role !== 'admin' && user.role !== 'owner') {
    logger.warn('Admin access denied', { userId: user._id, role: user.role });
    throw new Error('Admin access required');
  }
  
  return user;
};

// Check if user has specific role
export const requireRole = async (request, requiredRole) => {
  const user = await getUserFromToken(request);
  
  if (user.role !== requiredRole) {
    throw new Error(`${requiredRole} access required`);
  }
  
  return user;
};

// Get user with basic auth check
export const requireAuth = async (request) => {
  return await getUserFromToken(request);
};