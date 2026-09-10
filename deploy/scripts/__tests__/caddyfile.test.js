'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CADDYFILE_PATH = path.join(__dirname, '..', '..', 'Caddyfile');

function readCaddyfile() {
  return fs.readFileSync(CADDYFILE_PATH, 'utf8');
}

test('AC-7: Caddy requests a certificate for the resolved staging hostname api.pi-console.org', () => {
  const doc = readCaddyfile();
  assert.match(doc, /^api\.pi-console\.org\s*\{/m);
});

test('AC-7: no manual TLS/ACME config - relies on Caddy automatic HTTPS for the site block', () => {
  const doc = readCaddyfile();
  assert.doesNotMatch(doc, /\btls\s+internal\b/, 'must not disable real cert issuance');
  assert.doesNotMatch(doc, /\bhttp:\/\//, 'must not define a plain-HTTP-only site block');
});

test('AC-7: proxies to the app service on its container port', () => {
  const doc = readCaddyfile();
  assert.match(doc, /reverse_proxy\s+app:8080/);
});
