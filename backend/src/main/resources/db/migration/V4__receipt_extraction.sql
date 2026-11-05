-- KAN-6: extraction pipeline.

-- AC-2: the raw model response is preserved on the entry when a result fails validation, so
-- the manual-confirmation queue (KAN-7) can show what the model actually returned. Stays null
-- for `extracted` entries and for AC-8's call-failure case (there is no model response to keep).
alter table entries add column raw_extraction jsonb;

-- AC-3: exactly one row per outbound model call, success or failure. entry_id is never null -
-- every call this ticket makes is on behalf of one entry; a future answer-model call (trainer)
-- gets its own row shape decision when that ticket is written, not a nullable column here.
create table llm_calls (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    entry_id uuid not null references entries (id),
    prompt_version text not null,
    model text not null,
    input_tokens integer,
    output_tokens integer,
    latency_ms integer not null,
    validation_outcome text not null
);

create index idx_llm_calls_entry_id on llm_calls (entry_id);

-- Fills in the prompt identifier V2 (KAN-4) left as ''. The identifier resolves to the classpath
-- resource backend/src/main/resources/prompts/receipt_extraction/v1.st
-- (dev.aihub.llm.PromptLoader) - the prompt text itself lives only in that file, never
-- duplicated into a migration (spring-conventions: no prompt text as a string literal anywhere
-- in the codebase, and a migration is part of the codebase).
update project_types set extraction_prompt = 'receipt_extraction/v1' where name = 'receipts';
