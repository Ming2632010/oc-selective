export type SubscriptionPlan = 'annual' | 'lifetime' | null;

export type SubscriptionInfo = {
  status: string;
  expiry: string | null;
  plan: SubscriptionPlan;
};

/**
 * Whether a user currently has access-granting subscription state:
 * an active plan that has not expired, or a lifetime plan.
 */
export function hasActiveAccess(
  status: string | null | undefined,
  expiry: Date | string | null | undefined,
): boolean {
  if (status === 'lifetime') return true;
  if (status === 'active') {
    if (!expiry) return false;
    const expiryTime = new Date(expiry).getTime();
    return Number.isFinite(expiryTime) && expiryTime > Date.now();
  }
  return false;
}

/** Infer the human-facing plan name from stored subscription state. */
export function planFromStatus(
  status: string | null | undefined,
  expiry: Date | string | null | undefined,
): SubscriptionPlan {
  if (status === 'lifetime') return 'lifetime';
  if (status === 'active' && expiry) return 'annual';
  return null;
}
