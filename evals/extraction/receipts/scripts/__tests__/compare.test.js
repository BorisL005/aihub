'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { compareEntry } = require('../compare');

test('AC-4: fields are compared and `_`-prefixed annotation keys are excluded', () => {
  const expected = {
    merchant: 'SOHO',
    total: 30.75,
    _note: 'same transaction printed twice on one strip - must yield ONE entry',
  };
  const actual = { merchant: 'SOHO', total: 30.75 };

  const results = compareEntry(expected, actual);

  assert.equal(results.length, 2);
  assert.ok(!results.some((r) => r.field === '_note'));
  assert.ok(results.every((r) => r.status === 'hit'));
});

test('AC-4: a wrong field value is scored as a miss', () => {
  const results = compareEntry({ merchant: 'SOHO' }, { merchant: 'Not SOHO' });
  assert.equal(results[0].status, 'miss');
});

test('AC-5: expected.total is the grand total paid; a pre-tip/subtotal figure from ' +
  'extraction is scored as a miss, never accepted as a match', () => {
  // 002 Sheraton: grand total 39.85, pre-tip subtotal 34.65 (the trap value).
  const expected = { total: 39.85 };
  const actual = { total: 34.65 };

  const results = compareEntry(expected, actual);

  assert.equal(results[0].field, 'total');
  assert.equal(results[0].status, 'miss');
});

test('AC-5: total matches only the exact grand total (float rounding tolerated, nothing else)', () => {
  const results = compareEntry({ total: 39.85 }, { total: 39.850000001 });
  assert.equal(results[0].status, 'hit');
});

test('AC-6: pair 019 — a non-null merchant from extraction is a MISS against expected ' +
  'null, never scored as a match (no hallucinated-merchant pass-through)', () => {
  // 019 is the needs_review case: merchant is unreadable, expected.merchant is null.
  const expected = { merchant: null, _expected_outcome: 'needs_review: merchant appears only as a logo' };
  const actual = { merchant: 'Confidently Wrong Restaurant Inc' };

  const results = compareEntry(expected, actual);
  const merchantResult = results.find((r) => r.field === 'merchant');

  assert.equal(merchantResult.status, 'miss');
});

test('AC-6: pair 019 — extraction correctly abstaining (null) also scores as a hit against expected null', () => {
  const results = compareEntry({ merchant: null }, { merchant: null });
  assert.equal(results[0].status, 'hit');
});

test('a field missing entirely from the extraction result is scored as a miss, not skipped', () => {
  const results = compareEntry({ merchant: 'SOHO' }, {});
  assert.equal(results.length, 1);
  assert.equal(results[0].status, 'miss');
});
