import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { planFromStatus } from '@/lib/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query<{
      subscription_status: string;
      subscription_expiry: Date | null;
    }>(
      `SELECT subscription_status, subscription_expiry
       FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );

    const row = result.rows[0];
    if (!row) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const expiry = row.subscription_expiry
      ? new Date(row.subscription_expiry).toISOString()
      : null;

    return NextResponse.json({
      status: row.subscription_status,
      expiry,
      plan: planFromStatus(row.subscription_status, row.subscription_expiry),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load subscription status';
    console.error('[subscription/status]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
