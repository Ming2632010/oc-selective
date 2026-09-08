import assert from 'node:assert/strict';
import test from 'node:test';
import { isMissingStripeCustomer } from './stripe-customer';

test('recognises a missing Stripe customer error', () => {
  const error = Object.assign(new Error('No such customer: cus_stale'), {
    code: 'resource_missing',
  });
  assert.equal(isMissingStripeCustomer(error), true);
});

test('does not reset a customer for unrelated Stripe errors', () => {
  const error = Object.assign(new Error('Invalid price'), {
    code: 'resource_missing',
  });
  assert.equal(isMissingStripeCustomer(error), false);
});
