import mongoose from 'mongoose';

const SuggestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['productivity', 'time-management', 'priority', 'automation'],
    default: 'productivity',
  },
  impact: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isImplemented: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Suggestion || mongoose.model('Suggestion', SuggestionSchema);