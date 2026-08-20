import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="max-w-lg space-y-6 text-center">
        <p className="text-sm uppercase tracking-wide text-stone-500">OC-Selective</p>
        <h1 className="text-4xl font-semibold text-stone-900">
          Writing Practice
        </h1>
        <p className="text-stone-600">
          Practise selective-style writing tasks with timed drafts, feedback, and
          revision cycles.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-md bg-stone-900 px-4 py-2.5 text-white"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-stone-900 px-4 py-2.5 text-stone-900"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
