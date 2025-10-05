import dbConnect from '@/lib/mongodb';
import { requireAdmin, requireAuth } from '@/middleware/auth';
import Task from '@/models/Task';
import Team from '@/models/Team';
import { NextResponse } from 'next/server';

// GET tasks based on user role
export async function GET(request) {
  try {
    await dbConnect();
    
    const user = await requireAuth(request);
    let tasks;

    if (user.role === 'admin') {
      // Admin can see all tasks
      tasks = await Task.find()
        .populate('assignedTo', 'name email')
        .populate('teamId', 'name')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Regular users see tasks assigned to them or their teams
      const userTeams = await Team.find({ members: user._id }).select('_id');
      const teamIds = userTeams.map(team => team._id);

      tasks = await Task.find({
        $or: [
          { assignedTo: user._id },
          { teamId: { $in: teamIds } }
        ]
      })
        .populate('assignedTo', 'name email')
        .populate('teamId', 'name')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: error.message || 'Unauthorized or server error' },
      { status: 401 }
    );
  }
}

// CREATE a new task (admin only)
export async function POST(request) {
  try {
    await dbConnect();
    
    const admin = await requireAdmin(request);
    const { title, description, deadline, priority, assignedTo, teamId } = await request.json();

    // Validate assignment - must have either assignedTo or teamId
    if (!assignedTo && !teamId) {
      return NextResponse.json(
        { error: 'Task must be assigned to a user or team' },
        { status: 400 }
      );
    }

    // Validate team exists if teamId provided
    if (teamId) {
      const team = await Team.findById(teamId);
      if (!team || !team.isActive) {
        return NextResponse.json(
          { error: 'Invalid team selected' },
          { status: 400 }
        );
      }
    }

    const task = await Task.create({
      title,
      description,
      deadline,
      priority,
      userId: admin._id, // Keep for backward compatibility
      assignedTo: assignedTo || null,
      teamId: teamId || null,
      createdBy: admin._id,
    });

    // Populate the created task
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('teamId', 'name')
      .populate('createdBy', 'name email');

    return NextResponse.json(
      { message: 'Task created successfully', task: populatedTask },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}