'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken, setStudentId as persistStudentId } from '@/lib/client-auth';
import {
  KY1_SUBJECT_PRICE_AUD,
  SUBJECTS,
  SUBJECT_BLURBS,
  SUBJECT_LABELS,
  SUBJECT_PRICE_AUD,
  isPurchasableSubject,
  priceAudForPurchase,
  type Subject,
} from '@/lib/subjects';
import { usesMathsDashboard, usesWritingDashboard } from '@/lib/student-grades';

type SubscriptionItem = {
  id: string;
  subject: string;
  student_id: string | null;
  status: string;
  expires_at: string | null;
  access_kind?: 'paid' | 'trial';
  active: boolean;
};

type StatusResponse = {
  subscriptions: SubscriptionItem[];
  has_active: boolean;
};
type Student = { id: string; name: string; grade: string };

export default function SubscriptionPage() {
  const router = useRouter();
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const [expiredNotice, setExpiredNotice] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState<string>('');

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
        const studentsRes = await apiFetch('/api/students');
        if (studentsRes.response.ok) {
          const list = (studentsRes.data.students as Student[]) || [];
          setStudents(list);
          setStudentId(
            getStudentId() && list.some((student) => student.id === getStudentId())
              ? getStudentId()!
              : list[0]?.id || '',
          );
        }
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
      if (sub.active && sub.student_id === studentId && !map.has(sub.subject)) {
        map.set(sub.subject, sub);
      }
    }
    return map;
  }, [data, studentId]);

  const hasBilling = (data?.subscriptions?.length ?? 0) > 0;
  const selectedStudent = students.find((student) => student.id === studentId) ?? null;
  const selectedGrade = selectedStudent?.grade ?? '';
  const canBuyWriting = usesWritingDashboard(selectedGrade);
  const canBuyKy1Maths = usesMathsDashboard(selectedGrade);
  const unassignedWriting = (data?.subscriptions ?? []).find(
    (subscription) =>
      subscription.subject === 'writing' && subscription.active && !subscription.student_id,
  );

  async function subscribe(subject: Subject) {
    setError(null);
    setBusy(subject);
    try {
      const res = await apiFetch('/api/subscription/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ subject, student_id: studentId }),
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

  async function assignLegacyWritingAccess() {
    if (!unassignedWriting || !studentId) return;
    setError(null);
    setBusy(`assign:${unassignedWriting.id}`);
    try {
      const res = await apiFetch('/api/subscription/assign-legacy', {
        method: 'POST',
        body: JSON.stringify({
          subscription_id: unassignedWriting.id,
          student_id: studentId,
        }),
      });
      if (!res.response.ok) {
        throw new Error(res.data.error || 'Could not assign access');
      }
      setData((current) =>
        current
          ? {
              ...current,
              subscriptions: current.subscriptions.map((subscription) =>
                subscription.id === unassignedWriting.id
                  ? { ...subscription, student_id: studentId }
                  : subscription,
              ),
            }
          : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign access');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-warm-border pb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-warm-subtle">Subscription</p>
          <h1 className="text-3xl font-semibold text-warm-ink">Choose your subjects</h1>
          <p className="mt-1 text-sm text-warm-muted">
            {canBuyKy1Maths
              ? `K–Y1 Maths is $${KY1_SUBJECT_PRICE_AUD} AUD for one year. Access lasts twelve months from the day you buy.`
              : `Selective Writing is $${SUBJECT_PRICE_AUD} AUD for one year. The paid year starts from the day you buy.`}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-[#EDF3ED]"
        >
          Back to dashboard
        </Link>
      </header>

      {expiredNotice ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Choose a subject below to continue practising.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-stone-600">Loading…</p>
      ) : (
        <>
          <label className="block max-w-sm text-sm font-medium text-warm-ink">
            Choose the child for this access
            <select
              value={studentId}
              onChange={(event) => {
                setStudentId(event.target.value);
                persistStudentId(event.target.value);
              }}
              className="mt-1 block w-full rounded-lg border border-warm-border bg-warm-card px-3 py-2 text-sm"
            >
              {students.length ? null : <option value="">Add a child first</option>}
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · {student.grade}
                </option>
              ))}
            </select>
          </label>
          {!students.length ? (
            <p className="text-sm text-warm-muted">
              Add a child profile on the <Link href="/dashboard">dashboard</Link> before purchasing access.
            </p>
          ) : null}
          {selectedStudent && canBuyKy1Maths ? (
            <p className="rounded-md border border-[#C9DDD0] bg-[#EEF6F0] px-4 py-3 text-sm text-brand-dark">
              {selectedStudent.name} is in {selectedStudent.grade}. K–Y1 Maths
              is open now at ${KY1_SUBJECT_PRICE_AUD} AUD for one year. English
              and Reading for this path are still coming soon.
            </p>
          ) : selectedStudent && !canBuyWriting ? (
            <p className="rounded-md border border-[#C9DDD0] bg-[#EEF6F0] px-4 py-3 text-sm text-brand-dark">
              {selectedStudent.name} is in {selectedStudent.grade}. Year-level
              courses for this path are not for sale yet. Selective Writing is
              for Year 4–7 profiles.
            </p>
          ) : null}
          {unassignedWriting ? (
            <section className="rounded-lg border border-terracotta bg-[#FFF8F1] p-4">
              <h2 className="font-serif text-xl font-semibold text-warm-ink">
                Assign your existing Selective Writing access
              </h2>
              <p className="mt-1 text-sm text-warm-muted">
                Your existing access is ready to be assigned once to the child selected above.
              </p>
              <button
                type="button"
                onClick={() => void assignLegacyWritingAccess()}
                disabled={!studentId || !canBuyWriting || busy === `assign:${unassignedWriting.id}`}
                className="mt-3 rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
              >
                {busy === `assign:${unassignedWriting.id}`
                  ? 'Assigning…'
                  : 'Assign access to this child'}
              </button>
            </section>
          ) : null}
        <section className="grid gap-4 sm:grid-cols-2">
          {canBuyKy1Maths
            ? [
                {
                  key: 'math',
                  subject: 'math' as const,
                  label: 'K–Y1 Maths',
                  blurb:
                    'See amounts, count, break numbers, and solve short stories. Seed Patch grows as they practise.',
                  available: true,
                  comingSoonPrice: KY1_SUBJECT_PRICE_AUD,
                },
                {
                  key: 'english',
                  subject: null,
                  label: 'English',
                  blurb:
                    'Sounds, sentences, and first writing at this year level. Notes stay short so a parent and child can read them together.',
                  available: false,
                  comingSoonPrice: KY1_SUBJECT_PRICE_AUD,
                },
                {
                  key: 'reading',
                  subject: null,
                  label: 'Reading',
                  blurb:
                    'Shared books and simple questions. Notes show what they understood, and where to look again.',
                  available: false,
                  comingSoonPrice: KY1_SUBJECT_PRICE_AUD,
                },
              ].map((offer) => {
                const active = offer.subject ? activeBySubject.get(offer.subject) : undefined;
                const price = offer.subject
                  ? priceAudForPurchase(offer.subject, selectedGrade)
                  : offer.comingSoonPrice;
                return (
                  <OfferCard
                    key={offer.key}
                    label={offer.label}
                    blurb={offer.blurb}
                    price={price}
                    available={offer.available}
                    active={active}
                    busy={offer.subject ? busy === offer.subject : false}
                    managing={managing}
                    canBuy={Boolean(studentId && offer.available)}
                    onBuy={
                      offer.subject
                        ? () => subscribe(offer.subject as Subject)
                        : undefined
                    }
                    onManage={manage}
                  />
                );
              })
            : SUBJECTS.map((subject) => {
                const active = activeBySubject.get(subject);
                const available = isPurchasableSubject(subject, selectedGrade);
                return (
                  <OfferCard
                    key={subject}
                    label={SUBJECT_LABELS[subject]}
                    blurb={SUBJECT_BLURBS[subject]}
                    price={priceAudForPurchase(subject, selectedGrade)}
                    available={available}
                    active={active}
                    busy={busy === subject}
                    managing={managing}
                    canBuy={Boolean(studentId && canBuyWriting && available)}
                    onBuy={() => subscribe(subject)}
                    onManage={manage}
                  />
                );
              })}
        </section>
        </>
      )}

      <p className="text-center text-sm text-warm-muted">
        Need access for another child?{' '}
        <span className="font-medium text-warm-ink">
          Each child needs their own yearly access.
        </span>
        {hasBilling ? (
          <>
            {' '}
            <button
              type="button"
              onClick={manage}
              disabled={managing}
              className="font-medium text-brand hover:text-brand-dark disabled:opacity-60"
            >
              View receipts
            </button>
          </>
        ) : null}
      </p>
    </main>
  );
}

function OfferCard({
  label,
  blurb,
  price,
  available,
  active,
  busy,
  managing,
  canBuy,
  onBuy,
  onManage,
}: {
  label: string;
  blurb: string;
  price: number;
  available: boolean;
  active?: SubscriptionItem;
  busy: boolean;
  managing: boolean;
  canBuy: boolean;
  onBuy?: () => void;
  onManage: () => void;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-warm-border bg-warm-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-warm-ink">{label}</h2>
          <p className="mt-1 text-sm text-warm-muted">{blurb}</p>
        </div>
        {active && active.access_kind !== 'trial' ? (
          <span className="whitespace-nowrap rounded-full bg-[#E3EFE6] px-2.5 py-0.5 text-xs font-medium text-brand-dark">
            Active
          </span>
        ) : !available ? (
          <span className="whitespace-nowrap rounded-full bg-[#F0EBE3] px-2.5 py-0.5 text-xs font-medium text-warm-muted">
            Coming soon
          </span>
        ) : null}
      </div>

      {available || active ? (
        <p className="mt-4 font-serif text-3xl font-semibold text-warm-ink">
          ${price} AUD{' '}
          <span className="text-base font-normal text-warm-subtle">/ year</span>
        </p>
      ) : (
        <p className="mt-4 font-serif text-2xl font-semibold text-warm-ink">Coming soon</p>
      )}

      {active && active.access_kind !== 'trial' ? (
        <div className="mt-4 flex-1 space-y-2 text-sm text-warm-muted">
          <p>
            Active
            {active.expires_at ? ` until ${new Date(active.expires_at).toLocaleDateString()}` : ''}.
          </p>
          <button
            type="button"
            onClick={onManage}
            disabled={managing}
            className="mt-2 rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand disabled:opacity-60"
          >
            {managing ? 'Opening…' : 'View receipts'}
          </button>
        </div>
      ) : available ? (
        <div className="mt-6 space-y-3">
          {active?.access_kind === 'trial' ? (
            <p className="text-sm text-warm-muted">
              Trial in progress
              {active.expires_at ? ` until ${new Date(active.expires_at).toLocaleDateString()}` : ''}.
              Buy a year to keep this work.
            </p>
          ) : null}
          <button
            type="button"
            onClick={onBuy}
            disabled={busy || !canBuy}
            className="w-full rounded-full bg-terracotta px-4 py-2.5 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
          >
            {busy ? 'Redirecting…' : `Buy 1 year · $${price}`}
          </button>
        </div>
      ) : (
        <p className="mt-6 border-t border-warm-divider pt-4 text-sm leading-relaxed text-warm-muted">
          We&apos;re carefully preparing this subject. It will open at the same ${price} yearly
          price.
        </p>
      )}
    </div>
  );
}
