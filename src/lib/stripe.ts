import Stripe from 'stripe';

let client: Stripe | null = null;

/** Lazily create the Stripe client. Throws if the secret key is missing. */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }
  if (!client) {
    client = new Stripe(secretKey);
  }
  return client;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }
  return secret;
}

/** Resolve the public app URL used for Stripe redirect URLs. */
export function getAppUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return new URL(request.url).origin;
}
