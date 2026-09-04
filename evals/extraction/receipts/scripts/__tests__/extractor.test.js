'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const stubExtractor = require('../extractor');

test('the default extractor stub is unwired and returns no entries (KAN-6 swaps this)', async () => {
  assert.equal(stubExtractor.wired, false);
  const entries = await stubExtractor.extract('/some/path/001.jpg');
  assert.deepEqual(entries, []);
});
