'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getStudentId } from '@/lib/client-auth';

export default function SubscriptionConfirmPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Confirming your payment and setting up access…');

  useEffect(() => {
    const studentId = getStudentId();
    if (!studentId) {
      setMessage('Payment received. Choose the child this access is for on the subscription page.');
      return;
    }
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      const res = await apiFetch('/api/subscription/status');
      const subscriptions = Array.isArray(res.data.subscriptions) ? res.data.subscriptions : [];
      if (subscriptions.some((sub: { student_id?: string; subject?: string; active?: boolean }) =>
        sub.student_id === studentId && sub.subject === 'writing' && sub.active,
      )) {
        window.clearInterval(timer);
        router.replace('/dashboard');
      } else if (attempts >= 12) {
        window.clearInterval(timer);
        setMessage('Your payment is being confirmed. This usually takes a moment—refresh this page shortly.');
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-warm-page p-6">
      <section className="max-w-md rounded-lg border border-warm-border bg-warm-card p-8 text-center shadow-card">
        <h1 className="text-3xl">Thank you</h1>
        <p className="mt-3 text-warm-muted">{message}</p>
        <Link href="/subscription" className="mt-6 inline-block font-medium text-brand">
          Back to subscription
        </Link>
      </section>
    </main>
  );
}
