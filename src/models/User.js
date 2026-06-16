import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 60, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 6, select: false },

    role: {
      type: String,
      enum: ['owner', 'admin', 'manager', 'team_leader', 'employee'],
      default: 'employee',
      index: true,
    },
    isOwner: { type: Boolean, default: false },

    department: { type: String, trim: true, default: 'General' },
    title: { type: String, trim: true, default: 'Contributor' },
    avatarUrl: { type: String, default: '' },

    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    visibilityScore: { type: Number, min: 0, max: 100, default: 50 },
    promotionScore: { type: Number, min: 0, max: 100, default: 50 },

    lastActiveAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.pre('validate', function (next) {
  if (this.role === 'user') this.role = 'employee';
  next();
});

UserSchema.index({ managerId: 1 });
UserSchema.index(
  { isOwner: 1 },
  { unique: true, partialFilterExpression: { isOwner: true }, sparse: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
