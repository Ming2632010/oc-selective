import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'OC-Selective Writing Practice',
  description: 'Selective high school writing practice with timed drafts and feedback',
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
