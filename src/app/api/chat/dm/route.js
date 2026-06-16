import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { directChannelSchema } from '@/lib/validation';
import { requireAuth } from '@/middleware/auth';
import Channel from '@/models/Channel';
import User from '@/models/User';

export const POST = createHandler({
  schema: directChannelSchema,
  rateLimit: { bucket: 'chat-dm', limit: 60 },
  handler: async ({ request, body }) => {
    await dbConnect();
    const me = await requireAuth(request);
    const otherId = body.participantId;

    if (String(otherId) === me._id.toString()) {
      return ok({ error: 'Cannot start a DM with yourself' }, 400);
    }

    const other = await User.findById(otherId).select('name email');
    if (!other) return ok({ error: 'User not found' }, 404);

    let channel = await Channel.findOne({
      type: 'direct',
      participants: { $all: [me._id, otherId], $size: 2 },
    });

    if (!channel) {
      const name = `DM: ${me.name} ↔ ${other.name}`.slice(0, 80);
      channel = await Channel.create({
        name,
        type: 'direct',
        teamId: null,
        participants: [me._id, otherId],
        createdBy: me._id,
        isPrivate: true,
      });
    }

    return ok({ channel });
  },
});
