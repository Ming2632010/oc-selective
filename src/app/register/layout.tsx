import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Create account',
  description:
    'Create a TrialSeed account to start NSW Selective, Opportunity Class, or K–Y1 practice.',
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
