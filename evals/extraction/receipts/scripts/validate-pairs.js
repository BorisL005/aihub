#!/usr/bin/env node
// Validates the receipt eval fixture directory: exactly 24 complete NNN.jpg +
// NNN.expected.json pairs (001-024), no orphans, no malformed JSON.
// Exits non-zero on any problem, naming the specific NNN/file at fault, and
// writes the same failure detail to a report file (AC-8/AC-3 owner ruling:
// a validation failure must fail the job before extraction/comparison ever
// runs, but must fail loudly — this step owns producing that report, since
// the comparison step never gets to run against an incomplete set).
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_COUNT = 24;
const REPORT_FILE_NAME = 'validation-report.txt';
const ALLOWED_EXTRA_FILES = new Set(['MANIFEST.md', 'MANIFEST-002.md', 'README.md', REPORT_FILE_NAME]);
// The eval scripts themselves live alongside the synced fixtures in the same
// directory that gets validated — not an orphan, just where this tool lives.
const ALLOWED_EXTRA_DIRS = new Set(['scripts']);

function pad3(n) {
  return String(n).padStart(3, '0');
}

// Returns { ok: true } or { ok: false, problems: string[] }
function validatePairs(dir) {
  const problems = [];

  if (!fs.existsSync(dir)) {
    return { ok: false, problems: [`eval directory does not exist: ${dir}`] };
  }
  if (!fs.statSync(dir).isDirectory()) {
    return { ok: false, problems: [`eval path is not a directory: ${dir}`] };
  }

  const entries = fs.readdirSync(dir).filter((name) => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      return !ALLOWED_EXTRA_DIRS.has(name);
    }
    return true;
  });

  if (entries.length === 0) {
    return { ok: false, problems: [`eval directory is empty: ${dir}`] };
  }

  const remaining = new Set(entries);

  for (let i = 1; i <= EXPECTED_COUNT; i++) {
    const nnn = pad3(i);
    const jpgName = `${nnn}.jpg`;
    const jsonName = `${nnn}.expected.json`;

    if (!remaining.has(jpgName)) {
      problems.push(`pair ${nnn}: missing ${jpgName}`);
    } else {
      remaining.delete(jpgName);
    }

    if (!remaining.has(jsonName)) {
      problems.push(`pair ${nnn}: missing ${jsonName}`);
    } else {
      const full = path.join(dir, jsonName);
      const raw = fs.readFileSync(full, 'utf8');
      try {
        JSON.parse(raw);
      } catch (err) {
        problems.push(`pair ${nnn}: ${jsonName} is not valid JSON (${err.message})`);
      }
      remaining.delete(jsonName);
    }
  }

  for (const name of remaining) {
    if (ALLOWED_EXTRA_FILES.has(name)) continue;
    problems.push(`orphaned/unexpected file with no matching pair: ${name}`);
  }

  const pairFileCount = entries.filter((name) => !ALLOWED_EXTRA_FILES.has(name)).length;
  if (pairFileCount !== EXPECTED_COUNT * 2) {
    problems.push(
      `expected exactly ${EXPECTED_COUNT} pairs (${EXPECTED_COUNT * 2} files), found ${pairFileCount} fixture file(s)`
    );
  }

  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}

function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: validate-pairs.js <eval-dir> [report-path]');
    process.exit(1);
  }
  const reportPath = process.argv[3] || path.join(dir, REPORT_FILE_NAME);

  const result = validatePairs(dir);
  if (!result.ok) {
    const reportLines = [
      `receipt eval set validation FAILED (${result.problems.length} problem(s)):`,
      ...result.problems.map((problem) => `  - ${problem}`),
    ];
    const report = reportLines.join('\n');
    console.error(report);
    fs.writeFileSync(reportPath, `${report}\n`);
    console.error(`validation failure report written to ${reportPath}`);
    process.exit(1);
  }

  console.log(`receipt eval set validation OK: ${EXPECTED_COUNT} complete pairs found in ${dir}`);
}

module.exports = { validatePairs, EXPECTED_COUNT, ALLOWED_EXTRA_FILES, ALLOWED_EXTRA_DIRS, REPORT_FILE_NAME };

if (require.main === module) {
  main();
}
