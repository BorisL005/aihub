# Receipt extraction eval set

Pairs: `NNN.jpg` + `NNN.expected.json` (reference extraction). Target: 30-50 real receipts
incl. crumpled, handwritten, and Polish fiscal (comma decimals). Run on every prompt/model change.

Fixture files (`*.jpg`, `*.expected.json`) are gitignored — they are not committed.
`MANIFEST.md` and `MANIFEST-002.md` are also gitignored: they are private R2 bucket
contents (owner spend history) and must never be committed to this public repo, even
though CI reads their names for the pairing check below. They arrive locally the same
way the fixtures do — via the R2 sync. This `README.md`, and the `scripts/` directory,
are the only tracked contents of this directory.

## Source of truth

The set lives in a private Cloudflare R2 bucket, prefix `receipts/`. CI syncs it before any
evaluation runs:

```
aws s3 sync s3://aihub-evals/receipts/ evals/extraction/receipts/ --endpoint-url "$R2_ENDPOINT"
```

Authenticated via repository secrets `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.

## Pairing convention

Every `NNN` from `001` to the current set size must have both `NNN.jpg` and a valid
`NNN.expected.json`. No orphaned or unpaired files. `MANIFEST.md`, `MANIFEST-002.md`, and
this `README.md` are not fixture files and are excluded from the pairing check.

## Annotation convention

Any key prefixed with `_` in an `NNN.expected.json` is annotation metadata for a human
reviewer (e.g. `_note`, `_expected_outcome`) — it is never part of the extraction schema and
is excluded from field-by-field comparison.

## Eval semantics

- `total` is always the grand total actually paid, tips and cash-rounding included — never a
  subtotal or pre-tip figure. See `MANIFEST.md`/`MANIFEST-002.md` "tip trap" cases.
- `019` is a designated `needs_review` case (`_expected_outcome`): the merchant is unreadable
  (logo only). A confidently produced merchant name from extraction is scored as a miss, not
  a match — a hallucinated answer is never rewarded.
- `020` is a dedup case (`_note`): the same transaction is printed twice on one receipt
  strip. Exactly one entry must be scored for it; producing two is a mismatch.

## Current set

24 pairs (`001`-`024`, batches 001-002). Batch 003 (Polish fiscal, handwritten, non-CAD,
long grocery lists) is an outstanding owner TODO toward the 30-50 target.
