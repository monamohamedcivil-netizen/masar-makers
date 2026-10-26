-- Errors that visitors' browsers hit (e.g. "This page couldn't load"), to find the cause.
-- Written only by the server (service role); no public access.
create table if not exists public.client_error_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  url text,
  message text,
  digest text,
  stack text,
  user_agent text,
  recovered boolean not null default false
);
alter table public.client_error_logs enable row level security;
create index if not exists client_error_logs_created_at_idx on public.client_error_logs (created_at desc);
