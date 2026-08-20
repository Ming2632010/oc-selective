import { NextResponse } from 'next/server';
import { generateToken, hashPassword } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RegisterBody = {
  email?: unknown;
  password?: unknown;
  full_name?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function POST(request: Request) {
  try {
    let body: RegisterBody;
    try {
      body = (await request.json()) as RegisterBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = isNonEmptyString(body.email)
      ? body.email.trim().toLowerCase()
      : '';
    const password = isNonEmptyString(body.password) ? body.password : '';
    const fullName = isNonEmptyString(body.full_name)
      ? body.full_name.trim()
      : '';

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'email, password, and full_name are required' },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    let user: {
      id: string;
      email: string;
      full_name: string;
      subscription_status: string;
      created_at: Date;
    };

    try {
      const result = await query<{
        id: string;
        email: string;
        full_name: string;
        subscription_status: string;
        created_at: Date;
      }>(
        `INSERT INTO users (email, password_hash, full_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, full_name, subscription_status, created_at`,
        [email, passwordHash, fullName],
      );
      user = result.rows[0];
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('users_email_key') || message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Email is already registered' },
          { status: 409 },
        );
      }
      throw error;
    }

    const token = await generateToken(user.id);

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          subscription_status: user.subscription_status,
          created_at: user.created_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    console.error('[auth/register]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
