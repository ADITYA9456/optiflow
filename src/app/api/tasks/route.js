import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { recordAudit } from '@/lib/audit';
import { notify } from '@/lib/notifications';
import { taskCreateSchema } from '@/lib/validation';
import { hasMinimumRole, requireAuth, requireManager } from '@/middleware/auth';
import Task from '@/models/Task';
import Team from '@/models/Team';

const PRIORITY_WEIGHT = { low: 35, medium: 55, high: 75, critical: 90 };
const STATUS_TO_COLUMN = {
  pending: 'todo',
  'in-progress': 'in-progress',
  review: 'review',
  blocked: 'backlog',
  completed: 'done',
};

function computeTaskIntelligence({ priority = 'medium', deadline, effortPoints = 3 }) {
  const dueDate = deadline ? new Date(deadline) : null;
  const now = new Date();

  let urgencyBoost = 0;
  if (dueDate && !Number.isNaN(dueDate.getTime())) {
    const diffInDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays <= 1) urgencyBoost = 20;
    else if (diffInDays <= 3) urgencyBoost = 12;
    else if (diffInDays <= 7) urgencyBoost = 6;
  }

  const effortPenalty = Math.min((Number(effortPoints || 3) - 1) * 2, 12);
  const basePriority = PRIORITY_WEIGHT[priority] || PRIORITY_WEIGHT.medium;

  const aiPriorityScore = Math.max(15, Math.min(100, basePriority + urgencyBoost - effortPenalty));
  const visibilityImpactScore = Math.max(20, Math.min(100, Math.round(aiPriorityScore * 0.9 + 8)));
  const promotionImpactScore = Math.max(
    20,
    Math.min(100, Math.round(aiPriorityScore * 0.75 + visibilityImpactScore * 0.2))
  );
  const businessImpactScore = Math.max(20, Math.min(100, Math.round(aiPriorityScore * 0.85 + 10)));

  let productivityHint = 'Plan this task in a focused time block and provide progress updates.';
  if (aiPriorityScore >= 85) {
    productivityHint = 'This is a high-visibility task. Share updates early and unblock fast.';
  } else if (aiPriorityScore >= 70) {
    productivityHint = 'Prioritize this in the first half of the sprint to keep momentum.';
  }

  return { aiPriorityScore, visibilityImpactScore, promotionImpactScore, businessImpactScore, productivityHint };
}

async function buildTaskQueryForUser(user) {
  if (hasMinimumRole(user.role, 'admin')) return {};

  if (hasMinimumRole(user.role, 'team_leader')) {
    const managedTeams = await Team.find({
      $or: [{ createdBy: user._id }, { teamLead: user._id }, { members: user._id }],
      isActive: true,
    }).select('_id');
    const ids = managedTeams.map((t) => t._id);
    return { $or: [{ createdBy: user._id }, { assignedTo: user._id }, { teamId: { $in: ids } }] };
  }

  const memberTeams = await Team.find({ members: user._id, isActive: true }).select('_id');
  const teamIds = memberTeams.map((t) => t._id);
  return {
    $or: [
      { assignedTo: user._id },
      { userId: user._id },
      { createdBy: user._id },
      { teamId: { $in: teamIds } },
    ],
  };
}

export const GET = createHandler({
  rateLimit: { bucket: 'tasks-list', limit: 240 },
  handler: async ({ request }) => {
    await dbConnect();
    const user = await requireAuth(request);
    const baseFilter = await buildTaskQueryForUser(user);

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const boardColumn = url.searchParams.get('boardColumn');
    const priority = url.searchParams.get('priority');
    const teamId = url.searchParams.get('teamId');

    const filter = {
      ...baseFilter,
      ...(status ? { status } : {}),
      ...(boardColumn ? { boardColumn } : {}),
      ...(priority ? { priority } : {}),
      ...(teamId ? { teamId } : {}),
    };

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('teamId', 'name')
      .populate('createdBy', 'name email role')
      .select('-comments -activity -attachments')
      .sort({ aiPriorityScore: -1, deadline: 1, createdAt: -1 });

    return ok({ tasks });
  },
});

export const POST = createHandler({
  schema: taskCreateSchema,
  rateLimit: { bucket: 'tasks-create', limit: 60 },
  handler: async ({ request, body }) => {
    await dbConnect();
    const creator = await requireManager(request);

    if (!body.assignedTo && !body.teamId) {
      return ok({ error: 'Task must be assigned to a user or team' }, 400);
    }

    if (body.teamId) {
      const team = await Team.findById(body.teamId).select('members createdBy teamLead isActive');
      if (!team || !team.isActive) {
        return ok({ error: 'Invalid team selected' }, 400);
      }
      if (!hasMinimumRole(creator.role, 'admin')) {
        const id = creator._id.toString();
        const inTeam =
          team.createdBy?.toString() === id ||
          team.teamLead?.toString() === id ||
          (team.members || []).some((m) => m.toString() === id);
        if (!inTeam) return ok({ error: 'You can create tasks only for teams you lead or belong to' }, 403);
      }
    }

    const intel = computeTaskIntelligence({
      priority: body.priority,
      deadline: body.deadline,
      effortPoints: body.effortPoints,
    });

    const task = await Task.create({
      title: body.title,
      description: body.description,
      deadline: body.deadline,
      priority: body.priority || 'medium',
      status: 'pending',
      boardColumn: STATUS_TO_COLUMN.pending,
      taskType: body.taskType || 'feature',
      effortPoints: Number(body.effortPoints || 3),
      labels: Array.isArray(body.labels) ? body.labels.slice(0, 8) : [],
      userId: body.assignedTo || creator._id,
      assignedTo: body.assignedTo || null,
      teamId: body.teamId || null,
      createdBy: creator._id,
      ...intel,
      activity: [{ actorId: creator._id, type: 'create', message: `${creator.name} created the task` }],
    });

    if (body.assignedTo && String(body.assignedTo) !== creator._id.toString()) {
      await notify({
        userId: body.assignedTo,
        type: 'task_assigned',
        title: `New task assigned: ${task.title}`,
        body: task.description?.slice(0, 140),
        link: `/tasks/${task._id}`,
      });
    }

    await recordAudit({
      action: 'task.create',
      actor: creator,
      targetType: 'task',
      targetId: task._id,
      meta: { assignedTo: body.assignedTo || null, teamId: body.teamId || null, priority: body.priority },
      request,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('teamId', 'name')
      .populate('createdBy', 'name email role');

    return ok({ message: 'Task created', task: populated }, 201);
  },
});
