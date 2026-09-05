# Receipt extraction eval set

Reference data for evaluating receipt extraction quality (KAN-6 gate).

## Where the data lives

The photos and reference JSONs are **not in git** (privacy: real receipts).
Source of truth is the private R2 bucket, prefix `receipts/`. This directory
is gitignored; only this README is tracked.

- Local working copy (Pi / laptop):
  `aws s3 sync s3://aihub-evals/receipts/ evals/extraction/receipts/ --endpoint-url "$R2_ENDPOINT"`
- CI obtains the data the same way, using repository secrets
  `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.

## Layout and pairing convention

Flat, sequentially numbered:

```
receipts/
  001.jpg            photo as the mobile client would upload it (<=1400px, jpeg)
  001.expected.json  owner-verified reference extraction for 001.jpg
  ...
  MANIFEST.md        batch 001 (receipts 001-010): per-receipt verification notes
  MANIFEST-002.md    batch 002 (receipts 011-024)
```

Every `NNN.jpg` has exactly one `NNN.expected.json`. Reference JSONs follow the
`receipts` project_type payload schema (see the KAN-4 ticket): `merchant`,
`purchased_at` (YYYY-MM-DD), `total`, `currency`, optional `tax_total`,
`payment_method`, `line_items[]`.

## Semantics that evaluators must respect

- `total` is the grand total actually PAID, including tips and after cash
  rounding - not the pre-tip amount and not the pre-rounding subtotal. Several
  receipts (002, 004, 007, 008, 009, 012, 014, 017, 020, 022, 024) exist
  specifically to punish confusing the two.
- Keys starting with `_` in expected JSONs are annotations for humans and the
  eval harness, not extraction targets.
- `019` is a designated needs_review case: the merchant appears only as a
  logo. Correct behavior is a validation failure routed to the confirmation
  queue; a confidently hallucinated merchant name is a scored MISS.
- `020` shows one transaction printed twice on a single strip. Correct
  behavior is ONE entry.

## Set status

24 receipts (batches 001-002), all CAD, restaurant-heavy - a deliberate
partial set. KAN-6 threshold ACs may run on it with an explicit partial-set
note. Batch 003 (owner TODO) adds the missing coverage: Polish fiscal
receipts (comma decimals, PTU sections), long grocery lists, handwritten,
non-CAD currencies. An empty or missing set is a FAIL for gated tickets,
never a skip.

