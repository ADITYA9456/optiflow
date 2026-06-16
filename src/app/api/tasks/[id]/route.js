import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { recordAudit } from '@/lib/audit';
import { notify } from '@/lib/notifications';
import { taskUpdateSchema } from '@/lib/validation';
import { hasMinimumRole, requireAuth, requireManager } from '@/middleware/auth';
import Task from '@/models/Task';
import Team from '@/models/Team';

const STATUS_TO_COLUMN = {
  pending: 'todo',
  'in-progress': 'in-progress',
  review: 'review',
  blocked: 'backlog',
  completed: 'done',
};

const MANAGER_ONLY_FIELDS = new Set([
  'title',
  'description',
  'deadline',
  'priority',
  'assignedTo',
  'teamId',
  'taskType',
  'effortPoints',
  'labels',
]);

async function canUserAccessTask(user, task) {
  if (hasMinimumRole(user.role, 'admin')) return true;
  const id = user._id.toString();
  if (task.createdBy?.toString() === id) return true;
  if (task.assignedTo?.toString() === id) return true;
  if (task.userId?.toString() === id) return true;
  if (task.teamId) {
    const team = await Team.findById(task.teamId).select('members createdBy teamLead');
    if (team) {
      const memberIds = (team.members || []).map((m) => m.toString());
      if (
        memberIds.includes(id) ||
        team.createdBy?.toString() === id ||
        team.teamLead?.toString() === id
      ) {
        return true;
      }
    }
  }
  return false;
}

export const GET = createHandler({
  rateLimit: { bucket: 'task-get', limit: 240 },
  handler: async ({ request, context }) => {
    await dbConnect();
    const user = await requireAuth(request);
    const { id } = await context.params;
    const task = await Task.findById(id)
      .populate('assignedTo', 'name email role')
      .populate('teamId', 'name')
      .populate('createdBy', 'name email role')
      .populate('comments.userId', 'name email role')
      .populate('activity.actorId', 'name email');
    if (!task) return ok({ error: 'Task not found' }, 404);
    if (!(await canUserAccessTask(user, task))) return ok({ error: 'Access denied' }, 403);
    return ok({ task });
  },
});

export const PUT = createHandler({
  schema: taskUpdateSchema,
  rateLimit: { bucket: 'task-update', limit: 120 },
  handler: async ({ request, context, body }) => {
    await dbConnect();
    const user = await requireAuth(request);
    const { id } = await context.params;

    const task = await Task.findById(id);
    if (!task) return ok({ error: 'Task not found' }, 404);
    if (!(await canUserAccessTask(user, task))) return ok({ error: 'Access denied' }, 403);

    const isManager = hasMinimumRole(user.role, 'team_leader');
    const patch = {};
    const activityEntries = [];

    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue;
      if (!isManager && MANAGER_ONLY_FIELDS.has(key)) continue;
      patch[key] = value;
    }

    const prevStatus = task.status;
    const prevAssigned = task.assignedTo?.toString();

    if (patch.status && !patch.boardColumn) {
      patch.boardColumn = STATUS_TO_COLUMN[patch.status] || task.boardColumn;
    }
    if (patch.status === 'in-progress' && !task.startedAt) {
      patch.startedAt = new Date();
    }
    if (patch.status === 'completed') {
      patch.completedAt = new Date();
    }

    if (patch.status && patch.status !== prevStatus) {
      activityEntries.push({
        actorId: user._id,
        type: 'status',
        message: `${user.name} moved status from ${prevStatus} to ${patch.status}`,
      });
    }

    let newAssignedNotify = null;
    if (patch.assignedTo && String(patch.assignedTo) !== prevAssigned) {
      activityEntries.push({
        actorId: user._id,
        type: 'assign',
        message: `${user.name} reassigned the task`,
      });
      newAssignedNotify = String(patch.assignedTo);
    }

    Object.assign(task, patch);
    if (activityEntries.length > 0) task.activity.push(...activityEntries);
    await task.save();

    if (newAssignedNotify) {
      await notify({
        userId: newAssignedNotify,
        type: 'task_assigned',
        title: `You were assigned: ${task.title}`,
        body: task.description?.slice(0, 140),
        link: `/tasks/${task._id}`,
      });
    }

    await recordAudit({
      action: 'task.update',
      actor: user,
      targetType: 'task',
      targetId: task._id,
      meta: { fields: Object.keys(patch) },
      request,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email role')
      .populate('teamId', 'name')
      .populate('createdBy', 'name email role');

    return ok({ message: 'Task updated', task: populated });
  },
});

export const DELETE = createHandler({
  rateLimit: { bucket: 'task-delete', limit: 60 },
  handler: async ({ request, context }) => {
    await dbConnect();
    const manager = await requireManager(request);
    const { id } = await context.params;

    const task = await Task.findByIdAndDelete(id);
    if (!task) return ok({ error: 'Task not found' }, 404);

    await recordAudit({
      action: 'task.delete',
      actor: manager,
      targetType: 'task',
      targetId: id,
      meta: { title: task.title },
      request,
      severity: 'warn',
    });

    return ok({ message: 'Task deleted' });
  },
});
