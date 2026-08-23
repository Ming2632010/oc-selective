import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { getAppUrl, getStripeClient } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query<{ stripe_customer_id: string | null }>(
      `SELECT stripe_customer_id FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );
    const customerId = result.rows[0]?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json(
        { error: 'No billing account found for this user' },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl()}/subscription`,
    });

    return NextResponse.json({ portal_url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create billing portal session';
    console.error('[subscription/customer-portal]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
