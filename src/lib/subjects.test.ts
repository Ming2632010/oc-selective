import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isAvailableSubject,
  isPurchasableSubject,
  isSubject,
  KY1_SUBJECT_PRICE_AUD,
  priceAudForPurchase,
  priceIdForPurchase,
  priceIdForSubject,
  SUBJECT_PRICE_AUD,
} from './subjects';

describe('subscription subject availability', () => {
  it('keeps Selective Math out of the exam catalogue until that course opens', () => {
    assert.equal(isAvailableSubject('writing'), true);
    assert.equal(isAvailableSubject('math'), false);
    assert.equal(isAvailableSubject('thinking'), false);
    assert.equal(isAvailableSubject('reading'), false);
  });

  it('lets Year 4–7 buy Writing and Kindergarten/Year 1 buy Maths', () => {
    assert.equal(isPurchasableSubject('writing', 'Year 5'), true);
    assert.equal(isPurchasableSubject('writing', 'Kindergarten'), false);
    assert.equal(isPurchasableSubject('math', 'Kindergarten'), true);
    assert.equal(isPurchasableSubject('math', 'Year 1'), true);
    assert.equal(isPurchasableSubject('math', 'Year 5'), false);
    assert.equal(isPurchasableSubject('thinking', 'Year 5'), false);
  });

  it('keeps every displayed subject valid', () => {
    assert.equal(isSubject('writing'), true);
    assert.equal(isSubject('math'), true);
    assert.equal(isSubject('thinking'), true);
    assert.equal(isSubject('reading'), true);
  });

  it('keeps exam subjects at $99 and K–Y1 at $29', () => {
    assert.equal(SUBJECT_PRICE_AUD, 99);
    assert.equal(KY1_SUBJECT_PRICE_AUD, 29);
    assert.equal(priceAudForPurchase('math', 'Kindergarten'), 29);
    assert.equal(priceAudForPurchase('math', 'Year 5'), 99);
    assert.equal(priceAudForPurchase('writing', 'Year 5'), 99);
  });

  it('uses STRIPE_KY1_MATH_PRICE_ID for K–Y1 Maths, not Selective Math', () => {
    const previousKy1 = process.env.STRIPE_KY1_MATH_PRICE_ID;
    const previousMath = process.env.STRIPE_MATH_PRICE_ID;
    process.env.STRIPE_KY1_MATH_PRICE_ID = 'price_ky1_live';
    process.env.STRIPE_MATH_PRICE_ID = 'price_selective_math';
    try {
      assert.equal(priceIdForPurchase('math', 'Kindergarten'), 'price_ky1_live');
      assert.equal(priceIdForPurchase('math', 'Year 1'), 'price_ky1_live');
      assert.equal(priceIdForPurchase('math', 'Year 5'), 'price_selective_math');
      assert.equal(priceIdForSubject('math'), 'price_selective_math');
    } finally {
      if (previousKy1 === undefined) delete process.env.STRIPE_KY1_MATH_PRICE_ID;
      else process.env.STRIPE_KY1_MATH_PRICE_ID = previousKy1;
      if (previousMath === undefined) delete process.env.STRIPE_MATH_PRICE_ID;
      else process.env.STRIPE_MATH_PRICE_ID = previousMath;
    }
  });
});
