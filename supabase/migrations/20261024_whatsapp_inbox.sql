-- WhatsApp live inbox: full message log + contact info on sessions.
-- Locked like the finance tables (RLS on, no policies): read/written only
-- by the webhook and admin server actions through the service-role client.

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  direction text not null check (direction in ('in', 'out')),
  -- customer: incoming message
  -- bot: automatic reply from the webhook
  -- admin: reply typed in the platform inbox
  -- admin_phone: reply sent from the WhatsApp Business app (coexistence echo)
  sender text not null check (sender in ('customer', 'bot', 'admin', 'admin_phone')),
  message_type text not null default 'text',
  body text,
  wa_message_id text unique,
  status text,
  status_error text,
  sent_by uuid,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_phone_created_idx
  on public.whatsapp_messages (phone, created_at desc);

create index if not exists whatsapp_messages_created_idx
  on public.whatsapp_messages (created_at desc);

alter table public.whatsapp_messages enable row level security;

alter table public.whatsapp_bot_sessions
  add column if not exists contact_name text,
  add column if not exists last_inbound_at timestamptz,
  add column if not exists last_message_at timestamptz,
  add column if not exists admin_last_read_at timestamptz;

-- Free-tier guard (Meta: 1,000 free service messages per number per month since Oct 2026).
alter table public.whatsapp_bot_settings
  add column if not exists quota_monthly_free integer not null default 1000,
  add column if not exists quota_warn_at integer not null default 800,
  add column if not exists quota_stop_at integer not null default 980,
  add column if not exists quota_warned_month text,
  add column if not exists quota_paused_month text;

-- Routing: test mode, known contacts, manual hand-off to the bot.
alter table public.whatsapp_bot_settings
  add column if not exists bot_mode text not null default 'test' check (bot_mode in ('off', 'test', 'live')),
  add column if not exists test_numbers text[] not null default '{}';

alter table public.whatsapp_bot_sessions
  add column if not exists always_human boolean not null default false,
  add column if not exists bot_forced boolean not null default false;

-- Web Push subscriptions for admin phones/laptops (inbox notifications).
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);
alter table public.push_subscriptions enable row level security;

-- Numbers Mona already talks to (imported list). New conversations from them are never answered by the bot.
alter table public.whatsapp_bot_settings
  add column if not exists known_numbers text[] not null default '{}';
