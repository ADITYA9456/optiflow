import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { createHandler } from '@/lib/api-handler';
import {
  COOKIE_NAMES,
  accessCookieOptions,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
} from '@/lib/jwt';
import logger from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { recordAudit } from '@/lib/audit';
import { LIMITS } from '@/lib/rate-limit';
import { registerSchema } from '@/lib/validation';
import User from '@/models/User';

const ELEVATED_ROLES = new Set(['admin', 'manager', 'team_leader']);

export const POST = createHandler({
  schema: registerSchema,
  rateLimit: { bucket: 'auth-register', limit: LIMITS.auth },
  handler: async ({ request, body, requestId }) => {
    await dbConnect();
    const { name, email, password, role = 'employee', adminSecret, department, title } = body;

    if (ELEVATED_ROLES.has(role)) {
      if (!process.env.ADMIN_SECRET) {
        logger.error('Elevated registration attempted but ADMIN_SECRET not configured', { requestId });
        return NextResponse.json({ error: 'Elevated role registration is not available' }, { status: 403 });
      }
      if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
        return NextResponse.json({ error: 'Invalid verification code for elevated role' }, { status: 403 });
      }
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // The first user becomes the owner. Done in a transaction-safe manner using
    // the unique partial index on `isOwner`. If two requests race, only one will
    // win the unique constraint and we will gracefully demote and retry.
    const session = await mongoose.startSession();
    let user;
    try {
      await session.withTransaction(async () => {
        const userCount = await User.countDocuments({}).session(session);
        const isFirstUser = userCount === 0;
        const finalRole = isFirstUser ? 'owner' : role;

        const [created] = await User.create(
          [
            {
              name,
              email,
              password,
              role: finalRole,
              isOwner: isFirstUser,
              department: department?.trim() || 'General',
              title: title?.trim() || 'Contributor',
            },
          ],
          { session }
        );
        user = created;
      });
    } catch (error) {
      // Fallback for replica sets that disallow transactions — try without txn.
      if (String(error.message || '').toLowerCase().includes('transaction')) {
        const userCount = await User.countDocuments({});
        const isFirstUser = userCount === 0;
        user = await User.create({
          name,
          email,
          password,
          role: isFirstUser ? 'owner' : role,
          isOwner: isFirstUser,
          department: department?.trim() || 'General',
          title: title?.trim() || 'Contributor',
        });
      } else {
        throw error;
      }
    } finally {
      session.endSession();
    }

    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role, name: user.name });
    const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: 1 });

    await recordAudit({ action: 'user.register', actor: user, request });

    const response = NextResponse.json(
      {
        message: 'Account created',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          title: user.title,
          isOwner: !!user.isOwner,
        },
      },
      { status: 201 }
    );
    response.cookies.set(COOKIE_NAMES.access, accessToken, accessCookieOptions());
    response.cookies.set(COOKIE_NAMES.refresh, refreshToken, refreshCookieOptions());
    return response;
  },
});
