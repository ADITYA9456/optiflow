import logger from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/middleware/auth';
import AdminRequest from '@/models/AdminRequest';
import { NextResponse } from 'next/server';

// GET - Fetch admin requests (only for owner)
export async function GET(request) {
  const requestId = logger.generateRequestId();
  
  try {
    await dbConnect();
    const user = await requireAuth(request);
    
    // Only owner can view requests
    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Owner access required' },
        { status: 403 }
      );
    }

    const requests = await AdminRequest.find({})
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    logger.info('Admin requests fetched', {
      requestId,
      count: requests.length
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    logger.error('Failed to fetch admin requests', {
      requestId,
      error: error.message
    });

    return NextResponse.json(
      { error: 'Unauthorized or server error' },
      { status: 401 }
    );
  }
}

// POST - Create admin elevation request
export async function POST(request) {
  const requestId = logger.generateRequestId();
  
  try {
    await dbConnect();
    const user = await requireAuth(request);
    
    // Check if user is already admin or owner
    if (user.role === 'admin' || user.role === 'owner') {
      return NextResponse.json(
        { error: 'You already have elevated privileges' },
        { status: 400 }
      );
    }

    const { reason } = await request.json();

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a detailed reason (minimum 10 characters)' },
        { status: 400 }
      );
    }

    // Check for pending requests
    const existingRequest = await AdminRequest.findOne({
      userId: user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending admin request' },
        { status: 400 }
      );
    }

    // Create new request
    const adminRequest = await AdminRequest.create({
      userId: user._id,
      requestedBy: {
        name: user.name,
        email: user.email,
      },
      reason: reason.trim(),
      status: 'pending',
    });

    logger.info('Admin elevation request created', {
      requestId,
      userId: user._id.toString(),
      requestIdDb: adminRequest._id.toString()
    });

    return NextResponse.json(
      {
        message: 'Admin request submitted successfully. The owner will review your request.',
        request: {
          id: adminRequest._id.toString(),
          status: adminRequest.status,
          createdAt: adminRequest.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create admin request', {
      requestId,
      error: error.message
    });

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
