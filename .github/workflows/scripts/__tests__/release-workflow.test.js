'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WORKFLOW_PATH = path.join(__dirname, '..', '..', 'release.yml');

function readWorkflow() {
  return fs.readFileSync(WORKFLOW_PATH, 'utf8');
}

function getTriggerBlock(yaml) {
  const match = yaml.match(/^on:\n([\s\S]*?)\npermissions:/m);
  assert.ok(match, 'workflow must have an "on:" trigger block before "permissions:"');
  return match[1];
}

test('AC-1: release.yml triggers only on push to master', () => {
  const yaml = readWorkflow();
  const trigger = getTriggerBlock(yaml);
  assert.doesNotMatch(trigger, /pull_request/, 'must not trigger on pull_request');
  assert.match(trigger, /push:/, 'must trigger on push');
  assert.match(trigger, /branches:\s*\n\s*-\s*master/, 'push trigger must target master');
  assert.doesNotMatch(trigger, /develop/, 'must not also trigger on develop pushes');
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

test('the tag-push step actually pushes the tag this workflow computed, via git + the default token', () => {
  const yaml = readWorkflow();
  assert.match(yaml, /node .*print-next-tag\.js/, 'must compute the tag via the tested print-next-tag script');
  assert.match(yaml, /git tag "\$\{\{\s*steps\.next_tag\.outputs\.tag\s*\}\}"/);
  assert.match(yaml, /git push origin "\$\{\{\s*steps\.next_tag\.outputs\.tag\s*\}\}"/);
});

test('checkout uses full tag history (fetch-depth: 0) so "reachable from master" can be computed', () => {
  const yaml = readWorkflow();
  assert.match(yaml, /fetch-depth:\s*0/);
});
