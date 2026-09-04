// Field-by-field comparator between an expected fixture and an extraction
// result entry. Pure logic, no I/O — exercised directly by tests and by
// run-eval.js once a real extractor is wired (KAN-6).
'use strict';

const NUMERIC_EPSILON = 0.005;

function isAnnotationKey(key) {
  return key.startsWith('_');
}

function deepEqual(a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < NUMERIC_EPSILON;
  }
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(a[key], b[key]));
  }
  return false;
}

// Compares one extracted entry against one expected fixture object.
// `_`-prefixed keys in `expected` are annotation metadata (README convention)
// and are excluded from comparison. `actual` field values are compared with
// strict equality (numeric fields tolerate float rounding only, never a
// looser "close enough" match) — this is what keeps a subtotal/pre-tip
// figure from ever being scored as a match against a grand-total field
// (AC-5), and keeps a non-null hallucinated value from ever being scored as
// a match against an expected `null` (AC-6).
// Returns { field, status: 'hit' | 'miss', expected, actual }[]
function compareEntry(expected, actual) {
  const results = [];
  for (const key of Object.keys(expected)) {
    if (isAnnotationKey(key)) continue;
    const expectedValue = expected[key];
    const actualValue = actual ? actual[key] : undefined;
    const hit = deepEqual(expectedValue, actualValue === undefined ? null : actualValue);
    results.push({
      field: key,
      status: hit ? 'hit' : 'miss',
      expected: expectedValue,
      actual: actualValue === undefined ? null : actualValue,
    });
  }
  return results;
}

module.exports = { compareEntry, deepEqual, isAnnotationKey, NUMERIC_EPSILON };
