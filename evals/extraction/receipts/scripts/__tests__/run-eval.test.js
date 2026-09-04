'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { runEval, loadExtractor } = require('../run-eval');
const stubExtractor = require('../extractor');
const { makeValidFixtureSet, cleanup } = require('./test-helpers');

const PERFECT_EXTRACTOR = path.join(__dirname, 'fixtures', 'mock-extractor-perfect.js');
const DUPLICATE_020_EXTRACTOR = path.join(__dirname, 'fixtures', 'mock-extractor-duplicate-020.js');
const EMPTY_EXTRACTOR = path.join(__dirname, 'fixtures', 'mock-extractor-empty.js');
const THROWS_EXTRACTOR = path.join(__dirname, 'fixtures', 'mock-extractor-throws.js');
const MALFORMED_RETURN_EXTRACTOR = path.join(__dirname, 'fixtures', 'mock-extractor-malformed-return.js');
const CLI_PATH = path.join(__dirname, '..', 'run-eval.js');

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

test('AC-8: a per-pair extraction failure is scored as a mismatch, not a run-aborting throw — ' +
  'the report is still produced for every pair', async () => {
  const dir = makeValidFixtureSet(24);
  try {
    const extractor = loadExtractor(THROWS_EXTRACTOR);
    const results = await runEval(dir, extractor);

    assert.equal(results.length, 24);
    const pair013 = results.find((r) => r.id === '013');
    assert.equal(pair013.status, 'mismatch');
    assert.match(pair013.detail, /extractor error/);

    const others = results.filter((r) => r.id !== '013');
    assert.ok(others.every((r) => r.status === 'scored'));

    const { generateReport } = require('../report');
    const report = generateReport(results);
    assert.match(report, /24 pair\(s\) evaluated/);
    assert.match(report, /013: MISMATCH/);
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

test('QA edge case: a wired extractor that resolves to a non-array (e.g. null) for one pair ' +
  'takes down the whole run rather than being scored as a single-pair mismatch — the CLI still ' +
  'prints a report naming every pair (per AC-8) and exits non-zero, but this is coarser than the ' +
  '"throws" per-pair-isolation path and is a contract fragility KAN-6 should be aware of', async () => {
  const dir = makeValidFixtureSet(24);
  try {
    // Confirm runEval() itself rejects rather than scoring pair 005 as a
    // per-pair mismatch (unlike a thrown error from extract(), which IS
    // caught per-pair — see the THROWS_EXTRACTOR test above).
    const extractor = loadExtractor(MALFORMED_RETURN_EXTRACTOR);
    await assert.rejects(() => runEval(dir, extractor), /Cannot read propert/);

    // The CLI's outer catch (run-eval.js main()) still honors AC-8: a
    // report is printed naming every expected pair, and the process exits
    // non-zero, even though the underlying failure is a single malformed
    // pair rather than a total pipeline failure.
    const proc = spawnSync('node', [CLI_PATH, dir], {
      encoding: 'utf8',
      env: { ...process.env, EXTRACTOR_MODULE: MALFORMED_RETURN_EXTRACTOR },
    });

    assert.notEqual(proc.status, 0);
    assert.match(proc.stdout, /24 pair\(s\) evaluated/);
    assert.match(proc.stdout, /run aborted before evaluation/);
    assert.match(proc.stderr, /receipt eval run failed/);
  } finally {
    cleanup(dir);
  }
});

test('AC-8: a run that cannot even start (bad EXTRACTOR_MODULE) still prints a report ' +
  'naming every pair as aborted, and exits non-zero', () => {
  const dir = makeValidFixtureSet(24);
  try {
    const proc = spawnSync('node', [CLI_PATH, dir], {
      encoding: 'utf8',
      env: { ...process.env, EXTRACTOR_MODULE: path.join(__dirname, 'fixtures', 'does-not-exist.js') },
    });

    assert.notEqual(proc.status, 0);
    assert.match(proc.stdout, /24 pair\(s\) evaluated/);
    assert.match(proc.stdout, /run aborted before evaluation/);
    assert.match(proc.stderr, /receipt eval run failed/);
  } finally {
    cleanup(dir);
  }
});
