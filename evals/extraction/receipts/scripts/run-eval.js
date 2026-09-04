#!/usr/bin/env node
// Orchestrates the per-pair comparison step: for each of the 24 validated
// pairs, invokes the (swappable) extractor and scores its result against
// the expected fixture, then prints a report.
//
// This does not gate CI on accuracy — per-field thresholds are explicitly
// out of scope for KAN-10 (KAN-6's job). A non-zero exit here means the
// pipeline itself failed to run (bad fixtures, extractor crash), not that
// extraction was inaccurate.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { compareEntry } = require('./compare');
const { generateReport } = require('./report');
const { EXPECTED_COUNT } = require('./validate-pairs');

function pad3(n) {
  return String(n).padStart(3, '0');
}

function loadExtractor(extractorModulePath) {
  const resolved = extractorModulePath
    ? path.resolve(extractorModulePath)
    : path.join(__dirname, 'extractor.js');
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(resolved);
}

async function runEval(dir, extractor) {
  const results = [];

  for (let i = 1; i <= EXPECTED_COUNT; i++) {
    const nnn = pad3(i);
    const jpgPath = path.join(dir, `${nnn}.jpg`);
    const jsonPath = path.join(dir, `${nnn}.expected.json`);
    const expected = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    if (!extractor.wired) {
      results.push({ id: nnn, status: 'not_evaluated' });
      continue;
    }

    const entries = await extractor.extract(jpgPath);

    if (entries.length === 0) {
      results.push({ id: nnn, status: 'mismatch', detail: 'no entries returned by extractor' });
      continue;
    }
    if (entries.length > 1) {
      results.push({
        id: nnn,
        status: 'mismatch',
        detail: `${entries.length} entries returned for a single transaction (duplicate?)`,
      });
      continue;
    }

    const fields = compareEntry(expected, entries[0]);
    results.push({ id: nnn, status: 'scored', fields });
  }

  return results;
}

async function main() {
  const dir = process.argv[2];
  const extractorModulePath = process.env.EXTRACTOR_MODULE;

  if (!dir) {
    console.error('usage: run-eval.js <eval-dir>');
    process.exit(1);
  }

  const extractor = loadExtractor(extractorModulePath);
  const results = await runEval(dir, extractor);
  console.log(generateReport(results));
}

module.exports = { runEval, loadExtractor };

if (require.main === module) {
  main().catch((err) => {
    console.error(`receipt eval run failed: ${err.message}`);
    process.exit(1);
  });
}
