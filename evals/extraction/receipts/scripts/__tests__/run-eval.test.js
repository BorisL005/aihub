'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { runEval, loadExtractor } = require('../run-eval');
const stubExtractor = require('../extractor');
const { makeValidFixtureSet, cleanup } = require('./test-helpers');

const PERFECT_EXTRACTOR = path.join(__dirname, 'fixtures', 'mock-extractor-perfect.js');
const DUPLICATE_020_EXTRACTOR = path.join(__dirname, 'fixtures', 'mock-extractor-duplicate-020.js');
const EMPTY_EXTRACTOR = path.join(__dirname, 'fixtures', 'mock-extractor-empty.js');

test('no extractor wired: every pair is reported "not evaluated", never a fabricated score', async () => {
  const dir = makeValidFixtureSet(24);
  try {
    const results = await runEval(dir, stubExtractor);
    assert.equal(results.length, 24);
    assert.ok(results.every((r) => r.status === 'not_evaluated'));
  } finally {
    cleanup(dir);
  }
});

test('AC-9: run-eval accepts a swapped-in extractor module without changing sync/validate', async () => {
  const dir = makeValidFixtureSet(24);
  try {
    const extractor = loadExtractor(PERFECT_EXTRACTOR);
    const results = await runEval(dir, extractor);
    assert.equal(results.length, 24);
    assert.ok(results.every((r) => r.status === 'scored'));
    assert.ok(results.every((r) => r.fields.every((f) => f.status === 'hit')));
  } finally {
    cleanup(dir);
  }
});

test('AC-7: pair 020 — two entries from one photo score as a mismatch, not two hits', async () => {
  const dir = makeValidFixtureSet(24);
  try {
    const extractor = loadExtractor(DUPLICATE_020_EXTRACTOR);
    const results = await runEval(dir, extractor);

    const pair020 = results.find((r) => r.id === '020');
    assert.equal(pair020.status, 'mismatch');
    assert.match(pair020.detail, /2 entries/);

    // every other pair still scores normally (one entry each)
    const others = results.filter((r) => r.id !== '020');
    assert.ok(others.every((r) => r.status === 'scored'));
  } finally {
    cleanup(dir);
  }
});

test('a wired extractor returning zero entries is a mismatch, not "not evaluated"', async () => {
  const dir = makeValidFixtureSet(24);
  try {
    const extractor = loadExtractor(EMPTY_EXTRACTOR);
    const results = await runEval(dir, extractor);
    assert.ok(results.every((r) => r.status === 'mismatch' && /no entries/.test(r.detail)));
  } finally {
    cleanup(dir);
  }
});

test('AC-8: report states the total pair count (24) and the partial-set batch-003 note', async () => {
  const dir = makeValidFixtureSet(24);
  try {
    const { generateReport } = require('../report');
    const results = await runEval(dir, stubExtractor);
    const report = generateReport(results);

    assert.match(report, /24 pair\(s\) evaluated/);
    assert.match(report, /batches 001-002/);
    assert.match(report, /30-50 target/);
    assert.match(report, /Batch 003/);
    assert.match(report, /Polish fiscal/);
  } finally {
    cleanup(dir);
  }
});
