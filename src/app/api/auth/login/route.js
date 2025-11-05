import logger from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
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
    
    const { email, password } = await request.json();

    logger.info('Login attempt', { requestId, email });

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide email and password' },
        { status: 400 }
      );
    }

    if (isDbConnected) {
      // Find user by email
      const user = await User.findOne({ email });
      
      if (!user) {
        logger.warn('Login failed - user not found', { requestId, email });
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        logger.warn('Login failed - invalid password', { requestId, email });
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Create JWT token with reduced expiry (1 hour)
      const token = jwt.sign(
        { userId: user._id.toString(), role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const duration = Date.now() - startTime;
      logger.info('Login successful', {
        requestId,
        userId: user._id.toString(),
        role: user.role,
        duration: `${duration}ms`
      });

      // Create response with httpOnly cookie
      const response = NextResponse.json(
        {
          message: 'Login successful',
          token, // For backwards compatibility
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        { status: 200 }
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
      // Development fallback mode
      logger.warn('Using development fallback mode for login', { requestId });

      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const mockUserId = 'user_' + Date.now();
      const userName = email.split('@')[0];
      const userRole = email.includes('admin') ? 'admin' : 'user';

      // Create JWT token
      const token = jwt.sign(
        { userId: mockUserId, role: userRole, name: userName },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = NextResponse.json(
        {
          message: 'Login successful (Development Mode)',
          token,
          user: {
            id: mockUserId,
            name: userName,
            email: email,
            role: userRole,
          },
        },
        { status: 200 }
      );

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: false, // Development mode
        sameSite: 'lax',
        maxAge: 3600,
        path: '/',
      });

      return response;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Login failed', {
      requestId,
      error: error.message,
      duration: `${duration}ms`
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
