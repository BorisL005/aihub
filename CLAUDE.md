# AI Hub

Personal tracker app (receipts, workouts, car maintenance) built by AI agents under one human owner. Monorepo.

## Read first
- `ARCHITECTURE.md` - frozen decisions with rationale. Do not re-litigate them; escalate gaps to the owner instead.
- Relevant skill in `.claude/skills/` before touching its area (Java -> spring-conventions).

## Layout
- `backend/` - Java 21, Spring Boot 4.1, jOOQ, Flyway, Spring AI 2.0 (Maven)
- `mobile/` - Expo app (TypeScript)
- `api/openapi.yaml` - the client-backend contract; TS client is generated from it. An endpoint not in the spec does not exist.
- `design/` - DESIGN-SYSTEM.md (owner-set §Aesthetic direction is binding) + per-ticket canvas sources
- `deploy/` - docker-compose.yml, cloud-init, Caddyfile (the entire IaC)
- `evals/` - extraction eval sets and agent behavior scenarios
- `.claude/agents/` - po, designer, reviewer, qa (mobile & backend work happens in the main session)

## Branch & PR flow (gitflow, simplified)
- Two protected branches: `develop` (integration, default) and `master` (production). PR-only, no direct pushes.
- Feature branches: `KAN-<n>-short-slug`, from `develop`, PR back into `develop`, squash merge.
- Release: a PR `develop -> master` (merge commit, not squash), opened by the owner (/release). On merge CI tags `vX.Y` and runs the prod deploy job, which waits on the gated `production` environment.
- Hotfix: branch from `master`, PR into `master`; **immediately after merging, back-merge `master -> develop`** - skipping this silently reverts the hotfix on the next release. Never skip.
- Environments: every merge to `develop` auto-deploys to staging; `master` is production. Expo channels: `preview` -> staging URL, `production` -> prod.
- Pipeline per PR: dev agent opens PR (template fully filled) -> reviewer agent in a FRESH session posts verdict -> qa agent executes and posts report -> human owner approves and merges.
- QA may modify test paths only (`backend/src/test`, `mobile/**/__tests__`, `e2e`, `evals`). Reviewer modifies nothing.

## Standing rules (apply to every change)
1. Tenant isolation lives in code only (no RLS): every query on tenant data filters by user_id from the JWT, with a test proving cross-user access fails. See spring-conventions.
2. Jira ticket (KAN-*) is the sole context carrier between agents. Work from the ticket; write results back to it.
3. Any endpoint change updates `api/openapi.yaml` in the same PR.
4. Every LLM call is logged to llm_calls; prompts live in versioned resource files, never string literals.
5. Human owner gates: PR approval and the production deploy environment. Never merge or deploy without them.

## Commands
- Backend: `cd backend && ./mvnw verify` (Testcontainers needs Docker running)
- Mobile: `cd mobile && npx expo start`
- Board: `/po-sync`; design: `/design-ticket KAN-n`; review: `/review <pr>`; QA: `/qa <pr>`
