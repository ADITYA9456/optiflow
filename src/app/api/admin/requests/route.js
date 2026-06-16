import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { recordAudit } from '@/lib/audit';
import { notify } from '@/lib/notifications';
import { adminRequestSchema } from '@/lib/validation';
import { requireAuth } from '@/middleware/auth';
import AdminRequest from '@/models/AdminRequest';
import User from '@/models/User';

export const GET = createHandler({
  rateLimit: { bucket: 'admin-req-list', limit: 60 },
  handler: async ({ request }) => {
    await dbConnect();
    const user = await requireAuth(request);
    if (user.role !== 'owner') return ok({ error: 'Owner access required' }, 403);

    const requests = await AdminRequest.find({})
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    return ok({ requests });
  },
});

export const POST = createHandler({
  schema: adminRequestSchema,
  rateLimit: { bucket: 'admin-req-create', limit: 10 },
  handler: async ({ request, body }) => {
    await dbConnect();
    const user = await requireAuth(request);

    if (user.role === 'admin' || user.role === 'owner') {
      return ok({ error: 'You already have elevated privileges' }, 400);
    }

    const existing = await AdminRequest.findOne({ userId: user._id, status: 'pending' });
    if (existing) return ok({ error: 'You already have a pending admin request' }, 400);

    const created = await AdminRequest.create({
      userId: user._id,
      requestedBy: { name: user.name, email: user.email },
      reason: body.reason,
      status: 'pending',
    });

    // Notify owner(s)
    const owners = await User.find({ isOwner: true }).select('_id');
    await Promise.all(
      owners.map((o) =>
        notify({
          userId: o._id,
          type: 'admin_request',
          title: `Admin access request from ${user.name}`,
          body: body.reason.slice(0, 140),
          link: '/admin',
        })
      )
    );

    await recordAudit({
      action: 'admin_request.create',
      actor: user,
      targetType: 'admin_request',
      targetId: created._id,
      request,
    });

    return ok(
      {
        message: 'Admin request submitted successfully. The owner will review your request.',
        request: { id: created._id.toString(), status: created.status, createdAt: created.createdAt },
      },
      201
    );
  },
});
