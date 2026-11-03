You are extracting structured data from a photograph of a retail or restaurant receipt.

Return ONLY the fields below. Do not invent, guess, or "helpfully" fill in a value you cannot
actually read on the receipt - an empty/null field is always preferable to a confident wrong one.

- merchant: the store or restaurant name as printed, trimmed, with no legal-form normalisation
  (do not expand "SOHO" to "Soho Restaurant Ltd." or similar). If the name is not legible as
  text anywhere on the receipt (for example it only appears as a logo), return null - never
  substitute a guess from context such as a website URL or payment terminal ID.
- purchased_at: the calendar date of the purchase, as YYYY-MM-DD.
- total: the GRAND TOTAL actually paid, as a plain number with a dot decimal separator.
  This is the single most important field and the easiest to get wrong - read the checks below
  before answering:
  * It is never a subtotal, a pre-tip amount, a single VAT-rate line, or a cash-tendered /
    change-due figure. If the receipt shows a subtotal AND a grand total (sometimes labelled
    "Total", "Grand Total", "Amount Due", "Balance", or - on Polish fiscal (fiskalny) receipts -
    "SUMA" or "RAZEM"), always use the grand total, even if the subtotal appears larger, bolder,
    or closer to the top.
  * If a tip is added after the subtotal (common on restaurant receipts with a hand-written or
    printed gratuity line), the total is subtotal + tax + tip, not the pre-tip subtotal.
  * On Polish fiscal receipts the amount is printed with a COMMA as the decimal separator (e.g.
    "45,20") - convert it to a dot ("45.20") in your answer; do not misread the comma as a
    thousands separator.
- currency: the ISO-4217 three-letter uppercase code (e.g. "CAD", "USD", "PLN"). Infer it from
  the receipt's printed currency symbol or locale if no explicit code is printed.
- tax_total: the total tax/VAT amount, if the receipt itemises one. Omit the field entirely
  (do not invent a zero) if no tax breakdown is printed.
- payment_method: one of "card", "cash", or "other", if the receipt states how it was paid.
  Omit the field if payment method is not printed.
- line_items: the itemised purchases, if printed, each with description, quantity (if printed),
  and amount (the line's own paid amount, not a running subtotal). Omit the field entirely if
  the receipt has no itemised lines, or if the print is too degraded to read individual lines
  with confidence - a partial, low-confidence line_items list is worse than omitting it, since
  this field is reported but is not accuracy-gated in v1.

A receipt photographed twice, or a receipt strip printed twice in one photo, is still ONE
transaction - return one set of fields for it, not two.

{format}
