import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { query } from '@/lib/db';
import { sendPaymentFailedReminder } from '@/lib/email';
import { getStripeClient, getWebhookSecret } from '@/lib/stripe';
import { isSubject } from '@/lib/subjects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function idOf(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

/** Map a Stripe subscription status to our internal status. */
function mapStatus(stripeStatus: string): 'active' | 'cancelled' | 'expired' {
  if (stripeStatus === 'active' || stripeStatus === 'trialing') return 'active';
  if (stripeStatus === 'canceled') return 'cancelled';
  return 'expired';
}

function periodEndToDate(subscription: Stripe.Subscription): string {
  const raw = (subscription as unknown as { current_period_end?: number })
    .current_period_end;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return new Date(raw * 1000).toISOString();
  }
  return new Date(Date.now() + ONE_YEAR_MS).toISOString();
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId =
    (session.metadata?.userId as string | undefined) ||
    session.client_reference_id ||
    null;
  const subject = session.metadata?.subject as string | undefined;

  if (!userId || !subject || !isSubject(subject)) {
    console.warn(
      '[subscription/webhook] checkout.session.completed missing/invalid userId or subject',
    );
    return;
  }

  const subscriptionId = idOf(session.subscription);
  const priceId = (session.metadata?.priceId as string | undefined) ?? null;
  const customerId = idOf(session.customer);
  const expiresAt = new Date(Date.now() + ONE_YEAR_MS).toISOString();

  // Persist the customer id on the user for the billing portal.
  if (customerId) {
    await query(
      `UPDATE users SET stripe_customer_id = COALESCE($2, stripe_customer_id) WHERE id = $1`,
      [userId, customerId],
    );
  }

  // Upsert by Stripe subscription id so webhook retries do not create duplicates,
  // while still allowing multiple subscriptions to the same subject (per child).
  await query(
    `INSERT INTO user_subscriptions
       (user_id, subject, status, stripe_subscription_id, stripe_price_id, expires_at)
     VALUES ($1, $2, 'active', $3, $4, $5)
     ON CONFLICT (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL
     DO UPDATE SET status = 'active',
                   stripe_price_id = EXCLUDED.stripe_price_id,
                   expires_at = EXCLUDED.expires_at,
                   updated_at = NOW()`,
    [userId, subject, subscriptionId, priceId, expiresAt],
  );

  // Enforce "no auto-renewal": cancel the subscription at the end of its period.
  if (subscriptionId) {
    try {
      await getStripeClient().subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (error) {
      console.error(
        `[subscription/webhook] failed to set cancel_at_period_end for ${subscriptionId}:`,
        error,
      );
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const status = mapStatus(subscription.status);
  const expiresAt = periodEndToDate(subscription);
  await query(
    `UPDATE user_subscriptions
     SET status = $2, expires_at = $3, updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscription.id, status, expiresAt],
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await query(
    `UPDATE user_subscriptions
     SET status = 'cancelled', updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscription.id],
  );
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = idOf(invoice.customer);
  console.warn(
    `[subscription/webhook] invoice.payment_failed for customer ${customerId} (invoice ${invoice.id}); sending reminder.`,
  );
  let email = invoice.customer_email ?? null;
  if (!email && customerId) {
    const result = await query<{ email: string }>(
      `SELECT email FROM users WHERE stripe_customer_id = $1 LIMIT 1`,
      [customerId],
    );
    email = result.rows[0]?.email ?? null;
  }
  await sendPaymentFailedReminder(email);
}

export async function POST(request: Request) {
  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, getWebhookSecret());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook payload';
    console.error('[subscription/webhook] signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed';
    console.error(`[subscription/webhook] handler error for ${event.type}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
