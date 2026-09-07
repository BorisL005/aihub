'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DOCKERFILE_PATH = path.join(__dirname, '..', '..', '..', 'backend', 'Dockerfile');

function readDockerfile() {
  return fs.readFileSync(DOCKERFILE_PATH, 'utf8');
}

test('AC-2: backend/Dockerfile exists and is a multi-stage build (Maven build stage + JRE runtime stage)', () => {
  const doc = readDockerfile();
  const fromLines = [...doc.matchAll(/^FROM\s+\S+/gm)];
  assert.ok(fromLines.length >= 2, 'expected at least two FROM stages (build + runtime)');
  assert.match(doc, /FROM\s+eclipse-temurin:21-jdk\s+AS\s+build/i);
  assert.match(doc, /FROM\s+eclipse-temurin:21-jre/i);
});

test('does not bake a dev/debug Spring profile into the image', () => {
  const doc = readDockerfile();
  assert.doesNotMatch(doc, /SPRING_PROFILES_ACTIVE/);
});
