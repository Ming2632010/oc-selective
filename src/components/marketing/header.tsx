import Image from 'next/image';
import Link from 'next/link';
import { Menu } from 'lucide-react';

const ACCENT_BG = 'bg-terracotta hover:bg-terracotta-hover';

type MarketingHeaderProps = {
  current?: 'home' | 'selective' | 'oc';
};

export function MarketingHeader({ current }: MarketingHeaderProps) {
  const linkClass = (active: boolean) =>
    `hover:text-white ${active ? 'font-medium text-white' : 'text-white/75'}`;

  return (
    <header className="sticky top-0 z-30 border-b border-brand-dark bg-brand text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-white"
        >
          <Image
            src="/brand/trialseed-logo.jpg"
            alt=""
            width={36}
            height={36}
            priority
            className="rounded-md"
          />
          <span>TrialSeed</span>
        </Link>

        <details className="relative lg:hidden">
          <summary className="flex cursor-pointer list-none items-center rounded-lg border border-white/30 p-2 text-white [&::-webkit-details-marker]:hidden">
            <Menu className="h-5 w-5" aria-hidden />
            <span className="sr-only">Open menu</span>
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-warm-border bg-warm-card p-3 text-warm-ink shadow-card">
            <div className="flex flex-col gap-3 text-sm">
              <a href="/#features" className="text-warm-muted hover:text-brand-dark">
                Features
              </a>
              <Link
                href="/oc-trial"
                className={current === 'oc' ? 'font-medium text-brand-dark' : 'text-warm-muted hover:text-brand-dark'}
              >
                OC Trials
              </Link>
              <Link
                href="/selective-trial"
                className={
                  current === 'selective'
                    ? 'font-medium text-brand-dark'
                    : 'text-warm-muted hover:text-brand-dark'
                }
              >
                Selective Trials
              </Link>
              <a href="/#pricing" className="text-warm-muted hover:text-brand-dark">
                Pricing
              </a>
              <Link href="/login" className="text-warm-muted hover:text-brand-dark">
                Log in
              </Link>
              <Link
                href="/register"
                className={`rounded-full px-3 py-2 text-center text-sm font-medium text-white ${ACCENT_BG}`}
              >
                Get started
              </Link>
            </div>
          </div>
        </details>

        <nav className="hidden items-center gap-6 text-sm lg:flex lg:gap-8">
          <a href="/#features" className="text-white/75 hover:text-white">
            Features
          </a>
          <Link href="/oc-trial" className={linkClass(current === 'oc')}>
            OC Trials
          </Link>
          <Link href="/selective-trial" className={linkClass(current === 'selective')}>
            Selective Trials
          </Link>
          <a href="/#pricing" className="text-white/75 hover:text-white">
            Pricing
          </a>
          <Link href="/login" className="text-white/75 hover:text-white">
            Log in
          </Link>
          <Link
            href="/register"
            className={`rounded-full px-4 py-2 font-medium text-white ${ACCENT_BG}`}
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
