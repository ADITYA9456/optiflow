import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

// Verify JWT token and extract user info
export const verifyToken = (request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid token provided');
  }
  
  const token = authHeader.substring(7);
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
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
    throw new Error('Invalid token or user not found');
  }
};

// Check if user has admin role
export const requireAdmin = async (request) => {
  const user = await getUserFromToken(request);
  
  if (user.role !== 'admin') {
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