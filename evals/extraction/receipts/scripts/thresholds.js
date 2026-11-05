// AC-6/AC-7's CI gate: per-field accuracy against the gated set, computed over every expected
// pair (not just the ones that scored) - a pair that crashed the extractor or was never
// evaluated is a miss for every gated field, not an exemption from the denominator. Pure logic,
// no I/O, so it is testable without a real extractor or network access.
'use strict';

// AC-6. `line_items` is deliberately absent - reported but not gated in v1.
const THRESHOLDS = {
  total: 0.90,
  currency: 0.95,
  purchased_at: 0.90,
  merchant: 0.80,
};

// pairResults: the same shape run-eval.js's runEval() produces.
// Returns { field: accuracy (0-1) } for every gated field.
function computeAccuracy(pairResults) {
  const totalPairs = pairResults.length;
  const hits = Object.fromEntries(Object.keys(THRESHOLDS).map((field) => [field, 0]));

  for (const result of pairResults) {
    if (result.status !== 'scored') continue;
    for (const field of result.fields) {
      if (field.status === 'hit' && Object.prototype.hasOwnProperty.call(hits, field.field)) {
        hits[field.field] += 1;
      }
    }
  }

  const accuracy = {};
  for (const field of Object.keys(THRESHOLDS)) {
    accuracy[field] = totalPairs === 0 ? 0 : hits[field] / totalPairs;
  }
  return accuracy;
}

// Returns { accuracy, failures: [{field, actual, min}], passed: boolean }
function checkThresholds(pairResults) {
  const accuracy = computeAccuracy(pairResults);
  const failures = [];
  for (const [field, min] of Object.entries(THRESHOLDS)) {
    if (accuracy[field] < min) {
      failures.push({ field, actual: accuracy[field], min });
    }
  }
  return { accuracy, failures, passed: failures.length === 0 };
}

module.exports = { THRESHOLDS, computeAccuracy, checkThresholds };
