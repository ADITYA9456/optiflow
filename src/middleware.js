import { NextResponse } from 'next/server';

const AUTH_PAGES = new Set(['/login', '/signup']);
const PROTECTED_PREFIXES = ['/dashboard', '/teams', '/users', '/admin', '/chat', '/tasks', '/profile'];
const MANAGER_PREFIXES = ['/teams', '/users'];
const ADMIN_PREFIXES = ['/admin'];

const MANAGER_ROLES = new Set(['owner', 'admin', 'manager', 'team_leader']);
const ADMIN_ROLES = new Set(['owner', 'admin']);

function parseJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = atob(base64);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

function startsWithAny(pathname, prefixes) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;
  const payload = token ? parseJwtPayload(token) : null;
  const isAuthed = !!payload && (!payload.exp || payload.exp * 1000 > Date.now());
  const role = payload?.role;

  if (AUTH_PAGES.has(pathname) && isAuthed) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (startsWithAny(pathname, PROTECTED_PREFIXES) && !isAuthed) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthed && startsWithAny(pathname, ADMIN_PREFIXES) && !ADMIN_ROLES.has(role)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isAuthed && startsWithAny(pathname, MANAGER_PREFIXES) && !MANAGER_ROLES.has(role)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/teams/:path*',
    '/users/:path*',
    '/admin/:path*',
    '/chat/:path*',
    '/tasks/:path*',
    '/profile/:path*',
    '/login',
    '/signup',
  ],
};
