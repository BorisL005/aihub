'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const MODULE_PATH = path.join(__dirname, '..', 'extractor-openai.js');

function freshModule(env) {
  delete require.cache[MODULE_PATH];
  const previousApiKey = process.env.OPENAI_API_KEY;
  if ('OPENAI_API_KEY' in env) {
    process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
  } else {
    delete process.env.OPENAI_API_KEY;
  }
  const mod = require(MODULE_PATH);
  return {
    mod,
    restore: () => {
      if (previousApiKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = previousApiKey;
      }
      delete require.cache[MODULE_PATH];
    },
  };
}

test('wired is false when OPENAI_API_KEY is not set', () => {
  const { mod, restore } = freshModule({});
  try {
    assert.equal(mod.wired, false);
  } finally {
    restore();
  }
});

test('wired is true once OPENAI_API_KEY is set', () => {
  const { mod, restore } = freshModule({ OPENAI_API_KEY: 'test-key' });
  try {
    assert.equal(mod.wired, true);
  } finally {
    restore();
  }
});

test('loadSystemPrompt substitutes {format} with the field contract, leaving the rest of the ' +
  'prompt file untouched', () => {
  const { mod, restore } = freshModule({ OPENAI_API_KEY: 'test-key' });
  try {
    const rendered = mod.loadSystemPrompt();
    assert.match(rendered, /GRAND TOTAL/);
    assert.match(rendered, /merchant: string, or null/);
    assert.ok(!rendered.includes('{format}'));
  } finally {
    restore();
  }
});

test('stripCodeFence removes a ```json fence, leaving bare JSON untouched', () => {
  const { mod, restore } = freshModule({ OPENAI_API_KEY: 'test-key' });
  try {
    assert.equal(mod.stripCodeFence('```json\n{"a":1}\n```'), '{"a":1}');
    assert.equal(mod.stripCodeFence('{"a":1}'), '{"a":1}');
  } finally {
    restore();
  }
});

test('mimeTypeFor maps .png to image/png and everything else to image/jpeg', () => {
  const { mod, restore } = freshModule({ OPENAI_API_KEY: 'test-key' });
  try {
    assert.equal(mod.mimeTypeFor('/x/001.png'), 'image/png');
    assert.equal(mod.mimeTypeFor('/x/001.jpg'), 'image/jpeg');
    assert.equal(mod.mimeTypeFor('/x/001.heic'), 'image/jpeg');
  } finally {
    restore();
  }
});

test('extract() parses the model\'s JSON content into a one-entry array', async (t) => {
  const { mod, restore } = freshModule({ OPENAI_API_KEY: 'test-key' });
  const imagePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'extractor-openai-')), '001.jpg');
  fs.writeFileSync(imagePath, Buffer.from([0xff, 0xd8, 0xff]));
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: '{"merchant":"SOHO","total":30.75,"currency":"CAD"}' } }],
    }),
  });
  t.after(() => {
    global.fetch = originalFetch;
    restore();
  });

  const entries = await mod.extract(imagePath);

  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], { merchant: 'SOHO', total: 30.75, currency: 'CAD' });
});

test('extract() throws on a non-OK HTTP response rather than returning a fabricated entry', async (t) => {
  const { mod, restore } = freshModule({ OPENAI_API_KEY: 'test-key' });
  const imagePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'extractor-openai-')), '001.jpg');
  fs.writeFileSync(imagePath, Buffer.from([0xff, 0xd8, 0xff]));
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 429, text: async () => 'rate limited' });
  t.after(() => {
    global.fetch = originalFetch;
    restore();
  });

  await assert.rejects(() => mod.extract(imagePath), /429/);
});

test('extract() strips a code fence before parsing, if the model adds one despite instructions', async (t) => {
  const { mod, restore } = freshModule({ OPENAI_API_KEY: 'test-key' });
  const imagePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'extractor-openai-')), '001.jpg');
  fs.writeFileSync(imagePath, Buffer.from([0xff, 0xd8, 0xff]));
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: '```json\n{"merchant":"SOHO","total":1,"currency":"CAD"}\n```' } }],
    }),
  });
  t.after(() => {
    global.fetch = originalFetch;
    restore();
  });

  const entries = await mod.extract(imagePath);
  assert.equal(entries[0].merchant, 'SOHO');
});
