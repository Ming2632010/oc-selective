'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not reset password');
      }

      router.push('/login?reset=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <>
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Reset password</h1>
          <p className="mt-1 text-sm text-stone-600">
            This reset link is missing or invalid.
          </p>
        </div>
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Request a new reset link to continue.
        </p>
        <p className="text-center text-sm text-stone-600">
          <Link
            href="/forgot-password"
            className="font-medium text-stone-900 underline"
          >
            Forgot password
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Reset password</h1>
        <p className="mt-1 text-sm text-stone-600">
          Choose a new password for your TrialSeed account.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-stone-800">New password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
            placeholder="At least 6 characters"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-stone-800">Confirm password</span>
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
            placeholder="Re-enter new password"
          />
        </label>

        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-stone-900 px-4 py-2.5 text-white disabled:opacity-60"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <p className="text-center text-sm text-stone-600">
        <Link href="/login" className="font-medium text-stone-900 underline">
          Back to log in
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <Suspense
          fallback={
            <p className="text-sm text-stone-600">Loading reset form…</p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
