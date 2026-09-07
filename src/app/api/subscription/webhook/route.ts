import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { query } from '@/lib/db';
import { sendPaymentFailedReminder } from '@/lib/email';
import { getStripeClient, getWebhookSecret } from '@/lib/stripe';
import { isAvailableSubject, isSubject, priceIdForSubject } from '@/lib/subjects';

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
  if (session.payment_status && session.payment_status !== 'paid') {
    console.warn(
      `[subscription/webhook] checkout.session.completed not paid (${session.payment_status})`,
    );
    return;
  }

  const userId =
    (session.metadata?.userId as string | undefined) ||
    session.client_reference_id ||
    null;
  const subject = session.metadata?.subject as string | undefined;
  const studentId = session.metadata?.studentId as string | undefined;

  if (!userId || !studentId || !subject || !isSubject(subject) || !isAvailableSubject(subject)) {
    console.warn(
      '[subscription/webhook] checkout.session.completed missing/invalid userId or subject',
    );
    return;
  }

  // Checkout session id is the idempotency key for one-off payments (no Stripe
  // subscription object). Stored in stripe_subscription_id so webhook retries
  // do not insert a second year of access.
  const paymentRef = session.id;
  const priceId = (session.metadata?.priceId as string | undefined) ?? null;
  const discount = session.discounts?.[0];
  const promotionCodeId = idOf(discount?.promotion_code);
  const couponId = idOf(discount?.coupon);
  if (!priceId || priceId !== priceIdForSubject(subject)) {
    console.warn('[subscription/webhook] checkout session has an unexpected price');
    return;
  }
  const student = await query<{ id: string }>(
    `SELECT id FROM students WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [studentId, userId],
  );
  if (!student.rows[0]) {
    console.warn('[subscription/webhook] checkout session has an invalid student');
    return;
  }
  const customerId = idOf(session.customer);
  const expiresAt = new Date(Date.now() + ONE_YEAR_MS).toISOString();

  if (customerId) {
    await query(
      `UPDATE users SET stripe_customer_id = COALESCE($2, stripe_customer_id) WHERE id = $1`,
      [userId, customerId],
    );
  }

  await query(
    `INSERT INTO user_subscriptions
       (user_id, student_id, subject, status, stripe_subscription_id, stripe_price_id,
        stripe_promotion_code_id, stripe_coupon_id, amount_paid, currency, expires_at)
     VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL
     DO UPDATE SET status = 'active',
                   stripe_price_id = EXCLUDED.stripe_price_id,
                   expires_at = EXCLUDED.expires_at,
                   stripe_promotion_code_id = EXCLUDED.stripe_promotion_code_id,
                   stripe_coupon_id = EXCLUDED.stripe_coupon_id,
                   amount_paid = EXCLUDED.amount_paid,
                   currency = EXCLUDED.currency,
                   updated_at = NOW()`,
    [
      userId,
      studentId,
      subject,
      paymentRef,
      priceId,
      promotionCodeId,
      couponId,
      session.amount_total,
      session.currency,
      expiresAt,
    ],
  );
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

async function claimWebhookEvent(event: Stripe.Event): Promise<boolean> {
  const result = await query(
    `INSERT INTO stripe_webhook_events (event_id, event_type)
     VALUES ($1, $2)
     ON CONFLICT (event_id) DO UPDATE
       SET status = 'processing',
           attempts = stripe_webhook_events.attempts + 1,
           received_at = NOW(),
           last_error = NULL
       WHERE stripe_webhook_events.status = 'failed'
          OR (
            stripe_webhook_events.status = 'processing'
            AND stripe_webhook_events.received_at < NOW() - INTERVAL '10 minutes'
          )
     RETURNING event_id`,
    [event.id, event.type],
  );
  return (result.rowCount ?? result.rows.length) > 0;
}

async function completeWebhookEvent(eventId: string) {
  await query(
    `UPDATE stripe_webhook_events
     SET status = 'completed', processed_at = NOW(), last_error = NULL
     WHERE event_id = $1`,
    [eventId],
  );
}

async function failWebhookEvent(eventId: string, error: unknown) {
  const message = error instanceof Error ? error.message.slice(0, 1_000) : 'Unknown webhook failure';
  await query(
    `UPDATE stripe_webhook_events
     SET status = 'failed', last_error = $2
     WHERE event_id = $1`,
    [eventId, message],
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
    if (!(await claimWebhookEvent(event))) {
      return NextResponse.json({ received: true, duplicate: true });
    }

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

    await completeWebhookEvent(event.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[subscription/webhook] handler error for ${event.type}:`, error);
    try {
      await failWebhookEvent(event.id, error);
    } catch (ledgerError) {
      console.error('[subscription/webhook] failed to update event ledger:', ledgerError);
    }
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
