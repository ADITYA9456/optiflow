import dbConnect from '@/lib/mongodb';
import { requireAdmin } from '@/middleware/auth';
import User from '@/models/User';
import { NextResponse } from 'next/server';

// GET all users (admin only)
export async function GET(request) {
  try {
    await dbConnect();
    
    await requireAdmin(request);

    const users = await User.find({ role: 'user' })
      .select('name email createdAt')
      .sort({ name: 1 });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: error.message || 'Unauthorized or server error' },
      { status: 401 }
    );
  }
}