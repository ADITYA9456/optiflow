import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Try to connect to MongoDB
    let isDbConnected = false;
    try {
      await dbConnect();
      isDbConnected = true;
    } catch (dbError) {
      console.warn('MongoDB connection failed, using fallback mode:', dbError.message);
    }
    
    const { email, password } = await request.json();

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
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // Create JWT token with role
      const token = jwt.sign(
        { userId: user._id.toString(), role: user.role, name: user.name },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '7d' }
      );

      return NextResponse.json(
        {
          message: 'Login successful',
          token,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        { status: 200 }
      );
    } else {
      // Fallback mode: Accept any credentials for development
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
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '7d' }
      );

      return NextResponse.json(
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
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}