import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { requireAdmin } from '@/middleware/auth';
import AdminRequest from '@/models/AdminRequest';
import AuditLog from '@/models/AuditLog';
import Notification from '@/models/Notification';
import Task from '@/models/Task';
import Team from '@/models/Team';
import User from '@/models/User';

export const GET = createHandler({
  rateLimit: { bucket: 'admin-stats', limit: 30 },
  handler: async ({ request }) => {
    await dbConnect();
    await requireAdmin(request);

    const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalTeams,
      totalTasks,
      completedTasks,
      blockedTasks,
      pendingAdminRequests,
      unreadNotifications,
      recentLogins,
      criticalEvents,
      roleBreakdownRaw,
      tasksByDay,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: { $ne: false } }),
      Team.countDocuments({ isActive: { $ne: false } }),
      Task.countDocuments({}),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'blocked' }),
      AdminRequest.countDocuments({ status: 'pending' }),
      Notification.countDocuments({ isRead: false }),
      AuditLog.countDocuments({ action: 'user.login.success', createdAt: { $gte: last7 } }),
      AuditLog.countDocuments({ severity: 'critical', createdAt: { $gte: last7 } }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Task.aggregate([
        { $match: { createdAt: { $gte: last7 } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            created: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const roleBreakdown = {};
    for (const row of roleBreakdownRaw) roleBreakdown[row._id || 'unknown'] = row.count;

    return ok({
      stats: {
        totalUsers,
        activeUsers,
        totalTeams,
        totalTasks,
        completedTasks,
        blockedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        pendingAdminRequests,
        unreadNotifications,
        recentLogins,
        criticalEvents,
      },
      roleBreakdown,
      tasksByDay: tasksByDay.map((row) => ({
        date: row._id,
        created: row.created,
        completed: row.completed,
      })),
    });
  },
});
