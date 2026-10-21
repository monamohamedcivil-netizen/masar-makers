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
