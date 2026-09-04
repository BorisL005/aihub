#!/usr/bin/env node
// Validates the receipt eval fixture directory: exactly 24 complete NNN.jpg +
// NNN.expected.json pairs (001-024), no orphans, no malformed JSON.
// Exits non-zero on any problem, naming the specific NNN/file at fault.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_COUNT = 24;
const ALLOWED_EXTRA_FILES = new Set(['MANIFEST.md', 'MANIFEST-002.md', 'README.md']);

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
    return fs.statSync(full).isFile();
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
    console.error('usage: validate-pairs.js <eval-dir>');
    process.exit(1);
  }

  const result = validatePairs(dir);
  if (!result.ok) {
    console.error(`receipt eval set validation FAILED (${result.problems.length} problem(s)):`);
    for (const problem of result.problems) {
      console.error(`  - ${problem}`);
    }
    process.exit(1);
  }

  console.log(`receipt eval set validation OK: ${EXPECTED_COUNT} complete pairs found in ${dir}`);
}

module.exports = { validatePairs, EXPECTED_COUNT, ALLOWED_EXTRA_FILES };

if (require.main === module) {
  main();
}
