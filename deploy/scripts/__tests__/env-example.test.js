'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ENV_EXAMPLE_PATH = path.join(__dirname, '..', '..', '.env.example');

const REQUIRED_KEYS = [
  'AUTH0_ISSUER_URI',
  'AUTH0_AUDIENCE',
  'R2_ENDPOINT',
  'R2_BUCKET',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'SPRING_DATASOURCE_URL',
  'SPRING_DATASOURCE_USERNAME',
  'SPRING_DATASOURCE_PASSWORD',
];

function readEnvExample() {
  return fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
}

test('AC-4: deploy/.env.example is committed and documents every required key', () => {
  assert.ok(fs.existsSync(ENV_EXAMPLE_PATH), 'deploy/.env.example must exist');
  const doc = readEnvExample();
  for (const key of REQUIRED_KEYS) {
    assert.match(doc, new RegExp(`^${key}=`, 'm'), `missing required key: ${key}`);
  }
});

test('AC-4: no real secret values - only placeholders', () => {
  const doc = readEnvExample();
  assert.doesNotMatch(doc, /R2_ACCESS_KEY_ID=(?!changeme)\S+/);
  assert.doesNotMatch(doc, /R2_SECRET_ACCESS_KEY=(?!changeme)\S+/);
  assert.doesNotMatch(doc, /POSTGRES_PASSWORD=(?!changeme)\S+/);
  assert.doesNotMatch(doc, /SPRING_DATASOURCE_PASSWORD=(?!changeme)\S+/);
});
