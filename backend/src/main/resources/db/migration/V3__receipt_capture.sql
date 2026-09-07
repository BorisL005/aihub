-- KAN-5: receipt photo capture. Idempotent entry creation and the presigned-upload claim record.

alter table entries add column idempotency_key text;

-- A plain (non-partial) unique index: Postgres never treats two NULLs as conflicting in a unique
-- index, so entries with no idempotency_key (every KAN-4 source, and any future non-idempotent
-- source) are unaffected - only two rows in the same project sharing the same non-null key
-- collide, which is exactly the per-project idempotency the capture endpoint needs (AC-3). Kept
-- plain rather than a partial index so ON CONFLICT (project_id, idempotency_key) can target it
-- directly, with no separate predicate to keep in sync.
create unique index uq_entries_project_id_idempotency_key on entries (project_id, idempotency_key);

-- One row per media_ref issued by POST /media/upload-url. `claimed_at` is set when an entry
-- successfully claims it (AC-1); AC-8's cleanup sweep deletes rows still unclaimed 24h after
-- `created_at`. No project_id: a media_ref is owned by a user, not a project, until claimed.
create table media_uploads (
    media_ref text primary key,
    created_at timestamptz not null default now(),
    user_id text not null,
    claimed_at timestamptz
);

create index idx_media_uploads_user_id on media_uploads (user_id);
create index idx_media_uploads_unclaimed_created_at on media_uploads (created_at) where claimed_at is null;
