import dbConnect from '@/lib/mongodb';
import { requireAdmin } from '@/middleware/auth';
import Team from '@/models/Team';
import User from '@/models/User';
import { NextResponse } from 'next/server';

// UPDATE a team (admin only)
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const admin = await requireAdmin(request);
    const { id } = params;
    const { name, description, memberIds, isActive } = await request.json();

    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Validate team name if provided
    if (name && name.trim() !== team.name) {
      const existingTeam = await Team.findOne({ 
        name: name.trim(),
        isActive: true,
        _id: { $ne: id }
      });
      
      if (existingTeam) {
        return NextResponse.json(
          { error: 'Team name already exists' },
          { status: 400 }
        );
      }
    }

    // Validate member IDs if provided
    if (memberIds && Array.isArray(memberIds)) {
      const validMembers = await User.find({ 
        _id: { $in: memberIds },
        role: 'user'
      });
      
      if (validMembers.length !== memberIds.length) {
        return NextResponse.json(
          { error: 'Some user IDs are invalid' },
          { status: 400 }
        );
      }
    }

    // Update team
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || '';
    if (memberIds !== undefined) updateData.memberIds = memberIds;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    return NextResponse.json(
      { message: 'Team updated successfully', team: updatedTeam },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE a team (admin only)
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const admin = await requireAdmin(request);
    const { id } = params;

    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Soft delete - set isActive to false
    await Team.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json(
      { message: 'Team deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}