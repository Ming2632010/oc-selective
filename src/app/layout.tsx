import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'TrialSeed',
  description:
    'AI practice for NSW Selective and Opportunity Class exams. Writing, Math, Thinking Skills, and Reading — tailored to each student’s strengths and weaknesses.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
