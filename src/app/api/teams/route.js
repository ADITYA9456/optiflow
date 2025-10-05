import dbConnect from '@/lib/mongodb';
import { requireAdmin, requireAuth } from '@/middleware/auth';
import Team from '@/models/Team';
import User from '@/models/User';
import { NextResponse } from 'next/server';

// GET all teams (admin only) or teams user is member of
export async function GET(request) {
  try {
    await dbConnect();
    
    const user = await requireAuth(request);
    let teams;

    if (user.role === 'admin') {
      // Admin can see all teams
      teams = await Team.find({ isActive: true })
        .populate('members', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Regular users can only see teams they are member of
      teams = await Team.find({ 
        members: user._id,
        isActive: true 
      })
        .populate('members', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ teams }, { status: 200 });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { error: error.message || 'Unauthorized or server error' },
      { status: 401 }
    );
  }
}

// CREATE a new team (admin only)
export async function POST(request) {
  try {
    await dbConnect();
    
    const admin = await requireAdmin(request);
    const { name, description, memberIds = [] } = await request.json();

    // Validate team name
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Check if team name already exists
    const existingTeam = await Team.findOne({ 
      name: name.trim(),
      isActive: true 
    });
    
    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team name already exists' },
        { status: 400 }
      );
    }

    // Validate member IDs
    if (memberIds.length > 0) {
      const validMembers = await User.find({ 
        _id: { $in: memberIds },
        role: 'user' // Only regular users can be team members
      });
      
      if (validMembers.length !== memberIds.length) {
        return NextResponse.json(
          { error: 'Some user IDs are invalid' },
          { status: 400 }
        );
      }
    }

    const team = await Team.create({
      name: name.trim(),
      description: description?.trim() || '',
      members: memberIds,
      createdBy: admin._id,
    });

    // Populate the created team
    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    return NextResponse.json(
      { 
        message: 'Team created successfully', 
        team: populatedTeam 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}