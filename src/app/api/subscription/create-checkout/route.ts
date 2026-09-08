import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { getAppUrl, getStripeClient } from '@/lib/stripe';
import { isAvailableSubject, isSubject, priceIdForSubject } from '@/lib/subjects';
import { isRateLimited } from '@/lib/rate-limit';
import { isMissingStripeCustomer } from '@/lib/stripe-customer';
import type Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckoutBody = {
  subject?: unknown;
  student_id?: unknown;
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
    if (isRateLimited(`checkout:${userId}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many checkout attempts. Try again shortly.' }, { status: 429 });
    }

    let body: CheckoutBody;
    try {
      body = (await request.json()) as CheckoutBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const subject = isNonEmptyString(body.subject) ? body.subject.trim() : '';
    const studentId = isNonEmptyString(body.student_id) ? body.student_id.trim() : '';
    if (!isSubject(subject)) {
      return NextResponse.json(
        { error: 'subject must be one of: writing, math, thinking, reading' },
        { status: 400 },
      );
    }
    if (!isAvailableSubject(subject)) {
      return NextResponse.json(
        { error: 'This subject is coming soon. Selective Writing is available now.' },
        { status: 409 },
      );
    }
    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }
    const student = await query<{ id: string }>(
      `SELECT id FROM students WHERE id = $1 AND user_id = $2 AND is_active = TRUE LIMIT 1`,
      [studentId, userId],
    );
    if (!student.rows[0]) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    const existing = await query<{ id: string }>(
      `SELECT id FROM user_subscriptions
       WHERE user_id = $1 AND student_id = $2 AND subject = $3
         AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
       LIMIT 1`,
      [userId, studentId, subject],
    );
    if (existing.rows[0]) {
      return NextResponse.json(
        { error: 'This student already has active Selective Writing access.' },
        { status: 409 },
      );
    }

    const priceId = priceIdForSubject(subject);
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

    // One-off payment: Stripe charges once. We grant 1 year of access in the
    // webhook. Promotion codes (coupons) can be entered on the Checkout page.
    const createSession = (customerId: string | null) =>
      stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: user.id,
        allow_promotion_codes: true,
        metadata: { userId: user.id, studentId, subject, priceId },
        payment_intent_data: {
          metadata: { userId: user.id, studentId, subject, priceId },
        },
        ...(customerId
          ? { customer: customerId }
          : { customer_email: user.email, customer_creation: 'always' }),
        success_url: `${appUrl}/subscription/confirm?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/subscription`,
      });

    let session: Stripe.Checkout.Session;
    try {
      session = await createSession(user.stripe_customer_id);
    } catch (error) {
      if (!user.stripe_customer_id || !isMissingStripeCustomer(error)) throw error;

      // A customer created in another Stripe account/mode can no longer be
      // reused. Clear only the stale reference and let Checkout create one.
      await query(
        `UPDATE users SET stripe_customer_id = NULL
         WHERE id = $1 AND stripe_customer_id = $2`,
        [user.id, user.stripe_customer_id],
      );
      session = await createSession(null);
    }

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    console.error('[subscription/create-checkout]', error);
    return NextResponse.json(
      { error: 'Unable to start checkout. Please try again.' },
      { status: 500 },
    );
  }
}
