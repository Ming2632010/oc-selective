import Link from 'next/link';
import { Menu } from 'lucide-react';

const ACCENT_BG = 'bg-indigo-600 hover:bg-indigo-700';

type MarketingHeaderProps = {
  current?: 'home' | 'selective' | 'oc';
};

export function MarketingHeader({ current }: MarketingHeaderProps) {
  const linkClass = (active: boolean) =>
    `hover:text-slate-900 ${active ? 'font-medium text-slate-900' : 'text-slate-600'}`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          TrialSeed
        </Link>

        <details className="relative lg:hidden">
          <summary className="flex cursor-pointer list-none items-center rounded-md border border-slate-200 p-2 text-slate-700 [&::-webkit-details-marker]:hidden">
            <Menu className="h-5 w-5" aria-hidden />
            <span className="sr-only">Open menu</span>
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 text-sm">
              <a href="/#features" className="text-slate-600 hover:text-slate-900">
                Features
              </a>
              <Link href="/oc-trial" className={linkClass(current === 'oc')}>
                OC Trials
              </Link>
              <Link href="/selective-trial" className={linkClass(current === 'selective')}>
                Selective Trials
              </Link>
              <a href="/#pricing" className="text-slate-600 hover:text-slate-900">
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

        <nav className="hidden items-center gap-6 text-sm lg:flex lg:gap-8">
          <a href="/#features" className="text-slate-600 hover:text-slate-900">
            Features
          </a>
          <Link href="/oc-trial" className={linkClass(current === 'oc')}>
            OC Trials
          </Link>
          <Link href="/selective-trial" className={linkClass(current === 'selective')}>
            Selective Trials
          </Link>
          <a href="/#pricing" className="text-slate-600 hover:text-slate-900">
            Pricing
          </a>
          <Link href="/login" className="text-slate-600 hover:text-slate-900">
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
  );
}
