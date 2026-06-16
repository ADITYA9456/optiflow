import { createHandler, ok } from '@/lib/api-handler';
import logger from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { requireManager } from '@/middleware/auth';
import User from '@/models/User';

// GET all users (manager and above)
export const GET = createHandler({
  rateLimit: { bucket: 'users-list', limit: 120 },
  handler: async ({ request, requestId }) => {
    await dbConnect();

    await requireManager(request);

    const users = await User.find({ role: { $ne: 'owner' } })
      .select('name email role department title visibilityScore promotionScore isActive createdAt lastActiveAt')
      .sort({ name: 1 });

    logger.info('Users fetched', { requestId, count: users.length });

    return ok({ users });
  },
});