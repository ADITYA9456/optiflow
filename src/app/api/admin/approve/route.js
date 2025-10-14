import logger from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { requireOwner } from '@/middleware/auth';
import AdminRequest from '@/models/AdminRequest';
import User from '@/models/User';
import { NextResponse } from 'next/server';

// POST - Approve or reject admin request (owner only)
export async function POST(request) {
  const requestId = logger.generateRequestId();
  
  try {
    await dbConnect();
    const owner = await requireOwner(request);
    
    const { requestIdDb, action, notes } = await request.json();

    if (!requestIdDb || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Find the admin request
    const adminRequest = await AdminRequest.findById(requestIdDb).populate('userId');

    if (!adminRequest) {
      return NextResponse.json(
        { error: 'Admin request not found' },
        { status: 404 }
      );
    }

    if (adminRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 }
      );
    }

    // Update request status
    adminRequest.status = action === 'approve' ? 'approved' : 'rejected';
    adminRequest.reviewedBy = owner._id;
    adminRequest.reviewedAt = new Date();
    adminRequest.reviewNotes = notes || '';
    await adminRequest.save();

    // If approved, elevate user to admin
    if (action === 'approve') {
      const targetUser = await User.findById(adminRequest.userId);
      if (targetUser) {
        targetUser.role = 'admin';
        await targetUser.save();

        logger.info('User elevated to admin', {
          requestId,
          userId: targetUser._id.toString(),
          elevatedBy: owner._id.toString()
        });
      }
    }

    logger.info(`Admin request ${action}ed`, {
      requestId,
      requestIdDb: adminRequest._id.toString(),
      action,
      reviewedBy: owner._id.toString()
    });

    return NextResponse.json(
      {
        message: `Admin request ${action}ed successfully`,
        request: {
          id: adminRequest._id.toString(),
          status: adminRequest.status,
          reviewedAt: adminRequest.reviewedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Failed to process admin request', {
      requestId,
      error: error.message
    });

    if (error.message.includes('Owner access required')) {
      return NextResponse.json(
        { error: 'Owner access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
