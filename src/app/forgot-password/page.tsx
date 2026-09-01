'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDevResetUrl(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not send reset email');
      }

      setMessage(
        data.message ||
          'If that email is registered, we have sent a reset link.',
      );
      if (typeof data.resetUrl === 'string' && data.resetUrl) {
        setDevResetUrl(data.resetUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Forgot password</h1>
          <p className="mt-1 text-sm text-stone-600">
            Enter your account email and we will send a reset link if it is
            registered.
          </p>
        </div>

        {message ? (
          <div className="space-y-4">
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {message}
            </p>
            {devResetUrl ? (
              <p className="rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-700">
                Local development link:{' '}
                <Link href={devResetUrl} className="font-medium underline">
                  Reset password
                </Link>
              </p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-stone-800">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-stone-300 px-3 py-2"
              placeholder="you@example.com"
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
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-stone-600">
          Remembered it?{' '}
          <Link href="/login" className="font-medium text-stone-900 underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
