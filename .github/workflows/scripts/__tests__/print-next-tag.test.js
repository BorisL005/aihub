'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SCRIPT_PATH = path.join(__dirname, '..', 'print-next-tag.js');

function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-tag-'));
  execFileSync('git', ['init', '-q', '-b', 'master'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'README.md'), 'x');
  execFileSync('git', ['add', '.'], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir });
  return dir;
}

function runScript(dir) {
  return execFileSync('node', [SCRIPT_PATH], { cwd: dir, encoding: 'utf8' });
}

test('AC-2: a repo with no vX.Y tags reachable from HEAD prints v0.1', () => {
  const dir = makeRepo();
  try {
    assert.equal(runScript(dir), 'v0.1');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('AC-3: highest tag reachable from HEAD is v0.7 -> prints v0.8', () => {
  const dir = makeRepo();
  try {
    execFileSync('git', ['tag', 'v0.1'], { cwd: dir });
    execFileSync('git', ['tag', 'v0.7'], { cwd: dir });
    execFileSync('git', ['tag', 'v0.3'], { cwd: dir });
    assert.equal(runScript(dir), 'v0.8');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a tag on an unreachable branch is ignored', () => {
  const dir = makeRepo();
  try {
    execFileSync('git', ['tag', 'v0.2'], { cwd: dir });
    execFileSync('git', ['checkout', '-q', '-b', 'side'], { cwd: dir });
    fs.writeFileSync(path.join(dir, 'other.txt'), 'y');
    execFileSync('git', ['add', '.'], { cwd: dir });
    execFileSync('git', ['commit', '-q', '-m', 'side commit'], { cwd: dir });
    execFileSync('git', ['tag', 'v9.9'], { cwd: dir });
    execFileSync('git', ['checkout', '-q', 'master'], { cwd: dir });
    assert.equal(runScript(dir), 'v0.3');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
