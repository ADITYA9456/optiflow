import dbConnect from '@/lib/mongodb';
import Suggestion from '@/models/Suggestion';
import Task from '@/models/Task';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

// Helper function to verify JWT token
const verifyToken = (request) => {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('No authorization header or invalid format');
    throw new Error('No valid token provided');
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    console.log('Token decoded successfully:', { userId: decoded.userId, role: decoded.role });
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw new Error('Invalid or expired token');
  }
};

// Mock AI service to generate workflow suggestions
const generateAISuggestions = async (tasks) => {
  // This is a mock implementation. In a real app, you'd call an actual AI API
  const suggestions = [];
  
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const highPriorityTasks = tasks.filter(task => task.priority === 'high');
  const overdueTasks = tasks.filter(task => new Date(task.deadline) < new Date());
  
  if (pendingTasks.length > 5) {
    suggestions.push({
      title: 'Task Overload Alert',
      description: `You have ${pendingTasks.length} pending tasks. Consider prioritizing the most important ones or delegating some tasks.`,
      category: 'productivity',
      impact: 'high'
    });
  }
  
  if (highPriorityTasks.length > 0) {
    suggestions.push({
      title: 'Focus on High Priority Tasks',
      description: `You have ${highPriorityTasks.length} high priority tasks. Consider working on these first to maximize impact.`,
      category: 'priority',
      impact: 'high'
    });
  }
  
  if (overdueTasks.length > 0) {
    suggestions.push({
      title: 'Overdue Tasks Attention',
      description: `You have ${overdueTasks.length} overdue tasks. Review deadlines and consider rescheduling or completing them urgently.`,
      category: 'time-management',
      impact: 'high'
    });
  }
  
  // Add some general productivity suggestions
  suggestions.push({
    title: 'Daily Planning Routine',
    description: 'Start each day by reviewing your tasks and setting priorities. This can improve productivity by up to 25%.',
    category: 'productivity',
    impact: 'medium'
  });

  suggestions.push({
    title: 'Break Large Tasks',
    description: 'Consider breaking down large tasks into smaller, manageable subtasks for better progress tracking.',
    category: 'productivity',
    impact: 'medium'
  });
  
  return suggestions;
};

// GET suggestions for the authenticated user
export async function GET(request) {
  try {
    await dbConnect();
    
    const decoded = verifyToken(request);
    
    // Validate and convert userId to ObjectId
    if (!decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid user ID in token' },
        { status: 401 }
      );
    }

    // Validate if userId is a valid ObjectId format before conversion
    let userObjectId;
    try {
      if (mongoose.Types.ObjectId.isValid(decoded.userId)) {
        userObjectId = new mongoose.Types.ObjectId(decoded.userId);
      } else {
        // If it's not a valid ObjectId, use the string directly
        userObjectId = decoded.userId;
      }
    } catch (error) {
      console.error('ObjectId conversion error:', error);
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    // Get user's tasks to analyze
    const tasks = await Task.find({ userId: userObjectId });
    
    // Generate AI suggestions based on tasks (mock implementation)
    const aiSuggestions = await generateAISuggestions(tasks);
    
    // Save new suggestions to database
    const savedSuggestions = [];
    for (const suggestionData of aiSuggestions) {
      // Check if suggestion already exists
      const existingSuggestion = await Suggestion.findOne({
        userId: userObjectId,
        title: suggestionData.title
      });
      
      if (!existingSuggestion) {
        const suggestion = await Suggestion.create({
          ...suggestionData,
          userId: userObjectId
        });
        savedSuggestions.push(suggestion);
      }
    }
    
    // Get all suggestions for the user
    const allSuggestions = await Suggestion.find({ userId: userObjectId })
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      suggestions: allSuggestions,
      newSuggestions: savedSuggestions.length 
    }, { status: 200 });
  } catch (error) {
    console.error('Get suggestions error:', error);
    console.error('Error stack:', error.stack);
    
    // Return more specific error messages
    if (error.message.includes('token')) {
      return NextResponse.json(
        { error: 'Authentication failed: ' + error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// Mark suggestion as implemented
export async function PUT(request) {
  try {
    await dbConnect();
    
    const decoded = verifyToken(request);
    const { suggestionId, isImplemented } = await request.json();

    // Validate and convert userId to ObjectId
    if (!decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid user ID in token' },
        { status: 401 }
      );
    }

    // Validate if userId is a valid ObjectId format before conversion
    let userObjectId;
    try {
      if (mongoose.Types.ObjectId.isValid(decoded.userId)) {
        userObjectId = new mongoose.Types.ObjectId(decoded.userId);
      } else {
        userObjectId = decoded.userId;
      }
    } catch (error) {
      console.error('ObjectId conversion error:', error);
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const suggestion = await Suggestion.findOneAndUpdate(
      { _id: suggestionId, userId: userObjectId },
      { isImplemented },
      { new: true }
    );

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Suggestion updated successfully', suggestion },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update suggestion error:', error);
    return NextResponse.json(
      { error: 'Unauthorized or server error' },
      { status: 401 }
    );
  }
}