import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { notify } from '@/lib/notifications';
import { messageSchema } from '@/lib/validation';
import { requireAuth } from '@/middleware/auth';
import Channel from '@/models/Channel';
import Message from '@/models/Message';
import Team from '@/models/Team';

async function canAccessChannel(userId, channelId) {
  const channel = await Channel.findById(channelId).select('participants teamId type');
  if (!channel) return { ok: false, channel: null };
  const id = userId.toString();

  const participantIds = (channel.participants || []).map((p) => p.toString());
  if (participantIds.includes(id)) return { ok: true, channel };
  if (!channel.teamId) return { ok: false, channel: null };

  const team = await Team.findById(channel.teamId).select('members createdBy teamLead');
  if (!team) return { ok: false, channel: null };

  const inTeam =
    team.createdBy?.toString() === id ||
    team.teamLead?.toString() === id ||
    (team.members || []).some((m) => m.toString() === id);
  return { ok: inTeam, channel };
}

export const GET = createHandler({
  rateLimit: { bucket: 'chat-messages-get', limit: 240 },
  handler: async ({ request }) => {
    await dbConnect();
    const user = await requireAuth(request);
    const url = new URL(request.url);
    const channelId = url.searchParams.get('channelId');
    if (!channelId) return ok({ error: 'channelId query parameter is required' }, 400);

    const access = await canAccessChannel(user._id, channelId);
    if (!access.ok) return ok({ error: 'Access denied for this channel' }, 403);

    const messages = await Message.find({ channelId })
      .populate('senderId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);

    return ok({ messages: messages.reverse() });
  },
});

export const POST = createHandler({
  schema: messageSchema,
  rateLimit: { bucket: 'chat-messages-post', limit: 120 },
  handler: async ({ request, body }) => {
    await dbConnect();
    const user = await requireAuth(request);

    const access = await canAccessChannel(user._id, body.channelId);
    if (!access.ok) return ok({ error: 'Access denied for this channel' }, 403);

    const message = await Message.create({
      channelId: body.channelId,
      senderId: user._id,
      content: body.content,
      mentions: Array.isArray(body.mentions) ? body.mentions : [],
      attachments: [],
      readBy: [{ userId: user._id }],
    });

    const hydrated = await Message.findById(message._id).populate('senderId', 'name email role');

    // Broadcast via socket.io (best-effort)
    const io = globalThis.__optiflowSocketIO;
    if (io) {
      io.to(`channel:${body.channelId}`).emit('message:new', {
        message: JSON.parse(JSON.stringify(hydrated)),
      });
    }

    // Send notifications: mentions + DM-recipient
    const channel = access.channel;
    const notified = new Set();
    if (Array.isArray(body.mentions)) {
      for (const m of body.mentions) {
        const key = String(m);
        if (key === user._id.toString()) continue;
        if (notified.has(key)) continue;
        notified.add(key);
        await notify({
          userId: m,
          type: 'mention',
          title: `${user.name} mentioned you in #${channel.name || 'channel'}`,
          body: body.content.slice(0, 140),
          link: '/chat',
        });
      }
    }
    if (channel.type === 'direct') {
      for (const p of channel.participants || []) {
        const key = String(p);
        if (key === user._id.toString() || notified.has(key)) continue;
        notified.add(key);
        await notify({
          userId: p,
          type: 'message',
          title: `New message from ${user.name}`,
          body: body.content.slice(0, 140),
          link: '/chat',
        });
      }
    }

    return ok({ message: hydrated }, 201);
  },
});
