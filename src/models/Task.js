import mongoose from 'mongoose';

const AttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 200 },
    url: { type: String, required: true, maxlength: 1000 },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, _id: true }
);

const CommentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 1000 },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true, _id: true }
);

const ActivitySchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['create', 'update', 'status', 'assign', 'comment', 'attachment'],
      required: true,
    },
    message: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: true }
);

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 500 },
    deadline: { type: Date, required: true, index: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'review', 'blocked', 'completed'],
      default: 'pending',
      index: true,
    },
    boardColumn: {
      type: String,
      enum: ['backlog', 'todo', 'in-progress', 'review', 'done'],
      default: 'todo',
    },
    taskType: {
      type: String,
      enum: ['feature', 'bug', 'chore', 'research'],
      default: 'feature',
    },
    effortPoints: { type: Number, min: 1, max: 13, default: 3 },
    labels: [{ type: String, trim: true, maxlength: 24 }],

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    aiPriorityScore: { type: Number, min: 0, max: 100, default: 50, index: true },
    visibilityImpactScore: { type: Number, min: 0, max: 100, default: 50 },
    promotionImpactScore: { type: Number, min: 0, max: 100, default: 50 },
    businessImpactScore: { type: Number, min: 0, max: 100, default: 50 },
    productivityHint: { type: String, default: '', maxlength: 240 },

    startedAt: Date,
    completedAt: Date,

    attachments: [AttachmentSchema],
    comments: [CommentSchema],
    activity: [ActivitySchema],
  },
  { timestamps: true }
);

TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ teamId: 1, status: 1 });
TaskSchema.index({ deadline: 1, status: 1 });

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
