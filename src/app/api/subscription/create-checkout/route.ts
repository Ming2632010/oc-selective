import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { getAppUrl, getStripeClient } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckoutBody = {
  price_id?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: CheckoutBody;
    try {
      body = (await request.json()) as CheckoutBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const priceId = isNonEmptyString(body.price_id) ? body.price_id.trim() : '';
    if (!priceId) {
      return NextResponse.json({ error: 'price_id is required' }, { status: 400 });
    }

    const userResult = await query<{
      id: string;
      email: string;
      stripe_customer_id: string | null;
    }>(
      `SELECT id, email, stripe_customer_id FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );
    const user = userResult.rows[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const stripe = getStripeClient();

    // Determine checkout mode from the price: recurring => annual subscription,
    // one-time => lifetime payment.
    const price = await stripe.prices.retrieve(priceId);
    const isRecurring = Boolean(price.recurring);
    const plan = isRecurring ? 'annual' : 'lifetime';
    const mode = isRecurring ? 'subscription' : 'payment';

    const appUrl = getAppUrl(request);

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
      ...(user.stripe_customer_id
        ? { customer: user.stripe_customer_id }
        : { customer_email: user.email }),
      ...(mode === 'subscription'
        ? { subscription_data: { metadata: { userId: user.id, plan } } }
        : {}),
      success_url: `${appUrl}/subscription?checkout=success`,
      cancel_url: `${appUrl}/subscription?checkout=cancelled`,
    });

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create checkout session';
    console.error('[subscription/create-checkout]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
