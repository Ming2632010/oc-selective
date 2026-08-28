'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/client-auth';
import {
  SUBJECTS,
  SUBJECT_BLURBS,
  SUBJECT_LABELS,
  SUBJECT_PRICE_AUD,
  type Subject,
} from '@/lib/subjects';

type SubscriptionItem = {
  id: string;
  subject: string;
  status: string;
  expires_at: string | null;
  active: boolean;
};

type StatusResponse = {
  subscriptions: SubscriptionItem[];
  has_active: boolean;
};

export default function SubscriptionPage() {
  const router = useRouter();
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
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
        if (!res.response.ok) {
          throw new Error(res.data.error || 'Failed to load subscription status');
        }
        setData(res.data as StatusResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load status');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  const activeBySubject = useMemo(() => {
    const map = new Map<string, SubscriptionItem>();
    for (const sub of data?.subscriptions ?? []) {
      if (sub.active && !map.has(sub.subject)) {
        map.set(sub.subject, sub);
      }
    }
    return map;
  }, [data]);

  const hasBilling = (data?.subscriptions?.length ?? 0) > 0;

  async function subscribe(subject: Subject) {
    setError(null);
    setBusy(subject);
    try {
      const res = await apiFetch('/api/subscription/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ subject }),
      });
      if (!res.response.ok || !res.data.checkout_url) {
        throw new Error(res.data.error || 'Could not start checkout');
      }
      window.location.href = res.data.checkout_url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
      setBusy(null);
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

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 pb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-stone-500">Subscription</p>
          <h1 className="text-3xl font-semibold text-stone-900">Choose your subjects</h1>
          <p className="mt-1 text-sm text-stone-600">
            Each subject is ${SUBJECT_PRICE_AUD} AUD for one year. Pay once —
            access ends after 12 months, with no automatic renewal. You can
            enter a promotion code at checkout.
          </p>
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
          You don&apos;t have an active subscription. Choose a subject below to
          continue practising.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-stone-600">Loading…</p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {SUBJECTS.map((subject) => {
            const active = activeBySubject.get(subject);
            return (
              <div
                key={subject}
                className="flex flex-col rounded-xl border border-stone-200 bg-white p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-stone-900">
                      {SUBJECT_LABELS[subject]}
                    </h2>
                    <p className="mt-1 text-sm text-stone-600">
                      {SUBJECT_BLURBS[subject]}
                    </p>
                  </div>
                  {active ? (
                    <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      Active
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 text-2xl font-bold text-stone-900">
                  ${SUBJECT_PRICE_AUD} AUD{' '}
                  <span className="text-base font-normal text-stone-500">/ year</span>
                </p>

                {active ? (
                  <div className="mt-4 flex-1 space-y-2 text-sm text-stone-700">
                    <p>
                      Active
                      {active.expires_at
                        ? ` until ${new Date(active.expires_at).toLocaleDateString()}`
                        : ''}
                      .
                    </p>
                    <button
                      type="button"
                      onClick={manage}
                      disabled={managing}
                      className="mt-2 rounded-md border border-stone-900 px-4 py-2 text-sm font-medium text-stone-900 disabled:opacity-60"
                    >
                      {managing ? 'Opening…' : 'View receipts'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => subscribe(subject)}
                    disabled={busy === subject}
                    className="mt-6 rounded-md bg-stone-900 px-4 py-2.5 text-white disabled:opacity-60"
                  >
                    {busy === subject
                      ? 'Redirecting…'
                      : `Buy 1 year · $${SUBJECT_PRICE_AUD}`}
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}

      <p className="text-center text-sm text-stone-600">
        Need access for a second child?{' '}
        <span className="font-medium text-stone-800">
          Pay again — each purchase is independent.
        </span>
        {hasBilling ? (
          <>
            {' '}
            <button
              type="button"
              onClick={manage}
              disabled={managing}
              className="font-medium text-stone-900 underline disabled:opacity-60"
            >
              View receipts
            </button>
          </>
        ) : null}
      </p>
    </main>
  );
}
