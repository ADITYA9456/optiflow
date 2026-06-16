import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import dbConnect from '@/lib/mongodb';
import Channel from '@/models/Channel';
import Message from '@/models/Message';
import Team from '@/models/Team';
import User from '@/models/User';

export const config = {
  api: {
    bodyParser: false,
  },
};

const getCookieValue = (cookieHeader, name) => {
  if (!cookieHeader) return null;

  const cookieParts = cookieHeader.split(';');
  for (const part of cookieParts) {
    const [rawKey, ...rawValueParts] = part.trim().split('=');
    if (!rawKey) continue;
    if (rawKey === name) {
      const rawValue = rawValueParts.join('=');
      return rawValue ? decodeURIComponent(rawValue) : '';
    }
  }

  return null;
};

async function canAccessChannel(userId, channelId) {
  const channel = await Channel.findById(channelId).select('participants teamId');
  if (!channel) return false;

  const userIdStr = userId.toString();
  const participantIds = (channel.participants || []).map((participant) => participant.toString());
  if (participantIds.includes(userIdStr)) {
    return true;
  }

  if (!channel.teamId) {
    return false;
  }

  const team = await Team.findById(channel.teamId).select('members createdBy teamLead');
  if (!team) {
    return false;
  }

  if (team.createdBy?.toString() === userIdStr || team.teamLead?.toString() === userIdStr) {
    return true;
  }

  return (team.members || []).some((member) => member.toString() === userIdStr);
}

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      // Keep default path: /socket.io
      addTrailingSlash: false,
    });

    // Expose the io instance for App Router route handlers (best-effort).
    // This works reliably in a single long-running Node process (e.g. `next start`).
    globalThis.__optiflowSocketIO = io;

    io.use(async (socket, next) => {
      try {
        await dbConnect();

        const cookieHeader = socket.request.headers?.cookie || '';
        const token = getCookieValue(cookieHeader, 'auth-token');

        if (!token) {
          return next(new Error('Unauthorized'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('name email role isOwner');

        if (!user) {
          return next(new Error('Unauthorized'));
        }

        socket.data.user = {
          id: user._id.toString(),
          role: user.role,
          name: user.name,
          email: user.email,
          isOwner: !!user.isOwner,
        };

        return next();
      } catch {
        return next(new Error('Unauthorized'));
      }
    });

    io.on('connection', (socket) => {
      const user = socket.data.user;
      socket.join(`user:${user.id}`);

      socket.on('channel:join', async (channelId, ack) => {
        try {
          if (!channelId) {
            throw new Error('channelId is required');
          }

          const canAccess = await canAccessChannel(user.id, channelId);
          if (!canAccess) {
            throw new Error('Access denied');
          }

          socket.join(`channel:${channelId}`);
          ack?.({ ok: true });
        } catch (error) {
          ack?.({ ok: false, error: error.message || 'Unable to join channel' });
        }
      });

      socket.on('channel:leave', (channelId) => {
        if (!channelId) return;
        socket.leave(`channel:${channelId}`);
      });

      socket.on('message:send', async (payload, ack) => {
        try {
          const channelId = payload?.channelId;
          const content = payload?.content;
          const mentions = payload?.mentions;
          const attachments = payload?.attachments;

          if (!channelId) {
            throw new Error('channelId is required');
          }

          if (!content || String(content).trim().length === 0) {
            throw new Error('Message content is required');
          }

          const canAccess = await canAccessChannel(user.id, channelId);
          if (!canAccess) {
            throw new Error('Access denied');
          }

          const message = await Message.create({
            channelId,
            senderId: user.id,
            content: String(content).trim(),
            mentions: Array.isArray(mentions) ? mentions : [],
            attachments: Array.isArray(attachments) ? attachments.slice(0, 5) : [],
            readBy: [{ userId: user.id }],
          });

          const hydrated = await Message.findById(message._id).populate('senderId', 'name email role');
          const messagePayload = JSON.parse(JSON.stringify(hydrated));

          io.to(`channel:${channelId}`).emit('message:new', {
            message: messagePayload,
          });

          ack?.({ ok: true, message: messagePayload });
        } catch (error) {
          ack?.({ ok: false, error: error.message || 'Unable to send message' });
        }
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
