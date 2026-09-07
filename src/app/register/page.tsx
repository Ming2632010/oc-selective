'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { setToken } from '@/lib/client-auth';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setToken(data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-warm-page px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-warm-border bg-warm-card p-8 shadow-card">
        <div>
          <h1 className="text-3xl font-semibold text-warm-ink">Create account</h1>
          <p className="mt-1 text-sm text-warm-muted">
            Create an account to practise for Selective and OC exams.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-warm-ink">Full name</span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-warm-border bg-warm-card px-3 py-2"
              placeholder="Parent or student name"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-warm-ink">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-warm-border bg-warm-card px-3 py-2"
              placeholder="you@example.com"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-warm-ink">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-warm-border bg-warm-card px-3 py-2"
              placeholder="At least 6 characters"
            />
          </label>

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-terracotta px-4 py-2.5 font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-warm-muted">
          Already registered?{' '}
          <Link href="/login" className="font-medium text-brand hover:text-brand-dark">
            Log in
          </Link>
        </p>
        <p className="text-center text-sm text-warm-muted">
          <Link
            href="/forgot-password"
            className="font-medium text-brand hover:text-brand-dark"
          >
            Forgot password?
          </Link>
        </p>
      </div>
    </main>
  );
}
