import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Create account',
  description:
    'Create a TrialSeed account to practise for the NSW Selective High School and Opportunity Class exams.',
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
