import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { recordAudit } from '@/lib/audit';
import { notify } from '@/lib/notifications';
import { taskCommentSchema } from '@/lib/validation';
import { hasMinimumRole, requireAuth } from '@/middleware/auth';
import Task from '@/models/Task';

function userCanAccessTask(user, task) {
  if (!task) return false;
  if (hasMinimumRole(user.role, 'admin')) return true;
  const id = user._id.toString();
  return (
    task.createdBy?.toString() === id ||
    task.assignedTo?.toString() === id ||
    task.userId?.toString() === id
  );
}

export const GET = createHandler({
  rateLimit: { bucket: 'task-comments-get', limit: 120 },
  handler: async ({ request, context }) => {
    await dbConnect();
    const user = await requireAuth(request);
    const { id } = await context.params;
    const task = await Task.findById(id).populate('comments.userId', 'name email role');
    if (!task) return ok({ error: 'Task not found' }, 404);
    if (!userCanAccessTask(user, task)) return ok({ error: 'Access denied' }, 403);
    return ok({ comments: task.comments || [] });
  },
});

export const POST = createHandler({
  schema: taskCommentSchema,
  rateLimit: { bucket: 'task-comments-post', limit: 60 },
  handler: async ({ request, context, body }) => {
    await dbConnect();
    const user = await requireAuth(request);
    const { id } = await context.params;
    const task = await Task.findById(id);
    if (!task) return ok({ error: 'Task not found' }, 404);
    if (!userCanAccessTask(user, task)) return ok({ error: 'Access denied' }, 403);

    const comment = {
      userId: user._id,
      text: body.text,
      mentions: Array.isArray(body.mentions) ? body.mentions : [],
    };
    task.comments.push(comment);
    task.activity.push({
      actorId: user._id,
      type: 'comment',
      message: `${user.name} commented on the task`,
    });
    await task.save();

    const created = task.comments[task.comments.length - 1];

    const mentionTargets = new Set((comment.mentions || []).map((m) => String(m)));
    mentionTargets.delete(String(user._id));
    if (task.assignedTo && String(task.assignedTo) !== String(user._id)) {
      mentionTargets.add(String(task.assignedTo));
    }

    await Promise.all(
      Array.from(mentionTargets).map((userId) =>
        notify({
          userId,
          type: comment.mentions?.length ? 'mention' : 'task_comment',
          title: `${user.name} commented on "${task.title}"`,
          body: comment.text.slice(0, 140),
          link: `/tasks/${task._id}`,
        })
      )
    );

    await recordAudit({
      action: 'task.comment',
      actor: user,
      targetType: 'task',
      targetId: task._id,
      meta: { length: comment.text.length },
      request,
    });

    const populated = await Task.findById(task._id, { comments: { $slice: -1 } }).populate(
      'comments.userId',
      'name email role'
    );

    return ok({ comment: populated.comments[0] || created }, 201);
  },
});
