'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { validatePairs } = require('../validate-pairs');
const { makeValidFixtureSet, cleanup } = require('./test-helpers');

const CLI_PATH = path.join(__dirname, '..', 'validate-pairs.js');

test('AC-2: exactly 24 complete pairs validates OK', () => {
  const dir = makeValidFixtureSet(24);
  try {
    const result = validatePairs(dir);
    assert.equal(result.ok, true);
  } finally {
    cleanup(dir);
  }
});

test('AC-3: missing NNN.jpg fails and names the missing pair', () => {
  const dir = makeValidFixtureSet(24);
  try {
    fs.unlinkSync(path.join(dir, '013.jpg'));
    const result = validatePairs(dir);
    assert.equal(result.ok, false);
    assert.ok(result.problems.some((p) => p.includes('013') && p.includes('013.jpg')));
  } finally {
    cleanup(dir);
  }
});

test('AC-3: missing NNN.expected.json fails and names the missing pair', () => {
  const dir = makeValidFixtureSet(24);
  try {
    fs.unlinkSync(path.join(dir, '007.expected.json'));
    const result = validatePairs(dir);
    assert.equal(result.ok, false);
    assert.ok(result.problems.some((p) => p.includes('007') && p.includes('007.expected.json')));
  } finally {
    cleanup(dir);
  }
});

test('AC-3: unparseable NNN.expected.json fails and names the file', () => {
  const dir = makeValidFixtureSet(24);
  try {
    fs.writeFileSync(path.join(dir, '009.expected.json'), '{ not valid json ');
    const result = validatePairs(dir);
    assert.equal(result.ok, false);
    assert.ok(result.problems.some((p) => p.includes('009.expected.json') && p.includes('not valid JSON')));
  } finally {
    cleanup(dir);
  }
});

test('AC-3: orphaned unpaired file fails and names the file', () => {
  const dir = makeValidFixtureSet(24);
  try {
    fs.writeFileSync(path.join(dir, '025.jpg'), Buffer.from([0xff]));
    const result = validatePairs(dir);
    assert.equal(result.ok, false);
    assert.ok(result.problems.some((p) => p.includes('025.jpg')));
  } finally {
    cleanup(dir);
  }
});

test('AC-3: a count other than 24 fails', () => {
  const dir = makeValidFixtureSet(20);
  try {
    const result = validatePairs(dir);
    assert.equal(result.ok, false);
    assert.ok(result.problems.some((p) => p.includes('expected exactly 24 pairs')));
  } finally {
    cleanup(dir);
  }
});

test('AC-3: empty directory fails', () => {
  const dir = makeValidFixtureSet(0);
  try {
    fs.unlinkSync(path.join(dir, 'README.md'));
    fs.unlinkSync(path.join(dir, 'MANIFEST.md'));
    fs.unlinkSync(path.join(dir, 'MANIFEST-002.md'));
    const result = validatePairs(dir);
    assert.equal(result.ok, false);
    assert.ok(result.problems.some((p) => p.includes('empty')));
  } finally {
    cleanup(dir);
  }
});

test('AC-3: absent directory fails', () => {
  const result = validatePairs('/nonexistent/path/does-not-exist');
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.includes('does not exist')));
});

test('AC-3: README/MANIFEST files are ignored, not treated as orphans', () => {
  const dir = makeValidFixtureSet(24);
  try {
    const result = validatePairs(dir);
    assert.equal(result.ok, true);
  } finally {
    cleanup(dir);
  }
});

test('AC-3: CLI exits non-zero on a validation failure (proves the job fails hard)', () => {
  const dir = makeValidFixtureSet(24);
  try {
    fs.unlinkSync(path.join(dir, '013.jpg'));
    const proc = spawnSync('node', [CLI_PATH, dir], { encoding: 'utf8' });
    assert.notEqual(proc.status, 0);
    assert.ok(proc.stderr.includes('013'));
  } finally {
    cleanup(dir);
  }
});

test('AC-3: CLI exits zero on a valid set', () => {
  const dir = makeValidFixtureSet(24);
  try {
    const proc = spawnSync('node', [CLI_PATH, dir], { encoding: 'utf8' });
    assert.equal(proc.status, 0);
  } finally {
    cleanup(dir);
  }
});
