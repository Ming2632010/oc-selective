export type WritingLeaveKind = 'review' | 'leave';

export type WritingLeaveCopy = {
  title: string;
  body: string;
  extra: string | null;
  stay: string;
  leave: string;
};

export function hasUnsavedWriting(plan: string, content: string): boolean {
  return plan.trim().length > 0 || content.trim().length > 0;
}

export function isReviewSavedDraftsHref(href: string | null | undefined): boolean {
  if (!href) return false;
  const path = hrefPathname(href);
  return /\/dashboard\/writing\/[^/]+\/results\/?$/.test(path);
}

/** In-app or same-tab navigations we can intercept with TrialSeed wording. */
export function isLeaveNavigationHref(href: string | null | undefined): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('javascript:')) {
    return false;
  }
  const protocol = trimmed.split(':')[0]?.toLowerCase();
  if (protocol === 'mailto' || protocol === 'tel') return false;
  return true;
}

export function writingLeaveCopy(kind: WritingLeaveKind): WritingLeaveCopy {
  return {
    title: 'Leave this page?',
    body: 'This writing is not saved yet. If you leave now, this draft will be gone.',
    extra:
      kind === 'review'
        ? 'You can read the last draft after you submit this sitting.'
        : null,
    stay: 'Stay and keep writing',
    leave: 'Leave anyway',
  };
}

export function writingLeaveKindForHref(href: string | null | undefined): WritingLeaveKind {
  return isReviewSavedDraftsHref(href) ? 'review' : 'leave';
}

function hrefPathname(href: string): string {
  const trimmed = href.trim();
  try {
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
      return new URL(trimmed).pathname;
    }
    if (trimmed.startsWith('//')) {
      return new URL(`https:${trimmed}`).pathname;
    }
  } catch {
    return trimmed.split(/[?#]/)[0] ?? trimmed;
  }
  return trimmed.split(/[?#]/)[0] ?? trimmed;
}
