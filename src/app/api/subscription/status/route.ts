import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { isSubscriptionActive } from '@/lib/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SubscriptionRow = {
  id: string;
  subject: string;
  status: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  expires_at: Date | null;
};

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query<SubscriptionRow>(
      `SELECT id, subject, status, stripe_subscription_id, stripe_price_id, expires_at
       FROM user_subscriptions
       WHERE user_id = $1
       ORDER BY subject ASC, created_at DESC`,
      [userId],
    );

    const subscriptions = result.rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      status: row.status,
      expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : null,
      stripe_subscription_id: row.stripe_subscription_id,
      active: isSubscriptionActive(row.status, row.expires_at),
    }));

    return NextResponse.json({
      subscriptions,
      has_active: subscriptions.some((s) => s.active),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load subscription status';
    console.error('[subscription/status]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
