export const SITE_NAME = 'TrialSeed';

const DEFAULT_SITE_URL = 'https://www.trialseed.com.au';

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return DEFAULT_SITE_URL;
}

export const SITE_DESCRIPTION =
  'TrialSeed helps NSW families practise for the Selective High School and Opportunity Class exams. Writing, Math, Thinking Skills, and Reading — with feedback that follows your child.';

export const SITE_TITLE = 'TrialSeed | NSW Selective and Opportunity Class practice';
