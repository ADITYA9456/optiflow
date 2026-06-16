import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/u, 'Invalid id');

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['employee', 'team_leader', 'manager', 'admin']).optional(),
  adminSecret: z.string().min(1).max(128).optional(),
  department: z.string().trim().max(80).optional(),
  title: z.string().trim().max(80).optional(),
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().min(1).max(500),
  deadline: z.coerce.date(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignedTo: objectIdSchema.optional().nullable(),
  teamId: objectIdSchema.optional().nullable(),
  taskType: z.enum(['feature', 'bug', 'chore', 'research']).default('feature'),
  effortPoints: z.number().int().min(1).max(13).optional(),
  labels: z.array(z.string().trim().min(1).max(24)).max(8).optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  status: z.enum(['pending', 'in-progress', 'review', 'blocked', 'completed']).optional(),
  boardColumn: z.enum(['backlog', 'todo', 'in-progress', 'review', 'done']).optional(),
});

export const taskCommentSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  mentions: z.array(objectIdSchema).max(15).optional(),
});

export const teamSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  memberIds: z.array(objectIdSchema).max(50).optional(),
  teamLead: objectIdSchema.optional().nullable(),
  channels: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(60),
        description: z.string().trim().max(200).optional(),
        isPrivate: z.boolean().optional(),
      })
    )
    .max(8)
    .optional(),
});

export const channelSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(['team', 'direct']).default('team'),
  teamId: objectIdSchema.optional().nullable(),
  participants: z.array(objectIdSchema).max(50).optional(),
  isPrivate: z.boolean().optional(),
});

export const directChannelSchema = z.object({
  participantId: objectIdSchema,
});

export const messageSchema = z.object({
  channelId: objectIdSchema,
  content: z.string().trim().min(1).max(4000),
  mentions: z.array(objectIdSchema).max(15).optional(),
});

export const adminRequestSchema = z.object({
  reason: z.string().trim().min(10).max(500),
});

export const adminApproveSchema = z.object({
  requestIdDb: objectIdSchema,
  action: z.enum(['approve', 'reject']),
  notes: z.string().trim().max(500).optional(),
});

export const userUpdateSchema = z.object({
  role: z.enum(['owner', 'admin', 'manager', 'team_leader', 'employee']).optional(),
  department: z.string().trim().max(80).optional(),
  title: z.string().trim().max(80).optional(),
  visibilityScore: z.number().min(0).max(100).optional(),
  promotionScore: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const aiChatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      })
    )
    .max(20)
    .optional(),
});

/**
 * @template T
 * @param {import('zod').ZodSchema<T>} schema
 * @param {unknown} data
 * @returns {{ ok: true, data: T } | { ok: false, error: string, issues: Array<{path: string, message: string}> }}
 */
export function parseInput(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  const issues = result.error.issues.map((i) => ({
    path: i.path.join('.'),
    message: i.message,
  }));
  const error = issues[0]?.message || 'Invalid input';
  return { ok: false, error, issues };
}
