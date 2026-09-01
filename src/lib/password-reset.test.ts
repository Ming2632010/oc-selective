import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  GENERIC_FORGOT_MESSAGE,
  RESET_TTL_MS,
  buildResetUrl,
  generateResetToken,
  hashResetToken,
  isResetExpired,
  shouldExposeDevResetUrl,
} from './password-reset';

describe('hashResetToken', () => {
  it('returns a stable 64-character hex digest', () => {
    const first = hashResetToken('reset-token');
    const second = hashResetToken('reset-token');
    assert.equal(first, second);
    assert.equal(first.length, 64);
    assert.match(first, /^[a-f0-9]+$/);
  });

  it('changes when the raw token changes', () => {
    assert.notEqual(hashResetToken('token-a'), hashResetToken('token-b'));
  });
});

describe('generateResetToken', () => {
  it('returns unique 64-character hex strings', () => {
    const tokens = Array.from({ length: 8 }, () => generateResetToken());
    assert.equal(new Set(tokens).size, 8);
    for (const token of tokens) {
      assert.equal(token.length, 64);
      assert.match(token, /^[a-f0-9]+$/);
    }
  });
});

describe('isResetExpired', () => {
  it('treats tokens as valid until the expiry instant', () => {
    const now = new Date('2026-09-01T00:00:00.000Z');
    const later = new Date(now.getTime() + RESET_TTL_MS);
    assert.equal(isResetExpired(later, now), false);
    assert.equal(isResetExpired(now, now), true);
    assert.equal(isResetExpired(new Date(now.getTime() - 1), now), true);
  });
});

describe('buildResetUrl', () => {
  it('uses NEXT_PUBLIC_APP_URL when set', () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.trialseed.com.au/';
    try {
      assert.equal(
        buildResetUrl('abc123'),
        'https://www.trialseed.com.au/reset-password?token=abc123',
      );
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = previous;
      }
    }
  });
});

describe('forgot-password copy', () => {
  it('does not reveal whether an email exists', () => {
    assert.match(GENERIC_FORGOT_MESSAGE, /if that email is registered/i);
  });

  it('only exposes the reset URL outside production', () => {
    const env = process.env as { NODE_ENV?: string };
    const previous = env.NODE_ENV;
    try {
      env.NODE_ENV = 'development';
      assert.equal(shouldExposeDevResetUrl(), true);
      env.NODE_ENV = 'production';
      assert.equal(shouldExposeDevResetUrl(), false);
    } finally {
      env.NODE_ENV = previous;
    }
  });
});
