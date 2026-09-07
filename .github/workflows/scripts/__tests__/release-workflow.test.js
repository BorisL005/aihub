'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const WORKFLOW_PATH = path.join(__dirname, '..', '..', 'release.yml');

function readWorkflow() {
  return fs.readFileSync(WORKFLOW_PATH, 'utf8');
}

// Everything indented under the top-level "on:" key, up to (not including)
// the next top-level (unindented) key - whatever that key happens to be.
function getTriggerBlock(yaml) {
  const lines = yaml.split('\n');
  const onIndex = lines.findIndex((line) => line === 'on:');
  assert.ok(onIndex !== -1, 'workflow must have a top-level "on:" key');
  const blockLines = [];
  for (let i = onIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t')) break;
    blockLines.push(line);
  }
  while (blockLines.length && blockLines[blockLines.length - 1] === '') blockLines.pop();
  return blockLines.join('\n');
}

function getStep(yaml, stepName) {
  const match = yaml.match(new RegExp(`- name: ${stepName}[\\s\\S]*?(?=\\n\\s{2,6}- name:|\\n*$)`));
  assert.ok(match, `workflow must have a "${stepName}" step`);
  return match[0];
}

test('AC-1: release.yml triggers only on push to master - whitelist, not a blacklist', () => {
  const yaml = readWorkflow();
  const trigger = getTriggerBlock(yaml);
  // An equality check (rather than asserting the absence of specific unwanted
  // keys) so ANY extra trigger - workflow_dispatch, schedule, pull_request,
  // an extra branch - fails this test, not just the ones we thought to list.
  assert.equal(
    trigger,
    '  push:\n    branches:\n      - master',
    'the "on:" block must contain exactly a push trigger scoped to master and nothing else'
  );
});

test('AC-4: the workflow contains no build, image-push, ssh, or deploy step - tagging only', () => {
  const yaml = readWorkflow();
  assert.doesNotMatch(yaml, /docker\s+(build|push)/i);
  assert.doesNotMatch(yaml, /docker\/build-push-action/i);
  assert.doesNotMatch(yaml, /\bssh\b/i);
  assert.doesNotMatch(yaml, /\bdeploy\b/i);
  assert.doesNotMatch(yaml, /ghcr\.io/i);
  assert.doesNotMatch(yaml, /compose\s+(pull|up)/i);
  assert.doesNotMatch(yaml, /mvnw/i);
  assert.doesNotMatch(yaml, /npm (ci|install|run)/i);
});

test('AC-5: uses the default GITHUB_TOKEN with an explicit contents: write permission, no new secret', () => {
  const yaml = readWorkflow();
  assert.match(yaml, /^permissions:\s*\n\s*contents:\s*write/m, 'must declare contents: write');
  assert.doesNotMatch(
    yaml,
    /secrets\.(?!GITHUB_TOKEN)/,
    'must not reference any repo secret other than the default GITHUB_TOKEN'
  );
});

test('the tag-push step pushes the tag this workflow computed, via git + the default token, ' +
  'passed through env rather than interpolated straight into the shell script', () => {
  const yaml = readWorkflow();
  assert.match(yaml, /node .*print-next-tag\.js/, 'must compute the tag via the tested print-next-tag script');

  const pushStep = getStep(yaml, 'Create and push tag');
  assert.match(
    pushStep,
    /env:\s*\n\s*TAG:\s*\$\{\{\s*steps\.next_tag\.outputs\.tag\s*\}\}/,
    'the computed tag must be passed via env, not interpolated directly into the run: script'
  );
  assert.match(pushStep, /git tag "\$TAG"/);
  assert.match(pushStep, /git push origin "\$TAG"/);
});

test('regression guard: "Compute next tag" captures the script output into a variable first, ' +
  'so a script failure fails THIS step rather than being swallowed by echo', () => {
  const yaml = readWorkflow();
  const computeStep = getStep(yaml, 'Compute next tag');

  assert.match(computeStep, /set -euo pipefail/, 'must fail fast if the tag script fails');
  assert.match(
    computeStep,
    /tag=\$\(node .*print-next-tag\.js\)/,
    'must capture the script output into a variable on its own line'
  );
  assert.match(computeStep, /echo "tag=\$tag" >> "\$GITHUB_OUTPUT"/);
  assert.doesNotMatch(
    computeStep,
    /echo "tag=\$\(node/,
    'must not echo a command substitution directly - "echo tag=$(...)" always exits 0 ' +
      "regardless of the script's own exit status, hiding a real failure behind a green step"
  );
});

test('regression guard: the compute-step\'s own shell pattern actually propagates a script failure ' +
  '(exercised for real in bash, not just asserted as text)', () => {
  // Same shape as the "Compute next tag" step: set -euo pipefail, then
  // capture a failing command's output into a variable before using it.
  const script = `
    set -euo pipefail
    tag=$(node -e "process.exit(7)")
    echo "tag=$tag"
  `;
  const result = spawnSync('bash', ['-c', script]);
  assert.notEqual(result.status, 0, 'the step must fail when the underlying script fails');

  // Prove the OLD (buggy) shape by contrast: echoing the substitution
  // directly swallows the failure and exits 0.
  const buggyScript = `
    set -euo pipefail
    echo "tag=$(node -e "process.exit(7)")"
  `;
  const buggyResult = spawnSync('bash', ['-c', buggyScript]);
  assert.equal(buggyResult.status, 0, 'documents the bug this fix avoids: echo masks the substitution\'s exit code');
});

test('checkout uses full tag history (fetch-depth: 0) so "reachable from master" can be computed', () => {
  const yaml = readWorkflow();
  assert.match(yaml, /fetch-depth:\s*0/);
});
