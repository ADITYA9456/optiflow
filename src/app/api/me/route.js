import logger from '@/lib/logger';
import { requireAuth } from '@/middleware/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestId = logger.generateRequestId();
  
  try {
    // Get user from database (not from JWT claims)
    const user = await requireAuth(request);
    
    logger.info('User profile fetched', {
      requestId,
      userId: user._id.toString()
    });

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isOwner: user.isOwner || false,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Failed to fetch user profile', {
      requestId,
      error: error.message
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
