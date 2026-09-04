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

test('AC-8: the report is produced on a validation failure too, not just success or an ' +
  'in-run-eval failure (a hard "Validate synced eval set" failure must not silently skip ' +
  'the "Run per-pair comparison"/report step)', () => {
  const yaml = readWorkflow();

  const compareStepMatch = yaml.match(/- name: Run per-pair comparison[\s\S]*?(?=\n\s{2,6}- name:|\n*$)/);
  assert.ok(compareStepMatch, 'workflow must have a "Run per-pair comparison" step');

  // AC-8 requires a report "when it completes (success or failure)". The
  // only failure paths currently proven by run-eval.test.js are inside
  // run-eval.js's own execution (a per-pair extractor throw, a bad
  // EXTRACTOR_MODULE). But the far more common "failure" — the "Validate
  // synced eval set" step (AC-3) exiting non-zero — is never exercised
  // end-to-end at the workflow level: GitHub Actions steps stop on the
  // first failure by default, and this step has no `if: always()` (or
  // similar), so "Run per-pair comparison" — and therefore any report at
  // all — is skipped entirely whenever AC-3 fires. That contradicts AC-8's
  // literal "on completion, success or failure" language.
  assert.match(
    compareStepMatch[0],
    /if:\s*always\(\)/,
    'the "Run per-pair comparison" step has no `if: always()` (or equivalent), so a validate-pairs.js ' +
      'failure (AC-3) skips this step and the job produces NO report at all — contradicting AC-8\'s ' +
      '"on completion (success or failure)" requirement. Flagged in the PR as needing a PO ruling on ' +
      'whether AC-3\'s "never continues past this point" should still win; until that ruling lands, ' +
      'AC-8 is not met for the validation-failure case.'
  );
});

test('KAN-9: this ticket adds a separate job and does not touch the build-and-test job', () => {
  const yaml = readWorkflow();
  assert.doesNotMatch(yaml, /build-and-test/);
  assert.match(yaml, /receipt-eval-sync-validate/);

  const buildAndTestPath = path.join(path.dirname(WORKFLOW_PATH), 'build-and-test.yml');
  const buildAndTestYaml = fs.readFileSync(buildAndTestPath, 'utf8');
  assert.match(buildAndTestYaml, /build-and-test:/);
});
