create table project_types (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    name text not null unique,
    schema jsonb not null,
    extraction_prompt text not null default '',
    metric_templates jsonb not null default '{}'::jsonb,
    retrieval_recipes jsonb not null default '{}'::jsonb,
    extraction_model text not null,
    answer_model text not null
);

create table projects (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    user_id text not null,
    project_type_id uuid not null references project_types (id),
    name text not null,
    settings jsonb not null default '{}'::jsonb,
    constraint uq_projects_user_id_project_type_id unique (user_id, project_type_id)
);

create index idx_projects_user_id on projects (user_id);

create table entries (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    project_id uuid not null references projects (id),
    ts timestamptz not null default now(),
    payload jsonb not null default '{}'::jsonb,
    source text not null,
    media_ref text,
    validation_status text not null default 'pending'
);

create index idx_entries_project_id_ts on entries (project_id, ts desc, id desc);
