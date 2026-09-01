import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
} from '@/lib/site';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  keywords: [
    'TrialSeed',
    'NSW Selective',
    'Selective High School',
    'Opportunity Class',
    'OC exam',
    'Selective exam practice',
    'Writing',
    'Math',
    'Thinking Skills',
    'Reading',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: siteUrl,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/marketing/hero-progress-chat.png',
        width: 1600,
        height: 1000,
        alt: 'A parent and child looking at TrialSeed practice progress together',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/marketing/hero-progress-chat.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en-AU">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
