'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { computeNextTag } = require('../compute-next-tag');

test('AC-2: no vX.Y tag exists yet -> first tag is v0.1', () => {
  assert.equal(computeNextTag([]), 'v0.1');
});

test('AC-2: unrelated tags present but no vX.Y tag -> still v0.1', () => {
  assert.equal(computeNextTag(['not-a-release', 'v1', 'v1.2.3']), 'v0.1');
});

test('AC-3: highest existing tag is v0.7 -> next tag is v0.8 (Y+1, X unchanged)', () => {
  assert.equal(computeNextTag(['v0.1', 'v0.5', 'v0.7']), 'v0.8');
});

test('AC-3: comparison is numeric, not lexicographic (v0.10 outranks v0.9)', () => {
  assert.equal(computeNextTag(['v0.9', 'v0.10']), 'v0.11');
});

test('AC-3: highest minor wins regardless of input order', () => {
  assert.equal(computeNextTag(['v0.3', 'v0.10', 'v0.7']), 'v0.11');
});

test('major version is never bumped by this ticket\'s logic', () => {
  assert.equal(computeNextTag(['v2.4']), 'v2.5');
});
