import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  consumePasswordResetToken,
  invalidateUserResetTokens,
} from '@/lib/password-reset';
import { isRateLimited } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ResetBody = {
  token?: unknown;
  password?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function POST(request: Request) {
  try {
    let body: ResetBody;
    try {
      body = (await request.json()) as ResetBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const token = isNonEmptyString(body.token) ? body.token.trim() : '';
    const password = isNonEmptyString(body.password) ? body.password : '';

    if (!token || !password) {
      return NextResponse.json(
        { error: 'token and password are required' },
        { status: 400 },
      );
    }
    if (isRateLimited(`reset-password:${token}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Request a new reset link.' },
        { status: 429 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }

    const userId = await consumePasswordResetToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired' },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
      passwordHash,
      userId,
    ]);
    await invalidateUserResetTokens(userId);

    return NextResponse.json({
      message: 'Password updated. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('[auth/reset-password]', error);
    return NextResponse.json({ error: 'Unable to reset password. Please try again.' }, { status: 500 });
  }
}
