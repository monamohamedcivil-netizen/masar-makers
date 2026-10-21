-- Website chat bot: same menus/answers/prices as the WhatsApp bot, but on the platform.
-- Visitors only move to WhatsApp to subscribe or reach customer support.
create table if not exists public.web_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,              -- MM-XXXXX, sent with the WhatsApp hand-off
  token text not null,                    -- secret held by the visitor's browser
  user_id uuid,
  source text,                            -- contact | course_action | enrollment | inquiry ...
  context jsonb not null default '{}'::jsonb,
  current_course_id uuid,
  handoff_reason text,                    -- subscribe | support | other_currency
  handed_off_at timestamptz,
  whatsapp_phone text,                    -- filled when the hand-off message reaches WhatsApp
  message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.web_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.web_chat_sessions(id) on delete cascade,
  sender text not null check (sender in ('visitor', 'bot')),
  body text,
  action_id text,
  created_at timestamptz not null default now()
);

create index if not exists web_chat_messages_session_idx on public.web_chat_messages (session_id, created_at);
create index if not exists web_chat_sessions_created_idx on public.web_chat_sessions (created_at desc);

alter table public.web_chat_sessions enable row level security;
alter table public.web_chat_messages enable row level security;
