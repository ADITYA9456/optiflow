import { NextResponse } from 'next/server';
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
import { loginSchema } from '@/lib/validation';
import User from '@/models/User';

export const POST = createHandler({
  schema: loginSchema,
  rateLimit: { bucket: 'auth-login', limit: LIMITS.auth },
  handler: async ({ request, body, requestId }) => {
    await dbConnect();
    const { email, password } = body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn('Login failed (no user)', { requestId, email });
      await recordAudit({ action: 'user.login.failed', meta: { email, reason: 'not_found' }, request, severity: 'warn' });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.isActive === false) {
      await recordAudit({ action: 'user.login.failed', actor: user, meta: { reason: 'disabled' }, request, severity: 'warn' });
      return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      logger.warn('Login failed (bad password)', { requestId, email });
      await recordAudit({ action: 'user.login.failed', actor: user, meta: { reason: 'bad_password' }, request, severity: 'warn' });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    user.lastActiveAt = new Date();
    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role, name: user.name });
    const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: 1 });

    await recordAudit({ action: 'user.login.success', actor: user, request });

    const response = NextResponse.json(
      {
        message: 'Login successful',
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
      { status: 200 }
    );

    response.cookies.set(COOKIE_NAMES.access, accessToken, accessCookieOptions());
    response.cookies.set(COOKIE_NAMES.refresh, refreshToken, refreshCookieOptions());

    return response;
  },
});
