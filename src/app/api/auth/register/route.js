import logger from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!process.env.ADMIN_SECRET) {
  logger.warn('ADMIN_SECRET not configured - admin registration will fail');
}

export async function POST(request) {
  const requestId = logger.generateRequestId();
  const startTime = Date.now();

  try {
    // Check if we're in production
    const isProduction = process.env.NODE_ENV === 'production';
    const devFallbackEnabled = process.env.DEV_AUTH_FALLBACK === 'true';

    // Try to connect to MongoDB
    let isDbConnected = false;
    try {
      await dbConnect();
      isDbConnected = true;
    } catch (dbError) {
      logger.error('MongoDB connection failed', { 
        requestId, 
        error: dbError.message 
      });

      // In production, fail immediately if DB is down
      if (isProduction) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }

      // In development, only allow fallback if explicitly enabled
      if (!devFallbackEnabled) {
        return NextResponse.json(
          { error: 'Database unavailable and DEV_AUTH_FALLBACK is not enabled' },
          { status: 503 }
        );
      }
    }
    
    const { name, email, password, role, adminSecret } = await request.json();

    logger.info('Registration attempt', { 
      requestId, 
      email, 
      role: role || 'user' 
    });

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate admin registration - strict validation
    if (role === 'admin') {
      if (!process.env.ADMIN_SECRET) {
        logger.error('Admin registration attempted but ADMIN_SECRET not configured', {
          requestId
        });
        return NextResponse.json(
          { error: 'Admin registration is not available' },
          { status: 403 }
        );
      }

      if (!adminSecret) {
        return NextResponse.json(
          { error: 'Admin verification code is required' },
          { status: 400 }
        );
      }
      
      if (adminSecret !== process.env.ADMIN_SECRET) {
        logger.warn('Invalid admin verification code attempt', { requestId });
        return NextResponse.json(
          { error: 'Invalid admin verification code' },
          { status: 403 }
        );
      }
    }

    if (isDbConnected) {
      // Check if this is the first user (will become owner)
      const userCount = await User.countDocuments();
      const isFirstUser = userCount === 0;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }

      // Determine final role
      let finalRole = role || 'user';
      let isOwner = false;

      if (isFirstUser) {
        finalRole = 'owner';
        isOwner = true;
        logger.info('First user registration - assigning owner role', { requestId });
      }

      // Create user in database
      const user = await User.create({
        name,
        email,
        password: password,
        role: finalRole,
        isOwner,
      });

      // Create JWT token with reduced expiry (1 hour)
      const token = jwt.sign(
        { userId: user._id.toString(), role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const duration = Date.now() - startTime;
      logger.info('User registered successfully', {
        requestId,
        userId: user._id.toString(),
        role: user.role,
        duration: `${duration}ms`
      });

      // Create response with httpOnly cookie
      const response = NextResponse.json(
        {
          message: 'User registered successfully',
          token, // For backwards compatibility with existing clients
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        { status: 201 }
      );

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600, // 1 hour
        path: '/',
      });

      return response;
    } else {
      // Fallback mode: Create mock user without database
      const mockUserId = 'user_' + Date.now();
      
      // Create JWT token with role
      const token = jwt.sign(
        { userId: mockUserId, role: role || 'user', name: name },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '7d' }
      );

      return NextResponse.json(
        {
          message: 'User registered successfully (Development Mode)',
          token,
          user: {
            id: mockUserId,
            name: name,
            email: email,
            role: role || 'user',
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return specific error message for debugging
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}