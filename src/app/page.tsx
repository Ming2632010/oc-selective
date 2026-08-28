import Link from 'next/link';
import {
  BookOpen,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  Menu,
  PenLine,
  RefreshCw,
  Shield,
  Sparkles,
} from 'lucide-react';
import {
  SUBJECT_BLURBS,
  SUBJECT_LABELS,
  SUBJECT_PRICE_AUD,
  SUBJECTS,
} from '@/lib/subjects';

const ACCENT = 'text-indigo-600';
const ACCENT_BG = 'bg-indigo-600 hover:bg-indigo-700';
const ACCENT_RING = 'ring-indigo-100';

const whyParents = [
  {
    icon: Sparkles,
    title: 'Feedback a child can use',
    body: 'Each draft is scored on structure, vocabulary, audience, and grammar — with notes on what to change next, not just a number.',
  },
  {
    icon: GraduationCap,
    title: 'Aligned to NSW exam writing',
    body: 'Units cover the text types Selective and OC students actually write: narrative, news report, persuasive text, speech, and more.',
  },
  {
    icon: CreditCard,
    title: 'Pay once. One year. No surprise renewals.',
    body: `$${SUBJECT_PRICE_AUD} AUD per subject, charged once. Access ends after 12 months. Promotion codes can be entered at checkout.`,
  },
];

const features = [
  {
    icon: ClipboardCheck,
    title: 'AI grading',
    body: 'Timed 30-minute tasks are marked against four dimensions, with a hint checklist so students can see what they covered.',
  },
  {
    icon: BookOpen,
    title: 'NSW writing standards',
    body: 'Eleven units grouped as Creative, Informative, and Persuasive — the same purposes markers look for.',
  },
  {
    icon: RefreshCw,
    title: 'Three drafts',
    body: 'Revise twice with the feedback in hand. After the third draft, high and medium sample answers unlock for comparison.',
  },
];

const stats = [
  { value: '11', label: 'Writing units, one per text type' },
  { value: '3', label: 'Drafts per prompt, with targeted notes' },
  { value: '30', label: 'Minute timed tasks, exam-style' },
  { value: `$${SUBJECT_PRICE_AUD}`, label: 'AUD one-off, one year of access' },
];

const faqs = [
  {
    q: 'Is TrialSeed for Selective, OC, or both?',
    a: 'Writing practice is built for NSW Selective and Opportunity Class exams. The same text types appear in both. Math, Thinking Skills, and Reading will follow the same subject model.',
  },
  {
    q: 'How does payment work?',
    a: `Each subject is a one-off $${SUBJECT_PRICE_AUD} AUD payment for 12 months. Nothing renews automatically. When the year ends, you can buy again if you still need access.`,
  },
  {
    q: 'Can I use a promotion code?',
    a: 'Yes. Enter it on the Stripe checkout page after you choose a subject. You do not need a code to start.',
  },
  {
    q: 'Which subjects can I buy today?',
    a: 'Writing is available now. Math, Thinking Skills, and Reading are listed at the same price and will open as those courses are ready. You only pay for a subject when you subscribe to it.',
  },
  {
    q: 'How does the AI mark writing?',
    a: 'After a draft is submitted, the app returns scores and comments on structure, vocabulary, audience, and grammar. If the AI service is unavailable, a rules-based fallback still returns a mark so practice is not blocked.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
            TrialSeed
          </Link>

          <details className="relative md:hidden">
            <summary className="flex cursor-pointer list-none items-center rounded-md border border-slate-200 p-2 text-slate-700 [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5" aria-hidden />
              <span className="sr-only">Open menu</span>
            </summary>
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 text-sm">
                <a href="#features" className="text-slate-600 hover:text-slate-900">
                  Features
                </a>
                <a href="#pricing" className="text-slate-600 hover:text-slate-900">
                  Pricing
                </a>
                <Link href="/login" className="text-slate-600 hover:text-slate-900">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className={`rounded-md px-3 py-2 text-center text-sm font-medium text-white ${ACCENT_BG}`}
                >
                  Get started
                </Link>
              </div>
            </div>
          </details>

          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#pricing" className="hover:text-slate-900">
              Pricing
            </a>
            <Link href="/login" className="hover:text-slate-900">
              Log in
            </Link>
            <Link
              href="/register"
              className={`rounded-md px-4 py-2 font-medium text-white ${ACCENT_BG}`}
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className={`text-sm font-medium uppercase tracking-wider ${ACCENT}`}>
              For Year 4–6 families in NSW
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              AI writing coach for Selective &amp; OC success
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Timed practice, clear marks, and two chances to revise — so your
              child knows what to fix before exam day. Built for parents who
              want substance, not a noisy app.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className={`inline-flex w-full items-center justify-center rounded-md px-6 py-3 text-sm font-medium text-white sm:w-auto ${ACCENT_BG}`}
              >
                Start writing practice
              </Link>
              <a
                href="#pricing"
                className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 sm:w-auto"
              >
                See pricing
              </a>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-semibold text-slate-900">
              Why parents choose TrialSeed
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Three practical reasons — not slogans.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {whyParents.map(({ icon: Icon, title, body }) => (
                <div key={title} className="space-y-3">
                  <div
                    className={`inline-flex rounded-lg bg-indigo-50 p-2.5 ring-8 ${ACCENT_RING}`}
                  >
                    <Icon className={`h-5 w-5 ${ACCENT}`} aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-semibold text-slate-900">
              How practice works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              The same loop, every session: write, mark, revise.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {features.map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <Icon className={`h-6 w-6 ${ACCENT}`} aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-16 text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-sm font-medium uppercase tracking-wider text-indigo-300">
              Built around exam conditions
            </p>
            <div className="mt-10 grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-4xl font-semibold tracking-tight">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-400">
              We do not publish a made-up “average improvement” figure. Progress
              shows on each student’s dashboard as prompts move from not started
              to completed.
            </p>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-semibold text-slate-900">
              Simple pricing
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              ${SUBJECT_PRICE_AUD} AUD per subject, one year. Buy only what you
              need. A second child is a separate purchase.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {SUBJECTS.map((subject) => {
                const available = subject === 'writing';
                return (
                  <article
                    key={subject}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">
                      {SUBJECT_LABELS[subject]}
                    </h3>
                    <p className="mt-2 flex-1 text-sm text-slate-600">
                      {SUBJECT_BLURBS[subject]}
                    </p>
                    <p className="mt-6 text-3xl font-semibold text-slate-900">
                      ${SUBJECT_PRICE_AUD}
                      <span className="text-base font-normal text-slate-500"> AUD</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-500">one-off · 12 months</p>
                    {available ? (
                      <Link
                        href="/register"
                        className={`mt-6 rounded-md px-4 py-2.5 text-center text-sm font-medium text-white ${ACCENT_BG}`}
                      >
                        Get Writing
                      </Link>
                    ) : (
                      <p className="mt-6 rounded-md bg-slate-100 px-4 py-2.5 text-center text-sm font-medium text-slate-500">
                        Coming soon
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-semibold text-slate-900">
              Questions parents ask
            </h2>
            <div className="mt-10 divide-y divide-slate-200">
              {faqs.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="cursor-pointer list-none text-left font-medium text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {item.q}
                      <span className="mt-0.5 text-slate-400 group-open:hidden">+</span>
                      <span className="mt-0.5 hidden text-slate-400 group-open:inline">−</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-2xl bg-slate-900 px-6 py-12 text-center text-white sm:px-12">
            <PenLine className="mx-auto h-8 w-8 text-indigo-300" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">Ready when they are</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
              Create an account, add a student, and start with a narrative or
              diary task. No auto-renewal, no long contract.
            </p>
            <Link
              href="/register"
              className={`mt-6 inline-flex rounded-md px-6 py-3 text-sm font-medium text-white ${ACCENT_BG}`}
            >
              Get started
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} TrialSeed. All rights reserved.</p>
          <div className="flex flex-wrap gap-6">
            <Link href="/privacy" className="hover:text-slate-800">
              Privacy
            </Link>
            <a href="mailto:hello@trialseed.com.au" className="hover:text-slate-800">
              Contact
            </a>
            <Link href="/login" className="hover:text-slate-800">
              Log in
            </Link>
          </div>
          <p className="flex items-center gap-1.5 text-xs">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            NSW Selective &amp; OC writing practice
          </p>
        </div>
      </footer>
    </div>
  );
}
