import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { recordAudit } from '@/lib/audit';
import { requireManager } from '@/middleware/auth';
import Channel from '@/models/Channel';
import Team from '@/models/Team';
import User from '@/models/User';

export const PUT = createHandler({
  rateLimit: { bucket: 'team-update', limit: 60 },
  handler: async ({ request, context }) => {
    await dbConnect();
    const manager = await requireManager(request);
    const { id } = await context.params;

    let body;
    try {
      body = await request.json();
    } catch {
      return ok({ error: 'Invalid JSON' }, 400);
    }

    const { name, description, memberIds, isActive, teamLead, channels } = body || {};

    const team = await Team.findById(id);
    if (!team) return ok({ error: 'Team not found' }, 404);

    if (name && name.trim() !== team.name) {
      const dup = await Team.findOne({ name: name.trim(), isActive: true, _id: { $ne: id } });
      if (dup) return ok({ error: 'Team name already exists' }, 409);
    }

    if (Array.isArray(memberIds)) {
      const valid = await User.find({ _id: { $in: memberIds } }).select('_id');
      if (valid.length !== memberIds.length) {
        return ok({ error: 'Some user IDs are invalid' }, 400);
      }
    }

    if (teamLead) {
      const leadUser = await User.findById(teamLead).select('_id');
      if (!leadUser) return ok({ error: 'Invalid team lead user' }, 400);
    }

    const update = {};
    if (name) update.name = String(name).trim();
    if (description !== undefined) update.description = String(description || '').trim();
    if (memberIds !== undefined) update.members = memberIds;
    if (teamLead !== undefined) update.teamLead = teamLead || null;
    if (isActive !== undefined) update.isActive = !!isActive;
    if (Array.isArray(channels)) {
      update.channels = channels
        .filter((c) => c?.name)
        .slice(0, 10)
        .map((c) => ({
          name: String(c.name).trim().slice(0, 80),
          description: String(c.description || '').trim().slice(0, 200),
          isPrivate: !!c.isPrivate,
        }));
    }

    const updated = await Team.findByIdAndUpdate(id, update, { new: true })
      .populate('members', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('teamLead', 'name email role');

    if (Array.isArray(channels) && updated) {
      const existing = await Channel.find({ teamId: id, type: 'team' }).select('name');
      const existingSet = new Set(existing.map((c) => String(c.name).toLowerCase()));
      const toCreate = (update.channels || [])
        .filter((c) => !existingSet.has(c.name.toLowerCase()))
        .map((c) => ({
          name: c.name,
          type: 'team',
          teamId: id,
          participants: [],
          createdBy: manager._id,
          isPrivate: c.isPrivate,
        }));
      if (toCreate.length > 0) {
        try {
          await Channel.insertMany(toCreate);
        } catch {
          // best-effort
        }
      }
    }

    await recordAudit({ action: 'team.update', actor: manager, targetType: 'team', targetId: id, request });

    return ok({ message: 'Team updated', team: updated });
  },
});

export const DELETE = createHandler({
  rateLimit: { bucket: 'team-delete', limit: 30 },
  handler: async ({ request, context }) => {
    await dbConnect();
    const manager = await requireManager(request);
    const { id } = await context.params;

    const team = await Team.findById(id);
    if (!team) return ok({ error: 'Team not found' }, 404);

    team.isActive = false;
    await team.save();

    await recordAudit({
      action: 'team.delete',
      actor: manager,
      targetType: 'team',
      targetId: id,
      meta: { name: team.name },
      request,
      severity: 'warn',
    });

    return ok({ message: 'Team deactivated' });
  },
});
