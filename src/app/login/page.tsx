'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { setToken } from '@/lib/client-auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setResetNotice(params.get('reset') === '1');
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setToken(data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Log in</h1>
          <p className="mt-1 text-sm text-stone-600">
            Welcome back. Continue to your dashboard.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-stone-800">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-stone-300 px-3 py-2"
              placeholder="you@example.com"
            />
          </label>

          <div className="space-y-1">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-stone-800">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2"
                placeholder="••••••••"
              />
            </label>
            <p className="text-right text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-stone-900 underline"
              >
                Forgot password?
              </Link>
            </p>
          </div>

          {resetNotice ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Password updated. Log in with your new password.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-stone-900 px-4 py-2.5 text-white disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-stone-600">
          No account yet?{' '}
          <Link href="/register" className="font-medium text-stone-900 underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
