import Link from 'next/link';
import { Shield } from 'lucide-react';

export function MarketingFooter() {
  return (
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
  );
}
