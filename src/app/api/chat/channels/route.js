import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { channelSchema } from '@/lib/validation';
import { hasMinimumRole, requireAuth } from '@/middleware/auth';
import Channel from '@/models/Channel';
import Team from '@/models/Team';

async function ensureTeamChannels(user, teamIds, teams) {
  if (teamIds.length === 0) return;
  try {
    const existing = await Channel.find({ teamId: { $in: teamIds }, type: 'team' }).select('teamId name');
    const existingMap = new Map();
    for (const ch of existing) {
      const k = ch.teamId.toString();
      const set = existingMap.get(k) || new Set();
      set.add(String(ch.name).toLowerCase());
      existingMap.set(k, set);
    }

    const toCreate = [];
    for (const team of teams) {
      const key = team._id.toString();
      const existingSet = existingMap.get(key) || new Set();
      const configs =
        Array.isArray(team.channels) && team.channels.length > 0
          ? team.channels
          : [{ name: 'general', description: 'Default team channel', isPrivate: false }];

      const seen = new Set();
      for (const cfg of configs.slice(0, 8)) {
        const safe = String(cfg?.name || '').trim().slice(0, 80);
        if (!safe || safe.length < 2) continue;
        const norm = safe.toLowerCase();
        if (seen.has(norm) || existingSet.has(norm)) continue;
        seen.add(norm);
        toCreate.push({
          name: safe,
          type: 'team',
          teamId: team._id,
          participants: [],
          createdBy: team.createdBy || user._id,
          isPrivate: !!cfg.isPrivate,
        });
      }
    }
    if (toCreate.length > 0) await Channel.insertMany(toCreate);
  } catch {
    // best-effort
  }
}

export const GET = createHandler({
  rateLimit: { bucket: 'channels-list', limit: 120 },
  handler: async ({ request }) => {
    await dbConnect();
    const user = await requireAuth(request);

    const teams = await Team.find({
      $or: [{ members: user._id }, { createdBy: user._id }, { teamLead: user._id }],
      isActive: true,
    }).select('_id channels createdBy');
    const teamIds = teams.map((t) => t._id);

    await ensureTeamChannels(user, teamIds, teams);

    const channels = await Channel.find({
      $or: [{ participants: user._id }, { teamId: { $in: teamIds } }],
    })
      .populate('teamId', 'name')
      .populate('participants', 'name email role')
      .sort({ updatedAt: -1 })
      .limit(100);

    return ok({ channels });
  },
});

export const POST = createHandler({
  schema: channelSchema,
  rateLimit: { bucket: 'channels-create', limit: 30 },
  handler: async ({ request, body }) => {
    await dbConnect();
    const user = await requireAuth(request);
    const { name, type = 'team', teamId, participants = [], isPrivate = false } = body;

    if (type === 'team' && !hasMinimumRole(user.role, 'team_leader')) {
      return ok({ error: 'Only team leads and above can create team channels' }, 403);
    }

    if (type === 'team') {
      if (!teamId) return ok({ error: 'teamId is required for team channels' }, 400);
      const team = await Team.findById(teamId).select('members createdBy teamLead isActive');
      if (!team || !team.isActive) return ok({ error: 'Invalid team selected' }, 400);

      if (!hasMinimumRole(user.role, 'admin')) {
        const id = user._id.toString();
        const allowed =
          team.createdBy?.toString() === id ||
          team.teamLead?.toString() === id ||
          (team.members || []).some((m) => m.toString() === id);
        if (!allowed) return ok({ error: 'You can create channels only for teams you belong to' }, 403);
      }
    }

    const uniqueParticipants = Array.isArray(participants)
      ? [...new Set([user._id.toString(), ...participants])]
      : [user._id.toString()];

    const channel = await Channel.create({
      name: String(name).trim(),
      type,
      teamId: teamId || null,
      participants: uniqueParticipants,
      createdBy: user._id,
      isPrivate: !!isPrivate,
    });

    const hydrated = await Channel.findById(channel._id).populate('teamId', 'name');
    return ok({ channel: hydrated }, 201);
  },
});
