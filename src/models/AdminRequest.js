import mongoose from 'mongoose';

const AdminRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestedBy: {
    name: String,
    email: String,
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: Date,
  reviewNotes: String,
}, {
  timestamps: true,
});

// Index for efficient queries
AdminRequestSchema.index({ userId: 1, status: 1 });
AdminRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.AdminRequest || mongoose.model('AdminRequest', AdminRequestSchema);
