'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CLOUD_INIT_PATH = path.join(__dirname, '..', '..', 'cloud-init.yaml');

function readCloudInit() {
  return fs.readFileSync(CLOUD_INIT_PATH, 'utf8');
}

test('AC-1: cloud-init is a valid #cloud-config document', () => {
  const doc = readCloudInit();
  assert.match(doc, /^#cloud-config/);
});

test('AC-1: installs Docker Engine (docker-ce) and the Compose plugin', () => {
  const doc = readCloudInit();
  assert.match(doc, /docker-ce\b/);
  assert.match(doc, /docker-compose-plugin/);
  assert.match(doc, /systemctl enable --now docker/);
});

test('AC-1: does not manage SSH keys or users - the deploy key is already provisioned', () => {
  const doc = readCloudInit();
  assert.doesNotMatch(doc, /ssh_authorized_keys/);
  assert.doesNotMatch(doc, /^users:/m);
});
