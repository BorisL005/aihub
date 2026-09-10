'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WORKFLOW_PATH = path.join(__dirname, '..', '..', 'deploy-staging.yml');

function readWorkflow() {
  return fs.readFileSync(WORKFLOW_PATH, 'utf8');
}

function getTriggerBlock(yaml) {
  const match = yaml.match(/^on:\n([\s\S]*?)\npermissions:/m);
  assert.ok(match, 'workflow must have an "on:" trigger block before "permissions:"');
  return match[1];
}

test('AC-5: deploy-staging.yml triggers only on push to develop', () => {
  const yaml = readWorkflow();
  const trigger = getTriggerBlock(yaml);
  assert.doesNotMatch(trigger, /pull_request/, 'must not trigger on pull_request');
  assert.match(trigger, /push:/, 'must trigger on push');
  assert.match(trigger, /branches:\s*\n\s*-\s*develop/, 'push trigger must target develop');
  assert.doesNotMatch(trigger, /master/, 'must not also trigger on master pushes');
});

test('AC-5: builds backend/Dockerfile for linux/amd64 and pushes to GHCR', () => {
  const yaml = readWorkflow();
  assert.match(yaml, /file:\s*backend\/Dockerfile/);
  assert.match(yaml, /platforms:\s*linux\/amd64/);
  assert.match(yaml, /push:\s*true/);
  assert.match(yaml, /registry:\s*ghcr\.io/);
});

test('AC-5: image tag is the commit SHA, defined once and reused for build-push and deploy (no floating tag)', () => {
  const yaml = readWorkflow();
  assert.match(
    yaml,
    /IMAGE_TAG:\s*ghcr\.io\/[\w.-]+\/aihub-backend:\$\{\{\s*github\.sha\s*\}\}/,
    'workflow-level IMAGE_TAG must be the SHA-tagged GHCR image'
  );
  const tagsLine = yaml.match(/tags:\s*(.+)/);
  assert.ok(tagsLine, 'build-push-action must set tags:');
  assert.match(
    tagsLine[1],
    /\$\{\{\s*env\.IMAGE_TAG\s*\}\}/,
    'the build must push the same IMAGE_TAG the workflow defines'
  );
  assert.match(
    yaml,
    /IMAGE_TAG=\$IMAGE_TAG/,
    'the deploy step must forward that same tag into the remote docker compose invocation'
  );
});

test('AC-5: syncs docker-compose.yml and Caddyfile to the node without touching deploy/.env', () => {
  const yaml = readWorkflow();
  assert.match(yaml, /rsync/);
  assert.match(yaml, /deploy\/docker-compose\.yml/);
  assert.match(yaml, /deploy\/Caddyfile/);
  assert.doesNotMatch(yaml, /deploy\/\.env\b/, 'must never sync or touch deploy/.env on the server');
});

test('AC-5: deploys over SSH using the repo secrets and runs pull then up -d', () => {
  const yaml = readWorkflow();
  assert.match(yaml, /secrets\.STAGING_SERVER_IP/);
  assert.match(yaml, /secrets\.STAGING_DEPLOY_KEY/);
  assert.match(yaml, /docker compose[^\n]*pull/);
  assert.match(yaml, /docker compose[^\n]*up -d/);
});

test('AC-6: no step prints the deploy key, R2/Auth0 secrets, or deploy/.env contents', () => {
  const yaml = readWorkflow();
  assert.doesNotMatch(yaml, /echo\s+["']?\$\{?\{?\s*secrets\./i, 'must not echo a secret expression directly');
  assert.doesNotMatch(yaml, /cat\s+.*staging_deploy_key/i, 'must not cat the private key file');
  assert.doesNotMatch(yaml, /cat\s+.*\.env\b/i, 'must not cat deploy/.env');
});

test('AC-6: $STAGING_DEPLOY_KEY is referenced nowhere except the single expected write-to-file line', () => {
  const yaml = readWorkflow();
  // Secrets are mapped to env vars (env: STAGING_DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }})
  // and referenced downstream as plain shell vars. A line-scoped "does this line echo/cat the
  // var" check (tried first, see git history) misses any leak that separates "read the secret"
  // from "print it" - a heredoc body, a reassignment to another var, an encoded copy - across
  // lines, which GitHub's own log masking doesn't catch either since it only redacts the exact
  // raw secret string. Asserting there is exactly one reference at all, and that it is the one
  // known-safe line, closes that off regardless of what a future line does with the value.
  const referencingLines = yaml.split('\n').filter((line) => /\$\{?STAGING_DEPLOY_KEY\}?/.test(line));
  assert.equal(
    referencingLines.length,
    1,
    `expected exactly one line referencing $STAGING_DEPLOY_KEY, found ${referencingLines.length}:\n` +
      referencingLines.map((l) => `  ${l.trim()}`).join('\n')
  );
  assert.match(
    referencingLines[0],
    /^\s*printf\s+'%s\\n'\s+"\$STAGING_DEPLOY_KEY"\s*>\s*"\$HOME\/\.ssh\/staging_deploy_key"\s*$/,
    'the sole reference to $STAGING_DEPLOY_KEY must be writing it straight to its key file'
  );
});

test('AC-6: no shell tracing (set -x/-v) is enabled anywhere in the workflow', () => {
  const yaml = readWorkflow();
  assert.doesNotMatch(yaml, /set\s+-\S*x/);
  assert.doesNotMatch(yaml, /set\s+-\S*v/);
});

test('AC-6: the temporary private key file is removed after use', () => {
  const yaml = readWorkflow();
  assert.match(yaml, /rm\s+-f\s+.*staging_deploy_key/);
});
