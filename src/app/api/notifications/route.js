import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/middleware/auth';
import Notification from '@/models/Notification';

export const GET = createHandler({
  rateLimit: { bucket: 'notifications-list', limit: 120 },
  handler: async ({ request }) => {
    await dbConnect();
    const user = await requireAuth(request);
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || 30), 100);

    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    return ok({ notifications });
  },
});

export const PATCH = createHandler({
  rateLimit: { bucket: 'notifications-mark', limit: 120 },
  handler: async ({ request }) => {
    await dbConnect();
    const user = await requireAuth(request);
    let payload = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    if (payload?.markAll) {
      await Notification.updateMany({ userId: user._id, isRead: false }, { $set: { isRead: true } });
    } else if (payload?.id) {
      await Notification.updateOne(
        { _id: payload.id, userId: user._id },
        { $set: { isRead: true } }
      );
    }
    return ok({ ok: true });
  },
});
