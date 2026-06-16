import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { recordAudit } from '@/lib/audit';
import { userUpdateSchema } from '@/lib/validation';
import { hasMinimumRole, requireManager } from '@/middleware/auth';
import User from '@/models/User';

export const PUT = createHandler({
  schema: userUpdateSchema,
  rateLimit: { bucket: 'user-update', limit: 60 },
  handler: async ({ request, context, body }) => {
    await dbConnect();
    const actor = await requireManager(request);
    const { id } = await context.params;

    const target = await User.findById(id);
    if (!target) return ok({ error: 'User not found' }, 404);
    if (target.role === 'owner') {
      return ok({ error: 'Owner account cannot be modified from this endpoint' }, 403);
    }

    const update = {};
    if (body.department !== undefined) update.department = body.department || 'General';
    if (body.title !== undefined) update.title = body.title || 'Contributor';
    if (typeof body.visibilityScore === 'number') update.visibilityScore = body.visibilityScore;
    if (typeof body.promotionScore === 'number') update.promotionScore = body.promotionScore;
    if (typeof body.isActive === 'boolean') update.isActive = body.isActive;

    if (body.role) {
      if (!hasMinimumRole(actor.role, 'admin')) {
        return ok({ error: 'Only admin and owner can update roles' }, 403);
      }
      update.role = body.role;
    }

    const updated = await User.findByIdAndUpdate(id, update, { new: true })
      .select('name email role department title visibilityScore promotionScore isActive lastActiveAt createdAt');

    await recordAudit({
      action: 'user.update',
      actor,
      targetType: 'user',
      targetId: id,
      meta: { fields: Object.keys(update) },
      request,
    });

    return ok({ user: updated });
  },
});

export const DELETE = createHandler({
  rateLimit: { bucket: 'user-deactivate', limit: 30 },
  handler: async ({ request, context }) => {
    await dbConnect();
    const actor = await requireManager(request);
    const { id } = await context.params;

    const target = await User.findById(id);
    if (!target) return ok({ error: 'User not found' }, 404);
    if (target.role === 'owner') return ok({ error: 'Owner account cannot be removed' }, 403);

    target.isActive = false;
    await target.save();

    await recordAudit({
      action: 'user.deactivate',
      actor,
      targetType: 'user',
      targetId: id,
      meta: { email: target.email },
      request,
      severity: 'warn',
    });

    return ok({ message: 'User deactivated' });
  },
});
