import { NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/email';
import { query } from '@/lib/db';
import {
  GENERIC_FORGOT_MESSAGE,
  buildResetUrl,
  createPasswordResetToken,
  shouldExposeDevResetUrl,
} from '@/lib/password-reset';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ForgotBody = {
  email?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function genericResponse(resetUrl?: string) {
  const body: { message: string; resetUrl?: string } = {
    message: GENERIC_FORGOT_MESSAGE,
  };
  if (resetUrl && shouldExposeDevResetUrl()) {
    body.resetUrl = resetUrl;
  }
  return NextResponse.json(body);
}

export async function POST(request: Request) {
  try {
    let body: ForgotBody;
    try {
      body = (await request.json()) as ForgotBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = isNonEmptyString(body.email)
      ? body.email.trim().toLowerCase()
      : '';

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const result = await query<{ id: string; email: string; full_name: string }>(
      `SELECT id, email, full_name FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    const user = result.rows[0];
    if (!user) {
      return genericResponse();
    }

    const { token } = await createPasswordResetToken(user.id);
    const resetUrl = buildResetUrl(token);
    await sendPasswordResetEmail({
      to: user.email,
      name: user.full_name,
      resetUrl,
    });

    return genericResponse(resetUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send reset email';
    console.error('[auth/forgot-password]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
