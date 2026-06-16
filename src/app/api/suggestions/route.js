import { createHandler, ok } from '@/lib/api-handler';
import geminiService from '@/lib/gemini';
import logger from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { LIMITS } from '@/lib/rate-limit';
import { requireAuth } from '@/middleware/auth';
import Suggestion from '@/models/Suggestion';
import Task from '@/models/Task';

export const GET = createHandler({
  rateLimit: { bucket: 'suggestions-get', limit: LIMITS.ai },
  handler: async ({ request }) => {
    await dbConnect();
    const user = await requireAuth(request);

    const tasks = await Task.find({
      $or: [{ assignedTo: user._id }, { userId: user._id }, { createdBy: user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(80);

    const aiSuggestions = await geminiService.generateTaskSuggestions(tasks);

    if (Array.isArray(aiSuggestions) && aiSuggestions.length > 0) {
      const ops = aiSuggestions.map((s) => ({
        updateOne: {
          filter: { userId: user._id, title: s.title },
          update: {
            $setOnInsert: { ...s, userId: user._id, createdAt: new Date() },
            $set: { description: s.description, category: s.category, impact: s.impact },
          },
          upsert: true,
        },
      }));
      try {
        await Suggestion.bulkWrite(ops);
      } catch (writeError) {
        logger.warn('Failed to persist AI suggestions', { error: writeError.message });
      }
    }

    const suggestions = await Suggestion.find({ userId: user._id }).sort({ createdAt: -1 });
    return ok({ suggestions });
  },
});

export const PUT = createHandler({
  rateLimit: { bucket: 'suggestions-update', limit: 60 },
  handler: async ({ request }) => {
    await dbConnect();
    const user = await requireAuth(request);
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const { suggestionId, isImplemented } = body;
    if (!suggestionId) return ok({ error: 'Suggestion id is required' }, 400);

    const suggestion = await Suggestion.findOneAndUpdate(
      { _id: suggestionId, userId: user._id },
      { isImplemented: !!isImplemented },
      { new: true }
    );
    if (!suggestion) return ok({ error: 'Suggestion not found' }, 404);

    return ok({ message: 'Suggestion updated', suggestion });
  },
});
