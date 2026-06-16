import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/middleware/auth';
import Task from '@/models/Task';

function average(arr, key) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((sum, t) => sum + (t[key] || 0), 0) / arr.length);
}

function buildScoreHistory(tasks, weeks = 6) {
  const buckets = [];
  const now = Date.now();
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const end = now - i * 7 * 24 * 60 * 60 * 1000;
    const start = end - 7 * 24 * 60 * 60 * 1000;
    const within = tasks.filter((t) => {
      const ts = new Date(t.completedAt || t.updatedAt || t.createdAt).getTime();
      return ts >= start && ts < end;
    });
    buckets.push({
      date: new Date(end).toISOString().slice(5, 10),
      promotion: within.length ? average(within, 'promotionImpactScore') : 0,
      visibility: within.length ? average(within, 'visibilityImpactScore') : 0,
    });
  }
  return buckets;
}

export const GET = createHandler({
  rateLimit: { bucket: 'analytics-employee', limit: 60 },
  handler: async ({ request }) => {
    await dbConnect();
    const user = await requireAuth(request);

    const tasks = await Task.find({
      $or: [{ assignedTo: user._id }, { userId: user._id }, { createdBy: user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(400);

    const completed = tasks.filter((t) => t.status === 'completed');
    const inProgress = tasks.filter((t) => t.status === 'in-progress' || t.status === 'review');
    const pending = tasks.filter((t) => t.status === 'pending');
    const blocked = tasks.filter((t) => t.status === 'blocked');

    const priorityBreakdown = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const t of tasks) priorityBreakdown[t.priority || 'medium'] += 1;

    const visibility = completed.length ? average(completed, 'visibilityImpactScore') : 50;
    const promotion = completed.length ? average(completed, 'promotionImpactScore') : 50;
    const momentumScore = Math.round((visibility + promotion) / 2);

    const highImpactOpenTasks = tasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => (b.aiPriorityScore || 0) - (a.aiPriorityScore || 0))
      .slice(0, 5)
      .map((t) => ({
        id: t._id.toString(),
        title: t.title,
        aiPriorityScore: t.aiPriorityScore,
        visibilityImpactScore: t.visibilityImpactScore,
        promotionImpactScore: t.promotionImpactScore,
        deadline: t.deadline,
        status: t.status,
      }));

    const recommendations = [];
    if (blocked.length > 0) recommendations.push('Clear blocked tasks first to protect delivery confidence this week.');
    if (pending.length > inProgress.length + 3) recommendations.push('Pending queue is growing. Pick top 3 by AI score and defer low-impact work.');
    if (promotion >= 70) recommendations.push('Promotion momentum is strong. Highlight high-impact outcomes in weekly updates.');
    else recommendations.push('Pick one high-visibility task this sprint to lift appraisal impact.');

    return ok({
      taskCounts: {
        total: tasks.length,
        pending: pending.length,
        inProgress: inProgress.length,
        completed: completed.length,
        blocked: blocked.length,
        completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
      },
      growth: {
        visibilityScore: visibility,
        promotionScore: promotion,
        momentumScore,
      },
      priorityBreakdown,
      scoreHistory: buildScoreHistory(tasks),
      highImpactOpenTasks,
      recommendations,
    });
  },
});
