import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasActiveAccess } from '@/lib/subscription';

// Next.js 16 renamed `middleware` to `proxy`, which runs on the Node.js runtime
// and therefore has full database access. This gate protects the subscription-
// only application area (`/dashboard/**`). Public routes (`/`, `/login`,
// `/register`, `/subscription`), auth APIs, and the Stripe webhook are never
// matched here, and API routes additionally enforce their own auth.
//
// Note: like all middleware/proxy, this is an optimistic UX gate, not the sole
// security boundary — the API routes remain the authoritative access checks.

const TOKEN_COOKIE = 'oc_token';

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

  const token = extractToken(request);

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = '';
    return NextResponse.redirect(url);
  };

  // Not authenticated → send to login.
  if (!token) {
    return redirectTo('/login');
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return redirectTo('/login');
  }

  // Authenticated → check authoritative subscription state in the database.
  try {
    const result = await query<{
      subscription_status: string;
      subscription_expiry: Date | null;
    }>(
      `SELECT subscription_status, subscription_expiry FROM users WHERE id = $1 LIMIT 1`,
      [payload.userId],
    );
    const row = result.rows[0];
    if (!row || !hasActiveAccess(row.subscription_status, row.subscription_expiry)) {
      return redirectTo('/subscription');
    }
  } catch (error) {
    console.error('[proxy] subscription check failed:', error);
    // Fail closed to the subscription page rather than exposing gated content.
    return redirectTo('/subscription');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
