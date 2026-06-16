import { createHandler, ok } from '@/lib/api-handler';
import logger from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { hasMinimumRole, requireAuth, requireManager } from '@/middleware/auth';
import Channel from '@/models/Channel';
import Team from '@/models/Team';
import User from '@/models/User';

// GET all teams (managers and above see all; others see only their own)
export const GET = createHandler({
  rateLimit: { bucket: 'teams-list', limit: 120 },
  handler: async ({ request, requestId }) => {
    await dbConnect();

    const user = await requireAuth(request);
    let teams;

    if (hasMinimumRole(user.role, 'manager')) {
      // Managers and above can see all teams.
      teams = await Team.find({ isActive: true })
        .populate('members', 'name email role')
        .populate('createdBy', 'name email role')
        .populate('teamLead', 'name email role')
        .sort({ createdAt: -1 });
    } else {
      // Employees can only see teams they are member of.
      teams = await Team.find({
        $or: [{ members: user._id }, { createdBy: user._id }, { teamLead: user._id }],
        isActive: true,
      })
        .populate('members', 'name email role')
        .populate('createdBy', 'name email role')
        .populate('teamLead', 'name email role')
        .sort({ createdAt: -1 });
    }

    logger.info('Teams fetched', {
      requestId,
      userId: user._id.toString(),
      role: user.role,
      count: teams.length,
    });

    return ok({ teams });
  },
});

// CREATE a new team (manager and above)
export const POST = createHandler({
  rateLimit: { bucket: 'team-create', limit: 60 },
  handler: async ({ request, requestId }) => {
    await dbConnect();

    const manager = await requireManager(request);

    let parsedBody;
    try {
      parsedBody = await request.json();
    } catch {
      return ok({ error: 'Request body must be valid JSON' }, 400);
    }
    const { name, description, memberIds = [], teamLead, channels = [] } = parsedBody || {};

    // Validate team name
    if (!name || name.trim().length === 0) {
      return ok({ error: 'Team name is required' }, 400);
    }

    // Check if team name already exists
    const existingTeam = await Team.findOne({
      name: name.trim(),
      isActive: true,
    });

    if (existingTeam) {
      return ok({ error: 'Team name already exists' }, 409);
    }

    // Validate member IDs
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      const validMembers = await User.find({
        _id: { $in: memberIds },
        role: { $in: ['employee', 'team_leader', 'manager', 'admin', 'owner', 'user'] },
      });

      if (validMembers.length !== memberIds.length) {
        return ok({ error: 'Some user IDs are invalid' }, 400);
      }
    }

    if (teamLead) {
      const validLead = await User.findById(teamLead).select('_id');
      if (!validLead) {
        return ok({ error: 'Invalid team lead selected' }, 400);
      }
    }

    const team = await Team.create({
      name: name.trim(),
      description: description?.trim() || '',
      members: memberIds,
      teamLead: teamLead || null,
      channels: Array.isArray(channels)
        ? channels
            .filter((channel) => channel?.name)
            .slice(0, 8)
            .map((channel) => ({
              name: String(channel.name).trim(),
              description: String(channel.description || '').trim(),
              isPrivate: !!channel.isPrivate,
            }))
        : [{ name: 'general', description: 'Default team channel', isPrivate: false }],
      createdBy: manager._id,
    });

    const channelConfigs = Array.isArray(team.channels) && team.channels.length > 0
      ? team.channels
      : [{ name: 'general', description: 'Default team channel', isPrivate: false }];

    const seenChannelNames = new Set();
    const normalizedTeamChannels = channelConfigs
      .filter((channel) => channel?.name)
      .slice(0, 8)
      .map((channel) => ({
        name: String(channel.name).trim().slice(0, 80),
        isPrivate: !!channel.isPrivate,
      }))
      .filter((channel) => channel.name.length >= 2)
      .filter((channel) => {
        const normalized = channel.name.toLowerCase();
        if (seenChannelNames.has(normalized)) return false;
        seenChannelNames.add(normalized);
        return true;
      });

    if (normalizedTeamChannels.length > 0) {
      try {
        await Channel.insertMany(
          normalizedTeamChannels.map((channel) => ({
            name: channel.name,
            type: 'team',
            teamId: team._id,
            participants: [],
            createdBy: manager._id,
            isPrivate: channel.isPrivate,
          }))
        );
      } catch (channelError) {
        logger.warn('Failed to create initial team channels', {
          requestId,
          teamId: team._id.toString(),
          error: channelError.message,
        });
      }
    }

    // Populate the created team
    const populatedTeam = await Team.findById(team._id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('teamLead', 'name email role');

    logger.info('Team created', {
      requestId,
      teamId: team._id.toString(),
      createdBy: manager._id.toString(),
      memberCount: Array.isArray(memberIds) ? memberIds.length : 0,
    });

    return ok({ message: 'Team created successfully', team: populatedTeam }, 201);
  },
});