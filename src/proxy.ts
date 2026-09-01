import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// Next.js 16 renamed `middleware` to `proxy`. Proxy runs on the Node.js runtime,
// so it has full database access to check the authoritative subscription state.
// (In Next.js 16 a `middleware.ts` file is deprecated/ignored; the working
// convention is `proxy.ts`.)
//
// This gates the app behind an active subscription. It is an optimistic UX
// gate — API routes also enforce their own authentication.

const TOKEN_COOKIE = 'oc_token';

// Paths that never require an active subscription.
// Note: the whole `/api/subscription` subtree is public (not just the webhook)
// so the subscription page can load status and start checkout before a user is
// subscribed; otherwise the flow would deadlock.
const PUBLIC_PAGES = new Set([
  '/',
  '/login',
  '/register',
  '/subscription',
  '/privacy',
  '/oc-trial',
  '/selective-trial',
  '/sitemap.xml',
  '/robots.txt',
]);
const PUBLIC_API_PREFIXES = ['/api/auth', '/api/subscription', '/api/health'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) return true;
  return PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function extractToken(request: NextRequest): string | null {
  const cookieToken = request.cookies.get(TOKEN_COOKIE)?.value;
  if (cookieToken) return cookieToken;

  const header = request.headers.get('authorization');
  if (header) {
    const [scheme, value] = header.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && value) return value;
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith('/api');

  const deny = (reason: 'auth' | 'subscription') => {
    if (isApi) {
      const status = reason === 'auth' ? 401 : 402;
      const error =
        reason === 'auth' ? 'Unauthorized' : 'Active subscription required';
      return NextResponse.json({ error }, { status });
    }
    const url = request.nextUrl.clone();
    url.search = '';
    if (reason === 'auth') {
      url.pathname = '/login';
    } else {
      url.pathname = '/subscription';
      // Signal the subscription page that access was blocked by an
      // expired/inactive subscription.
      url.searchParams.set('expired', 'true');
    }
    return NextResponse.redirect(url);
  };

  const token = extractToken(request);
  if (!token) return deny('auth');

  const payload = await verifyToken(token);
  if (!payload) return deny('auth');

  try {
    // Allow access when the user has at least one active subscription for any
    // subject (active status and either no expiry or an expiry in the future).
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM user_subscriptions
         WHERE user_id = $1
           AND status = 'active'
           AND (expires_at IS NULL OR expires_at > NOW())
       ) AS exists`,
      [payload.userId],
    );
    if (!result.rows[0]?.exists) {
      return deny('subscription');
    }
  } catch (error) {
    console.error('[proxy] subscription check failed:', error);
    // Fail closed rather than exposing gated content.
    return deny('subscription');
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static assets; the allowlist
  // above handles per-path exclusions.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml|woff2?)).*)',
  ],
};
