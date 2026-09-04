'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..', '..');
const WORKFLOW_PATH = path.join(REPO_ROOT, '.github', 'workflows', 'receipt-eval.yml');
const README_PATH = path.join(REPO_ROOT, 'evals', 'extraction', 'receipts', 'README.md');

function readWorkflow() {
  return fs.readFileSync(WORKFLOW_PATH, 'utf8');
}

// Reads the actual sync step's working-directory and command out of the
// workflow, resolves its destination against that working-directory, and
// compares the result to the destination the README documents — so a change
// to either file without the other is caught, instead of both sides being
// asserted independently against a hardcoded string neither one owns.
test('AC-1: the workflow syncs the eval set with the README-documented aws s3 sync command form', () => {
  const yaml = readWorkflow();
  const readme = fs.readFileSync(README_PATH, 'utf8');

  const readmeMatch = readme.match(/aws s3 sync (\S+) (\S+) --endpoint-url "\$R2_ENDPOINT"/);
  assert.ok(readmeMatch, 'README must document the aws s3 sync command form');
  const [, readmeSource, readmeDest] = readmeMatch;

  const syncStepMatch = yaml.match(
    /Sync eval set from R2[\s\S]*?working-directory:\s*(\S+)[\s\S]*?run:\s*aws s3 sync (\S+) (\S+) --endpoint-url "\$R2_ENDPOINT"/
  );
  assert.ok(syncStepMatch, 'workflow must have a "Sync eval set from R2" step running aws s3 sync');
  const [, workingDir, workflowSource, workflowDest] = syncStepMatch;

  assert.equal(workflowSource, readmeSource, 'sync source bucket/prefix must match the README');

  const resolvedDest = `${path.posix.normalize(path.posix.join(workingDir, workflowDest))}/`;
  assert.equal(
    resolvedDest,
    readmeDest,
    'sync destination, resolved against the step\'s working-directory, must match the README-documented path'
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
