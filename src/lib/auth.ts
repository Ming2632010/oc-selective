import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyToken(
  token: string,
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userId =
      (typeof payload.userId === 'string' && payload.userId) ||
      (typeof payload.sub === 'string' && payload.sub) ||
      null;

    if (!userId) {
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}

/** Extract Bearer token from an Authorization header. */
export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

function getCookieToken(request: Request): string | null {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(/(?:^|;\s*)oc_token=([^;]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Resolve the authenticated user id, or null if missing/invalid. */
export async function getAuthUserId(request: Request): Promise<string | null> {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  return payload?.userId ?? null;
}

/** Same as getAuthUserId, plus the oc_token cookie used by <img> tags. */
export async function getAuthUserIdFromRequest(request: Request): Promise<string | null> {
  const fromHeader = await getAuthUserId(request);
  if (fromHeader) return fromHeader;
  const cookieToken = getCookieToken(request);
  if (!cookieToken) return null;
  const payload = await verifyToken(cookieToken);
  return payload?.userId ?? null;
}
