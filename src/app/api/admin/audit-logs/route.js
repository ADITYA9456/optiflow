import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { requireAdmin } from '@/middleware/auth';
import AuditLog from '@/models/AuditLog';

export const GET = createHandler({
  rateLimit: { bucket: 'audit-logs', limit: 60 },
  handler: async ({ request }) => {
    await dbConnect();
    await requireAdmin(request);

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500);
    const action = url.searchParams.get('action');
    const severity = url.searchParams.get('severity');

    const filter = {};
    if (action) filter.action = action;
    if (severity) filter.severity = severity;

    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit);
    return ok({ logs });
  },
});
