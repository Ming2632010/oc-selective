import Link from 'next/link';
import { Shield } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer className="border-t border-warm-border bg-warm-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-warm-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} TrialSeed. All rights reserved.</p>
        <div className="flex flex-wrap gap-6">
          <Link href="/privacy" className="text-warm-muted hover:text-brand-dark">
            Privacy
          </Link>
          <a href="mailto:hello@trialseed.com.au" className="text-warm-muted hover:text-brand-dark">
            Contact
          </a>
          <Link href="/login" className="text-warm-muted hover:text-brand-dark">
            Log in
          </Link>
        </div>
        <p className="flex items-center gap-1.5 text-xs">
          <Shield className="h-3.5 w-3.5" aria-hidden />
          NSW Selective &amp; OC exam practice
        </p>
      </div>
    </footer>
  );
}
