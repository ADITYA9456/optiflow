import { createHandler, ok } from '@/lib/api-handler';
import { requireAuth } from '@/middleware/auth';

export const GET = createHandler({
  rateLimit: { bucket: 'me', limit: 60 },
  handler: async ({ request }) => {
    const user = await requireAuth(request);
    return ok({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isOwner: !!user.isOwner,
        department: user.department || 'General',
        title: user.title || 'Contributor',
        avatarUrl: user.avatarUrl || '',
        visibilityScore: user.visibilityScore ?? 50,
        promotionScore: user.promotionScore ?? 50,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  },
});
