import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query<{
      id: string;
      email: string;
      full_name: string;
      stripe_customer_id: string | null;
      subscription_status: string;
      subscription_expiry: Date | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, email, full_name, stripe_customer_id, subscription_status,
              subscription_expiry, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId],
    );

    const user = result.rows[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load user';
    console.error('[auth/me]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
