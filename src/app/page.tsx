import Image from 'next/image';
import Link from 'next/link';
import {
  Brain,
  ClipboardCheck,
  CreditCard,
  LineChart,
  MessageCircle,
  Sparkles,
  Target,
} from 'lucide-react';
import { JsonLd } from '@/components/marketing/json-ld';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingHeader } from '@/components/marketing/header';
import {
  HOME_FAQS,
  HOME_FEATURES,
  HOME_WHY_PARENTS,
} from '@/lib/marketing-home';
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import { SUBJECT_PRICE_AUD } from '@/lib/subjects';

const ACCENT = 'text-brand';
const ACCENT_BG = 'bg-terracotta hover:bg-terracotta-hover';
const ACCENT_RING = 'ring-[#E9DDD1]';

const whyIcons = [Target, ClipboardCheck, CreditCard];
const featureIcons = [Sparkles, LineChart, MessageCircle, Brain];

export default function Home() {
  const siteUrl = getSiteUrl();

  return (
    <div className="min-h-screen bg-warm-page text-warm-ink">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: SITE_NAME,
          url: siteUrl,
          description: SITE_DESCRIPTION,
          areaServed: 'AU',
          email: 'hello@trialseed.com.au',
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: siteUrl,
          description: SITE_DESCRIPTION,
          inLanguage: 'en-AU',
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: HOME_FAQS.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a,
            },
          })),
        }}
      />
      <MarketingHeader current="home" />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div>
            <p className={`text-sm font-medium uppercase tracking-wider ${ACCENT}`}>
              NSW Selective &amp; Opportunity Class
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-warm-ink sm:text-5xl">
              NSW Selective and Opportunity Class practice, made for your child
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-warm-muted">
              TrialSeed is a calm place to practise Writing, Math, Thinking
              Skills, and Reading. Feedback shows what is already going well
              and what to try next, so the work can follow your child.
              Writing is open now, with a progress line and a chat you can
              use together. Other subjects will join as they are ready.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row">
              <Link
                href="/register"
                className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-white ${ACCENT_BG}`}
              >
                Create an account
              </Link>
              <Link
                href="/selective-trial"
                className="inline-flex items-center justify-center rounded-full border border-brand bg-warm-card px-6 py-3 text-sm font-medium text-brand hover:bg-[#EDF3ED]"
              >
                Selective Trials
              </Link>
            </div>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-warm-border bg-warm-card shadow-card">
            <Image
              src="/marketing/hero-progress-chat.png"
              alt="A parent and child looking at TrialSeed practice progress together"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
          </div>
        </section>

        <section className="border-y border-warm-border bg-warm-card py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-semibold text-warm-ink">
              Why families choose TrialSeed
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-warm-muted">
              Built for two NSW exams, with room for every subject your child
              will need.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {HOME_WHY_PARENTS.map(({ title, body }, index) => {
                const Icon = whyIcons[index];
                return (
                  <div key={title} className="space-y-3">
                    <div
                      className={`inline-flex rounded-lg bg-[#F5EEE6] p-2.5 ring-8 ${ACCENT_RING}`}
                    >
                      <Icon className={`h-5 w-5 ${ACCENT}`} aria-hidden />
                    </div>
                    <h3 className="text-lg font-semibold text-warm-ink">{title}</h3>
                    <p className="text-sm leading-relaxed text-warm-muted">{body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-semibold text-warm-ink">
              How TrialSeed helps
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-warm-muted">
              See how they are going, practise the next step, and watch
              progress over time.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {HOME_FEATURES.map(({ title, body }, index) => {
                const Icon = featureIcons[index];
                return (
                  <article
                    key={title}
                    className="rounded-lg border border-warm-border bg-warm-card p-6 shadow-card"
                  >
                    <Icon className={`h-6 w-6 ${ACCENT}`} aria-hidden />
                    <h3 className="mt-4 text-lg font-semibold text-warm-ink">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-warm-muted">
                      {body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-warm-border bg-warm-card py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-semibold text-warm-ink">
              Choose the exam they are sitting
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-warm-muted">
              Open a trial to see each subject. You can start with one and add
              more later.
            </p>
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <Link
                href="/selective-trial"
                className="group overflow-hidden rounded-lg border border-warm-border bg-warm-card shadow-card transition hover:border-[#DCCEBE]"
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src="/marketing/selective-progress-chat.png"
                    alt="A student reviewing Selective exam practice progress on a tablet"
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </div>
                <div className="p-6">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${ACCENT}`}>
                    Selective Trials
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-warm-ink">
                    NSW Selective High School
                  </h3>
                  <p className="mt-2 text-sm text-warm-muted">
                    Writing, Math, Thinking Skills, and Reading.
                  </p>
                </div>
              </Link>

              <Link
                href="/oc-trial"
                className="group overflow-hidden rounded-lg border border-warm-border bg-warm-card shadow-card transition hover:border-[#DCCEBE]"
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src="/marketing/oc-progress-chat.png"
                    alt="A parent and child looking at Opportunity Class practice progress on a tablet"
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </div>
                <div className="p-6">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${ACCENT}`}>
                    OC Trials
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-warm-ink">
                    Opportunity Class
                  </h3>
                  <p className="mt-2 text-sm text-warm-muted">
                    Math, Thinking Skills, and Reading.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-semibold text-warm-ink">Simple pricing</h2>
            <p className="mt-3 text-warm-muted">
              ${SUBJECT_PRICE_AUD} AUD per subject for a full year. Choose the
              exam and the subjects you would like. Access lasts twelve months
              from the day you buy, and we will not charge again unless you
              decide to come back.
            </p>
            <p className="mt-8 font-serif text-5xl font-semibold text-warm-ink">
              ${SUBJECT_PRICE_AUD}
              <span className="text-xl font-normal text-warm-subtle"> AUD</span>
            </p>
            <p className="mt-2 text-sm text-warm-subtle">per subject · one-off · 12 months</p>
            <Link
              href="/register"
              className={`mt-8 inline-flex rounded-full px-6 py-3 text-sm font-medium text-white ${ACCENT_BG}`}
            >
              Create an account
            </Link>
            <p className="mt-4 text-sm text-warm-subtle">
              Selective Writing is available now. Other Selective and OC
              subjects will open at the same price.
            </p>
          </div>
        </section>

        <section id="faq" className="border-t border-warm-border bg-warm-card py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-semibold text-warm-ink">
              Questions families ask
            </h2>
            <div className="mt-10 divide-y divide-warm-divider">
              {HOME_FAQS.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="cursor-pointer list-none text-left font-medium text-warm-ink marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {item.q}
                      <span className="mt-0.5 text-warm-subtle group-open:hidden">+</span>
                      <span className="mt-0.5 hidden text-warm-subtle group-open:inline">−</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-warm-muted">{item.a}</p>
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
