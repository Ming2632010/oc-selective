/**
 * Stripe returns `resource_missing` when an account stores a customer ID from
 * another Stripe account or mode. It is safe to replace only that reference.
 */
export function isMissingStripeCustomer(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: unknown }).code === 'resource_missing' &&
    error.message.toLowerCase().includes('customer')
  );
}
