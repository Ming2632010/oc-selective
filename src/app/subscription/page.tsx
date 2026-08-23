'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/client-auth';

type StatusResponse = {
  status: string;
  expiry: string | null;
  plan: 'annual' | 'lifetime' | null;
};

type PlanCard = {
  key: 'annual' | 'lifetime';
  name: string;
  price: string;
  cadence: string;
  features: string[];
  priceId: string | undefined;
};

const PLANS: PlanCard[] = [
  {
    key: 'annual',
    name: 'Annual',
    price: '$49 AUD',
    cadence: 'per year',
    features: [
      'All 6 writing modules',
      'Unlimited AI-scored drafts',
      'Sample answers after Draft 3',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL,
  },
  {
    key: 'lifetime',
    name: 'Lifetime',
    price: '$99 AUD',
    cadence: 'one-time',
    features: [
      'Everything in Annual',
      'Pay once, keep forever',
      'All future modules included',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME,
  },
];

function statusLabel(status: string, expiry: string | null): {
  text: string;
  classes: string;
} {
  if (status === 'lifetime') {
    return { text: 'Lifetime', classes: 'bg-emerald-100 text-emerald-800' };
  }
  if (status === 'active') {
    const active = expiry ? new Date(expiry).getTime() > Date.now() : false;
    if (active) {
      const until = expiry ? new Date(expiry).toLocaleDateString() : '';
      return {
        text: until ? `Active until ${until}` : 'Active',
        classes: 'bg-emerald-100 text-emerald-800',
      };
    }
    return { text: 'Expired', classes: 'bg-amber-100 text-amber-800' };
  }
  if (status === 'cancelled') {
    return { text: 'Cancelled', classes: 'bg-amber-100 text-amber-800' };
  }
  return { text: 'None', classes: 'bg-stone-100 text-stone-600' };
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const [expiredNotice, setExpiredNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setExpiredNotice(
        new URLSearchParams(window.location.search).get('expired') === 'true',
      );
    }
  }, []);

  useEffect(() => {
    async function load() {
      if (!getToken()) {
        router.replace('/login');
        return;
      }
      try {
        const res = await apiFetch('/api/subscription/status');
        if (res.response.ok) {
          setStatus(res.data as StatusResponse);
        } else {
          throw new Error(res.data.error || 'Failed to load subscription status');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load status');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  async function subscribe(plan: PlanCard) {
    setError(null);
    if (!plan.priceId) {
      setError(
        `No price configured for the ${plan.name} plan. Set NEXT_PUBLIC_STRIPE_PRICE_${plan.key.toUpperCase()}.`,
      );
      return;
    }
    setBusyPlan(plan.key);
    try {
      const res = await apiFetch('/api/subscription/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ price_id: plan.priceId }),
      });
      if (!res.response.ok || !res.data.checkout_url) {
        throw new Error(res.data.error || 'Could not start checkout');
      }
      window.location.href = res.data.checkout_url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
      setBusyPlan(null);
    }
  }

  async function manage() {
    setError(null);
    setManaging(true);
    try {
      const res = await apiFetch('/api/subscription/customer-portal', { method: 'POST' });
      if (!res.response.ok || !res.data.portal_url) {
        throw new Error(res.data.error || 'Could not open billing portal');
      }
      window.location.href = res.data.portal_url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing portal');
      setManaging(false);
    }
  }

  const badge = status ? statusLabel(status.status, status.expiry) : null;
  const hasBilling = status
    ? status.status === 'active' ||
      status.status === 'lifetime' ||
      status.status === 'cancelled'
    : false;

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 pb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-stone-500">Subscription</p>
          <h1 className="text-3xl font-semibold text-stone-900">Unlock writing practice</h1>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-800"
        >
          Back to dashboard
        </Link>
      </header>

      {expiredNotice ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your subscription has expired or is inactive. Choose a plan below to
          continue practising.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-4">
        <div>
          <p className="text-sm text-stone-500">Current status</p>
          {loading ? (
            <p className="text-lg font-medium text-stone-900">Loading…</p>
          ) : (
            <div className="mt-1 flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  badge?.classes ?? 'bg-stone-100 text-stone-600'
                }`}
              >
                {badge?.text ?? 'Unknown'}
              </span>
            </div>
          )}
        </div>
        {hasBilling ? (
          <button
            type="button"
            onClick={manage}
            disabled={managing}
            className="text-sm font-medium text-stone-900 underline disabled:opacity-60"
          >
            {managing ? 'Opening…' : 'Manage Subscription'}
          </button>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className="flex flex-col rounded-xl border border-stone-200 bg-white p-6"
          >
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-stone-900">{plan.name}</h2>
              <p className="text-3xl font-bold text-stone-900">
                {plan.price}{' '}
                <span className="text-base font-normal text-stone-500">
                  {plan.cadence}
                </span>
              </p>
            </div>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-stone-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-emerald-700">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => subscribe(plan)}
              disabled={busyPlan === plan.key}
              className="mt-6 rounded-md bg-stone-900 px-4 py-2.5 text-white disabled:opacity-60"
            >
              {busyPlan === plan.key ? 'Redirecting…' : `Subscribe · ${plan.price}`}
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
