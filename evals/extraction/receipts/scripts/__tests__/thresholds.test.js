'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { THRESHOLDS, computeAccuracy, checkThresholds } = require('../thresholds');

function scored(hitFields, missFields = []) {
  return {
    status: 'scored',
    fields: [
      ...hitFields.map((field) => ({ field, status: 'hit' })),
      ...missFields.map((field) => ({ field, status: 'miss' })),
    ],
  };
}

test('AC-6: a field with no misses across the whole set scores 100% accuracy', () => {
  const results = Array.from({ length: 24 }, () => scored(['total', 'currency', 'purchased_at', 'merchant']));
  const accuracy = computeAccuracy(results);
  assert.equal(accuracy.total, 1);
  assert.equal(accuracy.currency, 1);
  assert.equal(accuracy.purchased_at, 1);
  assert.equal(accuracy.merchant, 1);
});

test('AC-6: accuracy is hits divided by the full pair count, not just the scored ones', () => {
  const results = [
    ...Array.from({ length: 20 }, () => scored(['total'])),
    ...Array.from({ length: 4 }, () => scored([], ['total'])),
  ];
  const accuracy = computeAccuracy(results);
  assert.equal(accuracy.total, 20 / 24);
});

test('AC-7: a pair that never scored (mismatch/not_evaluated) is a miss for every gated field, ' +
  'not excluded from the denominator', () => {
  const results = [
    ...Array.from({ length: 23 }, () => scored(['total', 'currency', 'purchased_at', 'merchant'])),
    { status: 'mismatch', detail: 'extractor error: boom' },
  ];
  const accuracy = computeAccuracy(results);
  assert.equal(accuracy.total, 23 / 24);

  const notEvaluated = [
    ...Array.from({ length: 23 }, () => scored(['total', 'currency', 'purchased_at', 'merchant'])),
    { status: 'not_evaluated' },
  ];
  assert.equal(computeAccuracy(notEvaluated).total, 23 / 24);
});

test('AC-7: an unwired extractor (every pair not_evaluated) fails every threshold at 0% - a ' +
  'missing extractor is a loud failure, never a silent pass', () => {
  const results = Array.from({ length: 24 }, () => ({ status: 'not_evaluated' }));
  const result = checkThresholds(results);
  assert.equal(result.passed, false);
  assert.equal(result.failures.length, Object.keys(THRESHOLDS).length);
  assert.ok(Object.values(result.accuracy).every((value) => value === 0));
});

test('AC-7: checkThresholds passes when every field clears its own threshold', () => {
  // 90% of 24 rounds down to 21.6, so 22/24 clears both 90% thresholds; 20/24 (83%) clears
  // merchant's 80% but not currency's 95%, so give currency a clean sweep.
  const hit22 = Array.from({ length: 22 }, () => scored(['total', 'purchased_at']));
  const miss2 = Array.from({ length: 2 }, () => scored([], ['total', 'purchased_at']));
  const results = [...hit22, ...miss2].map((r, i) => ({
    ...r,
    fields: [...r.fields, { field: 'currency', status: 'hit' }, { field: 'merchant', status: 'hit' }],
  }));

  const result = checkThresholds(results);
  assert.equal(result.passed, true);
  assert.deepEqual(result.failures, []);
});

test('AC-7: checkThresholds fails and names every field below its threshold', () => {
  const results = Array.from({ length: 24 }, () => scored([], ['total', 'currency', 'purchased_at', 'merchant']));
  const result = checkThresholds(results);
  assert.equal(result.passed, false);
  assert.equal(result.failures.length, 4);
  assert.deepEqual(result.failures.map((f) => f.field).sort(), ['currency', 'merchant', 'purchased_at', 'total']);
});
