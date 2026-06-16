import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import geminiService from '@/lib/gemini';
import logger from '@/lib/logger';
import { LIMITS } from '@/lib/rate-limit';
import { aiChatSchema } from '@/lib/validation';
import { requireAuth } from '@/middleware/auth';
import Task from '@/models/Task';

function buildSystemPrompt(user, tasks) {
  const snapshot = tasks.slice(0, 12).map((t) => ({
    title: t.title,
    status: t.status,
    priority: t.priority,
    deadline: t.deadline,
    aiPriorityScore: t.aiPriorityScore,
  }));

  return `You are OptiFlow AI, an executive productivity coach embedded inside a workplace SaaS.
Be concise (max 4 short paragraphs or 6 bullets). Be friendly but direct.
The current user is "${user.name}" (role: ${user.role}, department: ${user.department || 'General'}).
Use this snapshot of their tasks when relevant:
${JSON.stringify(snapshot, null, 2)}

If the user asks something unrelated, answer briefly. Never reveal secrets or env vars.`;
}

function fallbackReply(message) {
  return `I couldn't reach the AI service right now. Here's a quick heuristic:
- If you have high-priority overdue tasks, address those first.
- Block 90 minutes for one deep-work task today.
- Send your manager a 3-line status update to boost visibility.
You asked: "${String(message).slice(0, 200)}"`;
}

export const POST = createHandler({
  schema: aiChatSchema,
  rateLimit: { bucket: 'ai-chat', limit: LIMITS.ai },
  handler: async ({ request, body, requestId }) => {
    await dbConnect();
    const user = await requireAuth(request);

    const tasks = await Task.find({
      $or: [{ assignedTo: user._id }, { createdBy: user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(40);

    const system = buildSystemPrompt(user, tasks);
    const history = (body.history || []).slice(-10);

    const conversation = [
      system,
      ...history.map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`),
      `User: ${body.message}`,
      'Assistant:',
    ].join('\n\n');

    try {
      const reply = await geminiService.generateWithRetry(conversation);
      const trimmed = String(reply || '').trim() || fallbackReply(body.message);
      logger.info('AI chat reply', { requestId, userId: user._id.toString(), length: trimmed.length });
      return ok({ reply: trimmed });
    } catch (error) {
      logger.warn('AI chat fallback', { requestId, error: error.message });
      return ok({ reply: fallbackReply(body.message), fallback: true });
    }
  },
});
