'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const COMPOSE_PATH = path.join(__dirname, '..', '..', 'docker-compose.yml');

function readCompose() {
  return fs.readFileSync(COMPOSE_PATH, 'utf8');
}

function getServiceNames(yaml) {
  const servicesBlock = yaml.match(/^services:\n([\s\S]*?)\n(?:networks|volumes):/m);
  assert.ok(servicesBlock, 'compose file must have a services: block');
  return [...servicesBlock[1].matchAll(/^  (\w+):/gm)].map((m) => m[1]);
}

test('AC-2: exactly three services are defined - app, db, caddy', () => {
  const yaml = readCompose();
  const names = getServiceNames(yaml);
  assert.deepEqual(names.sort(), ['app', 'caddy', 'db']);
});

test('AC-2: app is built from backend/Dockerfile and deployed from a GHCR image', () => {
  const yaml = readCompose();
  assert.match(yaml, /context:\s*\.\.\/backend/);
  assert.match(yaml, /dockerfile:\s*Dockerfile/);
  assert.match(yaml, /image:\s*\$\{IMAGE_TAG/);
});

test('AC-2: db uses Postgres 17 with pgvector available', () => {
  const yaml = readCompose();
  assert.match(yaml, /image:\s*pgvector\/pgvector:pg17/);
});

test('AC-2: each of the three services declares an explicit memory limit', () => {
  const yaml = readCompose();
  const memoryLimits = [...yaml.matchAll(/memory:\s*\S+/g)];
  assert.equal(memoryLimits.length, 3, 'expected one deploy.resources.limits.memory per service');
});

test('AC-2: the app service caps its JVM heap via JAVA_TOOL_OPTIONS, not the container limit alone', () => {
  const yaml = readCompose();
  assert.match(yaml, /JAVA_TOOL_OPTIONS:\s*-Xmx1g/);
});

test('AC-3: the db data directory is backed by a named volume, not an anonymous mount', () => {
  const yaml = readCompose();
  assert.match(yaml, /db-data:\/var\/lib\/postgresql\/data/);
  const volumesBlock = yaml.match(/^volumes:\n([\s\S]*)$/m);
  assert.ok(volumesBlock, 'compose file must declare top-level named volumes');
  assert.match(volumesBlock[1], /^\s*db-data:\s*$/m, 'db-data must be declared as a named volume');
});

test('AC-4: app reads runtime config via env_file: deploy/.env, no secrets committed inline', () => {
  const yaml = readCompose();
  assert.match(yaml, /env_file:\s*deploy\/\.env/);
  assert.doesNotMatch(yaml, /AUTH0_ISSUER_URI:\s*https?:\/\/(?!your-tenant)/i);
  assert.doesNotMatch(yaml, /R2_SECRET_ACCESS_KEY:\s*\S+/);
});

test('AC-S: db is never published to the host/internet - no top-level ports: for the db service', () => {
  const yaml = readCompose();
  const servicesBlock = yaml.match(/^services:\n([\s\S]*?)\n(?:networks|volumes):/m)[1];
  const dbBlock = servicesBlock.match(/^  db:\n([\s\S]*?)(?=^  \w+:|\Z)/m);
  assert.ok(dbBlock, 'db service block not found');
  assert.doesNotMatch(dbBlock[1], /^\s*ports:/m, 'db must not publish a host port');
});
