import { createHandler, ok } from '@/lib/api-handler';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/middleware/auth';
import Task from '@/models/Task';

/**
 * Heuristic-based promotion + hike predictor.
 *
 * Inputs:
 *  - Recent completed tasks (last 90 days)
 *  - Average visibility / promotion impact scores
 *  - Completion rate
 *  - Streak (consecutive weeks with closures)
 *
 * Output:
 *  - promotionReadiness: 0-100
 *  - estimatedHikePercent: 0-30 (band, never absolute)
 *  - confidence: "low" | "medium" | "high"
 *  - factors: human-readable reasons
 *  - nextActions: 3 prescriptive moves
 *
 * NOTE: this is intentionally explainable, not a black-box ML model — perfect
 * for SaaS demos and trust-building with users.
 */
function calculate(tasks) {
  if (!tasks.length) {
    return {
      promotionReadiness: 35,
      estimatedHikePercent: 4,
      band: 'baseline',
      confidence: 'low',
      factors: ['No recent task data — predictions improve as you complete work.'],
      nextActions: [
        'Pick one high-visibility task this sprint and close it on time.',
        'Share a weekly status update with your manager.',
        'Volunteer for a cross-team initiative for compounding visibility.',
      ],
    };
  }

  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recent = tasks.filter((t) => new Date(t.createdAt || t.updatedAt || Date.now()).getTime() >= cutoff);
  const completed = recent.filter((t) => t.status === 'completed');
  const completionRate = recent.length === 0 ? 0 : completed.length / recent.length;

  const avgVisibility = average(completed.map((t) => t.visibilityImpactScore || 50));
  const avgPromotion = average(completed.map((t) => t.promotionImpactScore || 50));
  const avgPriority = average(completed.map((t) => t.aiPriorityScore || 50));
  const onTime = completed.filter((t) => !t.deadline || (t.completedAt && new Date(t.completedAt) <= new Date(t.deadline))).length;
  const onTimeRate = completed.length === 0 ? 0 : onTime / completed.length;

  const weighted =
    completionRate * 25 +
    (avgVisibility / 100) * 25 +
    (avgPromotion / 100) * 25 +
    onTimeRate * 15 +
    (avgPriority / 100) * 10;

  const promotionReadiness = clamp(Math.round(weighted), 0, 100);

  // Hike band: 0-3% baseline; +1% per 10pt readiness above 50 capped at 18%.
  const above = Math.max(0, promotionReadiness - 50);
  const estimatedHikePercent = clamp(Math.round(3 + above * 0.3), 2, 22);

  const band =
    promotionReadiness >= 80
      ? 'fast-track'
      : promotionReadiness >= 65
      ? 'strong'
      : promotionReadiness >= 50
      ? 'on-track'
      : promotionReadiness >= 35
      ? 'developing'
      : 'baseline';

  const confidence = completed.length >= 8 ? 'high' : completed.length >= 4 ? 'medium' : 'low';

  const factors = [];
  if (completionRate >= 0.8) factors.push(`High completion rate: ${Math.round(completionRate * 100)}%`);
  else if (completionRate < 0.4) factors.push(`Low completion rate (${Math.round(completionRate * 100)}%) — drag on readiness`);

  if (avgVisibility >= 70) factors.push(`High visibility on closed work (${Math.round(avgVisibility)}/100)`);
  else if (avgVisibility < 50) factors.push(`Visibility of completed work is below 50 — pick more outward-facing tasks`);

  if (onTimeRate >= 0.85) factors.push(`Excellent on-time delivery (${Math.round(onTimeRate * 100)}%)`);
  else if (onTimeRate < 0.5) factors.push(`Slipping deadlines (${Math.round(onTimeRate * 100)}% on-time) hurts your case`);

  if (avgPromotion >= 70) factors.push(`Strong promotion-impact alignment in recent work`);

  const nextActions = [];
  if (promotionReadiness < 65) {
    nextActions.push('Take ownership of one high-visibility cross-team task this month.');
  }
  if (onTimeRate < 0.85) {
    nextActions.push('Set sub-deadlines for in-flight tasks and update status daily.');
  }
  if (avgVisibility < 70) {
    nextActions.push('Write a 1-page wins document for the last quarter and share with your manager.');
  }
  while (nextActions.length < 3) {
    nextActions.push('Schedule a 15-min growth check-in with your manager this week.');
  }

  return {
    promotionReadiness,
    estimatedHikePercent,
    band,
    confidence,
    factors,
    nextActions: nextActions.slice(0, 3),
    stats: {
      tasksLast90Days: recent.length,
      completedLast90Days: completed.length,
      completionRate: Math.round(completionRate * 100),
      onTimeRate: Math.round(onTimeRate * 100),
      avgVisibility: Math.round(avgVisibility),
      avgPromotion: Math.round(avgPromotion),
    },
  };
}

function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export const GET = createHandler({
  rateLimit: { bucket: 'ai-hike', limit: 30 },
  handler: async ({ request }) => {
    await dbConnect();
    const user = await requireAuth(request);

    const tasks = await Task.find({
      $or: [{ assignedTo: user._id }, { createdBy: user._id }],
    })
      .sort({ updatedAt: -1 })
      .limit(120);

    const result = calculate(tasks);
    return ok({ prediction: result });
  },
});
