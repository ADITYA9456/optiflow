import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a team name'],
    maxlength: [100, 'Team name cannot be more than 100 characters'],
    trim: true,
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    trim: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  channels: [{
    name: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for better query performance
TeamSchema.index({ createdBy: 1 });
TeamSchema.index({ members: 1 });
TeamSchema.index({ teamLead: 1 });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);