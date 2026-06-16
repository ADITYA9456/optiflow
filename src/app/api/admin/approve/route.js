import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { recordAudit } from '@/lib/audit';
import { notify } from '@/lib/notifications';
import { adminApproveSchema } from '@/lib/validation';
import { requireOwner } from '@/middleware/auth';
import AdminRequest from '@/models/AdminRequest';
import User from '@/models/User';

export const POST = createHandler({
  schema: adminApproveSchema,
  rateLimit: { bucket: 'admin-approve', limit: 30 },
  handler: async ({ request, body }) => {
    await dbConnect();
    const owner = await requireOwner(request);
    const { requestIdDb, action, notes } = body;

    const req = await AdminRequest.findById(requestIdDb).populate('userId');
    if (!req) return ok({ error: 'Admin request not found' }, 404);
    if (req.status !== 'pending') return ok({ error: 'This request has already been processed' }, 400);

    req.status = action === 'approve' ? 'approved' : 'rejected';
    req.reviewedBy = owner._id;
    req.reviewedAt = new Date();
    req.reviewNotes = notes || '';
    await req.save();

    let elevatedUserId = null;
    if (action === 'approve') {
      const target = await User.findById(req.userId);
      if (target) {
        target.role = 'admin';
        await target.save();
        elevatedUserId = target._id;
      }
    }

    if (req.userId?._id || elevatedUserId) {
      await notify({
        userId: elevatedUserId || req.userId._id,
        type: 'admin_decision',
        title: action === 'approve' ? 'Your admin request was approved' : 'Your admin request was rejected',
        body: notes || '',
        link: '/dashboard',
      });
    }

    await recordAudit({
      action: action === 'approve' ? 'admin_request.approve' : 'admin_request.reject',
      actor: owner,
      targetType: 'admin_request',
      targetId: req._id,
      meta: { notes: notes || '', userId: elevatedUserId?.toString() || null },
      request,
      severity: action === 'approve' ? 'warn' : 'info',
    });

    return ok({
      message: `Admin request ${action}d successfully`,
      request: { id: req._id.toString(), status: req.status, reviewedAt: req.reviewedAt },
    });
  },
});
