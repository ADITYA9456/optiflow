import { NextResponse } from 'next/server';
import { createHandler } from '@/lib/api-handler';
import {
  COOKIE_NAMES,
  accessCookieOptions,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@/lib/jwt';
import dbConnect from '@/lib/mongodb';
import { LIMITS } from '@/lib/rate-limit';
import User from '@/models/User';

export const POST = createHandler({
  rateLimit: { bucket: 'auth-refresh', limit: LIMITS.auth },
  handler: async ({ request }) => {
    const refresh = request.cookies.get(COOKIE_NAMES.refresh)?.value;
    if (!refresh) {
      return NextResponse.json({ error: 'Missing refresh token' }, { status: 401 });
    }
    let payload;
    try {
      payload = verifyRefreshToken(refresh);
    } catch {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(payload.userId).select('-password');
    if (!user || user.isActive === false) {
      return NextResponse.json({ error: 'User not available' }, { status: 401 });
    }

    const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role, name: user.name });
    const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenVersion: 1 });

    const response = NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
    response.cookies.set(COOKIE_NAMES.access, accessToken, accessCookieOptions());
    response.cookies.set(COOKIE_NAMES.refresh, refreshToken, refreshCookieOptions());
    return response;
  },
});
