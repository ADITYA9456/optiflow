import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_updated',
        'task_comment',
        'mention',
        'message',
        'admin_request',
        'admin_decision',
        'system',
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, default: '', maxlength: 500 },
    link: { type: String, default: '', maxlength: 300 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
