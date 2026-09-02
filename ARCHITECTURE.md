# AI Hub — Architecture (frozen 2026-09-01)

A personal "AI hub": the user creates projects (car maintenance, workouts, receipts, etc.), feeds in data via camera / voice dictation / text, an LLM extracts structure, and the system answers questions, computes metrics, and reminds about routines.

Status: pet project with no growth ambitions. Priorities: minimal cost of ownership (~€12/mo total), code readable by the owner (Java), suitability for agent-driven development.

## 1. Key architectural decisions (and why)

**A project is data, not code.** A project type (`project_type`) is fully described by a database row: JSON Schema of fields, extraction prompt, metric templates, retrieval recipes, assigned LLM models. A new project type = a new row — no new tables, no new code. In v1 types are created manually (a fixed catalog); LLM-generating a type from a free-text rule description comes later and changes nothing architecturally.

**No classic vector RAG for structured data.** Receipts, workouts, maintenance are structured records: extraction into JSON per schema → regular DB → SQL aggregations. Vector search (pgvector) is only for free-form notes.

**Trainer context is three layers, not a history dump:**
1. Aggregates are computed by SQL (window functions over JSONB); the LLM receives a ready ~20-row table, not 200 raw workouts.
2. The last N sessions as raw entries — for recent detail.
3. A running summary (qualitative context: goals, injuries, preferences) — updated asynchronously after each entry.

**Queries go through a router: recipe by default, tool-loop by escalation.**
- A cheap model classifies the question.
- ~90% → "recipe": a deterministic set of SQL aggregates defined in project_type + a single LLM call.
- The long tail of arbitrary questions → a tool-loop with `run_metric(project, metric, period)`, `get_recent(project, n)`, `search_notes(query)`.
- Metrics in v1 are parameterized SQL templates (sum/avg/trend/min/max over a field for a period), whitelisted. Arbitrary text-to-SQL only when templates prove insufficient.

**Ingestion is a single rigid pipeline with no agency:**
client uploads media to object storage → calls the API with media_ref + project_id → the service loads the schema from project_type → vision/text extraction → validation (Bean Validation on records) → insert into entries → invalid results go to a manual-confirmation queue in the UI (never silently discarded) → asynchronous summary update.

**The model is a field in project_type.** Each type declares which model extracts and which answers. Model experiments = editing a DB row.

## 2. Stack (frozen)

| Layer | Choice | Notes |
|---|---|---|
| Client | Expo SDK + expo-router, EAS Build/Update | OTA updates are mandatory. expo-camera, expo-image-picker, expo-audio, expo-notifications, expo-calendar. Zustand + TanStack Query. expo-sqlite as an offline sync queue. |
| Backend | Java 21 (25 allowed), Spring Boot 4.1, Spring Framework 7 | Virtual threads, blocking style. @Retryable/@ConcurrencyLimit from Framework 7 for LLM calls. Trainer answers stream via SSE. NOT Boot 4.0 (OSS ends Dec 2026). |
| DB access | jOOQ + Flyway | Not JPA/Hibernate — jsonb payloads are far more ergonomic via jOOQ. |
| Database | PostgreSQL 17 + pgvector, JSONB + GIN | One database for everything, including vectors and the LLM call log. |
| LLM | Spring AI 2.0 (GA June 2026) | Provider-agnostic ChatModel. Fresh GA — little community material; agents should rely on official docs. MCP support in core — the path to the tool-loop. |
| Models | Receipt extraction: GPT-5 Mini or Gemini Flash (vision). Router: cheapest text model. Trainer tool-loop: the $2-input tier (Sonnet 5 / GPT-5.6 Terra / Gemini 3.1 Pro). | Budget ~$2–5/mo. Provider is configuration, not code. |
| Transcription | Whisper API or Deepgram over HTTP | On-device models are noticeably worse for Russian. |
| Embeddings | text-embedding-3-small or Voyage | Notes only. |
| Auth | Auth0 (free tier) + Spring Security 7 (resource server, JWT validation) | We do not write our own auth. EVERY data query filters by user_id — there is no RLS, this is a code-level obligation (skill + tests). |
| Scheduler | Quartz, strictly JDBC JobStore | Routine reminders. RAMJobStore is forbidden. |
| Hosting | Hetzner VPS (CX23/CAX21, 4GB, Nuremberg/Falkenstein), docker compose: app + Postgres 17 + Caddy (auto-TLS) | ~€6–8/mo. No Pulumi/Terraform in v1: docker-compose.yml + cloud-init + deploy workflow = the entire IaC. |
| Object storage | Cloudflare R2 via S3 client | Free tier 10GB, zero egress. Receipt photos, audio. |
| Push | Expo Push (HTTP API from Java) | Free. |
| CI/CD | GitHub Actions: build → GHCR → ssh → compose pull && up -d | Production deploy gated by a GitHub Environment with the owner as required reviewer. |
| Backups | Hetzner snapshots (~€1/mo) + nightly pg_dump to R2 | |
| Client↔backend contract | OpenAPI spec in the repo; the TS client for Expo is generated from it | Mandatory: the stack is bilingual, the contract must be machine-readable, not "in agents' heads". |

## 3. Data model (core)

- `project_types` — schema (jsonb, JSON Schema of fields), extraction_prompt, metric_templates (jsonb: parameterized SQL templates), retrieval_recipes (jsonb), extraction_model, answer_model.
- `projects` — user_id, project_type_id, name, settings.
- `entries` — project_id, ts, payload (jsonb, GIN index), source (camera/voice/text), media_ref, validation status.
- `summaries` — project_id, versioned running summary.
- `notes` — project_id, text, embedding (pgvector).
- `routines` — project_id, recurrence rule, next_fire, notification template.
- `llm_calls` — log of every call: prompt version, model, token counts, latency, validation outcome. Observability in v1 is this table; Langfuse later.

## 4. Agent team (4 roles)

1. **Product owner / spec** — feature specs, project_type schemas, acceptance criteria. All other agents work only from its artifacts (Jira project KAN; tickets are the sole context carrier).
2. **Design** — design system and tokens once, then conformance checks. Works in Claude Design.
3. **Mobile (Expo)** — UI, navigation, camera/voice, offline queue. Consumes the OpenAPI client.
4. **Backend / LLM-platform (Java)** — Spring service, jOOQ, migrations, extraction, router, tool-loop, prompts, evals, deploy files. There is no separate DevOps role.

Do not grow past 5–6 agents — coordination overhead eats the benefit. Human owner sign-off gates: PR review and the production deploy approval.

## 5. Skills (create when mistakes repeat, not in advance)

- `spring-conventions` — written FIRST, before any code generation: module structure (ingestion / query / routines), jOOQ patterns for jsonb, the mandatory user_id filtering rule + its test, Testcontainers, records + Bean Validation style.
- `expo-conventions` — structure, navigation, EAS workflow, consuming the OpenAPI client.
- `design-system` — tokens, components, rules.
- `llm-extraction` — extraction prompt templates, JSON schemas, how to write and run evals.
- `db-migrations` — schema and Flyway migration rules.

## 6. Known risks

- **Quality of cheap vision extraction** — the product's main risk. A mandatory eval set of 30–50 real receipts with reference JSON, run on every prompt/model change. Specific cases: crumpled receipts, handwritten ones, the Polish fiscal (fiskalny) format with comma decimal separators.
- Cheap models confuse the total with subtotals — only evals catch this.
- Spring AI 2.0 is fresh: few community answers, possible API rough edges.
- user_id filtering without RLS — verify systematically (agents forget it).
- Two stacked layers of nondeterminism (generated schema + generated SQL) — avoided in v1: manual types, templated metrics.

## 7. V1 — vertical slice

One project_type, "receipts": camera → upload to R2 → extraction → entries → the question "how much did I spend this month" via a recipe. Touches every layer, tests the main risk. Trainer, routines, calendar, notes, tool-loop — afterwards.
