import Image from 'next/image';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { buildHeaderNav, type HeaderNavItem, type ProgramId } from '@/lib/programs';

const ACCENT_BG = 'bg-terracotta hover:bg-terracotta-hover';

type MarketingHeaderProps = {
  current?: 'home' | ProgramId;
};

function itemIsActive(item: HeaderNavItem, current: MarketingHeaderProps['current']): boolean {
  if (!current || current === 'home') return false;
  if (item.type === 'link') return item.id === current;
  return item.items.some((child) => child.id === current);
}

function navLinkClass(active: boolean, variant: 'desktop' | 'mobile'): string {
  if (variant === 'desktop') {
    return `hover:text-white ${active ? 'font-medium text-white' : 'text-white/75'}`;
  }
  return active
    ? 'font-medium text-brand-dark'
    : 'text-warm-muted hover:text-brand-dark';
}

function HeaderLinks({
  current,
  variant,
}: {
  current: MarketingHeaderProps['current'];
  variant: 'desktop' | 'mobile';
}) {
  const items = buildHeaderNav();
  return (
    <>
      {items.map((item) => {
        if (item.type === 'link') {
          return (
            <Link
              key={item.id}
              href={item.href}
              className={navLinkClass(itemIsActive(item, current), variant)}
            >
              {item.label}
            </Link>
          );
        }

        if (variant === 'mobile') {
          return (
            <div key={item.id} className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-warm-subtle">
                {item.label}
              </p>
              {item.items.map((child) => (
                <Link
                  key={child.id}
                  href={child.href}
                  className={navLinkClass(child.id === current, 'mobile')}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          );
        }

        return (
          <details key={item.id} className="relative">
            <summary
              className={`cursor-pointer list-none ${navLinkClass(itemIsActive(item, current), 'desktop')} [&::-webkit-details-marker]:hidden`}
            >
              {item.label}
            </summary>
            <div className="absolute right-0 mt-2 min-w-36 rounded-lg border border-warm-border bg-warm-card p-2 text-sm text-warm-ink shadow-card">
              {item.items.map((child) => (
                <Link
                  key={child.id}
                  href={child.href}
                  className={`block rounded-md px-3 py-2 ${
                    child.id === current
                      ? 'bg-[#EDF3ED] font-medium text-brand-dark'
                      : 'text-warm-muted hover:bg-[#F5EEE6] hover:text-brand-dark'
                  }`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </details>
        );
      })}
    </>
  );
}

export function MarketingHeader({ current }: MarketingHeaderProps) {
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
              <HeaderLinks current={current} variant="mobile" />
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

        <nav className="hidden items-center gap-5 text-sm lg:flex xl:gap-8">
          <a href="/#features" className="text-white/75 hover:text-white">
            Features
          </a>
          <HeaderLinks current={current} variant="desktop" />
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
