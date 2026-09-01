import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HOME_FAQS, HOME_FEATURES, HOME_WHY_PARENTS } from './marketing-home';
import { SITE_DESCRIPTION, SITE_TITLE, getSiteUrl } from './site';

const publicCopy = [
  SITE_TITLE,
  SITE_DESCRIPTION,
  ...HOME_WHY_PARENTS.flatMap((item) => [item.title, item.body]),
  ...HOME_FEATURES.flatMap((item) => [item.title, item.body]),
  ...HOME_FAQS.flatMap((item) => [item.q, item.a]),
].join('\n');

describe('public marketing copy', () => {
  it('does not tell families there is no writing paper', () => {
    assert.doesNotMatch(publicCopy, /no writing paper/i);
  });

  it('does not describe TrialSeed as writing-only practice', () => {
    assert.doesNotMatch(publicCopy, /writing practice dashboard/i);
    assert.doesNotMatch(publicCopy, /selective-style writing tasks/i);
  });

  it('keeps Selective and OC in the site title and description', () => {
    assert.match(SITE_TITLE, /Selective/);
    assert.match(SITE_TITLE, /Opportunity Class/);
    assert.match(SITE_DESCRIPTION, /Selective/);
    assert.match(SITE_DESCRIPTION, /Opportunity Class/);
    assert.match(SITE_DESCRIPTION, /Writing, Math, Thinking Skills, and Reading/);
  });
});

describe('getSiteUrl', () => {
  it('does not publish localhost URLs for search engines', () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    try {
      assert.equal(getSiteUrl(), 'https://www.trialseed.com.au');
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = previous;
      }
    }
  });
});
