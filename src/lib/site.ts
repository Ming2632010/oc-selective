export const SITE_NAME = 'TrialSeed';

const DEFAULT_SITE_URL = 'https://www.trialseed.com.au';

function isLocalHost(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    const cleaned = configured.replace(/\/$/, '');
    if (!isLocalHost(cleaned)) {
      return cleaned;
    }
  }
  return DEFAULT_SITE_URL;
}

export const SITE_DESCRIPTION =
  'TrialSeed helps NSW families practise for the Selective High School and Opportunity Class exams. Writing, Math, Thinking Skills, and Reading — with feedback that follows your child.';

export const SITE_TITLE = 'TrialSeed | NSW Selective and Opportunity Class practice';
