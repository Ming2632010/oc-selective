import { NextResponse } from 'next/server';
import { generateToken, verifyPassword } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function POST(request: Request) {
  try {
    let body: LoginBody;
    try {
      body = (await request.json()) as LoginBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = isNonEmptyString(body.email)
      ? body.email.trim().toLowerCase()
      : '';
    const password = isNonEmptyString(body.password) ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'email and password are required' },
        { status: 400 },
      );
    }

    const result = await query<{
      id: string;
      email: string;
      full_name: string;
      password_hash: string;
      subscription_status: string;
      subscription_expiry: Date | null;
    }>(
      `SELECT id, email, full_name, password_hash, subscription_status, subscription_expiry
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email],
    );

    const user = result.rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await generateToken(user.id);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        subscription_status: user.subscription_status,
        subscription_expiry: user.subscription_expiry,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    console.error('[auth/login]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
