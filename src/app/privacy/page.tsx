import Link from 'next/link';

export const metadata = {
  title: 'Privacy',
  description: 'How TrialSeed stores account, practice, and payment information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-16 text-slate-700">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
        ← TrialSeed
      </Link>
      <h1 className="text-3xl font-semibold text-slate-900">Privacy</h1>
      <p>
        TrialSeed stores the account email and name you register with, student
        profiles you add, practice work, and subscription records needed to
        provide access. We use this to run the service — login, practice,
        marking, and payments — not to sell personal information.
      </p>
      <p>
        Payments are processed by Stripe. Card details are entered on Stripe’s
        checkout page and are not stored on TrialSeed servers.
      </p>
      <p>
        To ask a question about your data, email{' '}
        <a href="mailto:hello@trialseed.com.au" className="text-indigo-600 underline">
          hello@trialseed.com.au
        </a>
        .
      </p>
    </main>
  );
}
