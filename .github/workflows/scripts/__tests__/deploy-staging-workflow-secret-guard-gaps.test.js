'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// QA finding (KAN-12 PR #15, commit 7fbbf75): the reviewer's Major #4 asked for
// a guard covering an echo of the env-mapped shell variable ($STAGING_DEPLOY_KEY),
// not just a literal `echo ${{ secrets.X }}`. The first fix attempt added a
// line-scoped check ("does this line contain both the token and echo/printf/cat")
// to deploy-staging-workflow.test.js. QA showed that check only inspects a line
// if the literal token `$STAGING_DEPLOY_KEY` appears on it, AND only flags it if
// echo/printf/cat appears on that SAME line - so a heredoc body, a reassignment
// to a new variable, or an encoded copy (each spreading "read the secret" and
// "print it" across two lines) slipped through untouched. GitHub's own log
// masking doesn't save you either: it only redacts the exact raw secret string,
// not a renamed or transformed copy.
//
// The follow-up fix (still commit history on this branch) replaced that check
// entirely with a stricter allowlist: assert $STAGING_DEPLOY_KEY is referenced
// on exactly one line in the whole workflow, and that line must be the known
// write-to-file line. That closes all three bypasses at once, since each one
// requires an *extra* reference to the variable regardless of what it then does
// with the value - see "AC-6: $STAGING_DEPLOY_KEY is referenced nowhere except
// the single expected write-to-file line" in deploy-staging-workflow.test.js.
//
// This file copies that allowlist check verbatim (see `violatesGuard` below) and
// re-runs QA's three synthetic leak patterns against it as regression coverage:
// each must now be caught.

function violatesGuard(yaml) {
  const referencingLines = yaml.split('\n').filter((line) => /\$\{?STAGING_DEPLOY_KEY\}?/.test(line));
  if (referencingLines.length !== 1) return true;
  return !/^\s*printf\s+'%s\\n'\s+"\$STAGING_DEPLOY_KEY"\s*>\s*"\$HOME\/\.ssh\/staging_deploy_key"\s*$/.test(
    referencingLines[0]
  );
}

test('regression guard: a heredoc body that prints the key is now caught', () => {
  const evilStep = [
    '      - name: Debug SSH key (regression)',
    '        env:',
    '          STAGING_DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}',
    '        run: |',
    '          cat <<EOF',
    '          $STAGING_DEPLOY_KEY',
    '          EOF',
  ].join('\n');

  assert.ok(violatesGuard(evilStep), 'the allowlist guard must flag a heredoc body referencing the key');
});

test('regression guard: renaming the secret to a new shell var before echoing it is now caught', () => {
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
    'the allowlist guard must flag the reassignment line itself, regardless of what the new var is used for'
  );
});

test('regression guard: base64-encoding the key into a new var before echoing it is now caught', () => {
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
    'the allowlist guard must flag the line deriving ENCODED from the key, regardless of downstream use'
  );
});

test('sanity: the allowlist guard does not flag the real workflow', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const yaml = fs.readFileSync(path.join(__dirname, '..', '..', 'deploy-staging.yml'), 'utf8');
  assert.ok(!violatesGuard(yaml), 'the real deploy-staging.yml must pass its own guard');
});
