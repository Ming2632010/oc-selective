import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Next.js 16 renamed `middleware` to `proxy`. Proxy runs on the Node.js runtime,
// so it has full database access to check the authoritative subscription state.
// (In Next.js 16 a `middleware.ts` file is deprecated/ignored; the working
// convention is `proxy.ts`.)
//
// Authentication gates private pages. Child- and subject-specific access is
// enforced by the student-scoped APIs, so parents can reach the dashboard to
// create/select the child they want to licence.

const TOKEN_COOKIE = 'oc_token';

// Paths that never require an active subscription.
// Note: the whole `/api/subscription` subtree is public (not just the webhook)
// so the subscription page can load status and start checkout before a user is
// subscribed; otherwise the flow would deadlock.
const PUBLIC_PAGES = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
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

  const deny = (reason: 'auth') => {
    if (isApi) {
      const status = 401;
      const error = 'Unauthorized';
      return NextResponse.json({ error }, { status });
    }
    const url = request.nextUrl.clone();
    url.search = '';
    if (reason === 'auth') {
      url.pathname = '/login';
    }
    return NextResponse.redirect(url);
  };

  const token = extractToken(request);
  if (!token) return deny('auth');

  const payload = await verifyToken(token);
  if (!payload) return deny('auth');

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static assets. XML is excluded so sitemap.xml
  // is not sent through the subscription gate.
  matcher: [
    '/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml|woff2?)).*)',
  ],
};
