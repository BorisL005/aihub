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
    // `_`-prefixed keys are annotation metadata at every nesting depth, not
    // just the top level `compareEntry` iterates — otherwise an annotation
    // inside a nested object (e.g. a line_items[] entry) makes the whole
    // object an automatic miss via the length guard below.
    const aKeys = Object.keys(a).filter((key) => !isAnnotationKey(key));
    const bKeys = Object.keys(b).filter((key) => !isAnnotationKey(key));
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(a[key], b[key]));
  }
  return false;
}

// AC-6's own text sets a looser bar for merchant specifically ("case-insensitive trimmed
// match") than every other field gets - total/currency/purchased_at/line_items all go through
// deepEqual's strict comparison (AC-5: "never a looser close-enough match"). Applying that
// loosening ONLY to merchant, and only when both sides are strings, keeps the null-vs-hallucinated
// check (AC-6, pair 019) exact: null is not a string, so it still falls through to deepEqual.
function merchantEqual(expectedValue, actualValue) {
  if (typeof expectedValue !== 'string' || typeof actualValue !== 'string') {
    return deepEqual(expectedValue, actualValue);
  }
  return expectedValue.trim().toLowerCase() === actualValue.trim().toLowerCase();
}

// Compares one extracted entry against one expected fixture object.
// `_`-prefixed keys in `expected` are annotation metadata (README convention)
// and are excluded from comparison. `actual` field values are compared with
// strict equality (numeric fields tolerate float rounding only, never a
// looser "close enough" match) — this is what keeps a subtotal/pre-tip
// figure from ever being scored as a match against a grand-total field
// (AC-5), and keeps a non-null hallucinated value from ever being scored as
// a match against an expected `null` (AC-6) - except `merchant`, which AC-6
// explicitly grades case-insensitive and trimmed (see merchantEqual above).
// Returns { field, status: 'hit' | 'miss', expected, actual }[]
function compareEntry(expected, actual) {
  const results = [];
  for (const key of Object.keys(expected)) {
    if (isAnnotationKey(key)) continue;
    const expectedValue = expected[key];
    const actualValue = actual ? actual[key] : undefined;
    const normalizedActual = actualValue === undefined ? null : actualValue;
    const hit = key === 'merchant'
      ? merchantEqual(expectedValue, normalizedActual)
      : deepEqual(expectedValue, normalizedActual);
    results.push({
      field: key,
      status: hit ? 'hit' : 'miss',
      expected: expectedValue,
      actual: normalizedActual,
    });
  }
  return results;
}

module.exports = { compareEntry, deepEqual, merchantEqual, isAnnotationKey, NUMERIC_EPSILON };
