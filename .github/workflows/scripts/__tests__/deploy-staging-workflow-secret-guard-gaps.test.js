'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// QA finding (KAN-12 PR #15, commit 7fbbf75): the reviewer's Major #4 asked for
// a guard covering an echo of the env-mapped shell variable ($STAGING_DEPLOY_KEY),
// not just a literal `echo ${{ secrets.X }}`. The fix added exactly that check
// to deploy-staging-workflow.test.js ("AC-6: no step echoes/cats the deploy key
// env var to stdout"):
//
//   const referencingLines = yaml.split('\n').filter((line) => /\$\{?STAGING_DEPLOY_KEY\}?/.test(line));
//   for (const line of referencingLines) {
//     const printsToStdout =
//       /\b(?:echo|printf|cat)\b/.test(line) && !/>\s*["']?\S*staging_deploy_key/i.test(line);
//     assert.ok(!printsToStdout, ...);
//   }
//
// That guard only inspects a line if the literal token `$STAGING_DEPLOY_KEY` /
// `${STAGING_DEPLOY_KEY}` appears on it, AND only flags it if echo/printf/cat
// appears on that SAME line. Any regression that separates "read the secret"
// from "print it" across two lines - completely natural in a multi-line
// `run: |` block - slips through untouched, and GitHub's own automatic log
// masking does not save you either: it only redacts the exact raw secret
// string, not a renamed variable or a transformed (e.g. base64) copy of it.
//
// The guard lives inline in that test, not in an importable module, so this
// file copies it verbatim (see `violatesGuard` below) to demonstrate three
// concrete leak patterns it would currently wave through. Each test below
// asserts the guard SHOULD flag the given (synthetic) workflow step; each
// currently fails, proving the gap is real. This file adds test coverage
// only - no production workflow/YAML file is touched.

function violatesGuard(yaml) {
  const referencingLines = yaml.split('\n').filter((line) => /\$\{?STAGING_DEPLOY_KEY\}?/.test(line));
  for (const line of referencingLines) {
    const printsToStdout =
      /\b(?:echo|printf|cat)\b/.test(line) && !/>\s*["']?\S*staging_deploy_key/i.test(line);
    if (printsToStdout) return true;
  }
  return false;
}

test('BYPASS: a heredoc body that prints the key is not caught by the AC-6 guard', () => {
  const evilStep = [
    '      - name: Debug SSH key (regression)',
    '        env:',
    '          STAGING_DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}',
    '        run: |',
    '          cat <<EOF',
    '          $STAGING_DEPLOY_KEY',
    '          EOF',
  ].join('\n');

  assert.ok(
    violatesGuard(evilStep),
    'guard gap: `cat` and `$STAGING_DEPLOY_KEY` never appear on the same line in a heredoc, ' +
      'so this leak (the key printed to stdout via `cat <<EOF`) is invisible to the current check'
  );
});

test('BYPASS: renaming the secret to a new shell var before echoing it is not caught', () => {
  const evilStep = [
    '      - name: Debug SSH key (regression)',
    '        env:',
    '          STAGING_DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}',
    '        run: |',
    '          KEY="$STAGING_DEPLOY_KEY"',
    '          echo "$KEY"',
  ].join('\n');

  assert.ok(
    violatesGuard(evilStep),
    'guard gap: the check only scans lines containing the literal token $STAGING_DEPLOY_KEY - ' +
      'once the value is copied to $KEY on its own line, the `echo "$KEY"` on the next line is ' +
      'never inspected at all'
  );
});

test('BYPASS: base64-encoding the key into a new var before echoing it is not caught', () => {
  const evilStep = [
    '      - name: Debug SSH key (regression)',
    '        env:',
    '          STAGING_DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}',
    '        run: |',
    '          ENCODED=$(base64 <<< "$STAGING_DEPLOY_KEY")',
    '          echo "$ENCODED"',
  ].join('\n');

  assert.ok(
    violatesGuard(evilStep),
    "guard gap: GitHub's automatic secret masking only redacts the exact raw secret string, so " +
      'a base64-transformed echo defeats both platform masking AND this guard - the guard never ' +
      'inspects the derived $ENCODED line since it does not contain $STAGING_DEPLOY_KEY'
  );
});
