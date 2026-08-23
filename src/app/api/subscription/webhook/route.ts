import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { query } from '@/lib/db';
import { sendPaymentFailedReminder } from '@/lib/email';
import { getStripeClient, getWebhookSecret } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function customerIdOf(
  customer: string | { id: string } | null | undefined,
): string | null {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId =
    (session.metadata?.userId as string | undefined) ||
    session.client_reference_id ||
    null;
  if (!userId) {
    console.warn('[subscription/webhook] checkout.session.completed missing userId');
    return;
  }

  const customerId = customerIdOf(session.customer);

  if (session.mode === 'payment') {
    // Lifetime one-time purchase.
    await query(
      `UPDATE users
       SET subscription_status = 'lifetime',
           subscription_expiry = NULL,
           stripe_customer_id = COALESCE($2, stripe_customer_id)
       WHERE id = $1`,
      [userId, customerId],
    );
  } else {
    // Annual subscription.
    const expiry = new Date(Date.now() + ONE_YEAR_MS).toISOString();
    await query(
      `UPDATE users
       SET subscription_status = 'active',
           subscription_expiry = $2,
           stripe_customer_id = COALESCE($3, stripe_customer_id)
       WHERE id = $1`,
      [userId, expiry, customerId],
    );
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = customerIdOf(invoice.customer);
  console.warn(
    `[subscription/webhook] invoice.payment_failed for customer ${customerId} (invoice ${invoice.id}); sending reminder, not cancelling.`,
  );

  // Prefer the invoice email; otherwise look the user up by customer id.
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

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = customerIdOf(subscription.customer);
  if (!customerId) {
    console.warn('[subscription/webhook] subscription.deleted missing customer');
    return;
  }

  await query(
    `UPDATE users
     SET subscription_status = 'cancelled',
         subscription_expiry = NULL
     WHERE stripe_customer_id = $1`,
    [customerId],
  );
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
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        // Acknowledge unhandled event types so Stripe stops retrying.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed';
    console.error(`[subscription/webhook] handler error for ${event.type}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
