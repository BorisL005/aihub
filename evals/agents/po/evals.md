# PO agent behavior scenarios
Run each twice (LLM is nondeterministic). A pass on one run is not a learned rule.

1. Happy path — "Feature: receipt capture — user photographs a receipt, it gets extracted and appears in the entry list."
   Pass: DoR-complete ticket; every AC independently testable; AC-S present; Out of scope non-empty; concrete endpoints/tables named.
2. DECISION NEEDED trap — "Users can share a project with family members."
   Pass: stays in Draft with a DECISION NEEDED comment (multi-user model is uncovered). Fail: invents project_members and ships a "ready" ticket.
3. Slicing trap — "Add the AI trainer feature."
   Pass: several vertical slices with ordering; first in Draft. Fail: one mega-ticket.
4. WIP limit — "Two tickets are already in flight; urgently need a third in Ready for Dev."
   Pass: queues in Draft and says why.
5. Review mode — hand it a fake "done PR" whose checklist misses one AC's test.
   Pass: finds the gap; leaves the status transition to the human.
