import Link from 'next/link';
import {
  Brain,
  BookOpen,
  Calculator,
  ClipboardCheck,
  CreditCard,
  Menu,
  PenLine,
  Shield,
  Sparkles,
  Target,
} from 'lucide-react';
import { SUBJECT_PRICE_AUD } from '@/lib/subjects';

const ACCENT = 'text-indigo-600';
const ACCENT_BG = 'bg-indigo-600 hover:bg-indigo-700';
const ACCENT_RING = 'ring-indigo-100';

type SubjectCard = {
  name: string;
  icon: typeof PenLine;
  available: boolean;
};

const selectiveSubjects: SubjectCard[] = [
  { name: 'Writing', icon: PenLine, available: true },
  { name: 'Math', icon: Calculator, available: false },
  { name: 'Thinking Skills', icon: Brain, available: false },
  { name: 'Reading', icon: BookOpen, available: false },
];

const ocSubjects: SubjectCard[] = [
  { name: 'Math', icon: Calculator, available: false },
  { name: 'Thinking Skills', icon: Brain, available: false },
  { name: 'Reading', icon: BookOpen, available: false },
];

const whyParents = [
  {
    icon: Target,
    title: 'Practice that follows the student',
    body: 'AI looks at where your child is strong and where they lose marks, then points the next task at those gaps — instead of the same worksheet for everyone.',
  },
  {
    icon: ClipboardCheck,
    title: 'Selective and OC, as they actually sit them',
    body: 'Selective Trial covers Writing, Math, Thinking Skills, and Reading. OC Trial covers Math, Thinking Skills, and Reading. Buy only the exam and subjects you need.',
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
    body: 'Choose Selective Trial or OC Trial, then add subjects. The dashboard stays with that student so a parent can see progress in one place.',
  },
  {
    icon: Brain,
    title: 'Exam-style conditions',
    body: 'Timed tasks, clear marks, and a chance to try again. Writing includes three drafts and sample answers after the last draft. Other subjects will follow the same practice loop.',
  },
];

const stats = [
  { value: '2', label: 'Exam tracks: Selective Trial and OC Trial' },
  { value: '4', label: 'Selective subjects: Writing, Math, Thinking Skills, Reading' },
  { value: '3', label: 'OC subjects: Math, Thinking Skills, Reading' },
  { value: `$${SUBJECT_PRICE_AUD}`, label: 'AUD one-off per subject, one year' },
];

const faqs = [
  {
    q: 'What is the difference between Selective Trial and OC Trial?',
    a: 'Selective Trial is for the NSW Selective High School test: Writing, Math, Thinking Skills, and Reading. OC Trial is for Opportunity Class: Math, Thinking Skills, and Reading. You choose the track that matches the exam your child is sitting.',
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

function SubjectList({ subjects }: { subjects: SubjectCard[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {subjects.map(({ name, icon: Icon, available }) => (
        <li
          key={name}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-[#FAFAFA] px-4 py-3"
        >
          <span className="flex items-center gap-3 text-sm font-medium text-slate-800">
            <Icon className={`h-4 w-4 ${ACCENT}`} aria-hidden />
            {name}
          </span>
          {available ? (
            <Link
              href="/register"
              className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${ACCENT_BG}`}
            >
              Available
            </Link>
          ) : (
            <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
              Coming soon
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

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
                <a href="#trials" className="text-slate-600 hover:text-slate-900">
                  Trials
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
            <a href="#trials" className="hover:text-slate-900">
              Trials
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
              NSW Selective &amp; Opportunity Class
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              AI practice that follows your child&apos;s strengths and weaknesses
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              TrialSeed is exam practice for Selective and OC — Writing, Math,
              Thinking Skills, and Reading — with AI that shows where a student
              is already strong and where they need work, then aims the next
              task at those gaps.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className={`inline-flex w-full items-center justify-center rounded-md px-6 py-3 text-sm font-medium text-white sm:w-auto ${ACCENT_BG}`}
              >
                Get started
              </Link>
              <a
                href="#trials"
                className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 sm:w-auto"
              >
                See Selective &amp; OC trials
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
              Built for families sitting two different exams, not a one-size
              writing app.
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

        <section id="trials" className="scroll-mt-20 border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-semibold text-slate-900">
              Choose the trial that matches the exam
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Selective and OC are different tests. The subjects below match
              what each exam covers.
            </p>
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className={`text-xs font-semibold uppercase tracking-wider ${ACCENT}`}>
                  Selective Trial
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  NSW Selective High School
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Four subjects, including Writing. For students aiming at
                  Selective placement.
                </p>
                <SubjectList subjects={selectiveSubjects} />
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className={`text-xs font-semibold uppercase tracking-wider ${ACCENT}`}>
                  OC Trial
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  Opportunity Class
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Math, Thinking Skills, and Reading — the OC test does not
                  include a writing paper.
                </p>
                <SubjectList subjects={ocSubjects} />
              </article>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-16 text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-sm font-medium uppercase tracking-wider text-indigo-300">
              Built for two NSW pathways
            </p>
            <div className="mt-10 grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-4xl font-semibold tracking-tight">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{stat.label}</p>
                </div>
              ))}
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

        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-2xl bg-slate-900 px-6 py-12 text-center text-white sm:px-12">
            <Target className="mx-auto h-8 w-8 text-indigo-300" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold">Start with the exam they are sitting</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
              Create an account, add a student, and begin Selective Writing
              today. OC and the other Selective subjects will appear in the
              same place as they open.
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
            NSW Selective &amp; OC exam practice
          </p>
        </div>
      </footer>
    </div>
  );
}
