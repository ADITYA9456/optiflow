import { createHandler, ok } from '@/lib/api-handler';
import geminiService from '@/lib/gemini';
import logger from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { LIMITS } from '@/lib/rate-limit';
import { requireAuth } from '@/middleware/auth';
import Task from '@/models/Task';

function fallbackInsights(tasks) {
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress' || t.status === 'review').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;
  return {
    summary: `You completed ${completed} task(s), currently progressing ${inProgress}, and have ${blocked} blocked item(s).`,
    recommendations: [
      blocked > 0
        ? 'Resolve blockers first to unlock team throughput.'
        : 'Keep momentum by closing one medium-size task each day.',
      'Share one impact update with your manager to improve visibility score.',
      'Batch similar tasks to reduce context-switch cost.',
    ],
  };
}

export const GET = createHandler({
  rateLimit: { bucket: 'ai-insights', limit: LIMITS.ai },
  handler: async ({ request, requestId }) => {
    await dbConnect();
    const user = await requireAuth(request);

    const tasks = await Task.find({
      $or: [{ assignedTo: user._id }, { userId: user._id }, { createdBy: user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(60);

    const prompt = `You are an AI productivity coach for OptiFlow AI.
Generate a concise weekly summary (1-3 sentences) and exactly three actionable recommendations based on the user task data.
Return STRICT JSON only with the shape:
{"summary": "string", "recommendations": ["string", "string", "string"]}

Task data:
${JSON.stringify(
  tasks.slice(0, 30).map((t) => ({
    title: t.title,
    priority: t.priority,
    status: t.status,
    deadline: t.deadline,
    aiPriorityScore: t.aiPriorityScore,
    promotionImpactScore: t.promotionImpactScore,
    visibilityImpactScore: t.visibilityImpactScore,
  })),
  null,
  2
)}`;

    try {
      const text = await geminiService.generateWithRetry(prompt);
      const cleaned = String(text || '').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (!parsed.summary || !Array.isArray(parsed.recommendations)) {
        throw new Error('Incomplete AI response');
      }
      return ok({
        summary: parsed.summary,
        recommendations: parsed.recommendations.slice(0, 3),
      });
    } catch (error) {
      logger.warn('AI insights fallback', { requestId, error: error.message });
      return ok({ ...fallbackInsights(tasks), fallback: true });
    }
  },
});
