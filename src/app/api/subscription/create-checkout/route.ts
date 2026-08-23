import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { getAppUrl, getStripeClient } from '@/lib/stripe';
import { isSubject, priceIdForSubject } from '@/lib/subjects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckoutBody = {
  price_id?: unknown;
  subject?: unknown;
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

    const subject = isNonEmptyString(body.subject) ? body.subject.trim() : '';
    if (!isSubject(subject)) {
      return NextResponse.json(
        { error: 'subject must be one of: writing, math, thinking, reading' },
        { status: 400 },
      );
    }

    // The price id can be supplied by the client or resolved server-side from
    // the subject (server-side is the source of truth for pricing).
    const priceId = isNonEmptyString(body.price_id)
      ? body.price_id.trim()
      : priceIdForSubject(subject);
    if (!priceId) {
      return NextResponse.json(
        { error: `No Stripe price configured for subject "${subject}"` },
        { status: 400 },
      );
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
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      allow_promotion_codes: true,
      metadata: { userId: user.id, subject, priceId },
      // The subscription is set to cancel at period end (no auto-renewal) in the
      // webhook once the subscription exists — the Checkout Session API does not
      // accept cancel_at_period_end at creation time.
      subscription_data: {
        metadata: { userId: user.id, subject, priceId },
      },
      ...(user.stripe_customer_id
        ? { customer: user.stripe_customer_id }
        : { customer_email: user.email }),
      success_url: `${appUrl}/dashboard`,
      cancel_url: `${appUrl}/subscription`,
    });

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create checkout session';
    console.error('[subscription/create-checkout]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
