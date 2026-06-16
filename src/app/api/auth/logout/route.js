import { NextResponse } from 'next/server';
import { COOKIE_NAMES } from '@/lib/jwt';

const expiredCookie = (name, path = '/') => ({
  name,
  value: '',
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path,
  },
});

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' }, { status: 200 });
  response.cookies.set(COOKIE_NAMES.access, '', { ...expiredCookie(COOKIE_NAMES.access).options });
  response.cookies.set(COOKIE_NAMES.refresh, '', { ...expiredCookie(COOKIE_NAMES.refresh, '/api/auth').options });
  return response;
}
