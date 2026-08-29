import Image from 'next/image';
import Link from 'next/link';
import {
  Brain,
  ClipboardCheck,
  CreditCard,
  Sparkles,
  Target,
} from 'lucide-react';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingHeader } from '@/components/marketing/header';
import { SUBJECT_PRICE_AUD } from '@/lib/subjects';

const ACCENT = 'text-indigo-600';
const ACCENT_BG = 'bg-indigo-600 hover:bg-indigo-700';
const ACCENT_RING = 'ring-indigo-100';

const whyParents = [
  {
    icon: Target,
    title: 'Practice that follows the student',
    body: 'AI looks at where your child is strong and where they lose marks, then points the next task at those gaps — instead of the same worksheet for everyone.',
  },
  {
    icon: ClipboardCheck,
    title: 'Selective and OC, as they actually sit them',
    body: 'Selective Trials cover Writing, Math, Thinking Skills, and Reading. OC Trials cover Math, Thinking Skills, and Reading. Buy only the exam and subjects you need.',
  },
  {
    icon: CreditCard,
    title: 'Pay once. One year. No surprise renewals.',
    body: `$${SUBJECT_PRICE_AUD} AUD per subject, charged once. Access ends after 12 months. Promotion codes can be entered at checkout.`,
  },
];

const features = [
  {
    icon: Sparkles,
    title: 'Strengths and weaknesses, not a single score',
    body: 'After each task, AI feedback shows what is already working and what to fix next. Writing does this today on structure, vocabulary, audience, and grammar. Other subjects will use the same idea.',
  },
  {
    icon: ClipboardCheck,
    title: 'Two exam tracks',
    body: 'Open Selective Trials or OC Trials, then add subjects. The dashboard stays with that student so a parent can see progress in one place.',
  },
  {
    icon: Brain,
    title: 'Exam-style conditions',
    body: 'Timed tasks, clear marks, and a chance to try again. Writing includes three drafts and sample answers after the last draft. Other subjects will follow the same practice loop.',
  },
];

const faqs = [
  {
    q: 'What is the difference between Selective Trials and OC Trials?',
    a: 'Selective Trials are for the NSW Selective High School test: Writing, Math, Thinking Skills, and Reading. OC Trials are for Opportunity Class: Math, Thinking Skills, and Reading. You choose the track that matches the exam your child is sitting.',
  },
  {
    q: 'How does the AI help my child?',
    a: 'It does not replace a tutor. It marks the work and highlights strengths and weaknesses so the next session is aimed at the gaps. Writing already returns notes on structure, vocabulary, audience, and grammar. Math, Thinking Skills, and Reading will use the same approach as those courses open.',
  },
  {
    q: 'How does payment work?',
    a: `Each subject is a one-off $${SUBJECT_PRICE_AUD} AUD payment for 12 months. Nothing renews automatically. You only pay for subjects you add. A second child is a separate purchase.`,
  },
  {
    q: 'Which subjects can I use today?',
    a: 'Selective Writing is open now. Selective Math, Thinking Skills, and Reading, and all OC Trial subjects, will open as those courses are ready. You are not charged for a subject until you buy it.',
  },
  {
    q: 'Can I use a promotion code?',
    a: 'Yes. Enter it on the Stripe checkout page after you choose a subject.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800">
      <MarketingHeader current="home" />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div>
            <p className={`text-sm font-medium uppercase tracking-wider ${ACCENT}`}>
              NSW Selective &amp; Opportunity Class
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              AI practice that follows your child&apos;s strengths and weaknesses
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Two exam tracks — Selective Trials and OC Trials — covering
              Writing, Math, Thinking Skills, and Reading. AI shows where a
              student is already strong and where they need work, then aims
              the next task at those gaps.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row">
              <Link
                href="/register"
                className={`inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium text-white ${ACCENT_BG}`}
              >
                Get started
              </Link>
              <Link
                href="/selective-trial"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Selective Trials
              </Link>
            </div>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
            <Image
              src="/marketing/hero-family-study.png"
              alt="Parent and child working through practice at the kitchen table"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-semibold text-slate-900">
              Why parents choose TrialSeed
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Built for families sitting two different exams.
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
              How TrialSeed helps
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              See the pattern, practise the gap, try again.
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

        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-semibold text-slate-900">
              Choose the exam they are sitting
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Open a trial to see subjects in blocks — only buy what you need.
            </p>
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <Link
                href="/selective-trial"
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src="/marketing/selective-study.png"
                    alt="Student preparing for the Selective exam"
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </div>
                <div className="p-6">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${ACCENT}`}>
                    Selective Trials
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                    NSW Selective High School
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Writing, Math, Thinking Skills, and Reading.
                  </p>
                </div>
              </Link>

              <Link
                href="/oc-trial"
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src="/marketing/oc-study.png"
                    alt="Younger student preparing for the OC exam"
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </div>
                <div className="p-6">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${ACCENT}`}>
                    OC Trials
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                    Opportunity Class
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Math, Thinking Skills, and Reading. No writing paper.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-semibold text-slate-900">Simple pricing</h2>
            <p className="mt-3 text-slate-600">
              ${SUBJECT_PRICE_AUD} AUD per subject, one year. Pay only for the
              exam track and subjects you add. Nothing auto-renews.
            </p>
            <p className="mt-8 text-5xl font-semibold text-slate-900">
              ${SUBJECT_PRICE_AUD}
              <span className="text-xl font-normal text-slate-500"> AUD</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">per subject · one-off · 12 months</p>
            <Link
              href="/register"
              className={`mt-8 inline-flex rounded-md px-6 py-3 text-sm font-medium text-white ${ACCENT_BG}`}
            >
              Get started with Selective Writing
            </Link>
            <p className="mt-4 text-sm text-slate-500">
              Selective Writing is available now. Other Selective and OC
              subjects will open at the same price.
            </p>
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
      </main>

      <MarketingFooter />
    </div>
  );
}
