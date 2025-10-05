import dbConnect from '@/lib/mongodb';
import { requireAdmin, requireAuth } from '@/middleware/auth';
import Task from '@/models/Task';
import { NextResponse } from 'next/server';

// UPDATE a task
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const user = await requireAuth(request);
    const { id } = params;
    const updates = await request.json();

    // Find the task first
    const task = await Task.findById(id)
      .populate('teamId', 'members');

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check permissions
    let canUpdate = false;
    
    if (user.role === 'admin') {
      // Admin can update any task
      canUpdate = true;
    } else {
      // Regular users can only update tasks assigned to them or their teams
      if (task.assignedTo && task.assignedTo.toString() === user._id.toString()) {
        canUpdate = true;
      } else if (task.teamId && task.teamId.members.some(member => member.toString() === user._id.toString())) {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // For regular users, limit what they can update (only status)
    let allowedUpdates = updates;
    if (user.role !== 'admin') {
      allowedUpdates = { status: updates.status };
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      allowedUpdates,
      { new: true }
    )
      .populate('assignedTo', 'name email')
      .populate('teamId', 'name')
      .populate('createdBy', 'name email');

    return NextResponse.json(
      { message: 'Task updated successfully', task: updatedTask },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE a task (admin only)
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const admin = await requireAdmin(request);
    const { id } = params;

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}