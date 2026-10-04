import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  hasUnsavedWriting,
  isLeaveNavigationHref,
  isReviewSavedDraftsHref,
  writingLeaveCopy,
  writingLeaveKindForHref,
} from './writing-leave';

describe('hasUnsavedWriting', () => {
  it('is false when both boxes are empty or only spaces', () => {
    assert.equal(hasUnsavedWriting('', ''), false);
    assert.equal(hasUnsavedWriting('   ', '\n\t'), false);
  });

  it('is true when the plan or the writing has text', () => {
    assert.equal(hasUnsavedWriting('hook then storm', ''), true);
    assert.equal(hasUnsavedWriting('', 'The gate slammed.'), true);
    assert.equal(hasUnsavedWriting(' notes ', '  words  '), true);
  });
});

describe('isReviewSavedDraftsHref', () => {
  it('matches the writing results path, with or without a trailing slash', () => {
    assert.equal(
      isReviewSavedDraftsHref('/dashboard/writing/85d4fcaf-e231-4453-b378-cd29351b1283/results'),
      true,
    );
    assert.equal(
      isReviewSavedDraftsHref('/dashboard/writing/85d4fcaf-e231-4453-b378-cd29351b1283/results/'),
      true,
    );
    assert.equal(
      isReviewSavedDraftsHref(
        'https://trialseed.com.au/dashboard/writing/85d4fcaf-e231-4453-b378-cd29351b1283/results?from=paper',
      ),
      true,
    );
  });

  it('does not match the paper itself or other pages', () => {
    assert.equal(
      isReviewSavedDraftsHref('/dashboard/writing/85d4fcaf-e231-4453-b378-cd29351b1283'),
      false,
    );
    assert.equal(isReviewSavedDraftsHref('/dashboard'), false);
    assert.equal(isReviewSavedDraftsHref('#results'), false);
    assert.equal(isReviewSavedDraftsHref(null), false);
  });
});

describe('isLeaveNavigationHref', () => {
  it('treats in-app paths as leaves and skips hash or mail links', () => {
    assert.equal(isLeaveNavigationHref('/dashboard'), true);
    assert.equal(isLeaveNavigationHref('/dashboard/writing/abc/results'), true);
    assert.equal(isLeaveNavigationHref('#stay'), false);
    assert.equal(isLeaveNavigationHref('mailto:hi@example.com'), false);
    assert.equal(isLeaveNavigationHref(''), false);
  });
});

describe('writingLeaveCopy', () => {
  it('uses the agreed easy-English wording', () => {
    const leave = writingLeaveCopy('leave');
    assert.equal(leave.title, 'Leave this page?');
    assert.match(leave.body, /not saved yet/);
    assert.match(leave.body, /this draft will be gone/);
    assert.equal(leave.extra, null);
    assert.equal(leave.stay, 'Stay and keep writing');
    assert.equal(leave.leave, 'Leave anyway');
  });

  it('adds a review hint when the student tapped Review saved drafts', () => {
    const review = writingLeaveCopy('review');
    assert.equal(
      review.extra,
      'You can read the last draft after you submit this sitting.',
    );
    assert.equal(writingLeaveKindForHref('/dashboard/writing/abc/results'), 'review');
    assert.equal(writingLeaveKindForHref('/dashboard'), 'leave');
  });
});
