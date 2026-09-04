'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WORKFLOW_PATH = path.join(
  __dirname,
  '..', '..', '..', '..', '..',
  '.github', 'workflows', 'receipt-eval.yml'
);

function readWorkflow() {
  return fs.readFileSync(WORKFLOW_PATH, 'utf8');
}

test('AC-1: the workflow syncs the eval set with the README-documented aws s3 sync command form', () => {
  const yaml = readWorkflow();
  assert.match(
    yaml,
    /aws s3 sync s3:\/\/aihub-evals\/receipts\/ \. --endpoint-url "\$R2_ENDPOINT"/
  );
});

test('AC-1: the sync step is authenticated via the three repository secrets, and no secret is echoed', () => {
  const yaml = readWorkflow();
  assert.match(yaml, /AWS_ACCESS_KEY_ID:\s*\$\{\{\s*secrets\.R2_ACCESS_KEY_ID\s*\}\}/);
  assert.match(yaml, /AWS_SECRET_ACCESS_KEY:\s*\$\{\{\s*secrets\.R2_SECRET_ACCESS_KEY\s*\}\}/);
  assert.match(yaml, /R2_ENDPOINT:\s*\$\{\{\s*secrets\.R2_ENDPOINT\s*\}\}/);
  // no debug echo of the secret-bearing env vars, and no shell tracing that
  // would expand them into the log
  assert.doesNotMatch(yaml, /echo\s+.*(AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|R2_ENDPOINT)/);
  assert.doesNotMatch(yaml, /set -x/);
});

test('AC-3: the job never skips or soft-passes past a validation failure (no continue-on-error / || true)', () => {
  const yaml = readWorkflow();
  assert.doesNotMatch(yaml, /continue-on-error/);
  assert.doesNotMatch(yaml, /\|\|\s*true/);
});

test('KAN-9: this ticket adds a separate job and does not touch the build-and-test job', () => {
  const yaml = readWorkflow();
  assert.doesNotMatch(yaml, /build-and-test/);
  assert.match(yaml, /receipt-eval-sync-validate/);

  const buildAndTestPath = path.join(path.dirname(WORKFLOW_PATH), 'build-and-test.yml');
  const buildAndTestYaml = fs.readFileSync(buildAndTestPath, 'utf8');
  assert.match(buildAndTestYaml, /build-and-test:/);
});
