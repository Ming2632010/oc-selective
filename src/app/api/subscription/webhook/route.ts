import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { query } from '@/lib/db';
import { getStripeClient, getWebhookSecret } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId =
    (session.metadata?.userId as string | undefined) ||
    session.client_reference_id ||
    null;
  if (!userId) {
    console.warn('[subscription/webhook] checkout.session.completed missing userId');
    return;
  }

  const plan = (session.metadata?.plan as string | undefined) ?? 'annual';
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  if (plan === 'lifetime') {
    await query(
      `UPDATE users
       SET subscription_status = 'lifetime',
           subscription_expiry = NULL,
           stripe_customer_id = COALESCE($2, stripe_customer_id)
       WHERE id = $1`,
      [userId, customerId],
    );
  } else {
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

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id ?? null;
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
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // Do not cancel immediately; a reminder email would be sent here.
        console.warn(
          `[subscription/webhook] payment_failed for customer ${
            typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
          } (invoice ${invoice.id}); sending reminder, not cancelling.`,
        );
        break;
      }
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed';
    console.error(`[subscription/webhook] handler error for ${event.type}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
