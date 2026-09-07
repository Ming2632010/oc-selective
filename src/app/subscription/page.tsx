'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken, setStudentId as persistStudentId } from '@/lib/client-auth';
import {
  SUBJECTS,
  SUBJECT_BLURBS,
  SUBJECT_LABELS,
  SUBJECT_PRICE_AUD,
  isAvailableSubject,
  type Subject,
} from '@/lib/subjects';

type SubscriptionItem = {
  id: string;
  subject: string;
  student_id: string | null;
  status: string;
  expires_at: string | null;
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

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-warm-border pb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-warm-subtle">Subscription</p>
          <h1 className="text-3xl font-semibold text-warm-ink">Choose your subjects</h1>
          <p className="mt-1 text-sm text-warm-muted">
            Selective Writing is ${SUBJECT_PRICE_AUD} AUD for one year. Access
            lasts twelve months from the day you buy. More subjects are on the
            way.
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
        <section className="grid gap-4 sm:grid-cols-2">
          {SUBJECTS.map((subject) => {
            const active = activeBySubject.get(subject);
            const available = isAvailableSubject(subject);
            return (
              <div
                key={subject}
                className="flex flex-col rounded-lg border border-warm-border bg-warm-card p-6 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-warm-ink">
                      {SUBJECT_LABELS[subject]}
                    </h2>
                    <p className="mt-1 text-sm text-warm-muted">
                      {SUBJECT_BLURBS[subject]}
                    </p>
                  </div>
                  {active ? (
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
                    ${SUBJECT_PRICE_AUD} AUD{' '}
                    <span className="text-base font-normal text-warm-subtle">/ year</span>
                  </p>
                ) : (
                  <p className="mt-4 font-serif text-2xl font-semibold text-warm-ink">
                    Coming soon
                  </p>
                )}

                {active ? (
                  <div className="mt-4 flex-1 space-y-2 text-sm text-warm-muted">
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
                      className="mt-2 rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand disabled:opacity-60"
                    >
                      {managing ? 'Opening…' : 'View receipts'}
                    </button>
                  </div>
                ) : available ? (
                  <button
                    type="button"
                    onClick={() => subscribe(subject)}
                    disabled={busy === subject || !studentId}
                    className="mt-6 rounded-full bg-terracotta px-4 py-2.5 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
                  >
                    {busy === subject
                      ? 'Redirecting…'
                      : `Buy 1 year · $${SUBJECT_PRICE_AUD}`}
                  </button>
                ) : (
                  <p className="mt-6 border-t border-warm-divider pt-4 text-sm leading-relaxed text-warm-muted">
                    We&apos;re carefully preparing this subject. It will open at the
                    same ${SUBJECT_PRICE_AUD} yearly price.
                  </p>
                )}
              </div>
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
