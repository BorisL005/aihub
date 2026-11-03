// Real extractor (KAN-6): calls the same provider/prompt the backend uses
// (dev.aihub.llm.ModelRegistry resolves "vision-cheap" to this same model id
// by default - see backend/src/main/resources/application.yml) directly
// over HTTP, independent of the Java service, so the eval measures the
// prompt+model pairing itself rather than round-tripping through a running
// backend. `wired` is true only when OPENAI_API_KEY is actually present -
// unwired falls back to run-eval.js's existing "not evaluated" path rather
// than throwing, but see the note in README/PR: an unwired gate still FAILS
// AC-7's threshold check (0% is not a passing accuracy), it just fails with
// a clear "no extractor" reason instead of a crash.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_MODEL = 'gpt-5-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
// Mirrors backend/src/main/resources/prompts/receipt_extraction/v1.st exactly - this script reads
// that same file rather than duplicating the prompt text (spring-conventions: no prompt text as
// a string literal anywhere in the codebase; this is the identical rule applied on the JS side).
const PROMPT_PATH = path.join(
  __dirname, '..', '..', '..', '..', 'backend', 'src', 'main', 'resources', 'prompts',
  'receipt_extraction', 'v1.st'
);
const USER_INSTRUCTION = 'Extract the receipt fields from this photo.';
// Spring AI's BeanOutputConverter generates the Java side's {format} instruction from the
// ReceiptPayload record; this script has no Java reflection available, so it spells out the
// same field contract by hand. Field names/shape must stay in sync with
// backend/src/main/java/dev/aihub/ingestion/ReceiptPayload.java.
const FORMAT_INSTRUCTION = `Respond with ONLY a single JSON object (no prose, no markdown code
fences) with exactly these keys:
- merchant: string, or null if not legible as text
- purchased_at: string, "YYYY-MM-DD"
- total: number
- currency: string, three-letter uppercase ISO-4217 code
- tax_total: number (omit the key entirely if not printed)
- payment_method: one of "card", "cash", "other" (omit the key entirely if not printed)
- line_items: array of {description: string, quantity: number, amount: number} (omit the key
  entirely if not printed or not legible)`;

function loadSystemPrompt() {
  const template = fs.readFileSync(PROMPT_PATH, 'utf8');
  return template.replace('{format}', FORMAT_INSTRUCTION);
}

function mimeTypeFor(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  return 'image/jpeg';
}

// The model is asked for bare JSON but models occasionally wrap it in a fenced code block
// regardless of instruction - stripping a fence here is more robust than tightening the prompt
// further and still failing on the rare non-compliant response.
function stripCodeFence(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

const wired = Boolean(process.env.OPENAI_API_KEY);

async function extract(imagePath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // run-eval.js never calls extract() when !wired, but guard anyway rather than sending an
    // unauthenticated request if something changes that contract later.
    throw new Error('OPENAI_API_KEY is not set');
  }
  const model = process.env.OPENAI_VISION_MODEL || DEFAULT_MODEL;
  const imageBase64 = fs.readFileSync(imagePath).toString('base64');
  const mimeType = mimeTypeFor(imagePath);

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: loadSystemPrompt() },
        {
          role: 'user',
          content: [
            { type: 'text', text: USER_INSTRUCTION },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${body}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new TypeError('OpenAI response had no message content');
  }

  const entry = JSON.parse(stripCodeFence(content));
  return [entry];
}

module.exports = { wired, extract, loadSystemPrompt, stripCodeFence, mimeTypeFor };
