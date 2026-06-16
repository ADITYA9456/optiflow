import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { hasMinimumRole, requireManager } from '@/middleware/auth';
import Task from '@/models/Task';
import Team from '@/models/Team';
import User from '@/models/User';

function getWeekStart(date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatWeek(date) {
  const d = new Date(date);
  const dayOfYear = (d - new Date(d.getFullYear(), 0, 1)) / 86400000;
  const week = Math.ceil((dayOfYear + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

export const GET = createHandler({
  rateLimit: { bucket: 'analytics-manager', limit: 60 },
  handler: async ({ request }) => {
    await dbConnect();
    const user = await requireManager(request);

    const teams = await Team.find({
      $or: [{ createdBy: user._id }, { teamLead: user._id }, { members: user._id }],
      isActive: true,
    }).select('_id name members');

    const teamIds = teams.map((t) => t._id);

    const taskFilter = hasMinimumRole(user.role, 'admin')
      ? {}
      : { $or: [{ createdBy: user._id }, { assignedTo: user._id }, { teamId: { $in: teamIds } }] };

    const tasks = await Task.find(taskFilter)
      .populate('assignedTo', 'name email role promotionScore visibilityScore')
      .sort({ createdAt: -1 })
      .limit(800);

    const userIdSet = new Set(
      tasks.map((t) => t.assignedTo?._id?.toString()).filter(Boolean)
    );
    const users = await User.find({ _id: { $in: Array.from(userIdSet) } }).select(
      'name email role promotionScore visibilityScore'
    );

    const statusBreakdown = { pending: 0, 'in-progress': 0, review: 0, blocked: 0, completed: 0 };
    const priorityBreakdown = { low: 0, medium: 0, high: 0, critical: 0 };
    const employeeMap = {};

    for (const task of tasks) {
      statusBreakdown[task.status] = (statusBreakdown[task.status] || 0) + 1;
      priorityBreakdown[task.priority] = (priorityBreakdown[task.priority] || 0) + 1;

      const assigneeId = task.assignedTo?._id?.toString();
      if (!assigneeId) continue;

      if (!employeeMap[assigneeId]) {
        employeeMap[assigneeId] = {
          userId: assigneeId,
          name: task.assignedTo?.name || 'Unknown',
          completed: 0,
          inProgress: 0,
          visibilityContribution: 0,
          promotionContribution: 0,
        };
      }
      if (task.status === 'completed') employeeMap[assigneeId].completed += 1;
      if (task.status === 'in-progress' || task.status === 'review') {
        employeeMap[assigneeId].inProgress += 1;
      }
      employeeMap[assigneeId].visibilityContribution += task.visibilityImpactScore || 0;
      employeeMap[assigneeId].promotionContribution += task.promotionImpactScore || 0;
    }

    const teamPerformance = Object.values(employeeMap)
      .map((e) => ({
        ...e,
        visibilityContribution: Math.round(e.visibilityContribution),
        promotionContribution: Math.round(e.promotionContribution),
      }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 8);

    const weeklyMap = {};
    for (const t of tasks) {
      if (!t.completedAt) continue;
      const weekKey = formatWeek(getWeekStart(t.completedAt));
      if (!weeklyMap[weekKey]) weeklyMap[weekKey] = { week: weekKey, completedTasks: 0, totalImpact: 0 };
      weeklyMap[weekKey].completedTasks += 1;
      weeklyMap[weekKey].totalImpact += t.businessImpactScore || 0;
    }
    const weeklyPerformance = Object.values(weeklyMap)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-6)
      .map((w) => ({
        ...w,
        avgImpact: w.completedTasks > 0 ? Math.round(w.totalImpact / w.completedTasks) : 0,
      }));

    const promotionInsights = users
      .map((u) => ({
        userId: u._id.toString(),
        name: u.name,
        role: u.role,
        promotionScore: u.promotionScore || 50,
        visibilityScore: u.visibilityScore || 50,
      }))
      .sort((a, b) => b.promotionScore - a.promotionScore)
      .slice(0, 6);

    const totalTasks = tasks.length;
    const completedTasks = statusBreakdown.completed || 0;

    return ok({
      totalTasks,
      completedTasks,
      inProgressTasks: (statusBreakdown['in-progress'] || 0) + (statusBreakdown.review || 0),
      blockedTasks: statusBreakdown.blocked || 0,
      teamCount: teams.length,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      statusBreakdown,
      priorityBreakdown,
      teamPerformance,
      weeklyPerformance,
      promotionInsights,
    });
  },
});
